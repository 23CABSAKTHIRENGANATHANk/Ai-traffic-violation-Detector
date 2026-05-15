import string
import easyocr

# Initialize the OCR reader
reader = easyocr.Reader(['en'], gpu=False)

# Mapping dictionaries for character conversion
dict_char_to_int = {'O': '0',
                    'I': '1',
                    'J': '3',
                    'A': '4',
                    'G': '6',
                    'S': '5'}

dict_int_to_char = {'0': 'O',
                    '1': 'I',
                    '3': 'J',
                    '4': 'A',
                    '6': 'G',
                    '5': 'S'}


def write_csv(results, output_path):
    """
    Write the results to a CSV file.

    Args:
        results (dict): Dictionary containing the results.
        output_path (str): Path to the output CSV file.
    """
    with open(output_path, 'w') as f:
        f.write('{},{},{},{},{},{},{}\n'.format('frame_nmr', 'car_id', 'car_bbox',
                                                'license_plate_bbox', 'license_plate_bbox_score', 'license_number',
                                                'license_number_score'))

        for frame_nmr in results.keys():
            for car_id in results[frame_nmr].keys():
                print(results[frame_nmr][car_id])
                if 'car' in results[frame_nmr][car_id].keys() and \
                   'license_plate' in results[frame_nmr][car_id].keys() and \
                   'text' in results[frame_nmr][car_id]['license_plate'].keys():
                    f.write('{},{},{},{},{},{},{}\n'.format(frame_nmr,
                                                            car_id,
                                                            '[{} {} {} {}]'.format(
                                                                results[frame_nmr][car_id]['car']['bbox'][0],
                                                                results[frame_nmr][car_id]['car']['bbox'][1],
                                                                results[frame_nmr][car_id]['car']['bbox'][2],
                                                                results[frame_nmr][car_id]['car']['bbox'][3]),
                                                            '[{} {} {} {}]'.format(
                                                                results[frame_nmr][car_id]['license_plate']['bbox'][0],
                                                                results[frame_nmr][car_id]['license_plate']['bbox'][1],
                                                                results[frame_nmr][car_id]['license_plate']['bbox'][2],
                                                                results[frame_nmr][car_id]['license_plate']['bbox'][3]),
                                                            results[frame_nmr][car_id]['license_plate']['bbox_score'],
                                                            results[frame_nmr][car_id]['license_plate']['text'],
                                                            results[frame_nmr][car_id]['license_plate']['text_score'])
                            )
        f.close()


def license_complies_format(text):
    """
    Check if the license plate text complies with the required format.

    Args:
        text (str): License plate text.

    Returns:
        bool: True if the license plate complies with the format, False otherwise.
    """
    # stripping spaces found by OCR
    text = text.replace(" ", "").replace("-", "")

    # Standard Indian Plate: 2 chars (State) + 2 nums (District) + 1-2 chars (Series) + 4 nums (Unique)
    # Example: TN38AB1234 (10 chars) or TN38A1234 (9 chars)
    # Some older plates might have different lengths, but standard is 9-10.
    
    if len(text) not in [9, 10]:
        return False

    # Check first 2 chars are letters (State Code)
    if not (text[0].isalpha() or text[0] in dict_int_to_char.keys()) or \
       not (text[1].isalpha() or text[1] in dict_int_to_char.keys()):
        return False

    # Check next 2 chars are digits (District Code)
    if not (text[2].isdigit() or text[2] in dict_char_to_int.keys()) or \
       not (text[3].isdigit() or text[3] in dict_char_to_int.keys()):
        return False

    # Check last 4 chars are digits (Unique Number)
    if not (text[-1].isdigit() or text[-1] in dict_char_to_int.keys()) or \
       not (text[-2].isdigit() or text[-2] in dict_char_to_int.keys()) or \
       not (text[-3].isdigit() or text[-3] in dict_char_to_int.keys()) or \
       not (text[-4].isdigit() or text[-4] in dict_char_to_int.keys()):
        return False

    # The middle part (index 4 to -5) should be letters
    # Length of middle part is len(text) - 2 (start) - 2 (district) - 4 (end) = len - 8
    # If len=10, middle=2 chars. If len=9, middle=1 char.
    middle_len = len(text) - 8
    for i in range(4, 4 + middle_len):
        if not (text[i].isalpha() or text[i] in dict_int_to_char.keys()):
             return False
             
    return True


