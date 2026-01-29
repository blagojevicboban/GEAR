import pool from '../db.js';

export const getAllLessons = async (req, res) => {
    try {
        const [lessons] = await pool.query(`
            SELECT l.*, s.name as sectorName, u.username as authorName, u.profilePicUrl as authorPic
            FROM lessons l
            LEFT JOIN sectors s ON l.sector_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            ORDER BY l.created_at DESC
        `);
        res.json(lessons);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
};

export const getLessonById = async (req, res) => {
    const { id } = req.params;
    try {
        const [lessons] = await pool.query(
            `
            SELECT l.*, s.name as sectorName, u.username as authorName 
            FROM lessons l
            LEFT JOIN sectors s ON l.sector_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            WHERE l.id = ?
        `,
            [id]
        );

        if (lessons.length === 0)
            return res.status(404).json({ error: 'Lesson not found' });

        const lesson = lessons[0];

        const [steps] = await pool.query(
            `
            SELECT ls.*, m.modelUrl, m.name as modelName 
            FROM lesson_steps ls 
            LEFT JOIN models m ON ls.model_id = m.id 
            WHERE ls.lesson_id = ? 
            ORDER BY ls.step_order ASC
        `,
            [id]
        );

        lesson.steps = steps;
        res.json(lesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
};

export const createLesson = async (req, res) => {
    const { title, description, sector_id, steps, image_url } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        // Get User ID from Username
        const [users] = await pool.query(
            'SELECT id, role FROM users WHERE username = ?',
            [requestor]
        );
        if (users.length === 0)
            return res.status(401).json({ error: 'User not found' });

        const user = users[0];
        if (user.role !== 'admin' && user.role !== 'teacher') {
            return res
                .status(403)
                .json({ error: 'Only teachers and admins can create lessons' });
        }

        const id = 'lesson-' + Date.now();
        await pool.query(
            'INSERT INTO lessons (id, title, description, sector_id, author_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, description, sector_id, user.id, image_url || null]
        );

        // Insert Steps if present
        if (steps && Array.isArray(steps) && steps.length > 0) {
            const stepValues = steps.map((s, index) => [
                s.id || 'step-' + Date.now() + '-' + index,
                id,
                index + 1, // step_order
                s.title,
                s.content,
                s.model_id || null, // Ensure empty string becomes null
                s.hotspot_id || null,
                s.image_url || null,
                s.interaction_type || 'read',
                s.interaction_data || null,
            ]);

            await pool.query(
                'INSERT INTO lesson_steps (id, lesson_id, step_order, title, content, model_id, hotspot_id, image_url, interaction_type, interaction_data) VALUES ?',
                [stepValues]
            );
        }

        res.json({
            id,
            title,
            description,
            sector_id,
            author_id: user.id,
            steps,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
};

export const updateLesson = async (req, res) => {
    const { id } = req.params;
    const { title, description, sector_id, steps, image_url } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        // Auth check
        const [users] = await pool.query(
            'SELECT id, role FROM users WHERE username = ?',
            [requestor]
        );
        if (users.length === 0)
            return res.status(401).json({ error: 'User not found' });
        const user = users[0];

        // Ownership check
        const [existing] = await pool.query(
            'SELECT author_id FROM lessons WHERE id = ?',
            [id]
        );
        if (existing.length === 0)
            return res.status(404).json({ error: 'Lesson not found' });

        if (user.role !== 'admin' && existing[0].author_id !== user.id) {
            return res
                .status(403)
                .json({ error: 'You can only edit your own lessons' });
        }

        // Update Metadata
        await pool.query(
            'UPDATE lessons SET title=?, description=?, sector_id=?, image_url=? WHERE id=?',
            [title, description, sector_id, image_url || null, id]
        );

        // Update Steps (Delete all and insert)
        if (steps && Array.isArray(steps)) {
            await pool.query('DELETE FROM lesson_steps WHERE lesson_id = ?', [
                id,
            ]);

            if (steps.length > 0) {
                const stepValues = steps.map((s, index) => [
                    s.id || 'step-' + Date.now() + '-' + index,
                    id,
                    index + 1, // step_order
                    s.title,
                    s.content,
                    s.model_id || null,
                    s.hotspot_id || null,
                    s.image_url || null,
                    s.interaction_type || 'read',
                    s.interaction_data || null,
                ]);

                await pool.query(
                    'INSERT INTO lesson_steps (id, lesson_id, step_order, title, content, model_id, hotspot_id, image_url, interaction_type, interaction_data) VALUES ?',
                    [stepValues]
                );
            }
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
};

export const deleteLesson = async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const [users] = await pool.query(
            'SELECT id, role FROM users WHERE username = ?',
            [requestor]
        );
        if (users.length === 0)
            return res.status(401).json({ error: 'User not found' });
        const user = users[0];

        const [existing] = await pool.query(
            'SELECT author_id FROM lessons WHERE id = ?',
            [id]
        );
        if (existing.length === 0)
            return res.status(404).json({ error: 'Lesson not found' });

        if (user.role !== 'admin' && existing[0].author_id !== user.id) {
            return res
                .status(403)
                .json({ error: 'You can only delete your own lessons' });
        }

        await pool.query('DELETE FROM lessons WHERE id = ?', [id]); // Cascades to steps
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
};

export const recordAttempt = async (req, res) => {
    const { id: lessonId } = req.params;
    const { status, score, last_step } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const [users] = await pool.query(
            'SELECT id FROM users WHERE username = ?',
            [requestor]
        );
        if (users.length === 0)
            return res.status(401).json({ error: 'User not found' });
        const userId = users[0].id;

        // Check if attempt exists
        const [existing] = await pool.query(
            'SELECT id FROM lesson_attempts WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
        );

        if (existing.length > 0) {
            // Update
            const attemptId = existing[0].id;
            let query = 'UPDATE lesson_attempts SET last_step = ?';
            const params = [last_step];

            if (status) {
                query += ', status = ?';
                params.push(status);
                if (status === 'completed') {
                    query += ', completed_at = CURRENT_TIMESTAMP';
                }
            }
            if (score !== undefined) {
                query += ', score = ?';
                params.push(score);
            }

            query += ' WHERE id = ?';
            params.push(attemptId);

            await pool.query(query, params);
            res.json({ success: true, id: attemptId });
        } else {
            // Create
            const attemptId = 'att-' + Date.now();
            await pool.query(
                'INSERT INTO lesson_attempts (id, user_id, lesson_id, status, score, last_step) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    attemptId,
                    userId,
                    lessonId,
                    status || 'started',
                    score || 0,
                    last_step || 0,
                ]
            );
            res.json({ success: true, id: attemptId });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record progress' });
    }
};

export const getTeacherStats = async (req, res) => {
    const requestor = req.headers['x-user-name'];

    try {
        const [users] = await pool.query(
            'SELECT id, role FROM users WHERE username = ?',
            [requestor]
        );
        if (users.length === 0)
            return res.status(401).json({ error: 'User not found' });

        const user = users[0];
        // Allow admin to see everything? Or just their own? Let's stick to their own + admin see all if needed.
        // For now, simple: Author Stats.

        let query = `
            SELECT 
                l.id as lessonId, l.title as lessonTitle, 
                la.status, la.score, la.started_at, la.completed_at,
                u.username as studentName, u.profilePicUrl as studentPic
            FROM lessons l
            JOIN lesson_attempts la ON l.id = la.lesson_id
            JOIN users u ON la.user_id = u.id
        `;

        const params = [];

        if (user.role !== 'admin') {
            query += ' WHERE l.author_id = ?';
            params.push(user.id);
        }

        query += ' ORDER BY la.started_at DESC';

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
