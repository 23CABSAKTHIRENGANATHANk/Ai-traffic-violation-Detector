# AI Video Analysis Improvements

## Summary

The AI service has been updated with enhanced detection heuristics, stricter validation logic, and configurable thresholds for professional-grade video violation analysis.

## Key Improvements

### 1. **Configurable Detection Parameters**

All critical thresholds are now environment variables, allowing per-deployment tuning:

```bash
# Detection confidence (lower = more detections, may have false positives)
YOLO_CONFIDENCE=0.35

# IoU threshold for bounding box overlap (lower = more overlapping detections)
YOLO_IOU=0.45

# Speed threshold for overspeeding violation (km/h)
SPEED_LIMIT_KMPH=60

# Pixel scale factor for speed calculation (calibrate per camera)
PIXEL_SCALE=0.05

# Frame buffer for tracking stability (frames)
TRACK_EXPIRE_FRAMES=20

# Maximum distance for centroid-based track matching (pixels)
MAX_TRACK_DISTANCE=80
```

### 2. **Improved Speed Calculation**

- **Jitter Filter**: Ignores movements < 5 pixels (reduces false triggers on parked vehicles)
- **Displacement Cap**: Caps unrealistic jumps > 300 pixels (avoids detection errors)
- **Frame-Skip Aware**: Correctly adjusts FPS when frames are skipped
- **Dynamic Pixel Scale**: Auto-adjusts for video resolution differences
- **Moving Average Smoothing**: 5-frame buffer for stable speed reporting

### 3. **Stricter Violation Heuristics**

#### No Helmet Detection
- **Improved**: Analyzes only clearly overlapping riders (>35% person area overlap)
- **Head Region Analysis**: 30% of person height (tighter focus)
- **Edge Detection**: Higher thresholds (0.02 density, 0.18-0.85 brightness range)
- **Multi-Rider Logic**: Confidence scales with number of valid riders (55-95%)
- **Helmet Signal**: Requires edge structure + moderate brightness (not just edges)

#### Triple Riding Detection
- **Strict Threshold**: Requires ≥ 3 riders (not > 2)
- **Overlap Validation**: >50% person area must overlap bike box
- **Filtered Count**: Only counts clear detections, avoids false positives

#### Overspeeding
- **All Vehicles**: Now applies to motorcycles, cars, buses, trucks (previously car-only)
- **Configurable Limit**: Set via `SPEED_LIMIT_KMPH` (default 60 km/h)

### 4. **Enhanced Tracking**

- **Centroid-Based Matching**: Stable track IDs across frames
- **Class Consistency**: Tracks only match same vehicle class
- **Stale Track Cleanup**: Auto-removes inactive tracks after 20 frames
- **Configurable Distance**: Track matching distance is `MAX_TRACK_DISTANCE`

### 5. **Robust OCR for License Plates**

- **Multi-Stage Fallback**: Strict regex → length check → best score
- **Preprocessing**: Upscaling, sharpening, bilateral filtering, CLAHE enhancement
- **Format Validation**: Indian plate format (TN 38 AB 1234)
- **Score Tracking**: Only updates if confidence increases
- **Frequency Control**: OCR runs every 5-10 frames based on current score

## Configuration for Deployment

### Local Development
```bash
cd ai_service
export YOLO_CONFIDENCE=0.35
export SPEED_LIMIT_KMPH=60
export PIXEL_SCALE=0.05
python app.py
```

### Vercel / Production
Set environment variables in `.env.local` or deployment config:
```
YOLO_CONFIDENCE=0.35
YOLO_IOU=0.45
SPEED_LIMIT_KMPH=60
PIXEL_SCALE=0.05
TRACK_EXPIRE_FRAMES=20
MAX_TRACK_DISTANCE=80
BACKEND_API_URL=https://your-backend-domain/api/violations/internal/record
```

## Tuning for Your Videos

If accuracy is still low after deployment:

1. **Check Detection Sensitivity** (low detection rate)
   - Lower `YOLO_CONFIDENCE` to 0.25-0.30
   - Lower `YOLO_IOU` to 0.35-0.40

2. **Reduce False Positives** (too many violations)
   - Increase `YOLO_CONFIDENCE` to 0.40-0.50
   - Increase `SPEED_LIMIT_KMPH` or adjust pixel scale

3. **Calibrate Speed** (incorrect speed readings)
   - If speeds are too high: increase `PIXEL_SCALE` (0.06-0.08)
   - If speeds are too low: decrease `PIXEL_SCALE` (0.03-0.04)
   - Record a reference vehicle at known speed and adjust

4. **Helmet Detection** (too sensitive or not sensitive)
   - Lower sensitivity: increase edge_density threshold from 0.02 to 0.025
   - Higher sensitivity: lower threshold to 0.015

## Testing Local Video

```bash
# 1. Start backend
cd backend && npm start

# 2. Start AI service
cd ai_service && python app.py

# 3. Upload test video via frontend or curl
curl -X POST -F "file=@test_video.mp4" http://localhost:8000/detect

# 4. Stream and view violations
# Visit: http://localhost:5173 → Violation Detection → paste video_id
```

## Files Modified

- `ai_service/app.py`: Speed calculation, helmet/triple-riding heuristics, detection params
- `ai_service/util.py`: OCR preprocessing (no changes, already optimized)
- `backend/src/db.js`: MockDB fallback (fixed in previous session)
- `backend/src/controllers/violationController.js`: Uses shared PDF generator

## Notes

- Speed estimation relies on pixel-to-real-world calibration (PIXEL_SCALE)
- No-helmet detection is heuristic-based; a trained classifier model would improve accuracy further
- OCR works best on clear, frontal license plates; angled or distant plates may fail
