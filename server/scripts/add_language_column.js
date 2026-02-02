
import pool from '../db.js';

const addLanguageColumn = async () => {
    try {
        console.log('Checking if language column exists...');
        const [columns] = await pool.query(
            "SHOW COLUMNS FROM users LIKE 'language'"
        );

        if (columns.length === 0) {
            console.log('Adding language column to users table...');
            await pool.query(
                "ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'"
            );
            console.log('Language column added successfully.');
        } else {
            console.log('Language column already exists.');
        }
    } catch (err) {
        console.error('Failed to add language column:', err);
    } finally {
        process.exit();
    }
};

addLanguageColumn();
