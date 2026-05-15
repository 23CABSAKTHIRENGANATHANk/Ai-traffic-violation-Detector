# Testing & Validation Guide

## 🧪 Comprehensive Testing Plan

### Phase 1: Local Development Testing

#### 1.1 Backend API Testing

**Test: Violation Recording Endpoint**
```bash
curl -X POST http://localhost:3000/api/violations/record \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "test_video_001",
    "violation_type": "OVERSPEEDING",
    "timestamp": "2024-05-15T10:30:00Z",
    "confidence": 0.95,
    "speed": 85,
    "vehicle_plate": "TN38AB1234",
    "evidence_image_path": "test_evidence.jpg",
    "vehicle_type": "CAR"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "video_id": "test_video_001",
  "violation_type": "OVERSPEEDING",
  "vehicle_plate": "TN38AB1234",
  "speed_kmph": 85,
  "status": "PENDING",
  "created_at": "2024-05-15T10:30:00Z"
}
```

**Test: Analytics Endpoint**
```bash
curl http://localhost:3000/api/analytics
```

**Expected Response:**
- Contains `total_violations`, `violations_by_type`, `status_breakdown`
- Has real-time statistics

**Test: Admin Violations with Filters**
```bash
curl "http://localhost:3000/api/admin/violations?status=PENDING&limit=10"
```

**Test: Settings Endpoint**
```bash
curl http://localhost:3000/api/config/settings
```

**Test: Challan Generation**
```bash
curl -X POST http://localhost:3000/api/violations/1/challan \
  -o challan_1.pdf
```

#### 1.2 Frontend Testing

**Test: Navigation**
- [ ] Access all menu items
- [ ] Verify sidebar highlighting on current page
- [ ] Test mobile responsive sidebar

**Test: Analytics Page**
- [ ] Verify charts load
- [ ] Check stat cards display correct values
- [ ] Test time period filters

**Test: Settings Page**
- [ ] Load all settings from API
- [ ] Modify settings
- [ ] Save and verify persistence
- [ ] Reset to defaults

**Test: Admin Panel**
- [ ] Load violations list
- [ ] Filter by status, type, vehicle
- [ ] Search by vehicle plate
- [ ] View violation details
- [ ] Generate challan
- [ ] Export to CSV/JSON

#### 1.3 Video Processing Testing

**Test: Upload Video**
```bash
curl -X POST http://localhost:8000/detect \
  -F "file=@test_video.mp4"
```

**Expected Response:**
```json
{
  "message": "Ready to stream",
  "video_id": "test_video_20240515",
  "file_path": "test_video_20240515.mp4"
}
```

**Test: Stream Video Feed**
```bash
curl "http://localhost:8000/video_feed?video_id=test_video_20240515"
```

**Test: Get Violations from AI Service**
```bash
curl http://localhost:8000/violations
```

---

### Phase 2: Integration Testing

#### 2.1 End-to-End Flow

```
1. Upload Video
   ↓
2. AI Service Processes and Detects Violations
   ↓
3. Violations Posted to Backend
   ↓
4. View in Admin Panel
   ↓
5. Generate Challan
   ↓
6. View in Analytics
```

**Steps:**
```bash
# 1. Upload
VIDEO_ID=$(curl -X POST http://localhost:8000/detect -F "file=@traffic_sample.mp4" | jq -r '.video_id')

# 2. Stream (access in browser)
# http://localhost:8000/video_feed?video_id=$VIDEO_ID

# 3. Check violations via admin panel
# http://localhost:5173/admin

# 4. Generate challan from admin panel

# 5. Check analytics
# http://localhost:5173/analytics
```

#### 2.2 Database Consistency

- [ ] Verify violations saved in database
- [ ] Check timestamp accuracy
- [ ] Verify field values match request
- [ ] Test status transitions
- [ ] Test soft delete (REJECTED status)

---

### Phase 3: Deployment Testing

#### 3.1 Vercel Backend Testing

**Pre-deployment:**
- [ ] Run `npm test` (if tests exist)
- [ ] Check `vercel env` variables
- [ ] Verify database connection string

**Post-deployment:**
```bash
# Test health check
curl https://your-backend.vercel.app/api

# Test violation recording
curl -X POST https://your-backend.vercel.app/api/violations/record \
  -H "Content-Type: application/json" \
  -d '{...}'

# Test analytics
curl https://your-backend.vercel.app/api/analytics
```

#### 3.2 HuggingFace Spaces Testing

