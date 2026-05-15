import requests
import time
import os

print("=" * 70)
print("VIDEO UPLOAD AND STREAM TEST")
print("=" * 70)

# Test video file
video_file = "output_with_number_plate.mp4"

if not os.path.exists(video_file):
    print(f"ERROR: Test video not found: {video_file}")
    exit(1)

print(f"\n[1] Uploading video: {video_file}")
print(f"    File size: {os.path.getsize(video_file)} bytes")

try:
    with open(video_file, 'rb') as f:
        files = {'file': (video_file, f, 'video/mp4')}
        response = requests.post("http://localhost:8000/detect", files=files, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            print(f"    ✓ Upload successful!")
            print(f"    Video ID: {data.get('video_id')}")
            video_id = data.get('video_id')
        else:
            print(f"    ✗ Upload failed: {response.status_code}")
            print(f"    Response: {response.text}")
            exit(1)
except Exception as e:
    print(f"    ✗ Upload error: {e}")
    exit(1)

# Wait a moment
print(f"\n[2] Waiting 2 seconds before testing stream...")
time.sleep(2)

# Test stream endpoint
print(f"\n[3] Testing video stream endpoint...")
print(f"    URL: http://localhost:8000/video_feed?video_id={video_id}")

try:
    response = requests.get(
        f"http://localhost:8000/video_feed?video_id={video_id}",
        stream=True,
        timeout=10
    )
    
    print(f"    Status Code: {response.status_code}")
    print(f"    Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 200:
        # Read first chunk
        chunk_count = 0
        total_bytes = 0
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                chunk_count += 1
                total_bytes += len(chunk)
                if chunk_count >= 5:  # Read first 5 chunks
                    break
        
        print(f"    ✓ Stream working!")
        print(f"    Received {chunk_count} chunks ({total_bytes} bytes)")
        
        if total_bytes == 0:
            print(f"    ✗ WARNING: Stream returned 0 bytes!")
        
    else:
        print(f"    ✗ Stream failed: {response.status_code}")
        print(f"    Response: {response.text}")
        
except Exception as e:
    print(f"    ✗ Stream error: {e}")

# Check violations
print(f"\n[4] Checking violations in backend...")
try:
    response = requests.get("http://localhost:3000/api/violations", timeout=5)
    if response.status_code == 200:
        violations = response.json()
        print(f"    ✓ Found {len(violations)} violations in database")
        if len(violations) > 0:
            latest = violations[0]
            print(f"    Latest: {latest.get('violation_type')} - {latest.get('vehicle_plate')}")
    else:
        print(f"    ✗ Failed to fetch violations")
except Exception as e:
    print(f"    ✗ Error: {e}")

print("\n" + "=" * 70)
print("TEST COMPLETE - Check AI service terminal for detailed logs")
print("=" * 70)
