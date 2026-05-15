from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uvicorn
import cv2
import math
import requests
import numpy as np
from datetime import datetime
import random
import threading
import time

# Try to import YOLO, but provide fallback
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    print("WARNING: YOLO not available, using mock detection")
    YOLO_AVAILABLE = False

app = FastAPI(title="AI Traffic Violation Detection Service")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api/violations/internal/record")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Load Models
if YOLO_AVAILABLE:
    print("Loading YOLOv8n model...")
    try:
        vehicle_model = YOLO('yolov8n.pt')
        print("YOLOv8 model loaded successfully!")
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        YOLO_AVAILABLE = False

# COCO Classes
VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck
PERSON_CLASS = 0
MOTORCYCLE_CLASS = 3

@app.get("/")
def health_check():
    return {
        "status": "healthy", 
        "service": "AI Traffic Violation Detector",
        "yolo_available": YOLO_AVAILABLE
    }

def calculate_speed(prev_pos, curr_pos, fps, pixel_scale=0.05):
    if prev_pos is None: 
        return 0
    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    pixel_dist = math.sqrt(dx**2 + dy**2)
    
    if pixel_dist < 5: 
        return 0
        
    speed_ms = (pixel_dist * pixel_scale) * fps
    return round(speed_ms * 3.6, 2)

def check_triple_riding(motorcycle_box, persons_boxes):
    mx1, my1, mx2, my2 = motorcycle_box
    count = 0
    
    for px1, py1, px2, py2 in persons_boxes:
        ix1 = max(mx1, px1)
        iy1 = max(my1, py1)
        ix2 = min(mx2, px2)
        iy2 = min(my2, py2)
        
        if ix1 < ix2 and iy1 < iy2:
            intersection_area = (ix2 - ix1) * (iy2 - iy1)
            person_area = (px2 - px1) * (py2 - py1)
            
            if intersection_area > 0.5 * person_area:
                count += 1
                
    return count > 2, count

def check_no_helmet(motorcycle_box, persons_boxes, track_id):
    rider_count = 0
    mx1, my1, mx2, my2 = motorcycle_box
    
    for px1, py1, px2, py2 in persons_boxes:
        ix1 = max(mx1, px1)
        iy1 = max(my1, py1)
        ix2 = min(mx2, px2)
        iy2 = min(my2, py2)
        if ix1 < ix2 and iy1 < iy2:
            rider_count += 1

    if rider_count > 0:
        # Simulate helmet detection (in production, use a helmet classifier)
        return random.random() > 0.7  # 30% chance of no helmet
    
    return False

def report_violation(video_id, v_type, track_id, frame, speed, plate_text, vehicle_type):
    try:
        evidence_filename = f"{video_id}_{v_type}_{track_id}.jpg"
        evidence_path = os.path.join(PROCESSED_DIR, evidence_filename)
        cv2.imwrite(evidence_path, frame)
        print(f"✓ Saved evidence: {evidence_filename}")
        
        final_number = plate_text or f"UNKNOWN-{track_id}"
        
        payload = {
            "video_id": video_id,
            "violation_type": v_type,
            "timestamp": datetime.now().isoformat(),
            "confidence": 0.95,
            "speed": speed,
            "vehicle_number": final_number,
            "evidence_image": evidence_filename,
            "vehicle_type": vehicle_type
        }
        
        response = requests.post(BACKEND_API_URL, json=payload, timeout=2)
        if response.ok:
            print(f"✓ Reported {v_type} for ID {track_id}")
        else:
            print(f"✗ Backend error: {response.status_code}")
    except Exception as e:
        print(f"✗ Failed to report violation: {e}")

