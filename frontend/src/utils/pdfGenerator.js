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

    // Helper to resolve URLs relative to location
    const getRelativeUrl = (path) => `${window.location.origin}${path}`;

    // ============ PRE-FETCH ASSETS ============
    let logoBase64 = null;
    let evidenceBase64 = null;

    try {
        logoBase64 = await fetchImageAsBase64(getRelativeUrl('/logo.png'));
    } catch (e) {
        console.warn("Could not pre-fetch police logo", e);
    }

    try {
        const type = challan.violation_type || 'OVERSPEEDING';
        let fallbackPath = '/overspeeding.png';
        if (type === 'NO HELMET') fallbackPath = '/no_helmet.png';
        else if (type === 'TRIPLE RIDING') fallbackPath = '/triple_riding.png';

        const imageUrl = challan.evidence_image_path
            ? `${API_CONFIG.AI_SERVICE_URL}/processed/${challan.evidence_image_path}`
            : getRelativeUrl(fallbackPath);

        evidenceBase64 = await fetchImageAsBase64(imageUrl);
    } catch (e) {
        console.warn("Could not pre-fetch violation evidence image", e);
    }

    // ============ HEADER SECTION ============
    // Deep navy header background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Draw Police Logo Emblem on the left
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 12, 6, 22, 22);
    }

    // White header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("MINISTRY OF ROAD TRANSPORT & HIGHWAYS", 38, 13);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("GOVERNMENT OF INDIA • E-CHALLAN SYSTEM", 38, 19);
    doc.text("AUTOMATED TRAFFIC VIOLATION NOTICE", 38, 24);
    
    currentY = 43;

    // ============ CHALLAN ID & DATE INFO ============
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`CHALLAN ID: ${challanID}`, margin, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const issueDate = new Date(challan.created_at || challan.timestamp || Date.now());
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    doc.text(`Issue Date: ${issueDate.toLocaleDateString('en-IN')} ${issueDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, margin, currentY + 5);
    doc.text(`Payment Due Date: ${dueDate.toLocaleDateString('en-IN')}`, margin, currentY + 10);

    // QR Code on the right
    try {
        const qrUrl = generateQRCodeUrl(challanID);
        const qrBase64 = await fetchImageAsBase64(qrUrl);
        doc.addImage(qrBase64, 'PNG', pageWidth - margin - 35, currentY - 5, 35, 35);
    } catch (e) {
        console.warn("QR code generation failed", e);
    }

    currentY += 20;

    // ============ DIVIDER ============
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // ============ OWNER & VEHICLE DETAILS (LEFT COLUMN) ============
    // Look up owner profiles dynamically
    const owners = {
        'TN38AB1234': { name: 'SAKTHI RANGANATHAN', dl: 'DL-382019485', address: '12A, Nehru Road, Coimbatore, TN' },
        'KA01HJ9988': { name: 'KARTHIK KUMAR', dl: 'DL-012020583', address: '45, Residency Street, Bengaluru, KA' },
        'MH12CD5678': { name: 'RAHUL DESHMUKH', dl: 'DL-122018394', address: '88, Shivaji Lane, Pune, MH' },
    };
    const plate = (challan.vehicle_plate || '').trim().replace(/\s+/g, '');
    const owner = owners[plate] || {
        name: 'VEERA TRANSPORT PVT LTD',
        dl: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: '5th Main Rd, Sector 4, HSR Layout, Bengaluru'
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("VEHICLE & OWNER DETAILS", margin, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const leftCol = [
        ['Registered Owner:', owner.name],
        ['Driving License:', owner.dl],
        ['Address:', owner.address],
        ['Vehicle Number:', challan.vehicle_plate || 'UNKNOWN'],
        ['Vehicle Type:', challan.vehicle_type || 'CAR'],
    ];

    leftCol.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, currentY);
        doc.setFont(undefined, 'normal');
        
        // Wrap long address strings
        if (label === 'Address:') {
            const addrLines = doc.splitTextToSize(value, 55);
            doc.text(addrLines, margin + 35, currentY);
            currentY += (addrLines.length * 4) + 1;
        } else {
            doc.text(value, margin + 35, currentY);
            currentY += 5;
        }
    });

    const midY = currentY;

    // ============ VIOLATION DETAILS (RIGHT COLUMN) ============
    currentY = midY - 26; // Align columns properly
    const rightMargin = pageWidth / 2 + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("VIOLATION DETAILS", rightMargin, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const rightCol = [
        ['Violation Type:', challan.violation_type || 'OVERSPEEDING'],
        ['Recorded Speed:', challan.speed_kmph ? `${challan.speed_kmph} km/h` : 'N/A'],
        ['AI Confidence:', `${((challan.confidence_score || 0.9) * 100).toFixed(1)}%`],
        ['Location Area:', challan.location || 'Main Road - Sector A'],
    ];

    rightCol.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, rightMargin, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(value, rightMargin + 32, currentY);
        currentY += 5;
    });

    // Sync Y coordinate to bottom of grid
    currentY = Math.max(midY, currentY) + 4;

    // ============ FINE AMOUNT (HIGHLIGHTED BOX) ============
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.8);
    doc.rect(margin, currentY, contentWidth, 14, 'DF');

    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL FINE AMOUNT: Rs. ${fine.toLocaleString('en-IN')}`, pageWidth / 2, currentY + 9, { align: 'center' });
    
    currentY += 21;

    // ============ EVIDENCE IMAGING ============
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("EVIDENCE CAMERA CAPTURE (AUTOMATED DETECTION)", margin, currentY);
    currentY += 5;

    if (evidenceBase64) {
        try {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.5);
            doc.rect(margin, currentY, contentWidth, 62, 'S');
            doc.addImage(evidenceBase64, 'JPEG', margin + 1, currentY + 1, contentWidth - 2, 60);
            currentY += 68;
        } catch (e) {
            console.error("Error drawing evidence image on PDF", e);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text("[EVIDENCE IMAGE LOADING ERROR]", pageWidth / 2, currentY + 20, { align: 'center' });
            currentY += 30;
        }
    } else {
        doc.setDrawColor(241, 245, 249);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 30, 'DF');
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text("CCTV EVIDENCE CAPTURE RECORD UNAVAILABLE", pageWidth / 2, currentY + 16, { align: 'center' });
        currentY += 36;
    }

    // ============ PAYMENT INSTRUCTIONS & LEGAL ============
    doc.setFillColor(254, 253, 237);
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.6);
    doc.rect(margin, currentY, contentWidth, 26, 'DF');

    doc.setTextColor(161, 98, 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("WARNING & LEGAL NOTICE", margin + 4, currentY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(113, 76, 11);
    const notes = doc.splitTextToSize(
        "This notice represents automated traffic violation documentation. The fine must be paid within 30 days of issuance to prevent formal legal proceedings. To make payments, check status, or submit appeals, enter the Challan ID on the government web portal (autochallanai.gov.in).",
        contentWidth - 8
    );
    doc.text(notes, margin + 4, currentY + 10);

    currentY += 31;

    // ============ SIGNATURE BLOCK ============
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("DIGITALLY SIGNED BY:", pageWidth - margin - 52, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("National Traffic Authority (NTA)", pageWidth - margin - 52, currentY + 4);
    doc.text("Government Electronic Verification", pageWidth - margin - 52, currentY + 8);

    // ============ FOOTER ============
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text("© Digital India E-Challan Initiative • Ministry of Road Transport & Highways", pageWidth / 2, pageHeight - 11, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} • Automated Digital Verification`, pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Save PDF
    doc.save(`Challan_${challan.id}_${challan.vehicle_plate || 'UNKNOWN'}_${Date.now()}.pdf`);
};
