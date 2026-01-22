CREATE TABLE IF NOT EXISTS workshops (
    id VARCHAR(255) PRIMARY KEY,
    modelId VARCHAR(255) NOT NULL,
    createdBy VARCHAR(255) NOT NULL,
    status ENUM('active', 'closed') DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(username) ON DELETE CASCADE
);
