import { jsPDF } from "jspdf";

export const generateClientSidePDF = (challan, FINES) => {
    const doc = new jsPDF();
    const fine = FINES[challan.violation_type] || 500;
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(200, 0, 0); // Red title
    doc.text("E-CHALLAN", 105, 20, null, null, "center");

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("TRAFFIC VIOLATION NOTICE", 105, 30, null, null, "center");

    // Divider
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const startY = 50;
    const lineSpacing = 10;
    
    doc.text(`Challan ID: CH-${challan.id}-${Date.now().toString().slice(-4)}`, 20, startY);
    doc.text(`Date & Time: ${new Date(challan.created_at || Date.now()).toLocaleString()}`, 20, startY + lineSpacing);
    doc.text(`Vehicle Number: ${challan.vehicle_plate || 'UNKNOWN'}`, 20, startY + lineSpacing * 2);
    doc.text(`Vehicle Type: ${challan.vehicle_type || 'UNKNOWN'}`, 20, startY + lineSpacing * 3);
    
    // Divider
    doc.line(20, startY + lineSpacing * 4, 190, startY + lineSpacing * 4);

    // Violation Details
    doc.setFont(undefined, 'bold');
    doc.text("Violation Details:", 20, startY + lineSpacing * 5);
    doc.setFont(undefined, 'normal');

    doc.text(`Type: ${challan.violation_type}`, 20, startY + lineSpacing * 6);
    doc.text(`Speed Recorded: ${challan.speed_kmph ? challan.speed_kmph + ' km/h' : 'N/A'}`, 20, startY + lineSpacing * 7);
    doc.text(`AI Confidence: ${((challan.confidence_score || 0.9) * 100).toFixed(0)}%`, 20, startY + lineSpacing * 8);

    // Divider
    doc.line(20, startY + lineSpacing * 9, 190, startY + lineSpacing * 9);

    // Fine Amount
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text(`Fine Amount: INR ${fine.toLocaleString()}`, 20, startY + lineSpacing * 11);

    // Footer note
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    const footerY = 250;
    doc.line(20, footerY - 5, 190, footerY - 5);
    doc.text("Notice: This is an automatically generated AI Traffic Violation Challan.", 105, footerY, null, null, "center");
    doc.text("Please pay the fine within 30 days to avoid legal action.", 105, footerY + 5, null, null, "center");

    // Save PDF
    doc.save(`Challan_${challan.id}_${challan.vehicle_plate || 'UNKNOWN'}.pdf`);
};
