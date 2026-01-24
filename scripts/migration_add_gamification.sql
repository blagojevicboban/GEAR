ALTER TABLE lesson_steps
ADD COLUMN interaction_type ENUM('read', 'quiz', 'find_part') DEFAULT 'read',
ADD COLUMN interaction_data JSON DEFAULT NULL;