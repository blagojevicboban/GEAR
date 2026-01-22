import pool from './db.js';

const INITIAL_MODELS = [
    {
        id: 'brainstem-001',
        name: 'BrainStem - Bio-Mechanical Model',
        description: 'An advanced anatomical animation model used in Mechatronics and ICT VET courses to study complex skeletal rigging, vertex skinning, and synchronized motor control simulations.',
        sector: 'MECHATRONICS',
        equipmentType: 'Robotic Anatomy',
        level: 'ADVANCED',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
        thumbnailUrl: 'https://picsum.photos/seed/brainstem/600/400',
        optimized: true,
        fileSize: 8400000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-07-20',
        hotspots: [
            {
                id: 'brain-hs1',
                position: '{"x": 0, "y": 1.2, "z": 0}',
                title: 'Neural Processor Hub',
                description: 'Analysis of the central control unit and sensor integration for bio-mimetic movement.',
                type: 'info',
                mediaUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200'
            },
            {
                id: 'brain-hs2',
                position: '{"x": 0.3, "y": 0.8, "z": 0.1}',
                title: 'Actuator Joint',
                description: 'Examine the multi-axis servo coordination required for fluid limb motion.',
                type: 'info'
            },
            {
                id: 'brain-hs3',
                position: '{"x": -0.2, "y": 1.5, "z": 0.2}',
                title: 'Rigging Constraints',
                description: 'Study the mesh deformation and weighting used in high-fidelity industrial simulations.',
                type: 'info'
            }
        ]
    },
    {
        id: 'toycar-001',
        name: 'Toy Car - Mechanical Assembly',
        description: 'A precision-engineered toy car model used to study injection molding parts, mechanical assembly tolerances, and material properties in automotive and product design VET courses.',
        sector: 'MECHANICAL',
        equipmentType: 'Mechanical Assembly',
        level: 'INTERMEDIATE',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
        thumbnailUrl: 'https://picsum.photos/seed/toycar/600/400',
        optimized: true,
        fileSize: 5600000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-07-02',
        hotspots: [
            {
                id: 'toy-hs1',
                position: '{"x": 0.15, "y": 0.08, "z": 0.25}',
                title: 'Wheel Assembly',
                description: 'Examine the axle attachment and tire tread geometry for friction analysis.',
                type: 'video',
                mediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            },
            {
                id: 'toy-hs2',
                position: '{"x": 0, "y": 0.15, "z": 0}',
                title: 'Chassis Integration',
                description: 'Assess the snap-fit connectors used to join the body shell to the base frame.',
                type: 'info'
            },
            {
                id: 'toy-hs3',
                position: '{"x": 0, "y": 0.1, "z": -0.2}',
                title: 'Rear Diffuser',
                description: 'Study aerodynamic shaping and molding constraints in high-impact plastics.',
                type: 'info'
            }
        ]
    },
    {
        id: 'city-001',
        name: 'Smart City Infrastructure',
        description: 'A comprehensive 3D visualization of urban infrastructure for studying smart city layouts, traffic management, and sustainable construction planning in VET construction sectors.',
        sector: 'CONSTRUCTION',
        equipmentType: 'Urban Planning Model',
        level: 'ADVANCED',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/VirtualCity/glTF-Binary/VirtualCity.glb',
        thumbnailUrl: 'https://picsum.photos/seed/virtualcity/600/400',
        optimized: true,
        fileSize: 12500000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-06-15',
        hotspots: [
            {
                id: 'city-hs1',
                position: '{"x": 2, "y": 0.5, "z": 2}',
                title: 'Traffic Management',
                description: 'Analyze intersection layouts and signal placement for optimized urban traffic flow.',
                type: 'info'
            },
            {
                id: 'city-hs2',
                position: '{"x": -3, "y": 1.2, "z": -1}',
                title: 'High-Rise Construction',
                description: 'Examine structural spacing and zoning regulations for commercial high-rise developments.',
                type: 'info'
            },
            {
                id: 'city-hs3',
                position: '{"x": 0, "y": 0.1, "z": -4}',
                title: 'Green Infrastructure',
                description: 'Integration of public parks and sustainable drainage systems in dense urban environments.',
                type: 'info'
            }
        ]
    },
    {
        id: 'chess-003',
        name: 'A Beautiful Game',
        description: 'An intricate chess set model used for studying high-fidelity PBR (Physically Based Rendering) materials and precision design in mechanical and product engineering.',
        sector: 'MECHANICAL',
        equipmentType: 'Precision Design Asset',
        level: 'INTERMEDIATE',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb',
        thumbnailUrl: 'https://picsum.photos/seed/chess/600/400',
        optimized: true,
        fileSize: 18400000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-05-10',
        hotspots: [
            {
                id: 'chess-hs1',
                position: '{"x": 0, "y": 0.05, "z": 0}',
                title: 'Material Fidelity',
                description: 'Analyze the complex interaction between the marble and wood textures in different lighting conditions.',
                type: 'info'
            },
            {
                id: 'chess-hs2',
                position: '{"x": 0.2, "y": 0.1, "z": 0.2}',
                title: 'Design Symmetry',
                description: 'Examine the intricate geometry of the knight piece for CNC manufacturing precision.',
                type: 'info'
            }
        ]
    },
    {
        id: 'fanuc-001',
        name: 'FANUC R-2000iC Robot',
        description: 'Digital twin of a FANUC industrial robot with integrated PLC control logic visualization.',
        sector: 'MECHATRONICS',
        equipmentType: 'Industrial Robot',
        level: 'ADVANCED',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb',
        thumbnailUrl: 'https://picsum.photos/seed/fanuc/600/400',
        optimized: true,
        fileSize: 15400000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-03-20',
        hotspots: [
            {
                id: 'hs1',
                position: '{"x": 0, "y": 1.5, "z": 0.5}',
                title: 'End Effector',
                description: 'Universal gripping system for heavy-duty payload handling.',
                type: 'info'
            },
            {
                id: 'hs2',
                position: '{"x": -0.5, "y": 0.8, "z": 0}',
                title: 'Servo Drive Assembly',
                description: 'Check out the wiring diagram for the primary axis.',
                type: 'pdf'
            }
        ]
    },
    {
        id: 'plc-002',
        name: 'Siemens S7-1500 PLC',
        description: 'High-performance modular controller for industrial automation.',
        sector: 'ELECTRICAL',
        equipmentType: 'Programmable Logic Controller',
        level: 'BASIC',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
        thumbnailUrl: 'https://picsum.photos/seed/plc/600/400',
        optimized: true,
        fileSize: 2100000,
        uploadedBy: 'boban.blagojevic',
        createdAt: '2024-03-22',
        hotspots: []
    }
];

