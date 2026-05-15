export const config = {
    api: {
        bodyParser: {
            sizeLimit: '500mb',
        },
    },
};

import busboy from 'busboy';
import axios from 'axios';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const bb = busboy({ headers: req.headers, limits: { fileSize: 500 * 1024 * 1024 } });
            let fileBuffer = null;
            let fileName = '';

            bb.on('file', (fieldname, file, info) => {
                const chunks = [];
                file.on('data', (data) => {
                    chunks.push(data);
                });
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    fileName = info.filename;
                });
            });

            bb.on('close', async () => {
                if (!fileBuffer) {
                    return res.status(400).json({ error: 'No video file provided' });
                }

                try {
                    // Try to forward to AI Service if available
                    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/detect';
                    
                    // Create FormData and send to AI service
                    const FormData = require('form-data');
                    const formData = new FormData();
                    formData.append('file', fileBuffer, fileName);

                    try {
                        const aiResponse = await axios.post(aiServiceUrl, formData, {
                            headers: formData.getHeaders(),
                            timeout: 300000 // 5 minutes timeout for processing
                        });

                        res.status(200).json({
                            message: 'Video uploaded and forwarded for AI analysis.',
                            videoId: fileName,
                            aiServiceId: aiResponse.data.video_id,
                            status: 'processing'
                        });
                    } catch (aiError) {
                        console.error('AI Service Error:', aiError.message);
                        res.status(200).json({
                            message: 'Video uploaded, but AI service could not be reached.',
                            videoId: fileName,
                            error: 'AI_SERVICE_UNAVAILABLE',
                            note: 'Please ensure AI service is running and accessible'
                        });
                    }
                } catch (error) {
                    console.error('Upload Error:', error.message);
                    res.status(500).json({ error: 'Failed to process video upload' });
                }
            });

            req.pipe(bb);
        } catch (error) {
            console.error('Busboy Error:', error);
            res.status(500).json({ error: 'Failed to parse request' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