def format_license(text):
    """
    Format the license plate text by converting characters using the mapping dictionaries.

    Args:
        text (str): License plate text.

    Returns:
        str: Formatted license plate text.
    """
    license_plate_ = ''
    mapping = {0: dict_int_to_char, 1: dict_int_to_char, 
               4: dict_int_to_char, 5: dict_int_to_char, 6: dict_int_to_char,
               2: dict_char_to_int, 3: dict_char_to_int}
    
    # Extensions for Indian formats
    # 0,1: State (Char)
    # 2,3: District (Int)
    # -4,-3,-2,-1: Unique (Int)
    # Middle: Series (Char)

    for j in range(len(text)):
        # Normalize index for standard logic
        # 0, 1 -> Char
        if j in [0, 1]:
            if text[j] in dict_int_to_char: license_plate_ += dict_int_to_char[text[j]]
            else: license_plate_ += text[j]
        
        # 2, 3 -> Int
        elif j in [2, 3]:
            if text[j] in dict_char_to_int: license_plate_ += dict_char_to_int[text[j]]
            else: license_plate_ += text[j]

        # Last 4 -> Int
        elif j >= len(text) - 4:
            if text[j] in dict_char_to_int: license_plate_ += dict_char_to_int[text[j]]
            else: license_plate_ += text[j]

        # Middle part (Series) -> Char
        else:
            if text[j] in dict_int_to_char: license_plate_ += dict_int_to_char[text[j]]
            else: license_plate_ += text[j]

    return license_plate_


import cv2
import numpy as np
import re

# Initialize the OCR reader
reader = easyocr.Reader(['en'], gpu=False)

# Expanded Mapping dictionaries for character conversion
dict_char_to_int = {'O': '0', 'I': '1', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'B': '8', 'Z': '2', 'Q': '0'}
dict_int_to_char = {'0': 'O', '1': 'I', '3': 'J', '4': 'A', '6': 'G', '5': 'S', '8': 'B', '2': 'Z'}

def preprocess_image(image):
    """
    Apply advanced preprocessing to improve OCR accuracy.
    """
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

def validate_indian_plate(text):
    """
    Flexible regex for Indian Plates.
    Standard: TN 38 AB 1234
    """
    text = text.upper().replace(' ', '').replace('-', '').replace('.', '')
    
    # Relaxed Regex: 
    # Starts with 2 chars (State), followed by 1-2 digits (District), 
    # Optional 1-3 chars (Series), Ends with 3-4 digits.
    # Total length usually > 6
    if len(text) < 6 or len(text) > 12:
        return False, text
        
    # Basic Pattern Check using Regex
    # ^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$
    pattern = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$')
    
    if pattern.match(text):
        return True, text
        
    return False, text

def read_license_plate(license_plate_crop):
    """
    Read the license plate text with preprocessing and multi-stage fallback.
    """
    # Preprocess
    processed_img = preprocess_image(license_plate_crop)

    # Allowlist: Alphanumeric only
    detections = reader.readtext(processed_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    
    best_candidate = None
    best_score = 0

    for detection in detections:
        bbox, text, score = detection[:3]
        text = text.upper().replace(' ', '').replace('.', '').replace('-', '')
        
        # Debug Log to see what raw text is being found
        # print(f"DEBUG OCR RAW: {text} ({score})") 

        # Attempt to correct common OCR errors using Format Logic
        # e.g. Convert 'B' to '8' in digit positions (Index 2, 3, etc)
        try:
            formatted_text = format_license(text)
        except:
            formatted_text = text

        # Tier 1: Strict Regex Match (High Quality) on FORMATTED text
        is_valid, final_text = validate_indian_plate(formatted_text)
        if is_valid:
            return final_text, score
            
        # Tier 2: Looks like a plate (Length 6-12, Alphanumeric)
        if 6 <= len(text) <= 12 and text.isalnum():
            # If we don't find a perfect regex match in ANY detection, we'll return this as fallback
            # We keep the one with highest score
            if score > best_score:
                best_score = score
                best_candidate = formatted_text # Return the formatted version as best guess

    # If no perfect regex match found after checking ALL detections, return best fallback
    # Lowered threshold to 0.4 for fallback
    if best_candidate and best_score > 0.4:
        return best_candidate, best_score

    return None, None


def get_car(license_plate, vehicle_track_ids):
    """
    Retrieve the vehicle coordinates and ID based on the license plate coordinates.

    Args:
        license_plate (tuple): Tuple containing the coordinates of the license plate (x1, y1, x2, y2, score, class_id).
        vehicle_track_ids (list): List of vehicle track IDs and their corresponding coordinates.

    Returns:
        tuple: Tuple containing the vehicle coordinates (x1, y1, x2, y2) and ID.
    """
    x1, y1, x2, y2, score, class_id = license_plate

    foundIt = False
    for j in range(len(vehicle_track_ids)):
        xcar1, ycar1, xcar2, ycar2, car_id = vehicle_track_ids[j]

        if x1 > xcar1 and y1 > ycar1 and x2 < xcar2 and y2 < ycar2:
            car_indx = j
            foundIt = True
            break

    if foundIt:
        return vehicle_track_ids[car_indx]

    return -1, -1, -1, -1, -1
