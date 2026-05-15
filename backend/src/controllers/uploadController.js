const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.uploadVideo = [
    upload.single('video'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        console.log(`File uploaded: ${req.file.path}`);

        try {
            // Forward file to AI Service
            const formData = new FormData();
            formData.append('file', fs.createReadStream(req.file.path));

            // Note: In a real production env, we might want to just pass the path if sharing storage,
            // but for microservices decoupling, sending the file is standard.
            const aiResponse = await axios.post('http://localhost:8000/detect', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            console.log('AI Service triggered:', aiResponse.data);

            res.status(200).json({
                message: 'Video uploaded and forwarded for AI analysis.',
                videoId: req.file.filename,
                aiServiceId: aiResponse.data.video_id,
                path: req.file.path
            });

        } catch (error) {
            console.error('Error contacting AI service:', error.message);

            // We still return 200 to the user but with a warning, or 500?
            // Let's return 200 keeping the file but noting AI failed.
            res.status(200).json({
                message: 'Video uploaded, but AI service could not be reached.',
                videoId: req.file.filename,
                error: 'AI_SERVICE_UNAVAILABLE'
            });
        }
    }
];
