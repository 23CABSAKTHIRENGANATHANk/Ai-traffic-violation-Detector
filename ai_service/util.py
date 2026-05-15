import string
import easyocr
import cv2
import numpy as np
import re

# Initialize the OCR reader once
reader = easyocr.Reader(['en'], gpu=False)

# Mapping dictionaries for character conversion
dict_char_to_int = {'O': '0', 'I': '1', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'B': '8', 'Z': '2', 'Q': '0'}
dict_int_to_char = {'0': 'O', '1': 'I', '3': 'J', '4': 'A', '6': 'G', '5': 'S', '8': 'B', '2': 'Z'}

def preprocess_image(image):
    """
    Apply advanced preprocessing to improve OCR accuracy.
    """
    if image is None or image.size == 0:
        return None
    
    # 1. Resize (Upscale standard to width ~400px for better OCR)
    h, w = image.shape[:2]
    if w < 400:
        scale = 400 / w
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # 2. Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 3. Sharpening (Important for CCTV blur)
    kernel = np.array([[0, -1, 0], 
                       [-1, 5,-1], 
                       [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)
    
    # 4. Bilateral Filter (Remove noise, keep edges)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # 5. Adaptive Thresholding (CLAHE) - Increased contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)
    
    return gray

def format_license(text):
    """
    Format the license plate text by converting characters using mapping dictionaries.
    Handles Indian plate format logic.
    """
    license_plate_ = ''
    # 0,1: State (Char)
    # 2,3: District (Int)
    # Middle: Series (Char)
    # Last 4: Unique (Int)
    
    for j in range(len(text)):
        if j in [0, 1]: # State code
            if text[j] in dict_int_to_char: license_plate_ += dict_int_to_char[text[j]]
            else: license_plate_ += text[j]
        elif j in [2, 3]: # District code
            if text[j] in dict_char_to_int: license_plate_ += dict_char_to_int[text[j]]
            else: license_plate_ += text[j]
        elif j >= len(text) - 4: # Unique number
            if text[j] in dict_char_to_int: license_plate_ += dict_char_to_int[text[j]]
            else: license_plate_ += text[j]
        else: # Series
            if text[j] in dict_int_to_char: license_plate_ += dict_int_to_char[text[j]]
            else: license_plate_ += text[j]

    return license_plate_

def validate_indian_plate(text):
    """
    Flexible regex for Indian Plates.
    Standard: TN 38 AB 1234
    """
    text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
    
    if len(text) < 6 or len(text) > 12:
        return False, text
        
    # Pattern: 2 letters, 1-2 digits, 0-3 letters, 3-4 digits
    pattern = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$')
    
    if pattern.match(text):
        return True, text
        
    return False, text

def read_license_plate(license_plate_crop):
    """
    Read the license plate text with preprocessing and multi-stage fallback.
    """
    processed_img = preprocess_image(license_plate_crop)
    if processed_img is None:
        return None, None

    detections = reader.readtext(processed_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    
    best_candidate = None
    best_score = 0

    for detection in detections:
        bbox, text, score = detection[:3]
        text = text.upper().replace(' ', '').replace('.', '').replace('-', '')
        
        try:
            formatted_text = format_license(text)
        except:
            formatted_text = text

        # Tier 1: Strict Regex Match
        is_valid, final_text = validate_indian_plate(formatted_text)
        if is_valid:
            return final_text, score
            
        # Tier 2: Length check fallback
        if 6 <= len(text) <= 12 and text.isalnum():
            if score > best_score:
                best_score = score
                best_candidate = formatted_text

    if best_candidate and best_score > 0.4:
        return best_candidate, best_score

    return None, None

def write_csv(results, output_path):
    """Write results to CSV (Legacy support)"""
    with open(output_path, 'w') as f:
        f.write('frame_nmr,car_id,car_bbox,license_plate_bbox,license_plate_bbox_score,license_number,license_number_score\n')
        for frame_nmr in results.keys():
            for car_id in results[frame_nmr].keys():
                if 'car' in results[frame_nmr][car_id] and 'license_plate' in results[frame_nmr][car_id]:
                    plate = results[frame_nmr][car_id]['license_plate']
                    f.write(f"{frame_nmr},{car_id},[{' '.join(map(str, results[frame_nmr][car_id]['car']['bbox']))}],"
                            f"[{' '.join(map(str, plate['bbox']))}],{plate['bbox_score']},{plate['text']},{plate['text_score']}\n")

def get_car(license_plate, vehicle_track_ids):
    """Retrieve vehicle track ID matching license plate bounding box"""
    x1, y1, x2, y2, score, class_id = license_plate
    for j in range(len(vehicle_track_ids)):
        xcar1, ycar1, xcar2, ycar2, car_id = vehicle_track_ids[j]
        if x1 > xcar1 and y1 > ycar1 and x2 < xcar2 and y2 < ycar2:
            return vehicle_track_ids[j]
    return -1, -1, -1, -1, -1