```bash
# Health check
curl https://your-username-your-space.hf.space/

# Upload and detect
curl -X POST https://your-username-your-space.hf.space/detect \
  -F "file=@test_video.mp4"

# Get violations
curl https://your-username-your-space.hf.space/violations
```

#### 3.3 Frontend (Vercel) Testing

- [ ] Load homepage
- [ ] Navigate to all pages
- [ ] Verify API endpoints work
- [ ] Test file upload
- [ ] Generate PDF
- [ ] Check console for errors

---

### Phase 4: Performance Testing

#### 4.1 Load Testing

**Backend:**
```bash
# Using Apache Bench (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/api/analytics
```

**Expected:** Response time < 200ms

#### 4.2 Video Processing Performance

- [ ] Test 100MB video (should complete in < 2 min)
- [ ] Test 10-minute video (should complete in < 5 min)
- [ ] Monitor memory usage
- [ ] Check CPU utilization

#### 4.3 Database Performance

- [ ] Query 1000 violations (should be < 500ms)
- [ ] Filtered query (should be < 300ms)
- [ ] Count aggregate operations

---

### Phase 5: Error Handling Testing

#### 5.1 Invalid Input

```bash
# Missing required fields
curl -X POST http://localhost:3000/api/violations/record \
  -H "Content-Type: application/json" \
  -d '{"violation_type": "OVERSPEEDING"}'
# Expected: 400 Bad Request

# Invalid status update
curl -X PATCH http://localhost:3000/api/admin/violations \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "status": "INVALID"}'
# Expected: 400 Bad Request

# Non-existent violation
curl http://localhost:3000/api/violations/99999
# Expected: 404 Not Found
```

#### 5.2 Video Processing Errors

```bash
# Invalid file format
curl -X POST http://localhost:8000/detect \
  -F "file=@document.txt"
# Expected: Error handling

# File too large
curl -X POST http://localhost:8000/detect \
  -F "file=@huge_video.mp4"
# Expected: File size limit error

# Corrupted video
curl -X POST http://localhost:8000/detect \
  -F "file=@corrupted.mp4"
# Expected: Video processing error
```

---

### Phase 6: Security Testing

- [ ] Test CORS headers
- [ ] Verify no SQL injection possible
- [ ] Test authentication (if implemented)
- [ ] Check sensitive data in logs
- [ ] Verify evidence images are secure

---

### Phase 7: Cross-Browser Testing

**Browsers to test:**
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)

**Features to test in each browser:**
- [ ] Charts rendering
- [ ] Video upload
- [ ] PDF generation
- [ ] Navigation
- [ ] Responsive layout

---

## 📊 Test Results Template

### Test Case: [Test Name]
- **Status**: ✅ PASSED / ❌ FAILED
- **Expected Result**: [Description]
- **Actual Result**: [What happened]
- **Environment**: [Local/Staging/Production]
- **Date**: [YYYY-MM-DD]
- **Notes**: [Additional notes]

### Example:
```
Test Case: Analytics Endpoint Returns Correct Statistics
- **Status**: ✅ PASSED
- **Expected Result**: API returns violation count of 127 and breakdown by type
- **Actual Result**: Received correct response with all expected fields
- **Environment**: Local Development
- **Date**: 2024-05-15
- **Notes**: Response time was 95ms
```

---

## 🔍 Bug Report Template

```
## Bug Title: [Short description]

### Environment
- **OS**: [Windows/Mac/Linux]
- **Browser**: [Chrome/Firefox/Safari]
- **Component**: [Frontend/Backend/AI Service]
- **URL**: [Where the bug occurs]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Logs
[Attach error logs or screenshots]

### Severity
- [ ] Critical (System down)
- [ ] High (Feature broken)
- [ ] Medium (Feature partially broken)
- [ ] Low (Minor issue)
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables set
- [ ] Database migrations completed
- [ ] Backup created
- [ ] Rollback plan prepared

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] AI Service deployed
- [ ] DNS updated
- [ ] SSL certificates valid
- [ ] Monitoring enabled

### Post-Deployment
- [ ] Health checks passing
- [ ] Smoke tests successful
- [ ] Real user testing
- [ ] Performance acceptable
- [ ] Logs monitored
- [ ] Rollback tested

---

## 📈 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | |
| Page Load Time | < 2s | |
| Video Processing Time | < 5s per min | |
| Uptime | 99.9% | |
| Error Rate | < 0.1% | |
| False Positive Rate | < 5% | |
| Detection Accuracy | > 95% | |

---

**Last Updated**: May 15, 2024
**Status**: ✅ Ready for Testing
