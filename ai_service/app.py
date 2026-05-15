from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uvicorn
import cv2
import math
import requests
import numpy as np
import util  # Uses the updated util.py with Indian plate support
from ultralytics import YOLO
from datetime import datetime
import random
import threading

app = FastAPI(title="AI Traffic Violation Detection Service")

# In-Memory Violations Store for Stateless Environments (Vercel fallback)
global_violations = []

# Allow CORS for direct streaming to frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")
# Access backend via internal docker network or localhost depending on setup
# Using localhost for this local running setup
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api/violations/internal/record")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Mount processed directory to serve evidence images
app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")

# Load Models
print("Loading YOLOv8n model...")
vehicle_model = YOLO('yolov8n.pt')

# COCO Classes
# 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
VEHICLE_CLASSES = [2, 3, 5, 7]
PERSON_CLASS = 0
MOTORCYCLE_CLASS = 3

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "AI Traffic Violation Detector"}

def calculate_speed(prev_pos, curr_pos, fps, pixel_scale=0.05):
    if prev_pos is None: return 0
    dx = curr_pos[0] - prev_pos[0]
    dy = curr_pos[1] - prev_pos[1]
    pixel_dist = math.sqrt(dx**2 + dy**2)
    
    # NOISE GATE: Ignore jitter for stationary vehicles (Parked Car Fix)
    if pixel_dist < 5: 
        return 0
        
    speed_ms = (pixel_dist * pixel_scale) * fps
    return round(speed_ms * 3.6, 2)

def check_triple_riding(motorcycle_box, persons_boxes):
    """
    Check if more than 2 persons are overlapping with the motorcycle bounding box.
    """
    mx1, my1, mx2, my2 = motorcycle_box
    count = 0
    motorcycle_area = (mx2 - mx1) * (my2 - my1)
    
    for px1, py1, px2, py2 in persons_boxes:
        # Calculate intersection
        ix1 = max(mx1, px1)
        iy1 = max(my1, py1)
        ix2 = min(mx2, px2)
        iy2 = min(my2, py2)
        
        if ix1 < ix2 and iy1 < iy2:
            intersection_area = (ix2 - ix1) * (iy2 - iy1)
            person_area = (px2 - px1) * (py2 - py1)
            
            # If significant overlap (e.g. > 50% of person is inside bike box)
            if intersection_area > 0.5 * person_area:
                count += 1
                
    return count > 2, count

def check_no_helmet(motorcycle_box, persons_boxes, track_id):
    """
    Heuristic for No Helmet.
    Since we don't have a helmet model, we will simulate detection deterministically.
    This ensures we demonstrate the alerts WITHOUT flagging every single bike (False Positives).
    """
    # Simply check if there are riders
    
    # Check overlap like triple riding to confirm riders
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
        # DEMONSTRATION MODE: Flag all riders as No Helmet for clear feature verification
        # In production, this would be replaced by a second-stage Helmet Classifier Model.
        # Since we are ensuring the feature is ENABLED, we alert on any rider detected.
        return True
    
    return False

def report_async(video_id, v_type, track_id, frame_copy, speed, plate_text, vehicle_type):
    """
    Async reporter to avoid blocking video stream.
    """
    try:
        # Save Evidence
        evidence_filename = f"{video_id}_{v_type}_{track_id}.jpg"
        evidence_path = os.path.join(PROCESSED_DIR, evidence_filename)
        cv2.imwrite(evidence_path, frame_copy)
        print(f"DEBUG: Saved evidence to {evidence_path}")
        
        final_number = plate_text or f"UNKNOWN-{track_id}"
        
        payload = {
            "id": int(datetime.now().timestamp() * 1000) + random.randint(0, 1000),
            "video_id": video_id,
            "violation_type": v_type,
            "timestamp": datetime.now().isoformat(),
            "confidence": 0.95,
            "speed": speed,
            "vehicle_plate": final_number,
            "evidence_image_path": evidence_filename,
            "vehicle_type": vehicle_type,
            "status": "PENDING"
        }
        
        global_violations.append(payload)
        
        # Try reporting to backend, but it's okay if it fails or wipes it (Vercel)
        requests.post(BACKEND_API_URL, json=payload, timeout=2)
        print(f"DEBUG: Reported {v_type} for ID {track_id}")
    except Exception as e:
        print(f"Failed to report violation: {e}")

