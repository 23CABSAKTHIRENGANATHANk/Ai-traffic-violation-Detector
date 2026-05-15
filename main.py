from ultralytics import YOLO
import cv2
import util
import numpy as np
import os

# Configuration
# Using a specific video found in the system or fallback to sample.mp4
VIDEO_PATH = './ai_service/uploads/video-1767777024089-171070048.mp4' 
if not os.path.exists(VIDEO_PATH):
    # Fallback search or default
    found_videos = [f for f in os.listdir('.') if f.endswith('.mp4')]
    if found_videos:
        VIDEO_PATH = found_videos[0]
    else:
        VIDEO_PATH = 'sample.mp4'

OUTPUT_PATH = 'output_with_number_plate.mp4'

# Load Models
# Using the yolov8n.pt found in ai_service
model_path = './ai_service/yolov8n.pt'
if not os.path.exists(model_path):
    model_path = 'yolov8n.pt' # Fallback
    
print(f"Loading vehicle model from {model_path}...")
coco_model = YOLO(model_path)

# Dictionary to store best license plate per vehicle track ID
# { track_id: {'text': 'TN38...', 'score': 0.8} }
vehicle_plates = {}
vehicle_last_ocr_frame = {}

# Vehicle classes in COCO: 2=car, 3=motorcycle, 5=bus, 7=truck
VEHICLE_CLASSES = [2, 3, 5, 7]

def process_video():
    print(f"Processing video: {VIDEO_PATH}")
    cap = cv2.VideoCapture(VIDEO_PATH)
    
    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    # Video Writer Setup
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, (width, height))

    frame_nmr = -1
    ret = True
    
    while ret:
        ret, frame = cap.read()
        if not ret: 
            break
            
        frame_nmr += 1
        if frame_nmr % 10 == 0:
            print(f"Processing frame {frame_nmr}...")

        # YOLO Tracking
        # persist=True enables tracking (ID assignment)
        results = coco_model.track(frame, persist=True, verbose=False)[0]
        
        if results.boxes.id is not None:
            boxes = results.boxes.xyxy.cpu().tolist()
            track_ids = results.boxes.id.int().cpu().tolist()
            class_ids = results.boxes.cls.int().cpu().tolist()
            
            for box, track_id, class_id in zip(boxes, track_ids, class_ids):
                if int(class_id) in VEHICLE_CLASSES:
                    x1, y1, x2, y2 = map(int, box)
                    
                    # Draw Vehicle Bounding Box (Blue)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    
                    # Store logic: If we don't have a high confidence plate, try to find one
                    # Optimization: Skip OCR if we already have a good plate, or run periodically
                    # For demo, we run frequently but could throttle
                    
                    # Optimization: OCR Throttling
                    if track_id not in vehicle_last_ocr_frame:
                         vehicle_last_ocr_frame[track_id] = -100 # Force first run

                    # Run OCR only if:
                    # 1. We don't have a plate yet
                    # 2. OR confidence is low AND we haven't run it recently (every 5 frames)
                    should_run_ocr = False
                    if track_id not in vehicle_plates:
                        if frame_nmr - vehicle_last_ocr_frame[track_id] > 5:
                            should_run_ocr = True
                    elif vehicle_plates[track_id]['score'] < 0.8:
                        if frame_nmr - vehicle_last_ocr_frame[track_id] > 5:
                            should_run_ocr = True
                    
                    if should_run_ocr:
                        # Crop vehicle
                        vehicle_crop = frame[max(0, y1):min(height, y2), max(0, x1):min(width, x2)]
                        
                        # Pre-process for OCR (convert to gray, etc. handled in util usually, but let's be explicitly helpful)
                        # util.read_license_plate expects a crop of the PLATE.
                        # Since we don't have a plate detector, we pass the vehicle crop. 
                        # This is a best-effort. EasyOCR might struggle with the whole car but we'll try.
                        # Ideally we would use a plate detector + util.read_license_plate(plate_crop).
                        
                        plate_text, plate_score = util.read_license_plate(vehicle_crop)
                        
                        # Update timestamp regardless of result (to throttle failed attempts too)
                        vehicle_last_ocr_frame[track_id] = frame_nmr

                        if plate_text is not None and plate_score is not None:
                            # Update if better score
                            current_score = vehicle_plates.get(track_id, {'score': 0})['score']
                            if plate_score > current_score:
                                vehicle_plates[track_id] = {'text': plate_text, 'score': plate_score}
                    
                    # Display Plate Text (Green)
                    if track_id in vehicle_plates:
                        text = vehicle_plates[track_id]['text']
                        # Dynamic font scale based on frame width
                        font_scale = width / 1000.0 * 1.5 
                        thickness = int(width / 500.0)
                        
                        (text_w, text_h), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                        
                        # Background for text
                        cv2.rectangle(frame, (x1, y1 - text_h - 10), (x1 + text_w, y1), (0, 0, 0), -1)
                        cv2.putText(frame, text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)

        out.write(frame)
        
    cap.release()
    out.release()
    print(f"Video processing complete. Saved to {OUTPUT_PATH}")

if __name__ == '__main__':
    process_video()