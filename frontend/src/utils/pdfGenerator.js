import { jsPDF } from "jspdf";
import { API_CONFIG } from "../config/api";

// Utility to generate QR code using QR server API (no library needed)
const generateQRCodeUrl = (data) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
};

const fetchImageAsBase64 = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image not found");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Professional PDF Generator with Enhanced Layout
export const generateClientSidePDF = async (challan, FINES) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fine = FINES[challan.violation_type] || 500;
    const challanID = `CH-${challan.id}-${Date.now().toString().slice(-6)}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    let currentY = margin;

    // ============ HEADER SECTION ============
    // Background header
    doc.setFillColor(200, 0, 0);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // White header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("E-CHALLAN", pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text("AUTOMATED TRAFFIC VIOLATION NOTICE", pageWidth / 2, 25, { align: 'center' });
    
    currentY = 45;

    // ============ CHALLAN ID & DATE INFO ============
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`CHALLAN ID: ${challanID}`, margin, currentY);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const issueDate = new Date(challan.created_at || challan.timestamp || Date.now());
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    doc.text(`Issued: ${issueDate.toLocaleDateString('en-IN')} ${issueDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, margin, currentY + 6);
    doc.text(`Due Date: ${dueDate.toLocaleDateString('en-IN')}`, margin, currentY + 12);

    // QR Code on the right
    try {
        const qrUrl = generateQRCodeUrl(challanID);
        const qrBase64 = await fetchImageAsBase64(qrUrl);
        doc.addImage(qrBase64, 'PNG', pageWidth - margin - 40, currentY - 5, 35, 35);
    } catch (e) {
        console.warn("QR code generation failed", e);
    }

    currentY += 25;

    // ============ DIVIDER ============
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // ============ VEHICLE INFORMATION ============
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text("VEHICLE INFORMATION", margin, currentY);
    currentY += 7;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const vehicleInfo = [
        ['Vehicle Number:', challan.vehicle_plate || 'UNKNOWN'],
        ['Vehicle Type:', challan.vehicle_type || 'UNKNOWN'],
        ['Video ID:', challan.video_id || 'N/A'],
    ];
    
    vehicleInfo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 6;
    });

    currentY += 5;

    // ============ VIOLATION DETAILS ============
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text("VIOLATION DETAILS", margin, currentY);
    currentY += 7;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    const violationInfo = [
        ['Type:', challan.violation_type],
        ['AI Confidence:', `${((challan.confidence_score || 0.9) * 100).toFixed(1)}%`],
        ['Speed Recorded:', challan.speed_kmph ? `${challan.speed_kmph} km/h` : 'N/A'],
    ];

    violationInfo.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 6;
    });

    currentY += 5;

    // ============ FINE AMOUNT (HIGHLIGHTED) ============
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(2);
    doc.rect(margin, currentY - 3, contentWidth, 18, 'S');
    
    doc.setFillColor(255, 240, 240);
    doc.rect(margin, currentY - 3, contentWidth, 18, 'F');
    
    doc.setTextColor(200, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(`FINE AMOUNT: ₹${fine.toLocaleString('en-IN')}`, pageWidth / 2, currentY + 6, { align: 'center' });
    
    currentY += 22;

    // ============ EVIDENCE IMAGE ============
    if (challan.evidence_image_path) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(200, 0, 0);
        doc.text("EVIDENCE IMAGE", margin, currentY);
        currentY += 6;

        try {
            const imageUrl = `${API_CONFIG.AI_SERVICE_URL}/processed/${challan.evidence_image_path}`;
            const base64Img = await fetchImageAsBase64(imageUrl);
            
            doc.setDrawColor(100, 100, 100);
            doc.rect(margin, currentY, contentWidth, 60, 'S');
            doc.addImage(base64Img, 'JPEG', margin + 2, currentY + 2, contentWidth - 4, 56);
            currentY += 65;
        } catch (e) {
            console.warn("Could not load evidence image", e);
            doc.setTextColor(200, 0, 0);
            doc.setFontSize(10);
            doc.text("[EVIDENCE IMAGE NOT AVAILABLE]", pageWidth / 2, currentY + 25, { align: 'center' });
            currentY += 35;
        }
    }

    currentY += 5;

    // ============ IMPORTANT NOTES ============
    doc.setFillColor(255, 250, 200);
    doc.rect(margin, currentY, contentWidth, 35, 'F');
    doc.setDrawColor(200, 150, 0);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, contentWidth, 35, 'S');

    doc.setTextColor(100, 80, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text("⚠ IMPORTANT NOTICE", margin + 5, currentY + 6);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const notes = doc.splitTextToSize(
        "This is an automated traffic violation challan generated using AI-based detection. The fine must be paid within 30 days of the notice date to avoid legal action. Payment details and instructions can be obtained from the local traffic authority website.",
        contentWidth - 10
    );
    doc.text(notes, margin + 5, currentY + 12);

    currentY += 40;

    // ============ FOOTER ============
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    doc.text("© AI Traffic Violation Detection System", pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save PDF
    doc.save(`Challan_${challan.id}_${challan.vehicle_plate || 'UNKNOWN'}_${Date.now()}.pdf`);
};