async function seed() {
    try {
        const connection = await pool.getConnection();

        console.log('Creating tables...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS sectors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        institution VARCHAR(255),
        bio TEXT,
        profilePicUrl VARCHAR(500),
        role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS models (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sector VARCHAR(50),
        equipmentType VARCHAR(100),
        level VARCHAR(50),
        modelUrl VARCHAR(500),
        thumbnailUrl VARCHAR(500),
        optimized BOOLEAN,
        fileSize BIGINT,
        uploadedBy VARCHAR(100),
        createdAt DATE,
        FOREIGN KEY (sector) REFERENCES sectors(id) ON DELETE SET NULL
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS hotspots (
        id VARCHAR(50) PRIMARY KEY,
        model_id VARCHAR(50),
        position JSON,
        title VARCHAR(255),
        description TEXT,
        type VARCHAR(50),
        mediaUrl VARCHAR(500),
        FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS workshops (
        id VARCHAR(50) PRIMARY KEY,
        modelId VARCHAR(50),
        createdBy VARCHAR(100),
        status ENUM('active', 'ended') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(username) ON DELETE CASCADE
      )
    `);

        console.log('Clearing existing data...');
        await connection.query('DELETE FROM workshops');
        await connection.query('DELETE FROM hotspots');
        await connection.query('DELETE FROM models');
        await connection.query('DELETE FROM users');
        await connection.query('DELETE FROM sectors');

        console.log('Inserting sectors...');
        const sectors = [
            { id: 'MECHATRONICS', name: 'Mechatronics' },
            { id: 'ELECTRICAL', name: 'Electrical Engineering' },
            { id: 'MECHANICAL', name: 'Mechanical Engineering' },
            { id: 'ICT', name: 'ICT' },
            { id: 'CONSTRUCTION', name: 'Construction' },
            { id: 'CHEMISTRY', name: 'Chemistry' }
        ];
        for (const s of sectors) {
            await connection.query('INSERT INTO sectors (id, name) VALUES (?, ?)', [s.id, s.name]);
        }

        console.log('Inserting default user...');
        await connection.query(
            'INSERT INTO users (id, username, email, password, institution, role) VALUES (?, ?, ?, ?, ?, ?)',
            ['user-001', 'boban.blagojevic', 'boban@example.com', 'admin123', 'Technical School Pirot', 'admin']
        );

        console.log('Inserting models and hotspots...');
        for (const model of INITIAL_MODELS) {
            await connection.query(
                'INSERT INTO models (id, name, description, sector, equipmentType, level, modelUrl, thumbnailUrl, optimized, fileSize, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [model.id, model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.optimized, model.fileSize, model.uploadedBy, model.createdAt]
            );

            if (model.hotspots && model.hotspots.length > 0) {
                for (const hs of model.hotspots) {
                    // Adjust position to be object if it's already object, or string if needed.
                    // In the array above, I manually stringified it for simple JSON insert, 
                    // or we can pass the object and let the driver handle it if supported, or JSON.stringify it here.
                    // The array above has strings: "position: '{\"x\":...}'". 
                    // Wait, the code above actually has them as strings now.

                    await connection.query(
                        'INSERT INTO hotspots (id, model_id, position, title, description, type, mediaUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [hs.id, model.id, hs.position, hs.title, hs.description, hs.type, hs.mediaUrl || null]
                    );
                }
            }
        }

        console.log('Database seeded successfully!');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
