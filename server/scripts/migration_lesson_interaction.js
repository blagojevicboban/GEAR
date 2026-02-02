import pool from '../db.js';

async function migrate() {
    console.log('Migrating lesson_steps table...');
    try {
        // Add interaction_type
        try {
            await pool.query("ALTER TABLE lesson_steps ADD COLUMN interaction_type ENUM('read', 'find_part', 'quiz') DEFAULT 'read'");
            console.log('Added interaction_type column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('interaction_type already exists');
            } else {
                console.error('Error adding interaction_type:', e);
            }
        }

        // Add interaction_data
        try {
            await pool.query("ALTER TABLE lesson_steps ADD COLUMN interaction_data TEXT DEFAULT NULL");
            console.log('Added interaction_data column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('interaction_data already exists');
            } else {
                console.error('Error adding interaction_data:', e);
            }
        }
        
        console.log('Migration complete');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
