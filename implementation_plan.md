# AI Traffic Violation Detection System - Final Architecture Design

## 1. Executive Summary
This document outlines the architecture for a court-ready **AI Traffic Violation Detection System**. The system ingests traffic video footage, uses Computer Vision (YOLOv8) to detect violations (Overspeeding, Triple Riding, No Helmet), maintains a chain of custody for evidence, and generates legal-grade e-Challan PDFs.

## 2. System Architecture

### 2.1 High-Level Data Flow
1.  **Ingest**: User uploads raw video (MP4/AVI) via Web Dashboard.
2.  **Storage**: Raw video saved to `backend/uploads`.
3.  **Processing (AI Microservice)**:
    *   **Detection**: YOLOv8 detects Vehicles (Car, Bike, Truck) and Persons.
    *   **Tracking**: Object tracking (BoT-SORT / ByteTrack) assigns unique IDs.
    *   **Violation Logic**: Rules engine checks for speeding, occupant counts, etc.
    *   **Annotation**: `cv2.VideoWriter` generates a red/green coded output video.
    *   **Evidence**: High-confidence frames are cropped and saved as JPGs.
4.  **Database**: Violation metadata (Time, Location, Type, License Plate) stored in PostgreSQL.
5.  **Admin Review**: Authorities view the annotated video and high-res evidence.
6.  **Action**: Admin approves violation -> e-Challan generated.

### 2.2 Technology Stack
| Component | Tech Choice | Justification |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind | fast, responsive, modern UI with "Government/Smart City" aesthetics. |
| **Backend** | Node.js + Express | Efficient I/O for file streaming and API handling. |
| **AI Engine** | Python + FastAPI | Native support for PyTorch/YOLO; independent scaling. |
| **DB** | PostgreSQL | Relational integrity for legal records (Challans, Payments). |
| **Video** | OpenCV + EasyOCR | robust frame manipulation and license plate reading. |

## 3. Detailed Logic Specifications

### 3.1 Violation Rules
| Violation | Logic Rule | Confidence Threshold |
| :--- | :--- | :--- |
| **Overspeeding** | `(distance_pixels * scale_factor) / time_sec > SPEED_LIMIT` | > 40 km/h (Demo) |
| **Triple Riding** | `Object(Class=Motorcycle)` INTERSECTS > 2 `Object(Class=Person)` | > 90% IoU |
| **No Helmet** | `Object(Class=Person)` inside `Motorcycle` detected WITHOUT `Class=Helmet` | > 80% (Simulated for Demo) |

### 3.2 Video Annotation Standard
The AI service generates a "Proof of Violation" video:
*   **Green Box**: Normal behavior.
*   **Red Box**: Detected violation.
*   **Overlay Text**: `[ID: 42] OVERSPEED (85 km/h)` burned into the video.
*   **Encoding**: MP4 container (h.264/mp4v) for web compatibility.

## 4. Database Schema (Schema v1.0)

```sql
-- VIOLATIONS TABLE
CREATE TABLE violations (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    tracking_id INTEGER,
    violation_type VARCHAR(50) CHECK (violation_type IN ('OVERSPEED', 'TRIPLE_RIDING', 'NO_HELMET')),
    confidence_score FLOAT,
    speed_kmph FLOAT,
    vehicle_number VARCHAR(20),     -- Extracted via OCR
    timestamp TIMESTAMP,
    evidence_image_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' -- PENDING, APPROVED, REJECTED
);

-- CHALLANS TABLE
CREATE TABLE challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id INTEGER REFERENCES violations(id),
    amount DECIMAL(10,2),
    pdf_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API Endpoints

### Backend (Port 3000)
*   `POST /api/upload`: Handle video ingestion.
*   `GET /api/violations`: List detected violations.
*   `POST /api/violations/:id/challan`: Generate PDF.
*   `GET /processed/:filename`: Stream annotated videos.

### AI Service (Port 8000)
*   `POST /detect`: Accepts video path, starts background task.

## 6. Implementation Status
*   ✅ **Frontend**: Dashboard, Upload, Admin, Challan pages active.
*   ✅ **AI**: YOLOv8 Tracking, Speed Estimation, OCR, Video Annotation active.
*   ✅ **Backend**: Express server, Static Video Serving, PDF Generation active.
*   ✅ **Deployment**: Localhost microservices structure ready.

---
*Created by Antigravity AI - 2026*