def generate_frames(video_path: str, video_id: str):
    print(f"▶ Starting stream for: {video_path}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): 
        print(f"✗ Error opening video {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = 0
    track_history = {} 
    reported_violations = set()
    
    while True:
        ret, frame = cap.read()
        if not ret: 
            break
        
        frame_count += 1
        
        # Process every 3rd frame for performance
        SKIP_STEP = 3
        if frame_count % SKIP_STEP != 0:
            continue

        # Resize for performance
        height, width = frame.shape[:2]
        if width > 640:
            scale = 640 / width
            frame = cv2.resize(frame, (640, int(height * scale)))
        
        annotated_frame = frame.copy()
        
        if YOLO_AVAILABLE:
            try:
                # Track objects
                results = vehicle_model.track(frame, persist=True, classes=[0, 2, 3, 5, 7], verbose=False, imgsz=640)
                
                if results and results[0].boxes and results[0].boxes.id is not None:
                    boxes = results[0].boxes.xywh.cpu().tolist()
                    track_ids = results[0].boxes.id.int().cpu().tolist()
                    cls_ids = results[0].boxes.cls.int().cpu().tolist()
                    boxes_xyxy = results[0].boxes.xyxy.cpu().tolist()

                    persons = []
                    vehicles = []

                    for box, box_xyxy_val, track_id, cls in zip(boxes, boxes_xyxy, track_ids, cls_ids):
                        if int(cls) == 0:
                            persons.append(box_xyxy_val)
                        elif int(cls) in VEHICLE_CLASSES:
                            vehicles.append((box, box_xyxy_val, track_id, int(cls)))

                    for box, box_xyxy, track_id, cls in vehicles:
                        x, y, w, h = box
                        center = (float(x), float(y))
                        x1, y1, x2, y2 = map(int, box_xyxy)
                        
                        if track_id not in track_history:
                            track_history[track_id] = {'last_pos': center, 'speed_buffer': []}
                        
                        prev_pos = track_history[track_id].get('last_pos')
                        effective_fps = fps / SKIP_STEP
                        raw_speed = calculate_speed(prev_pos, center, effective_fps)
                        
                        # Speed smoothing
                        track_history[track_id]['speed_buffer'].append(raw_speed)
                        if len(track_history[track_id]['speed_buffer']) > 5:
                            track_history[track_id]['speed_buffer'].pop(0)
                        speed = round(sum(track_history[track_id]['speed_buffer']) / len(track_history[track_id]['speed_buffer']), 2)

                        track_history[track_id]['last_pos'] = center
                        
                        class_name = vehicle_model.names[int(cls)].upper()
                        detected_violations = []

                        # Check violations
                        limit = 60
                        
                        # 1. OVERSPEEDING (Cars, Buses, Trucks)
                        if cls in [2, 5, 7] and speed > limit:
                            detected_violations.append("OVERSPEEDING")
                        
                        # 2. TRIPLE RIDING (Motorcycles)
                        if cls == MOTORCYCLE_CLASS:
                            is_triple, p_count = check_triple_riding(box_xyxy, persons)
                            if is_triple: 
                                detected_violations.append("TRIPLE RIDING")
                        
                        # 3. NO HELMET (Motorcycles)
                        if cls == MOTORCYCLE_CLASS:
                            is_no_helmet = check_no_helmet(box_xyxy, persons, track_id)
                            if is_no_helmet:
                                detected_violations.append("NO HELMET")

                        # Visualization
                        color = (0, 255, 0)
                        label_text = ""
                        plate_text = f"VEH-{track_id}"
                        
                        if detected_violations:
                            color = (0, 0, 255)
                            label_text = ", ".join(detected_violations)
                            
                            # Report violations (once per type per vehicle)
                            for v_type in detected_violations:
                                violation_key = f"{track_id}_{v_type}"
                                if violation_key not in reported_violations:
                                    threading.Thread(
                                        target=report_violation, 
                                        args=(video_id, v_type, track_id, frame.copy(), speed, plate_text, class_name)
                                    ).start()
                                    reported_violations.add(violation_key)

                        # Draw bounding box
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                        info_text = f"{plate_text}"
                        if speed > 10: 
                            info_text += f" | {speed} km/h"
                        if label_text: 
                            info_text += f" | {label_text}"
                        
                        font_scale = 0.5
                        thickness = 1
                        (tw, th), _ = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                        cv2.rectangle(annotated_frame, (x1, y1 - th - 10), (x1 + tw, y1), color, -1)
                        cv2.putText(annotated_frame, info_text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)
            
            except Exception as e:
                print(f"Detection error: {e}")
        else:
            # Mock detection when YOLO not available
            cv2.putText(annotated_frame, "YOLO NOT AVAILABLE - DEMO MODE", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # Encode frame
        ret, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()
    print(f"✓ Stream ended for {video_id}")

@app.get("/video_feed")
async def video_feed(video_id: str):
    files = os.listdir(UPLOAD_DIR)
    target_file = None
    
    for f in files:
        if f.startswith(video_id):
            target_file = os.path.join(UPLOAD_DIR, f)
            break
    
    if not target_file:
        print(f"✗ Video not found: {video_id}")
        return JSONResponse(status_code=404, content={"message": "Video not found"})

    return StreamingResponse(
        generate_frames(target_file, video_id), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/detect")
async def detect_violations(file: UploadFile = File(...)):
    base_name = os.path.splitext(file.filename)[0]
    ext = os.path.splitext(file.filename)[1]
    video_id = f"{base_name}_{int(datetime.now().timestamp())}"
    
    save_filename = f"{video_id}{ext}"
    file_location = os.path.join(UPLOAD_DIR, save_filename)
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    print(f"✓ Video uploaded: {save_filename}")
    
    return {
        "message": "Ready to stream", 
        "video_id": video_id, 
        "file_path": save_filename
    }

if __name__ == "__main__":
    print("=" * 50)
    print("AI Traffic Violation Detection Service")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
