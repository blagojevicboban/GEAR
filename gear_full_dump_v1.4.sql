/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: gear
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `hotspots`
--

DROP TABLE IF EXISTS `hotspots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotspots`
--

LOCK TABLES `hotspots` WRITE;
/*!40000 ALTER TABLE `hotspots` DISABLE KEYS */;
INSERT INTO `hotspots` VALUES
('brain-hs1','brainstem-001','{\"x\":0,\"y\":1.2,\"z\":0}','Neural Processor Hub','Analysis of the central control unit and sensor integration for bio-mimetic movement.','info','https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200'),
('brain-hs2','brainstem-001','{\"x\":0.3,\"y\":0.8,\"z\":0.1}','Actuator Joint','Examine the multi-axis servo coordination required for fluid limb motion.','info',NULL),
('brain-hs3','brainstem-001','{\"x\":-0.2,\"y\":1.5,\"z\":0.2}','Rigging Constraints','Study the mesh deformation and weighting used in high-fidelity industrial simulations.','info',NULL),
('chess-hs1','chess-003','{\"x\":0,\"y\":0.05,\"z\":0}','Material Fidelity','Analyze the complex interaction between the marble and wood textures in different lighting conditions.','info',NULL),
('chess-hs2','chess-003','{\"x\":0.2,\"y\":0.1,\"z\":0.2}','Design Symmetry','Examine the intricate geometry of the knight piece for CNC manufacturing precision.','info',NULL),
('city-hs1','city-001','{\"x\":2,\"y\":0.5,\"z\":2}','Traffic Management','Analyze intersection layouts and signal placement for optimized urban traffic flow.','info',NULL),
('city-hs2','city-001','{\"x\":-3,\"y\":1.2,\"z\":-1}','High-Rise Construction','Examine structural spacing and zoning regulations for commercial high-rise developments.','info',NULL),
('city-hs3','city-001','{\"x\":0,\"y\":0.1,\"z\":-4}','Green Infrastructure','Integration of public parks and sustainable drainage systems in dense urban environments.','info',NULL),
('hs-48ngq','6jwihtagv','{\"x\":0,\"y\":1,\"z\":0}','New Hotspot','Educational info goes here.','info',NULL),
('hs1','fanuc-001','{\"x\":0,\"y\":1.5,\"z\":0.5}','End Effector','Universal gripping system for heavy-duty payload handling.','info',NULL),
('hs2','fanuc-001','{\"x\":-0.5,\"y\":0.8,\"z\":0}','Servo Drive Assembly','Check out the wiring diagram for the primary axis.','pdf',NULL),
('toy-hs1','toycar-001','{\"x\": 0.15, \"y\": 0.08, \"z\": 0.25}','Wheel Assembly','Examine the axle attachment and tire tread geometry for friction analysis.','video','https://www.youtube.com/embed/dQw4w9WgXcQ'),
('toy-hs2','toycar-001','{\"x\": 0, \"y\": 0.15, \"z\": 0}','Chassis Integration','Assess the snap-fit connectors used to join the body shell to the base frame.','info',NULL),
('toy-hs3','toycar-001','{\"x\": 0, \"y\": 0.1, \"z\": -0.2}','Rear Diffuser','Study aerodynamic shaping and molding constraints in high-impact plastics.','info',NULL);
/*!40000 ALTER TABLE `hotspots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson_steps`
--

DROP TABLE IF EXISTS `lesson_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_steps` (
  `id` varchar(50) NOT NULL,
  `lesson_id` varchar(50) NOT NULL,
  `step_order` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `model_id` varchar(50) DEFAULT NULL,
  `hotspot_id` varchar(50) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `model_id` (`model_id`),
  KEY `hotspot_id` (`hotspot_id`),
  CONSTRAINT `lesson_steps_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_steps_ibfk_2` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lesson_steps_ibfk_3` FOREIGN KEY (`hotspot_id`) REFERENCES `hotspots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson_steps`
--

LOCK TABLES `lesson_steps` WRITE;
/*!40000 ALTER TABLE `lesson_steps` DISABLE KEYS */;
INSERT INTO `lesson_steps` VALUES
('step-1769212867043-0','lesson-1769212602954',1,'Chemical Formula & Key Properties','## Caffeine: A Natural Stimulant\n* **Chemical Formula:** $C_8H_{10}N_4O_2$\n* **IUPAC Name:** 1,3,7-Trimethylpurine-2,6-dione\n\n### Key Characteristics\n* **Molar Mass:** Approximately $194.19 \\text{ g/mol}$\n* **Class:** A methylxanthine alkaloid.\n* **Physical Appearance:** White crystalline powder with a distinctly bitter taste.\n* **Mechanism:** Acts as an **adenosine receptor antagonist** in the brain, effectively preventing the sensation of drowsiness.',NULL,NULL,'/api/uploads/file-1769216208340-776181617.png'),
('step-1769212867043-1','lesson-1769212602954',2,'3D Molecular Model','## The Molecular Architecture\n* **Fused Ring System:** Composed of a pyrimidine ring fused to an imidazole ring (forming a purine core).\n* **Atom Legend:** * ⚫ **Carbon** (Black)\n    * ⚪ **Hydrogen** (White)\n    * 🔵 **Nitrogen** (Blue)\n    * 🔴 **Oxygen** (Red)\n* **Geometry:** The molecule is relatively **planar**, allowing it to \"mimic\" other molecules and bind to specific biological receptors.\n* **Stability:** Its structure is robust enough to withstand high temperatures during coffee roasting.','6jwihtagv',NULL,NULL),
('step-1769212867043-2','lesson-1769212602954',3,'Natural and Commercial Sources','## Where is Caffeine Found?\n\n### Natural Sources\n* **Coffee Beans:** The most primary source (Arabica & Robusta).\n* **Tea Leaves:** Contains caffeine, historically referred to as *theine*.\n* **Cocoa Beans:** Found in chocolate in smaller amounts.\n* **Guarana & Yerba Mate:** High-concentration stimulants from South America.\n\n### Commercial Products\n* **Beverages:** Energy drinks and sodas (often use synthetic caffeine).\n* **Pharmaceuticals:** Added to pain relievers and cold medications to boost efficacy.',NULL,NULL,'/api/uploads/file-1769216249927-488530884.png');
/*!40000 ALTER TABLE `lesson_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sector_id` varchar(50) DEFAULT NULL,
  `author_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sector_id` (`sector_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lessons_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` VALUES
('lesson-1769212602954','Molecules','Caffeine molecule explanation','Chemistry','user-001','2026-01-23 23:56:42','/api/uploads/file-1769213874977-232505245.png');
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `models`
--

DROP TABLE IF EXISTS `models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  `isFeatured` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `sector` (`sector`),
  CONSTRAINT `models_ibfk_1` FOREIGN KEY (`sector`) REFERENCES `sectors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `models`
--

LOCK TABLES `models` WRITE;
/*!40000 ALTER TABLE `models` DISABLE KEYS */;
INSERT INTO `models` VALUES
('6jwihtagv','Caffeine','The caffeine molecule (C8H10N4O2) is a bitter, white powder and a natural stimulant, chemically known as 1,3,7-trimethylxanthine, structurally similar to adenosine, which allows it to block adenosine receptors in the brain, promoting wakefulness and alertness. Its formula shows it contains 8 carbon, 10 hydrogen, 4 nitrogen, and 2 oxygen atoms, forming a structure with two fused rings and three methyl groups that influence its polarity and solubility. ','Chemistry','Molecule','Basic','/uploads/file-1768509131788-633845595.pdb#pdb','/uploads/file-1768509553608-739122869.png',1,253379,'boban.blagojevic','2026-01-15',1),
('9u8hendys','elbow-engine','elbow-engine','Mechanical Engineering','elbow-engine','Intermediate','/api/uploads/file-1769114797327-480818536_extracted/Elbow Engine Assembly Step.STEP','https://picsum.photos/seed/elbow-engine/600/400',1,2799876,'boban.blagojevic','2026-01-22',0),
('brainstem-001','BrainStem - Bio-Mechanical Model','An advanced anatomical animation model used in Mechatronics and ICT VET courses to study complex skeletal rigging, vertex skinning, and synchronized motor control simulations.','MECHATRONICS','Robotic Anatomy','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb','/uploads/file-1768509584218-624459446.png',1,8400000,'teacher1','2024-07-20',1),
('chess-003','A Beautiful Game','An intricate chess set model used for studying high-fidelity PBR (Physically Based Rendering) materials and precision design in mechanical and product engineering.','MECHANICAL','Precision Design Asset','INTERMEDIATE','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb','/uploads/file-1768509652170-878667922.png',1,18400000,'student1','2024-05-10',0),
('city-001','Smart City Infrastructure','A comprehensive 3D visualization of urban infrastructure for studying smart city layouts, traffic management, and sustainable construction planning in VET construction sectors.','Construction','Urban Planning Model','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/VirtualCity/glTF-Binary/VirtualCity.glb','/uploads/file-1768509680448-61351829.png',1,12500000,'boban.blagojevic','2024-06-15',1),
('fanuc-001','FANUC R-2000iC Robot','Digital twin of a FANUC industrial robot with integrated PLC control logic visualization.','MECHATRONICS','Industrial Robot','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb','/uploads/file-1768568955909-422566147.png',1,15400000,'boban.blagojevic','2024-03-20',0),
('nah2kilp9','STEP','STEP','Mechatronics','STEP','Basic','/api/uploads/file-1769103574047-95544643.STL#stl','https://picsum.photos/seed/STEP/600/400',1,5414584,'boban.blagojevic','2026-01-22',0),
('plc-002','Siemens S7-1500 PLC','High-performance modular controller for industrial automation.','ELECTRICAL','Programmable Logic Controller','BASIC','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb','/uploads/file-1768568999804-228896050.png',1,2100000,'boban.blagojevic','2024-03-22',0),
('toycar-001','Toy Car - Mechanical Assembly','A precision-engineered toy car model used to study injection molding parts, mechanical assembly tolerances, and material properties in automotive and product design VET courses.','MECHANICAL','Mechanical Assembly','INTERMEDIATE','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb','https://picsum.photos/seed/toycar/600/400',1,5600000,'boban.blagojevic','2024-07-02',0);
/*!40000 ALTER TABLE `models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sectors`
--

DROP TABLE IF EXISTS `sectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sectors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sectors`
--

LOCK TABLES `sectors` WRITE;
/*!40000 ALTER TABLE `sectors` DISABLE KEYS */;
INSERT INTO `sectors` VALUES
('CHEMISTRY','Chemistry',NULL),
('CONSTRUCTION','Construction',NULL),
('ELECTRICAL','Electrical Engineering',NULL),
('ICT','ICT',NULL),
('MECHANICAL','Mechanical Engineering',NULL),
('Mechanical Engineering','Mechanical Engineering','Custom User Sector'),
('MECHATRONICS','Mechatronics',NULL);
/*!40000 ALTER TABLE `sectors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profilePicUrl` varchar(500) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `role` enum('admin','teacher','student') DEFAULT 'student',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('user-001','boban.blagojevic','boban.blagojevic@tsp.edu.rs','Tsp-2024','Technical School Pirot','','/uploads/file-1769087737984-288218298.jpg','2026-01-21 04:12:32','admin'),
('user-1768969039464','student1','student1@gear.com','Tsp-2024','TSP',NULL,NULL,'2026-01-21 04:17:19','student'),
('user-1768971278021','teacher1','teacher1@tsp.edu.rs','Tsp-2024','TSP',NULL,NULL,'2026-01-21 04:54:38','teacher');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshops`
--

DROP TABLE IF EXISTS `workshops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshops` (
  `id` varchar(50) NOT NULL,
  `modelId` varchar(50) DEFAULT NULL,
  `createdBy` varchar(100) DEFAULT NULL,
  `status` enum('active','ended') DEFAULT 'active',
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `modelId` (`modelId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `workshops_ibfk_1` FOREIGN KEY (`modelId`) REFERENCES `models` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workshops_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshops`
--

LOCK TABLES `workshops` WRITE;
/*!40000 ALTER TABLE `workshops` DISABLE KEYS */;
INSERT INTO `workshops` VALUES
('ws-1769110562673','nah2kilp9','boban.blagojevic','active','2026-01-22 19:36:02'),
('ws-1769124257017','6jwihtagv','boban.blagojevic','active','2026-01-22 23:24:17'),
('ws-1769124295617','nah2kilp9','boban.blagojevic','active','2026-01-22 23:24:55');
/*!40000 ALTER TABLE `workshops` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-24  2:01:15