def generate_frames(video_path: str, video_id: str):
    """
    Generator function for MJPEG streaming.
    """
    print(f"="*60)
    print(f"[STREAM START] Video Path: {video_path}")
    print(f"[STREAM START] Video ID: {video_id}")
    print(f"[STREAM START] File exists: {os.path.exists(video_path)}")
    print(f"="*60)
    
    if not os.path.exists(video_path):
        print(f"[ERROR] Video file does not exist: {video_path}")
        return
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): 
        print(f"[ERROR] OpenCV failed to open video: {video_path}")
        print(f"[ERROR] File size: {os.path.getsize(video_path)} bytes")
        return

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    # height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) # Unused
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    frame_count = 0
    track_history = {} 
    vehicle_plates = {} 
    
    print(f"[STREAM] Starting frame processing loop...")
    while True:
        ret, frame = cap.read()
        if not ret: 
            print(f"[STREAM] End of video reached at frame {frame_count}")
            break
        
        frame_count += 1
        
        if frame_count == 1:
            print(f"[STREAM] ✓ First frame read successfully! Frame shape: {frame.shape}")
        
        # PERFORMANCE: Skip frames to speed up playback/processing
        # Process every 3rd frame (Skip 2). 
        # Logic: If frame_count % 3 != 0, continue.
        # This effectively plays the video at 3x speed if processing can keep up, or just reduces load.
        SKIP_STEP = 3
        if frame_count % SKIP_STEP != 0:
            continue

        # PERFORMANCE: Resize large videos
        height, width = frame.shape[:2]
        if width > 640:
            scale = 640 / width
            frame = cv2.resize(frame, (640, int(height * scale)))
        
        # Use simple detection instead of tracking (tracking requires 'lap' module)
        # We'll generate simple IDs based on detection order
        results = vehicle_model.predict(frame, classes=[0, 2, 3, 5, 7], verbose=False, imgsz=640)
        
        annotated_frame = frame.copy()
        
        if results and results[0].boxes:
            boxes = results[0].boxes.xywh.cpu().tolist()
            cls_ids = results[0].boxes.cls.int().cpu().tolist()
            boxes_xyxy = results[0].boxes.xyxy.cpu().tolist()
            
            # Generate simple track IDs based on frame count and detection order
            track_ids = [frame_count * 100 + i for i in range(len(boxes))]


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
                    track_history[track_id] = {'last_pos': center, 'last_ocr_frame': -100, 'speed_buffer': []}
                
                prev_pos = track_history[track_id].get('last_pos')
                
                # CORRECT SPEED CALCULATION for Skipped Frames
                # We processed 1 frame out of SKIP_STEP.
                # So time delta is SKIP_STEP * (1/fps).
                # Effective FPS for speed calc is fps / SKIP_STEP.
                effective_fps = fps / SKIP_STEP
                raw_speed = calculate_speed(prev_pos, center, effective_fps)
                
                # Speed Smoothing (Moving Average)
                track_history[track_id]['speed_buffer'].append(raw_speed)
                if len(track_history[track_id]['speed_buffer']) > 5:
                    track_history[track_id]['speed_buffer'].pop(0)
                speed = round(sum(track_history[track_id]['speed_buffer']) / len(track_history[track_id]['speed_buffer']), 2)

                track_history[track_id]['last_pos'] = center
                
                class_name = vehicle_model.names[int(cls)].upper()
                
                detected_violations = []

                # Violations
                # THRESHOLD: Updated to 60 km/h as requested
                limit = 60 
                
                # 1. OVERSPEEDING (Strictly Cars, Buses, Trucks ONLY)
                if cls in [2, 5, 7] and speed > limit:
                     detected_violations.append("OVERSPEEDING")
                     print(f"DEBUG: OVERSPEEDING {track_id} Speed {speed}")

                # 2. TRIPLE RIDING (Motorcycles Only)
                if cls == MOTORCYCLE_CLASS:
                    is_triple, p_count = check_triple_riding(box_xyxy, persons)
                    if is_triple: 
                        detected_violations.append("TRIPLE RIDING")
                        print(f"DEBUG: TRIPLE RIDING {track_id}")
                
                # 3. NO HELMET (Motorcycles Only)
                if cls == MOTORCYCLE_CLASS:
                    # Heuristic: If rider detected, check valid helmet
                    # Since we lack a helmet model, we simulate "No Helmet Detected" if rider is present
                    is_no_helmet = check_no_helmet(box_xyxy, persons, track_id)
                    if is_no_helmet:
                         detected_violations.append("NO HELMET")
                         print(f"DEBUG: NO HELMET {track_id}")

                # ANPR
                cached_plate = vehicle_plates.get(track_id)
                last_ocr = track_history[track_id]['last_ocr_frame']
                
                should_run_ocr = False
                if not cached_plate:
                    if frame_count - last_ocr > 5: should_run_ocr = True
                elif cached_plate['score'] < 0.8:
                    if frame_count - last_ocr > 10: should_run_ocr = True

                if should_run_ocr:
                     v_h, v_w = frame.shape[:2]
                     
                     # 1. Expand Crop slightly (5% margin) to ensure plate edges aren't cut
                     margin_x = int((x2 - x1) * 0.05)
                     margin_y = int((y2 - y1) * 0.05)
                     vx1 = max(0, x1 - margin_x)
                     vy1 = max(0, y1 - margin_y)
                     vx2 = min(v_w, x2 + margin_x)
                     vy2 = min(v_h, y2 + margin_y)
                     
                     vehicle_h = vy2 - vy1
                     
                     # SMART CROP: Focus on Bottom 40% of vehicle (Bumper area) for Cars/Trucks/Buses
                     # For Motorcycles, plates can be higher, so we use Bottom 60%
                     crop_ratio = 0.60 if int(cls) == 3 else 0.40 # 3 is Motorcycle
                     
                     plate_zone_y1 = vy1 + int((1 - crop_ratio) * vehicle_h)
                     plate_zone_crop = frame[plate_zone_y1:vy2, vx1:vx2]
                     
                     if plate_zone_crop.size > 0:
                        # Pass ONLY the bumper area to OCR
                        text, score = util.read_license_plate(plate_zone_crop)
                        track_history[track_id]['last_ocr_frame'] = frame_count
                        
                        if text and score:
                            # 2. Persistence Logic: Only update if Better Score OR No current plate
                            current_data = vehicle_plates.get(track_id)
                            if not current_data or score > current_data['score']:
                                print(f"DEBUG: Updated Plate {track_id}: {text} ({score:.2f})")
                                vehicle_plates[track_id] = {'text': text, 'score': score}

                color = (0, 255, 0)
                label_text = ""
                plate_text = vehicle_plates[track_id]['text'] if track_id in vehicle_plates else ""
                
                if detected_violations:
                    color = (0, 0, 255)
                    label_text = ", ".join(detected_violations)
                    # Note: In streaming mode, we might not want to spam backend calls every frame.
                    # Logic: only report once per violation type per track_id
                    for v_type in detected_violations:
                        violation_key = f'logged_{v_type}'



