import pool from '../db.js';

export const runMigrations = async () => {
    try {
        await pool.query('SELECT optimizedUrl FROM models LIMIT 1').catch(async () => {
            console.log("Migrating DB: Adding optimization columns...");
            await pool.query('ALTER TABLE models ADD COLUMN optimizedUrl VARCHAR(255)');
            await pool.query('ALTER TABLE models ADD COLUMN aiAnalysis TEXT');
            await pool.query('ALTER TABLE models ADD COLUMN optimizationStats TEXT');
        });

        await pool.query('SELECT * FROM system_settings LIMIT 1').catch(async () => {
            console.log("Migrating DB: Creating system_settings table...");
            await pool.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT
                )
            `);
            await pool.query("INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('maintenance_mode', 'false'), ('global_announcement', '')");
        });

        await pool.query('SELECT 1 FROM analytics_logs LIMIT 1').catch(async () => {
            console.log("Migrating DB: Creating analytics_logs table...");
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

    } catch (e) {
        console.error("Migration check failed:", e);
    }
};
