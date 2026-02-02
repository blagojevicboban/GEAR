/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: gear
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

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
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES
('00_addAuthorizationServer.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `academy_videos`
--

DROP TABLE IF EXISTS `academy_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `academy_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `duration` varchar(20) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academy_videos`
--

LOCK TABLES `academy_videos` WRITE;
/*!40000 ALTER TABLE `academy_videos` DISABLE KEYS */;
INSERT INTO `academy_videos` VALUES
(1,'basics','Updated Title','5:20','https://www.youtube.com/embed/dQw4w9WgXcQ','Deploying Docker containers in schools.','2026-01-29 05:20:03'),
(2,'basics','Navigating the 3D Repo','3:15','https://www.youtube.com/embed/dQw4w9WgXcQ','Finding and filtering VET models.','2026-01-29 05:20:03'),
(3,'creation','Creating Your First Lesson','8:45','https://www.youtube.com/embed/dQw4w9WgXcQ','Using the Workbook Editor.','2026-01-29 05:20:03'),
(4,'creation','Adding Interactive Hotspots','4:30','https://www.youtube.com/embed/dQw4w9WgXcQ','Attaching media to 3D parts.','2026-01-29 05:20:03'),
(5,'pedagogy','Bloom\'s Taxonomy in VR','12:00','https://www.youtube.com/embed/dQw4w9WgXcQ','Structuring learning outcomes.','2026-01-29 05:20:03'),
(6,'pedagogy','Flipped Classroom with GEAR','9:10','https://www.youtube.com/embed/dQw4w9WgXcQ','Assigning VR homework.','2026-01-29 05:20:03');
/*!40000 ALTER TABLE `academy_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accesstokens`
--

DROP TABLE IF EXISTS `accesstokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accesstokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `scopes` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accesstokens_platform_url_client_id_scopes` (`platformUrl`(50),`clientId`(50),`scopes`(50)),
  KEY `accesstokens_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accesstokens`
--

LOCK TABLES `accesstokens` WRITE;
/*!40000 ALTER TABLE `accesstokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `accesstokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_logs`
--

DROP TABLE IF EXISTS `analytics_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) DEFAULT NULL,
  `lesson_id` varchar(255) DEFAULT NULL,
  `model_id` varchar(255) DEFAULT NULL,
  `position` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`position`)),
  `target` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target`)),
  `duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_logs`
--

