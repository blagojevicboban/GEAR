
import { VETSector, EquipmentLevel, VETModel } from './types';

export const INITIAL_MODELS: VETModel[] = [
  {
    id: 'brainstem-001',
    name: 'BrainStem - Bio-Mechanical Model',
    description: 'An advanced anatomical animation model used in Mechatronics and ICT VET courses to study complex skeletal rigging, vertex skinning, and synchronized motor control simulations.',
    sector: VETSector.MECHATRONICS,
    equipmentType: 'Robotic Anatomy',
    level: EquipmentLevel.ADVANCED,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
    thumbnailUrl: 'https://picsum.photos/seed/brainstem/600/400',
    optimized: true,
    fileSize: 8400000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-07-20',
    hotspots: [
      {
        id: 'brain-hs1',
        position: { x: 0, y: 1.2, z: 0 },
        title: 'Neural Processor Hub',
        description: 'Analysis of the central control unit and sensor integration for bio-mimetic movement.',
        type: 'info',
        mediaUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200'
      },
      {
        id: 'brain-hs2',
        position: { x: 0.3, y: 0.8, z: 0.1 },
        title: 'Actuator Joint',
        description: 'Examine the multi-axis servo coordination required for fluid limb motion.',
        type: 'info'
      },
      {
        id: 'brain-hs3',
        position: { x: -0.2, y: 1.5, z: 0.2 },
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
    sector: VETSector.MECHANICAL,
    equipmentType: 'Mechanical Assembly',
    level: EquipmentLevel.INTERMEDIATE,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
    thumbnailUrl: 'https://picsum.photos/seed/toycar/600/400',
    optimized: true,
    fileSize: 5600000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-07-02',
    hotspots: [
      {
        id: 'toy-hs1',
        position: { x: 0.15, y: 0.08, z: 0.25 },
        title: 'Wheel Assembly',
        description: 'Examine the axle attachment and tire tread geometry for friction analysis.',
        type: 'video',
        mediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Example embedded video
      },
      {
        id: 'toy-hs2',
        position: { x: 0, y: 0.15, z: 0 },
        title: 'Chassis Integration',
        description: 'Assess the snap-fit connectors used to join the body shell to the base frame.',
        type: 'info'
      },
      {
        id: 'toy-hs3',
        position: { x: 0, y: 0.1, z: -0.2 },
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
    sector: VETSector.CONSTRUCTION,
    equipmentType: 'Urban Planning Model',
    level: EquipmentLevel.ADVANCED,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/VirtualCity/glTF-Binary/VirtualCity.glb',
    thumbnailUrl: 'https://picsum.photos/seed/virtualcity/600/400',
    optimized: true,
    fileSize: 12500000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-06-15',
    hotspots: [
      {
        id: 'city-hs1',
        position: { x: 2, y: 0.5, z: 2 },
        title: 'Traffic Management',
        description: 'Analyze intersection layouts and signal placement for optimized urban traffic flow.',
        type: 'info'
      },
      {
        id: 'city-hs2',
        position: { x: -3, y: 1.2, z: -1 },
        title: 'High-Rise Construction',
        description: 'Examine structural spacing and zoning regulations for commercial high-rise developments.',
        type: 'info'
      },
      {
        id: 'city-hs3',
        position: { x: 0, y: 0.1, z: -4 },
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
    sector: VETSector.MECHANICAL,
    equipmentType: 'Precision Design Asset',
    level: EquipmentLevel.INTERMEDIATE,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb',
    thumbnailUrl: 'https://picsum.photos/seed/chess/600/400',
    optimized: true,
    fileSize: 18400000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-05-10',
    hotspots: [
      {
        id: 'chess-hs1',
        position: { x: 0, y: 0.05, z: 0 },
        title: 'Material Fidelity',
        description: 'Analyze the complex interaction between the marble and wood textures in different lighting conditions.',
        type: 'info'
      },
      {
        id: 'chess-hs2',
        position: { x: 0.2, y: 0.1, z: 0.2 },
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
    sector: VETSector.MECHATRONICS,
    equipmentType: 'Industrial Robot',
    level: EquipmentLevel.ADVANCED,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb', // Placeholder for actual robot model
    thumbnailUrl: 'https://picsum.photos/seed/fanuc/600/400',
    optimized: true,
    fileSize: 15400000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-03-20',
    hotspots: [
      {
        id: 'hs1',
        position: { x: 0, y: 1.5, z: 0.5 },
        title: 'End Effector',
        description: 'Universal gripping system for heavy-duty payload handling.',
        type: 'info'
      },
      {
        id: 'hs2',
        position: { x: -0.5, y: 0.8, z: 0 },
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
    sector: VETSector.ELECTRICAL,
    equipmentType: 'Programmable Logic Controller',
    level: EquipmentLevel.BASIC,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
    thumbnailUrl: 'https://picsum.photos/seed/plc/600/400',
    optimized: true,
    fileSize: 2100000,
    uploadedBy: 'boban.blagojevic',
    createdAt: '2024-03-22',
    hotspots: []
  }
];
