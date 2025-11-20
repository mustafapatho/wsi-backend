const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/slides', express.static(path.join(__dirname, 'public', 'slides')));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.svs', '.tiff', '.tif', '.ndpi', '.vms', '.vmu', '.scn'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: .svs, .tiff, .tif, etc.'));
        }
    }
});

// Convert SVS to DZI using Python script
async function convertToDZI(inputPath, outputName) {
    const outputDir = path.join(__dirname, 'public', 'slides');
    await fs.mkdir(outputDir, { recursive: true });

    const pythonScript = path.join(__dirname, 'convert.py');
    const command = `python3 "${pythonScript}" "${inputPath}" "${outputDir}" "${outputName}"`;

    console.log('Running conversion:', command);
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('Warning')) {
        console.error('Conversion error:', stderr);
    }
    console.log('Conversion output:', stdout);

    return `/slides/${outputName}.dzi`;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'WSI Backend is running' });
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File uploaded:', req.file.filename);

        // Generate output name (remove spaces, add timestamp)
        const outputName = `slide_${Date.now()}`;

        // Convert to DZI
        const dziUrl = await convertToDZI(req.file.path, outputName);

        // Clean up original file
        await fs.unlink(req.file.path);

        // Return the DZI URL
        const fullUrl = `${req.protocol}://${req.get('host')}${dziUrl}`;

        res.json({
            success: true,
            message: 'File uploaded and converted successfully',
            dziUrl: fullUrl,
            filename: req.file.originalname,
            size: req.file.size
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to process file',
            message: error.message
        });
    }
});

// List all converted slides
app.get('/slides', async (req, res) => {
    try {
        const slidesDir = path.join(__dirname, 'public', 'slides');
        const files = await fs.readdir(slidesDir);
        const dziFiles = files.filter(f => f.endsWith('.dzi'));

        const slides = dziFiles.map(f => ({
            name: f,
            url: `${req.protocol}://${req.get('host')}/slides/${f}`
        }));

        res.json({ slides });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list slides' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`WSI Backend running on port ${PORT}`);
    console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
