from ultralytics import YOLO
import cv2
import numpy as np

try:
    print("Loading Model...")
    model = YOLO('yolov8n.pt')
    
    # Create dummy black image
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    
    print("Running Inference...")
    results = model(img)
    print("Success! Model is working.")
except Exception as e:
    print(f"FAILED: {e}")
