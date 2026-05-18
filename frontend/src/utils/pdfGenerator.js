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

// Get detailed violation information from Indian Motor Vehicles Act, 1988
const getViolationDetails = (violationType) => {
    const violations = {
        'NO HELMET': {
            section: '188-A',
            act: 'Motor Vehicles Act, 1988',
            description: 'Riding motorcycle/scooter without crash helmet',
            baseAmount: 1000,
            imprisonment: 'Up to 3 months',
            penalty: 'Confiscation of vehicle documents',
            statute: 'Rule 138(2) of Road Safety Rules'
        },
        'TRIPLE RIDING': {
            section: '189',
            act: 'Motor Vehicles Act, 1988',
            description: 'More than two persons on motorcycle/scooter',
            baseAmount: 2000,
            imprisonment: 'Up to 6 months',
            penalty: 'License suspension up to 3 months',
            statute: 'Rule 137 of Road Safety Rules'
        },
        'OVERSPEEDING': {
            section: '182',
            act: 'Motor Vehicles Act, 1988',
            description: 'Exceeding speed limit on public way',
            baseAmount: 5000,
            imprisonment: 'Up to 6 months',
            penalty: 'License suspension up to 3 months',
            statute: 'Rule 47 of Central Motor Vehicles Rules'
        },
        'RED LIGHT VIOLATION': {
            section: '177',
            act: 'Motor Vehicles Act, 1988',
            description: 'Jumping or passing red traffic signal',
            baseAmount: 1500,
            imprisonment: 'Up to 3 months',
            penalty: 'Fine up to Rs. 5000 or license suspension',
            statute: 'Traffic Signal Violation Rules'
        },
        'WRONG SIDE DRIVING': {
            section: '173',
            act: 'Motor Vehicles Act, 1988',
            description: 'Driving on wrong side of the road',
            baseAmount: 3000,
            imprisonment: 'Up to 6 months',
            penalty: 'License suspension up to 3 months',
            statute: 'Rule 40 of Central Motor Vehicles Rules'
        },
        'NO LICENSE': {
            section: '180',
            act: 'Motor Vehicles Act, 1988',
            description: 'Driving without valid driving license',
            baseAmount: 5000,
            imprisonment: 'Up to 6 months',
            penalty: 'Vehicle seizure and auction',
            statute: 'Section 180 of MV Act, 1988'
        },
        'UNINSURED VEHICLE': {
            section: '196',
            act: 'Motor Vehicles Act, 1988',
            description: 'Operating vehicle without valid insurance',
            baseAmount: 2000,
            imprisonment: 'Up to 3 months',
            penalty: 'Vehicle impoundment',
            statute: 'Section 196 of MV Act, 1988'
        },
    };
    return violations[violationType] || violations['OVERSPEEDING'];
};

