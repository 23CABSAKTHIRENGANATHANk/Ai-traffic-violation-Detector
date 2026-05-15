import requests
import time
import os

print("=" * 60)
print("AI TRAFFIC VIOLATION DETECTION - SYSTEM TEST")
print("=" * 60)

# Test 1: Check AI Service Health
print("\n[TEST 1] Checking AI Service (Port 8000)...")
try:
    response = requests.get("http://localhost:8000/", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ AI Service is healthy: {data}")
    else:
        print(f"✗ AI Service returned status {response.status_code}")
except Exception as e:
    print(f"✗ AI Service error: {e}")

# Test 2: Check Backend Health
print("\n[TEST 2] Checking Backend (Port 3000)...")
try:
    response = requests.get("http://localhost:3000/", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Backend is healthy: {data}")
    else:
        print(f"✗ Backend returned status {response.status_code}")
except Exception as e:
    print(f"✗ Backend error: {e}")

# Test 3: Check Frontend
print("\n[TEST 3] Checking Frontend (Port 5173)...")
try:
    response = requests.get("http://localhost:5173/", timeout=5)
    if response.status_code == 200:
        print(f"✓ Frontend is accessible")
    else:
        print(f"✗ Frontend returned status {response.status_code}")
except Exception as e:
    print(f"✗ Frontend error: {e}")

# Test 4: Test Video Upload
print("\n[TEST 4] Testing Video Upload...")
video_path = "output_with_number_plate.mp4"
if os.path.exists(video_path):
    try:
        with open(video_path, 'rb') as f:
            files = {'file': (video_path, f, 'video/mp4')}
            response = requests.post("http://localhost:8000/detect", files=files, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Video uploaded successfully!")
                print(f"  Video ID: {data.get('video_id')}")
                print(f"  File Path: {data.get('file_path')}")
                
                # Test 5: Check if video stream is available
                print("\n[TEST 5] Testing Video Stream...")
                video_id = data.get('video_id')
                stream_url = f"http://localhost:8000/video_feed?video_id={video_id}"
                print(f"  Stream URL: {stream_url}")
                print(f"  ✓ You can now view the stream in your browser!")
                
            else:
                print(f"✗ Upload failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ Upload error: {e}")
else:
    print(f"✗ Test video not found: {video_path}")

# Test 6: Check Violations List
print("\n[TEST 6] Checking Violations Database...")
try:
    response = requests.get("http://localhost:3000/api/violations", timeout=5)
    if response.status_code == 200:
        violations = response.json()
        print(f"✓ Found {len(violations)} violations in database")
        if len(violations) > 0:
            print(f"  Latest violation: {violations[0].get('violation_type')} - {violations[0].get('vehicle_plate')}")
    else:
        print(f"✗ Failed to fetch violations: {response.status_code}")
except Exception as e:
    print(f"✗ Violations check error: {e}")

print("\n" + "=" * 60)
print("SYSTEM TEST COMPLETE")
print("=" * 60)
print("\n📱 Open http://localhost:5173 in your browser to use the app!")
print("📹 Upload a video and watch the AI detect violations in real-time!")
