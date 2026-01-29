import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assuming we want to keep academy_data.json in server root or config??
// Original path was __dirname + 'academy_data.json', where __dirname was server/
// Now we are in server/controllers. So we need ../academy_data.json
const ACADEMY_FILE = path.resolve(__dirname, '../academy_data.json');

const getAcademyVideos = () => {
    if (!fs.existsSync(ACADEMY_FILE)) {
        // Default seed data
        const defaults = {
            basics: [
                { id: 1, title: 'Installing GEAR Locally', duration: '5:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Deploying Docker containers in schools.' },
                { id: 2, title: 'Navigating the 3D Repo', duration: '3:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Finding and filtering VET models.' },
            ],
            creation: [
                { id: 3, title: 'Creating Your First Lesson', duration: '8:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Using the Workbook Editor.' },
                { id: 4, title: 'Adding Interactive Hotspots', duration: '4:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Attaching media to 3D parts.' },
            ],
            pedagogy: [
                { id: 5, title: 'Bloom\'s Taxonomy in VR', duration: '12:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Structuring learning outcomes.' },
                { id: 6, title: 'Flipped Classroom with GEAR', duration: '9:10', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Assigning VR homework.' },
            ]
        };
        fs.writeFileSync(ACADEMY_FILE, JSON.stringify(defaults, null, 2));
        return defaults;
    }
    return JSON.parse(fs.readFileSync(ACADEMY_FILE));
};

export const getVideos = (req, res) => {
    res.json(getAcademyVideos());
};

export const addVideo = (req, res) => {
    // Admin check logic is in route? Or repeated here?
    // Let's assume protection is done via middleware or checked here if we pass user
    // Original had simplistic check.
    const requestor = req.headers['x-user-name'];
    if (!requestor) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { category, video } = req.body;
        const data = getAcademyVideos();

        if (!data[category]) data[category] = [];
        const newVideo = { ...video, id: Date.now() };
        data[category].push(newVideo);

        fs.writeFileSync(ACADEMY_FILE, JSON.stringify(data, null, 2));
        res.json(newVideo);
    } catch (e) {
        res.status(500).json({ error: "Failed to save video" });
    }
};

export const deleteVideo = (req, res) => {
    const id = parseInt(req.params.id);
    const data = getAcademyVideos();
    let found = false;

    Object.keys(data).forEach(cat => {
        const initLen = data[cat].length;
        data[cat] = data[cat].filter(v => v.id !== id);
        if (data[cat].length !== initLen) found = true;
    });

    if (found) {
        fs.writeFileSync(ACADEMY_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Video not found" });
    }
};

export const updateVideo = (req, res) => {
    const id = parseInt(req.params.id);
    const { video } = req.body;
    const data = getAcademyVideos();
    let found = false;

    Object.keys(data).forEach(cat => {
        const idx = data[cat].findIndex(v => v.id === id);
        if (idx !== -1) {
            data[cat][idx] = { ...data[cat][idx], ...video };
            found = true;
        }
    });

    if (found) {
        fs.writeFileSync(ACADEMY_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Video not found" });
    }
};
