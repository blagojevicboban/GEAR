/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: gear
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;

--
-- Table structure for table `hotspots`
--

DROP TABLE IF EXISTS `hotspots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `hotspots` (
    `id` varchar(50) NOT NULL,
    `model_id` varchar(50) DEFAULT NULL,
    `position` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`position`)),
    `title` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `type` varchar(50) DEFAULT NULL,
    `mediaUrl` varchar(500) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `model_id` (`model_id`),
    CONSTRAINT `hotspots_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `hotspots`
--

LOCK TABLES `hotspots` WRITE;
/*!40000 ALTER TABLE `hotspots` DISABLE KEYS */
;
INSERT INTO
    `hotspots`
VALUES (
        'brain-hs1',
        'brainstem-001',
        '{\"x\":0,\"y\":1.2,\"z\":0}',
        'Neural Processor Hub',
        'Analysis of the central control unit and sensor integration for bio-mimetic movement.',
        'info',
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200'
    ),
    (
        'brain-hs2',
        'brainstem-001',
        '{\"x\":0.3,\"y\":0.8,\"z\":0.1}',
        'Actuator Joint',
        'Examine the multi-axis servo coordination required for fluid limb motion.',
        'info',
        NULL
    ),
    (
        'brain-hs3',
        'brainstem-001',
        '{\"x\":-0.2,\"y\":1.5,\"z\":0.2}',
        'Rigging Constraints',
        'Study the mesh deformation and weighting used in high-fidelity industrial simulations.',
        'info',
        NULL
    ),
    (
        'chess-hs1',
        'chess-003',
        '{\"x\":0,\"y\":0.05,\"z\":0}',
        'Material Fidelity',
        'Analyze the complex interaction between the marble and wood textures in different lighting conditions.',
        'info',
        NULL
    ),
    (
        'chess-hs2',
        'chess-003',
        '{\"x\":0.2,\"y\":0.1,\"z\":0.2}',
        'Design Symmetry',
        'Examine the intricate geometry of the knight piece for CNC manufacturing precision.',
        'info',
        NULL
    ),
    (
        'city-hs1',
        'city-001',
        '{\"x\":2,\"y\":0.5,\"z\":2}',
        'Traffic Management',
        'Analyze intersection layouts and signal placement for optimized urban traffic flow.',
        'info',
        NULL
    ),
    (
        'city-hs2',
        'city-001',
        '{\"x\":-3,\"y\":1.2,\"z\":-1}',
        'High-Rise Construction',
        'Examine structural spacing and zoning regulations for commercial high-rise developments.',
        'info',
        NULL
    ),
    (
        'city-hs3',
        'city-001',
        '{\"x\":0,\"y\":0.1,\"z\":-4}',
        'Green Infrastructure',
        'Integration of public parks and sustainable drainage systems in dense urban environments.',
        'info',
        NULL
    ),
    (
        'hs1',
        'fanuc-001',
        '{\"x\": 0, \"y\": 1.5, \"z\": 0.5}',
        'End Effector',
        'Universal gripping system for heavy-duty payload handling.',
        'info',
        NULL
    ),
    (
        'hs2',
        'fanuc-001',
        '{\"x\": -0.5, \"y\": 0.8, \"z\": 0}',
        'Servo Drive Assembly',
        'Check out the wiring diagram for the primary axis.',
        'pdf',
        NULL
    ),
    (
        'toy-hs1',
        'toycar-001',
        '{\"x\": 0.15, \"y\": 0.08, \"z\": 0.25}',
        'Wheel Assembly',
        'Examine the axle attachment and tire tread geometry for friction analysis.',
        'video',
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ),
    (
        'toy-hs2',
        'toycar-001',
        '{\"x\": 0, \"y\": 0.15, \"z\": 0}',
        'Chassis Integration',
        'Assess the snap-fit connectors used to join the body shell to the base frame.',
        'info',
        NULL
    ),
    (
        'toy-hs3',
        'toycar-001',
        '{\"x\": 0, \"y\": 0.1, \"z\": -0.2}',
        'Rear Diffuser',
        'Study aerodynamic shaping and molding constraints in high-impact plastics.',
        'info',
        NULL
    );
/*!40000 ALTER TABLE `hotspots` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `models`
--

DROP TABLE IF EXISTS `models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `models` (
    `id` varchar(50) NOT NULL,
    `name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `sector` varchar(50) DEFAULT NULL,
    `equipmentType` varchar(100) DEFAULT NULL,
    `level` varchar(50) DEFAULT NULL,
    `modelUrl` varchar(500) DEFAULT NULL,
    `thumbnailUrl` varchar(500) DEFAULT NULL,
    `optimized` tinyint(1) DEFAULT NULL,
    `fileSize` bigint(20) DEFAULT NULL,
    `uploadedBy` varchar(100) DEFAULT NULL,
    `createdAt` date DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `sector` (`sector`),
    CONSTRAINT `models_ibfk_1` FOREIGN KEY (`sector`) REFERENCES `sectors` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `models`
--

LOCK TABLES `models` WRITE;
/*!40000 ALTER TABLE `models` DISABLE KEYS */
;
INSERT INTO
    `models`