LOCK TABLES `analytics_logs` WRITE;
/*!40000 ALTER TABLE `analytics_logs` DISABLE KEYS */;
INSERT INTO `analytics_logs` VALUES
(1,'student1','lesson1','model-1','{\"x\":0,\"y\":0,\"z\":0}','{\"x\":0.5,\"y\":0.5,\"z\":0}',2000,'2026-01-26 00:59:16');
/*!40000 ALTER TABLE `analytics_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contexttokens`
--

DROP TABLE IF EXISTS `contexttokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contexttokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contextId` text DEFAULT NULL,
  `path` text DEFAULT NULL,
  `user` text DEFAULT NULL,
  `roles` text DEFAULT NULL,
  `targetLinkUri` text DEFAULT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`context`)),
  `resource` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`resource`)),
  `custom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom`)),
  `endpoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`endpoint`)),
  `namesRoles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`namesRoles`)),
  `lis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`lis`)),
  `launchPresentation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`launchPresentation`)),
  `messageType` text DEFAULT NULL,
  `version` text DEFAULT NULL,
  `deepLinkingSettings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`deepLinkingSettings`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contexttokens_context_id_user` (`contextId`(50),`user`(50)),
  KEY `contexttokens_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contexttokens`
--

LOCK TABLES `contexttokens` WRITE;
/*!40000 ALTER TABLE `contexttokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `contexttokens` ENABLE KEYS */;
UNLOCK TABLES;

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
('brain-hs1','brainstem-001','{\"x\": 0, \"y\": 1.2, \"z\": 0}','Neural Processor Hub','Analysis of the central control unit and sensor integration for bio-mimetic movement.','info','https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200'),
('brain-hs2','brainstem-001','{\"x\": 0.3, \"y\": 0.8, \"z\": 0.1}','Actuator Joint','Examine the multi-axis servo coordination required for fluid limb motion.','info',NULL),
('brain-hs3','brainstem-001','{\"x\": -0.2, \"y\": 1.5, \"z\": 0.2}','Rigging Constraints','Study the mesh deformation and weighting used in high-fidelity industrial simulations.','info',NULL),
('chess-hs1','chess-003','{\"x\": 0, \"y\": 0.05, \"z\": 0}','Material Fidelity','Analyze the complex interaction between the marble and wood textures in different lighting conditions.','info',NULL),
('chess-hs2','chess-003','{\"x\": 0.2, \"y\": 0.1, \"z\": 0.2}','Design Symmetry','Examine the intricate geometry of the knight piece for CNC manufacturing precision.','info',NULL),
('city-hs1','city-001','{\"x\": 2, \"y\": 0.5, \"z\": 2}','Traffic Management','Analyze intersection layouts and signal placement for optimized urban traffic flow.','info',NULL),
('city-hs2','city-001','{\"x\": -3, \"y\": 1.2, \"z\": -1}','High-Rise Construction','Examine structural spacing and zoning regulations for commercial high-rise developments.','info',NULL),
('city-hs3','city-001','{\"x\": 0, \"y\": 0.1, \"z\": -4}','Green Infrastructure','Integration of public parks and sustainable drainage systems in dense urban environments.','info',NULL),
('hs1','fanuc-001','{\"x\": 0, \"y\": 1.5, \"z\": 0.5}','End Effector','Universal gripping system for heavy-duty payload handling.','info',NULL),
('hs2','fanuc-001','{\"x\": -0.5, \"y\": 0.8, \"z\": 0}','Servo Drive Assembly','Check out the wiring diagram for the primary axis.','pdf',NULL),
('toy-hs1','toycar-001','{\"x\": 0.15, \"y\": 0.08, \"z\": 0.25}','Wheel Assembly','Examine the axle attachment and tire tread geometry for friction analysis.','video','https://www.youtube.com/embed/dQw4w9WgXcQ'),
('toy-hs2','toycar-001','{\"x\": 0, \"y\": 0.15, \"z\": 0}','Chassis Integration','Assess the snap-fit connectors used to join the body shell to the base frame.','info',NULL),
('toy-hs3','toycar-001','{\"x\": 0, \"y\": 0.1, \"z\": -0.2}','Rear Diffuser','Study aerodynamic shaping and molding constraints in high-impact plastics.','info',NULL);
/*!40000 ALTER TABLE `hotspots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `idtokens`
--

DROP TABLE IF EXISTS `idtokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `idtokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `iss` text DEFAULT NULL,
  `platformId` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `deploymentId` text DEFAULT NULL,
  `user` text DEFAULT NULL,
  `userInfo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`userInfo`)),
  `platformInfo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`platformInfo`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idtokens_iss_client_id_deployment_id_user` (`iss`(50),`clientId`(50),`deploymentId`(50),`user`(50)),
  KEY `idtokens_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `idtokens`
--

LOCK TABLES `idtokens` WRITE;
/*!40000 ALTER TABLE `idtokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `idtokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson_attempts`
--

DROP TABLE IF EXISTS `lesson_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_attempts` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `lesson_id` varchar(255) NOT NULL,
  `status` enum('started','completed') DEFAULT 'started',
  `score` int(11) DEFAULT 0,
  `last_step` int(11) DEFAULT 0,
  `started_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `lesson_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_attempts_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson_attempts`
--

LOCK TABLES `lesson_attempts` WRITE;
/*!40000 ALTER TABLE `lesson_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `lesson_attempts` ENABLE KEYS */;
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
  `interaction_type` enum('read','quiz','find_part') DEFAULT 'read',
  `interaction_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interaction_data`)),
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
('step-1769212867043-0','lesson-1769212602954',1,'Chemical Formula & Key Properties','<li style=\"font-family: &quot;Google Sans Text&quot;, sans-serif !important; line-height: 1.15 !important;\"><p data-path-to-node=\"4,0,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,0,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Title:</b> Caffeine: A Natural Stimulant</p></li><li style=\"font-family: &quot;Google Sans Text&quot;, sans-serif !important; line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,1,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,1,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Chemical Formula:</b> </p><div data-path-to-node=\"4,1,1\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><div class=\"math-block\" data-math=\"C_8H_{10}N_4O_2\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">$$C_8H_{10}N_4O_2$$</div></div></li><li style=\"font-family: &quot;Google Sans Text&quot;, sans-serif !important; line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,2,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,2,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">IUPAC Name:</b> 1,3,7-Trimethylpurine-2,6-dione</p></li><li style=\"font-family: &quot;Google Sans Text&quot;, sans-serif !important; line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,3,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,3,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Key Characteristics:</b></p><ul data-path-to-node=\"4,3,1\" style=\"padding-inline-start: 32px; line-height: 1.15 !important; margin-top: 0px !important;\"><li style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,3,1,0,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,3,1,0,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Molar Mass:</b> Approximately <span class=\"math-inline\" data-math=\"194.19 \\text{ g/mol}\" data-index-in-node=\"26\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">$194.19 \\text{ g/mol}$</span>.</p></li><li style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,3,1,1,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,3,1,1,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Class:</b> A methylxanthine alkaloid.</p></li><li style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,3,1,2,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,3,1,2,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Physical Appearance:</b> White crystalline powder with a distinctly bitter taste.</p></li><li style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><p data-path-to-node=\"4,3,1,3,0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\"><b data-path-to-node=\"4,3,1,3,0\" data-index-in-node=\"0\" style=\"line-height: 1.15 !important; margin-top: 0px !important;\">Mechanism:</b> Acts as an adenosine receptor antagonist in the brain, effectively preventing the sensation of drowsiness.</p></li></ul></li>',NULL,NULL,'/api/uploads/file-1769216208340-776181617.png','read',NULL),
('step-1769212867043-1','lesson-1769212602954',2,'3D Molecular Model','<li><p data-path-to-node=\"8,0,0\"><b data-path-to-node=\"8,0,0\" data-index-in-node=\"0\">Title:</b> The Molecular Architecture</p></li><li><p data-path-to-node=\"8,1,0\"><b data-path-to-node=\"8,1,0\" data-index-in-node=\"0\">Structural Features:</b></p><ul data-path-to-node=\"8,1,1\"><li><p data-path-to-node=\"8,1,1,0,0\"><b data-path-to-node=\"8,1,1,0,0\" data-index-in-node=\"0\">Fused Ring System:</b> Composed of a pyrimidine ring fused to an imidazole ring (forming a purine core).</p></li><li><p data-path-to-node=\"8,1,1,1,0\"><b data-path-to-node=\"8,1,1,1,0\" data-index-in-node=\"0\">Atom Legend:</b> Black spheres represent <b data-path-to-node=\"8,1,1,1,0\" data-index-in-node=\"37\">Carbon</b>, white represent <b data-path-to-node=\"8,1,1,1,0\" data-index-in-node=\"61\">Hydrogen</b>, blue represent <b data-path-to-node=\"8,1,1,1,0\" data-index-in-node=\"86\">Nitrogen</b>, and red represent <b data-path-to-node=\"8,1,1,1,0\" data-index-in-node=\"114\">Oxygen</b>.</p></li><li><p data-path-to-node=\"8,1,1,2,0\"><b data-path-to-node=\"8,1,1,2,0\" data-index-in-node=\"0\">Geometry:</b> The molecule is relatively planar (flat), which allows it to \"mimic\" other molecules and bind to specific biological receptors.</p></li></ul></li><li><p data-path-to-node=\"8,2,0\"><b data-path-to-node=\"8,2,0\" data-index-in-node=\"0\">Fact:</b> The structural stability of caffeine allows it to withstand high temperatures during the coffee roasting process.</p></li>',NULL,NULL,NULL,'read',NULL),
('step-1769212867043-2','lesson-1769212602954',3,'Natural and Commercial Sources','<li><p data-path-to-node=\"12,0,0\"><b data-path-to-node=\"12,0,0\" data-index-in-node=\"0\">Title:</b> Common Sources of Caffeine</p></li><li><p data-path-to-node=\"12,1,0\"><b data-path-to-node=\"12,1,0\" data-index-in-node=\"0\">Natural Sources:</b></p><ul data-path-to-node=\"12,1,1\"><li><p data-path-to-node=\"12,1,1,0,0\"><b data-path-to-node=\"12,1,1,0,0\" data-index-in-node=\"0\">Coffee Beans:</b> The most famous source (concentration varies by species, e.g., Arabica vs. Robusta).</p></li><li><p data-path-to-node=\"12,1,1,1,0\"><b data-path-to-node=\"12,1,1,1,0\" data-index-in-node=\"0\">Tea Leaves:</b> Contains caffeine, historically referred to as <i data-path-to-node=\"12,1,1,1,0\" data-index-in-node=\"59\">theine</i>.</p></li><li><p data-path-to-node=\"12,1,1,2,0\"><b data-path-to-node=\"12,1,1,2,0\" data-index-in-node=\"0\">Cocoa Beans:</b> Chocolate contains small but measurable amounts of caffeine.</p></li><li><p data-path-to-node=\"12,1,1,3,0\"><b data-path-to-node=\"12,1,1,3,0\" data-index-in-node=\"0\">Guarana &amp; Yerba Mate:</b> South American plants known for high stimulant concentrations.</p></li></ul></li><li><p data-path-to-node=\"12,2,0\"><b data-path-to-node=\"12,2,0\" data-index-in-node=\"0\">Commercial Products:</b></p><ul data-path-to-node=\"12,2,1\"><li><p data-path-to-node=\"12,2,1,0,0\">Energy drinks and carbonated sodas (often containing synthetic caffeine).</p></li><li><p data-path-to-node=\"12,2,1,1,0\">Pharmaceuticals (added to analgesics and cold medications to enhance efficacy).</p></li></ul></li>',NULL,NULL,'/api/uploads/file-1769216249927-488530884.png','read',NULL),
('step-1769240631556-3','lesson-1769212602954',4,'Step 4','<div>Which of the following elements is NOT present in a caffeine molecule?</div><div><br></div>',NULL,NULL,NULL,'quiz','{\"options\":[\"Nitrogen (N)\",\"Phosphorus (P)\",\"Carbon (C)\",\"Oxygen (O)\"],\"correctIndex\":1}'),
('step-1769241227416-4','lesson-1769212602954',5,'Step 5','<div>Which neurotransmitter does caffeine primarily block in the brain to prevent sleepiness?</div><div><br></div>',NULL,NULL,NULL,'quiz','{\"options\":[\"Adrenaline\",\"Dopamine\",\"Adenosine\",\"Serotonin\"],\"correctIndex\":2}'),
('step-1769241419954-5','lesson-1769212602954',6,'Step 6','Find Oxygen in the model',NULL,NULL,NULL,'find_part','{\"targetMesh\":\"\"}');
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
('lesson-1769212602954','Molecules','Caffeine molecule explanation',NULL,NULL,'2026-01-23 23:56:42','/api/uploads/file-1769213874977-232505245.png');
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
  `optimizedUrl` varchar(255) DEFAULT NULL,
  `aiAnalysis` text DEFAULT NULL,
  `optimizationStats` text DEFAULT NULL,
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
('brainstem-001','BrainStem - Bio-Mechanical Model','An advanced anatomical animation model used in Mechatronics and ICT VET courses to study complex skeletal rigging, vertex skinning, and synchronized motor control simulations.','MECHATRONICS','Robotic Anatomy','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb','https://picsum.photos/seed/brainstem/600/400',1,8400000,'boban.blagojevic','2024-07-20',0,NULL,NULL,NULL),
('chess-003','A Beautiful Game','An intricate chess set model used for studying high-fidelity PBR (Physically Based Rendering) materials and precision design in mechanical and product engineering.','MECHANICAL','Precision Design Asset','INTERMEDIATE','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb','https://picsum.photos/seed/chess/600/400',1,18400000,'boban.blagojevic','2024-05-10',0,NULL,NULL,NULL),
('city-001','Smart City Infrastructure','A comprehensive 3D visualization of urban infrastructure for studying smart city layouts, traffic management, and sustainable construction planning in VET construction sectors.','CONSTRUCTION','Urban Planning Model','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/VirtualCity/glTF-Binary/VirtualCity.glb','https://picsum.photos/seed/virtualcity/600/400',1,12500000,'boban.blagojevic','2024-06-15',0,NULL,NULL,NULL),
('fanuc-001','FANUC R-2000iC Robot','Digital twin of a FANUC industrial robot with integrated PLC control logic visualization.','MECHATRONICS','Industrial Robot','ADVANCED','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb','https://picsum.photos/seed/fanuc/600/400',1,15400000,'boban.blagojevic','2024-03-20',0,NULL,NULL,NULL),
('plc-002','Siemens S7-1500 PLC','High-performance modular controller for industrial automation.','ELECTRICAL','Programmable Logic Controller','BASIC','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb','https://picsum.photos/seed/plc/600/400',1,2100000,'boban.blagojevic','2024-03-22',0,NULL,NULL,NULL),
('toycar-001','Toy Car - Mechanical Assembly','A precision-engineered toy car model used to study injection molding parts, mechanical assembly tolerances, and material properties in automotive and product design VET courses.','MECHANICAL','Mechanical Assembly','INTERMEDIATE','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb','https://picsum.photos/seed/toycar/600/400',1,5600000,'boban.blagojevic','2024-07-02',0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nonces`
--

DROP TABLE IF EXISTS `nonces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nonces` (
  `nonce` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`nonce`),
  UNIQUE KEY `nonces_nonce` (`nonce`(50)),
  KEY `nonces_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nonces`
--

LOCK TABLES `nonces` WRITE;
/*!40000 ALTER TABLE `nonces` DISABLE KEYS */;
/*!40000 ALTER TABLE `nonces` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platformStatuses`
--

DROP TABLE IF EXISTS `platformStatuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `platformStatuses` (
  `id` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_statuses_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platformStatuses`
--

LOCK TABLES `platformStatuses` WRITE;
/*!40000 ALTER TABLE `platformStatuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `platformStatuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platforms`
--

DROP TABLE IF EXISTS `platforms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `platforms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platformName` text DEFAULT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `authEndpoint` text DEFAULT NULL,
  `accesstokenEndpoint` text DEFAULT NULL,
  `kid` text DEFAULT NULL,
  `authConfig` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`authConfig`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `authorizationServer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platforms_platform_url_client_id` (`platformUrl`(50),`clientId`(50)),
  UNIQUE KEY `platforms_kid` (`kid`(50)),
  KEY `platforms_platform_url` (`platformUrl`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platforms`
--

LOCK TABLES `platforms` WRITE;
/*!40000 ALTER TABLE `platforms` DISABLE KEYS */;
/*!40000 ALTER TABLE `platforms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `privatekeys`
--

DROP TABLE IF EXISTS `privatekeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `privatekeys` (
  `kid` varchar(255) NOT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`kid`),
  UNIQUE KEY `privatekeys_kid` (`kid`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `privatekeys`
--

LOCK TABLES `privatekeys` WRITE;
/*!40000 ALTER TABLE `privatekeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `privatekeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publickeys`
--

DROP TABLE IF EXISTS `publickeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `publickeys` (
  `kid` varchar(255) NOT NULL,
  `platformUrl` text DEFAULT NULL,
  `clientId` text DEFAULT NULL,
  `iv` text DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`kid`),
  UNIQUE KEY `publickeys_kid` (`kid`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publickeys`
--

LOCK TABLES `publickeys` WRITE;
/*!40000 ALTER TABLE `publickeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `publickeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `model_id` varchar(255) NOT NULL,
  `time_seconds` float NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
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
('MECHATRONICS','Mechatronics',NULL);
/*!40000 ALTER TABLE `sectors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `states` (
  `state` varchar(255) NOT NULL,
  `query` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`query`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`state`),
  UNIQUE KEY `states_state` (`state`(50)),
  KEY `states_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `states`
--

LOCK TABLES `states` WRITE;
/*!40000 ALTER TABLE `states` DISABLE KEYS */;
/*!40000 ALTER TABLE `states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES
('global_announcement',''),
('maintenance_mode','false');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
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
('user-001','boban.blagojevic','boban@example.com','$2b$10$EixQLwpOIdlFHxv.mSoxS.YtVBOeN2kY1J3go12Qi95/AE9Vao9c.','Technical School Pirot',NULL,NULL,'2026-02-01 19:38:36','admin');
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

-- Dump completed on 2026-02-01 20:51:02