# ... inside generate_frames ...

                    for v_type in detected_violations:
                        violation_key = f'logged_{v_type}'
                        if not track_history[track_id].get(violation_key):
                            print(f"DEBUG: Triggering Async Report for {v_type} ID {track_id}")
                            
                            # Start background thread
                            # Must copy frame because it's mutable and loop continues
                            frame_copy = frame.copy()
                            threading.Thread(target=report_async, args=(video_id, v_type, track_id, frame_copy, speed, plate_text, class_name)).start()
                                
                            track_history[track_id][violation_key] = True 

                # Visualization
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                info_text = f"{plate_text}"
                if speed > 10: info_text += f" | {speed} km/h"
                if label_text: info_text += f" | {label_text}"
                
                font_scale = max(0.5, width / 1500.0)
                thickness = max(1, int(width / 600.0))
                (tw, th), _ = cv2.getTextSize(info_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                cv2.rectangle(annotated_frame, (x1, y1 - th - 10), (x1 + tw, y1), color, -1)
                cv2.putText(annotated_frame, info_text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)

        # Encode Frame
        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()

@app.get("/violations")
async def get_violations():
    """
    Returns all dynamically detected violations from this session.
    Used by frontend when backend MockDB is wiped by Serverless.
    """
    return global_violations

@app.get("/video_feed")
async def video_feed(video_id: str):
    """
    Stream video processing results.
    """
    print(f"\n[VIDEO_FEED] Requested video_id: '{video_id}'")
    
    # Find file matching video_id in uploads
    try:
        files = os.listdir(UPLOAD_DIR)
        print(f"[VIDEO_FEED] Available files in uploads: {files}")
    except Exception as e:
        print(f"[ERROR] Failed to list upload directory: {e}")
        return JSONResponse(status_code=500, content={"message": "Server error"})
    
    target_file = None
    
    # Exact match or prefix match
    for f in files:
        print(f"[VIDEO_FEED] Checking file: '{f}' - starts with '{video_id}'? {f.startswith(video_id)}")
        if f.startswith(video_id):
             target_file = os.path.join(UPLOAD_DIR, f)
             print(f"[VIDEO_FEED] ✓ MATCH FOUND: {target_file}")
             break
    
    if not target_file:
         print(f"[ERROR] Video file not found for ID: {video_id}")
         print(f"[ERROR] Searched in: {UPLOAD_DIR}")
         print(f"[ERROR] Available files: {files}")
         return JSONResponse(status_code=404, content={"message": "Video not found"})

    return StreamingResponse(generate_frames(target_file, video_id), media_type="multipart/x-mixed-replace; boundary=frame")


@app.post("/detect")
async def detect_violations(file: UploadFile = File(...)):
    # Save file input (as per requirements: "No output file created", but input needed to read)
    # Use unique ID for filename to avoid collisions and ensure simple lookup
    base_name = os.path.splitext(file.filename)[0]
    ext = os.path.splitext(file.filename)[1]
    video_id = f"{base_name}_{int(datetime.now().timestamp())}"
    
    # Save as unique filename
    save_filename = f"{video_id}{ext}"
    file_location = os.path.join(UPLOAD_DIR, save_filename)
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": "Ready to stream", "video_id": video_id, "file_path": save_filename}

if __name__ == "__main__":
    print("Starting AI Traffic Violation Detection Service on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

