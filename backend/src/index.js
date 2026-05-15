const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads
// __dirname is backend/src -> ../uploads is backend/uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve processed videos
// __dirname is backend/src -> ../.. is root -> ai_service/processed
app.use('/processed', express.static(path.join(__dirname, '../../ai_service/processed')));

// Basic Routes
app.get('/', (req, res) => {
    res.json({ message: 'Traffic Violation Detection Backend API' });
});

// Import Routes
const violationRoutes = require('./routes/violationRoutes');
app.use('/api/violations', violationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Serving uploads from: ${path.join(__dirname, '../uploads')}`);
    console.log(`Serving processed videos from: ${path.join(__dirname, '../../ai_service/processed')}`);
});

module.exports = app;