// Professional Realistic PDF Generator with Indian Government Format
export const generateClientSidePDF = async (challan, FINES) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    
    let currentY = margin;
    
    // Get violation details from Indian Motor Vehicles Act
    const violation = getViolationDetails(challan.violation_type);
    const fineAmount = FINES[challan.violation_type] || violation.baseAmount;
    const challanID = `CH-${challan.id}-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date(challan.created_at || challan.timestamp || Date.now());
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ============ TOP BORDER ============
    doc.setDrawColor(0, 32, 96);
    doc.setLineWidth(1);
    doc.line(0, 2, pageWidth, 2);
    doc.setLineWidth(0.5);
    doc.line(0, 4, pageWidth, 4);

    // ============ OFFICIAL HEADER ============
    doc.setFillColor(0, 32, 96);
    doc.rect(0, 5, pageWidth, 28, 'F');
    
    // Government emblem area
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 12, { align: 'center' });
    doc.text("MINISTRY OF ROAD TRANSPORT & HIGHWAYS", pageWidth / 2, 16.5, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("National Traffic Management Authority", pageWidth / 2, 20, { align: 'center' });
    doc.text("AI-Powered Automated Traffic Violation Detection System", pageWidth / 2, 23, { align: 'center' });
    doc.text("Government of India E-Services Initiative", pageWidth / 2, 26, { align: 'center' });
    
    currentY = 36;

    // ============ RED BANNER - CHALLAN TITLE ============
    doc.setFillColor(192, 0, 0);
    doc.rect(margin, currentY - 2, contentWidth, 18, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("E-CHALLAN", pageWidth / 2, currentY + 7, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("AUTOMATED TRAFFIC VIOLATION NOTICE - MOTOR VEHICLES ACT, 1988", pageWidth / 2, currentY + 13, { align: 'center' });
    
    currentY += 22;

    // ============ CHALLAN ID & KEY DATES BOX ============
    doc.setDrawColor(100, 100, 100);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, contentWidth, 14, 'FD');
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    
    // Two column layout
    const col1 = margin + 5;
    const col2 = pageWidth / 2 + 5;
    
    doc.text('CHALLAN ID:', col1, currentY + 4);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.text(challanID, col1 + 25, currentY + 4);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('ISSUE DATE:', col2, currentY + 4);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.text(issueDate.toLocaleDateString('en-IN'), col2 + 25, currentY + 4);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('VALID UNTIL:', col1, currentY + 9);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.text(dueDate.toLocaleDateString('en-IN'), col1 + 25, currentY + 9);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('STATUS:', col2, currentY + 9);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.text('ACTIVE - PAYMENT REQUIRED', col2 + 25, currentY + 9);
    
    currentY += 18;

    // Add QR Code on top right
    try {
        const qrUrl = generateQRCodeUrl(challanID);
        const qrBase64 = await fetchImageAsBase64(qrUrl);
        doc.setDrawColor(120, 120, 120);
        doc.rect(pageWidth - margin - 35, currentY - 18, 32, 32, 'S');
        doc.addImage(qrBase64, 'PNG', pageWidth - margin - 34, currentY - 17, 30, 30);
    } catch (e) {
        console.warn("QR code generation failed", e);
    }

    // ============ VEHICLE INFORMATION ============
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, currentY, contentWidth, 5, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text("VEHICLE INFORMATION", margin + 2, currentY + 3.5);
    currentY += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    
    const vehicleInfo = [
        { label: 'Vehicle Registration:', value: challan.vehicle_plate || 'NOT RECORDED' },
        { label: 'Vehicle Type:', value: challan.vehicle_type || 'UNKNOWN' },
        { label: 'Vehicle Category:', value: (challan.vehicle_type === 'CAR' ? 'Light Motor Vehicle' : 'Motorized Two Wheeler') },
    ];
    
    vehicleInfo.forEach((item) => {
        doc.setFont(undefined, 'bold');
        doc.text(item.label, margin + 2, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(item.value, margin + 65, currentY);
        currentY += 4.5;
    });
    
    currentY += 2;

    // ============ VIOLATION DETAILS ============
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, currentY, contentWidth, 5, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text("VIOLATION DETAILS", margin + 2, currentY + 3.5);
    currentY += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    
    const violationInfo = [
        { label: 'Type of Violation:', value: challan.violation_type },
        { label: 'MV Act Section:', value: `Section ${violation.section}` },
        { label: 'Legal Description:', value: violation.description },
        { label: 'Detection Method:', value: 'AI-Based Automated Detection' },
        { label: 'AI Confidence:', value: `${((challan.confidence_score || 0.9) * 100).toFixed(1)}%` },
        { label: 'Detection Time:', value: issueDate.toLocaleString('en-IN') },
        { label: 'Location:', value: challan.location || 'Automated Detection Point' },
    ];
    
    violationInfo.forEach((item) => {
        doc.setFont(undefined, 'bold');
        doc.text(item.label, margin + 2, currentY);
        doc.setFont(undefined, 'normal');
        const textWidth = contentWidth - 65;
        const wrappedValue = doc.splitTextToSize(item.value, textWidth);
        doc.text(wrappedValue, margin + 65, currentY);
        currentY += 4.5;
    });
    
    if (challan.speed_kmph) {
        doc.setFont(undefined, 'bold');
        doc.text('Speed Recorded:', margin + 2, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(`${challan.speed_kmph} km/h`, margin + 65, currentY);
        currentY += 4.5;
    }
    
    currentY += 2;

    // ============ FINE AMOUNT - PROFESSIONAL DISPLAY ============
    doc.setDrawColor(192, 0, 0);
    doc.setFillColor(255, 245, 245);
    doc.setLineWidth(2);
    doc.rect(margin, currentY, contentWidth, 20, 'FD');
    
    doc.setTextColor(192, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('PAYABLE FINE AMOUNT', margin + 5, currentY + 5);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(192, 0, 0);
    doc.text(`₹ ${fineAmount.toLocaleString('en-IN')}`, pageWidth / 2, currentY + 12, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('(Payable within 30 days from issuance date)', pageWidth / 2, currentY + 17, { align: 'center' });
    
    currentY += 24;

    // ============ EVIDENCE IMAGE ============
    if (challan.evidence_image_path) {
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text("VIOLATION EVIDENCE (CAPTURED BY CCTV)", margin + 2, currentY + 3.5);
        currentY += 6;

        try {
            const imageUrl = `${API_CONFIG.AI_SERVICE_URL}/processed/${challan.evidence_image_path}`;
            const base64Img = await fetchImageAsBase64(imageUrl);
            
            doc.setDrawColor(80, 80, 80);
            doc.rect(margin, currentY, contentWidth, 45, 'S');
            doc.addImage(base64Img, 'JPEG', margin + 1, currentY + 1, contentWidth - 2, 43);
            currentY += 50;
        } catch (e) {
            console.warn("Could not load evidence image", e);
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, currentY, contentWidth, 25, 'F');
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.text("EVIDENCE IMAGE UNAVAILABLE", pageWidth / 2, currentY + 13, { align: 'center' });
            currentY += 30;
        }
    }

    currentY += 2;

    // ============ LEGAL & PAYMENT INFORMATION ============
    doc.setFillColor(255, 250, 220);
    doc.setDrawColor(180, 120, 0);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, contentWidth, 28, 'FD');

    doc.setTextColor(120, 80, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8.5);
    doc.text("⚠ IMPORTANT LEGAL NOTICE", margin + 3, currentY + 3);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    const legalNotice = `This challan is issued under Section ${violation.section} of the Motor Vehicles Act, 1988. This is an automated detection-based challan generated through AI-powered surveillance system. Non-payment may result in prosecution, license suspension, vehicle impounding, and additional penalties under relevant sections of Indian law. This challan must be paid within 30 days from the date of issuance.`;
    
    const legalLines = doc.splitTextToSize(legalNotice, contentWidth - 6);
    doc.text(legalLines, margin + 3, currentY + 7);

    currentY += 32;

    // ============ PAYMENT METHODS ============
    doc.setFillColor(220, 240, 255);
    doc.setDrawColor(0, 100, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, contentWidth, 16, 'FD');
    
    doc.setTextColor(0, 50, 150);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8.5);
    doc.text("PAYMENT METHODS & INFORMATION", margin + 3, currentY + 3);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text("Online Portal: www.vahan.nic.in (National Vehicle Registry)", margin + 3, currentY + 7);
    doc.text("State RTO Portal: www.[state]-rto.gov.in | Local RTO Office: Visit nearest Regional Transport Office", margin + 3, currentY + 10);
    doc.text("Reference: Use Challan ID and Vehicle Number for payment identification", margin + 3, currentY + 13);

    currentY += 19;

    // ============ FOOTER ============
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'normal');
    
    doc.text(`© Government of India E-Challan System | Generated: ${new Date().toLocaleString('en-IN')}`, 
        pageWidth / 2, currentY + 4, { align: 'center' });
    doc.text('This is an electronically generated document. No official seal or signature required under Information Technology Act, 2000',
        pageWidth / 2, currentY + 7, { align: 'center' });
    doc.text('For disputes and appeals: Contact the Traffic Court or Regional Transport Office within 60 days',
        pageWidth / 2, currentY + 10, { align: 'center' });

    // ============ BOTTOM BORDER ============
    doc.setDrawColor(0, 32, 96);
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight - 2, pageWidth, pageHeight - 2);
    doc.setLineWidth(1);
    doc.line(0, pageHeight - 0.5, pageWidth, pageHeight - 0.5);

    // Save PDF
    const fileName = `Challan_${challan.vehicle_plate || 'UNKNOWN'}_${issueDate.getTime()}.pdf`;
    doc.save(fileName);
};
