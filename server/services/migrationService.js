import pool from '../db.js';

export const runMigrations = async () => {
    try {
        // Ensure users table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255),
                institution VARCHAR(255),
                bio TEXT,
                profilePicUrl VARCHAR(500),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                role ENUM('admin', 'teacher', 'student') DEFAULT 'student'
            )
        `);

        // Ensure sectors table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sectors (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT
            )
        `);

        // Ensure hotspots table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hotspots (
                id VARCHAR(50) PRIMARY KEY,
                model_id VARCHAR(50),
                position JSON,
                title VARCHAR(255),
                description TEXT,
                type VARCHAR(50),
                mediaUrl VARCHAR(500)
            )
        `);

        // Ensure workshops table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workshops (
                id VARCHAR(50) PRIMARY KEY,
                modelId VARCHAR(50),
                createdBy VARCHAR(100),
                status ENUM('active', 'ended') DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool
            .query('SELECT optimizedUrl FROM models LIMIT 1')
            .catch(async () => {
                console.log('Migrating DB: Adding optimization columns...');
                await pool.query(
                    'ALTER TABLE models ADD COLUMN optimizedUrl VARCHAR(255)'
                );
                await pool.query(
                    'ALTER TABLE models ADD COLUMN aiAnalysis TEXT'
                );
                await pool.query(
                    'ALTER TABLE models ADD COLUMN optimizationStats TEXT'
                );
            });

        await pool
            .query('SELECT * FROM system_settings LIMIT 1')
            .catch(async () => {
                console.log('Migrating DB: Creating system_settings table...');
                await pool.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT
                )
            `);
                await pool.query(
                    "INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('maintenance_mode', 'false'), ('global_announcement', ''), ('allowed_origins', 'http://localhost:3000,http://localhost:3001,https://gear.tsp.edu.rs'), ('gemini_api_key', ''), ('allow_public_registration', 'true'), ('max_file_size_mb', '50'), ('moodle_url', ''), ('moodle_client_id', ''), ('brand_name', 'THE GEAR'), ('brand_color', '#4f46e5'), ('ai_model', 'gemini-2.0-flash'), ('ai_language', 'Auto'), ('ai_temperature', '0.7'), ('challenge_duration_days', '7'), ('show_leaderboard', 'true')"
                );
            });

        await pool
            .query('SELECT 1 FROM analytics_logs LIMIT 1')
            .catch(async () => {
                console.log('Migrating DB: Creating analytics_logs table...');
                await pool.query(`
                CREATE TABLE IF NOT EXISTS analytics_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255),
                    lesson_id VARCHAR(255),
                    model_id VARCHAR(255),
                    position JSON,
                    target JSON,
                    duration INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            });

        await pool
            .query('SELECT 1 FROM academy_videos LIMIT 1')
            .catch(async () => {
                console.log('Migrating DB: Creating academy_videos table...');
                await pool.query(`
                CREATE TABLE IF NOT EXISTS academy_videos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    category VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    duration VARCHAR(20),
                    url VARCHAR(255),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

                // Seed data if empty
                const [rows] = await pool.query(
                    'SELECT COUNT(*) as count FROM academy_videos'
                );
                if (rows[0].count === 0) {
                    console.log('Seeding Academy Videos...');
                    const seedData = [
                        {
                            category: 'basics',
                            title: 'Installing GEAR Locally',
                            duration: '5:20',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description:
                                'Deploying Docker containers in schools.',
                        },
                        {
                            category: 'basics',
                            title: 'Navigating the 3D Repo',
                            duration: '3:15',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description: 'Finding and filtering VET models.',
                        },
                        {
                            category: 'creation',
                            title: 'Creating Your First Lesson',
                            duration: '8:45',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description: 'Using the Workbook Editor.',
                        },
                        {
                            category: 'creation',
                            title: 'Adding Interactive Hotspots',
                            duration: '4:30',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description: 'Attaching media to 3D parts.',
                        },
                        {
                            category: 'pedagogy',
                            title: "Bloom's Taxonomy in VR",
                            duration: '12:00',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description: 'Structuring learning outcomes.',
                        },
                        {
                            category: 'pedagogy',
                            title: 'Flipped Classroom with GEAR',
                            duration: '9:10',
                            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                            description: 'Assigning VR homework.',
                        },
                    ];

                    for (const video of seedData) {
                        await pool.query(
                            'INSERT INTO academy_videos (category, title, duration, url, description) VALUES (?, ?, ?, ?, ?)',
                            [
                                video.category,
                                video.title,
                                video.duration,
                                video.url,
                                video.description,
                            ]
                        );
                    }
                }
            });
    } catch (e) {
        console.error('Migration check failed:', e);
    }
};