VALUES (
        '6jwihtagv',
        'Caffein',
        'Caffein',
        'Chemistry',
        'Molecule',
        'Basic',
        '/uploads/file-1768509131788-633845595.pdb#pdb',
        '/uploads/file-1768509553608-739122869.png',
        1,
        253379,
        'blagojevic.boban',
        '2026-01-15'
    ),
    (
        'brainstem-001',
        'BrainStem - Bio-Mechanical Model',
        'An advanced anatomical animation model used in Mechatronics and ICT VET courses to study complex skeletal rigging, vertex skinning, and synchronized motor control simulations.',
        'MECHATRONICS',
        'Robotic Anatomy',
        'ADVANCED',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
        '/uploads/file-1768509584218-624459446.png',
        1,
        8400000,
        'boban.blagojevic',
        '2024-07-20'
    ),
    (
        'chess-003',
        'A Beautiful Game',
        'An intricate chess set model used for studying high-fidelity PBR (Physically Based Rendering) materials and precision design in mechanical and product engineering.',
        'MECHANICAL',
        'Precision Design Asset',
        'INTERMEDIATE',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb',
        '/uploads/file-1768509652170-878667922.png',
        1,
        18400000,
        'boban.blagojevic',
        '2024-05-10'
    ),
    (
        'city-001',
        'Smart City Infrastructure',
        'A comprehensive 3D visualization of urban infrastructure for studying smart city layouts, traffic management, and sustainable construction planning in VET construction sectors.',
        'CONSTRUCTION',
        'Urban Planning Model',
        'ADVANCED',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/VirtualCity/glTF-Binary/VirtualCity.glb',
        '/uploads/file-1768509680448-61351829.png',
        1,
        12500000,
        'boban.blagojevic',
        '2024-06-15'
    ),
    (
        'fanuc-001',
        'FANUC R-2000iC Robot',
        'Digital twin of a FANUC industrial robot with integrated PLC control logic visualization.',
        'MECHATRONICS',
        'Industrial Robot',
        'ADVANCED',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb',
        'https://picsum.photos/seed/fanuc/600/400',
        1,
        15400000,
        'boban.blagojevic',
        '2024-03-20'
    ),
    (
        'plc-002',
        'Siemens S7-1500 PLC',
        'High-performance modular controller for industrial automation.',
        'ELECTRICAL',
        'Programmable Logic Controller',
        'BASIC',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
        'https://picsum.photos/seed/plc/600/400',
        1,
        2100000,
        'boban.blagojevic',
        '2024-03-22'
    ),
    (
        'toycar-001',
        'Toy Car - Mechanical Assembly',
        'A precision-engineered toy car model used to study injection molding parts, mechanical assembly tolerances, and material properties in automotive and product design VET courses.',
        'MECHANICAL',
        'Mechanical Assembly',
        'INTERMEDIATE',
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
        'https://picsum.photos/seed/toycar/600/400',
        1,
        5600000,
        'boban.blagojevic',
        '2024-07-02'
    );
/*!40000 ALTER TABLE `models` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `sectors`
--

DROP TABLE IF EXISTS `sectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `sectors` (
    `id` varchar(50) NOT NULL,
    `name` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `sectors`
--

LOCK TABLES `sectors` WRITE;
/*!40000 ALTER TABLE `sectors` DISABLE KEYS */
;
INSERT INTO
    `sectors`
VALUES (
        'CHEMISTRY',
        'Chemistry',
        NULL
    ),
    (
        'CONSTRUCTION',
        'Construction',
        NULL
    ),
    (
        'ELECTRICAL',
        'Electrical Engineering',
        NULL
    ),
    ('ICT', 'ICT', NULL),
    (
        'MECHANICAL',
        'Mechanical Engineering',
        NULL
    ),
    (
        'MECHATRONICS',
        'Mechatronics',
        NULL
    );
/*!40000 ALTER TABLE `sectors` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `users` (
    `id` varchar(50) NOT NULL,
    `username` varchar(100) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) DEFAULT NULL,
    `institution` varchar(255) DEFAULT NULL,
    `bio` text DEFAULT NULL,
    `profilePicUrl` varchar(500) DEFAULT NULL,
    `role` enum('admin', 'teacher', 'student') DEFAULT 'student',
    `createdAt` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */
;
INSERT INTO
    `users`
VALUES (
        'user-001',
        'boban.blagojevic',
        'boban@example.com',
        NULL,
        'Technical School Pirot',
        NULL,
        NULL,
        '2026-01-13 18:18:22'
    ),
    (
        'user-1768507313255',
        'blagojevic.boban',
        'boban.blagojevic@tsp.edu.rs',
        'Tsp-2024',
        'Technical school Pirot',
        NULL,
        NULL,
        '2026-01-15 20:01:53'
    );
/*!40000 ALTER TABLE `users` ENABLE KEYS */
;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;

-- Dump completed on 2026-01-16  6:21:30