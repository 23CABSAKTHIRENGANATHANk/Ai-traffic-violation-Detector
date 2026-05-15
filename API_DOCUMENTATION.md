# API Routes Configuration

## Current API Structure

```
/api/
├── index.js              → GET / → API info
└── violations/
    ├── index.js          → GET /violations → List all violations
    ├── record.js         → POST /violations/record → Record new violation (from AI service)
    └── [id]/
        ├── index.js      → GET /violations/[id] → Get single violation
        └── challan.js    → POST /violations/[id]/challan → Generate PDF challan
└── upload.js             → POST /upload → Upload video to AI service
```

## API Endpoints

### 1. Get API Info
```
GET /api/
Response: { message, version, endpoints }
```

### 2. List All Violations
```
GET /api/violations
Response: Array of violations
```

### 3. Get Single Violation
```
GET /api/violations/[id]
Response: Violation object
```

### 4. Record Violation (Called by AI Service)
```
POST /api/violations/record
Body: {
  video_id,
  violation_type,
  timestamp,
  confidence,
  speed,
  vehicle_number,
  evidence_image,
  vehicle_type
}
Response: Created violation object
```

### 5. Upload Video
```
POST /api/upload
Body: multipart/form-data with file
Response: { message, videoId, aiServiceId }
```

### 6. Generate Challan PDF
```
POST /api/violations/[id]/challan
Response: PDF file (binary)
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=traffic_db
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:8000
```

### AI Service (.env)
```
BACKEND_API_URL=http://localhost:3000/api/violations/record
DEBUG=true
UPLOAD_FOLDER=uploads
PROCESSED_FOLDER=processed
PORT=8000
```

## CORS Configuration

All endpoints have CORS enabled:
```javascript
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
```

For production, change `'*'` to specific domain:
```javascript
res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
```

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 405: Method Not Allowed
- 500: Server Error

## Database Fallback

If PostgreSQL is not available, the system uses an in-memory mock database with sample data:
- Sample violations pre-loaded
- All operations work in memory
- Data resets when server restarts
- Perfect for testing without database
