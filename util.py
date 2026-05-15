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


def read_license_plate(license_plate_crop):
    """
    Read the license plate text from the given cropped image.

    Args:
        license_plate_crop (PIL.Image.Image): Cropped image containing the license plate.

    Returns:
        tuple: Tuple containing the formatted license plate text and its confidence score.
    """

    detections = reader.readtext(license_plate_crop)

    for detection in detections:
        bbox, text, score = detection

        text = text.upper().replace(' ', '')

        if license_complies_format(text):
            return format_license(text), score

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
