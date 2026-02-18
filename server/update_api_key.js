import pool from './db.js';

async function updateApiKey() {
    const API_KEY = 'JW5B5OrElJKt1JurUIQvvqAHu7RGUaUb';

    try {
        await pool.query(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['material_project_api_key', API_KEY, API_KEY]
        );
        console.log('Successfully updated API Key in database.');
        process.exit(0);
    } catch (e) {
        console.error('Failed to update config:', e);
        process.exit(1);
    }
}

updateApiKey();
