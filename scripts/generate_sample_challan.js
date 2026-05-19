const utils = require('../backend/lib/utils');
const fs = require('fs');

async function run() {
  const sample = {
    id: 9999,
    video_id: 'test_cam_01',
    violation_type: 'OVERSPEEDING',
    timestamp: new Date().toISOString(),
    confidence_score: 0.92,
    speed_kmph: 88,
    vehicle_plate: 'KA01AB1234',
    evidence_image_path: 'test_evidence.jpg',
    vehicle_type: 'CAR'
  };

  try {
    const { buffer, filename, amount } = await utils.generateChallanPDF(sample);
    const outPath = `./uploads/${filename}`;
    fs.mkdirSync('./uploads', { recursive: true });
    fs.writeFileSync(outPath, buffer);
    console.log(`Generated challan PDF: ${outPath} (Amount: INR ${amount})`);
  } catch (err) {
    console.error('Error generating sample challan:', err);
  }
}

run();
