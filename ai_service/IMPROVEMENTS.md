# Enhanced AI Service Configuration and Improvements
# This file contains improvements to fix video processing and violation detection

## KEY IMPROVEMENTS:

### 1. Video Processing Fixes:
- Reduced aggressive frame skipping (changed from SKIP_STEP=3 to SKIP_STEP=2)
- Better error handling for video files
- Improved frame quality preservation
- Better memory management

### 2. Violation Detection Enhancements:
- Improved speed calculation with noise filtering
- Better license plate detection with zone-specific cropping
- Triple riding detection improvements
- No helmet detection with better heuristics

### 3. Backend Integration:
- Fixed field name mismatches (vehicle_plate vs vehicle_number)
- Better error handling for API calls
- Improved payload validation

### 4. Performance:
- Optimized frame processing
- Better thread management
- Reduced redundant API calls

## DEPLOYMENT INSTRUCTIONS:

1. For Vercel Backend:
   - Updated API endpoints to handle field name variations
   - Better CORS support
   - Improved error responses

2. For HuggingFace Spaces:
   - Video processing optimized for resource-constrained environments
   - Better temporary file management
   - Streaming improvements

3. Configuration Changes:
   - SKIP_STEP: Reduced to 2 (was 3) for better detection
   - MAX_RESOLUTION: Set to 720 (was 640) for better quality
   - OCR_FREQUENCY: Adjusted based on speed
