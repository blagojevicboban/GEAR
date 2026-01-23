
export enum EDUSector {
  MECHATRONICS = 'Mechatronics',
  ELECTRICAL = 'Electrical Engineering',
  MECHANICAL = 'Mechanical Engineering',
  ICT = 'ICT',
  CONSTRUCTION = 'Construction',
  CHEMISTRY = 'Chemistry'
}

export enum EquipmentLevel {
  BASIC = 'Basic',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface Hotspot {
  id: string;
  position: { x: number; y: number; z: number };
  title: string;
  description: string;
  mediaUrl?: string;
  type: 'info' | 'video' | 'pdf';
}

export interface VETModel {
  id: string;
  name: string;
  description: string;
  sector: EDUSector;
  equipmentType: string;
  level: EquipmentLevel;
  modelUrl: string;
  thumbnailUrl: string;
  optimized: boolean;
  fileSize: number; // in bytes
  uploadedBy: string;
  createdAt: string;
  hotspots: Hotspot[];
  isFeatured?: boolean;
  uploaderProfilePic?: string; // from join
}

export interface User {
  id: string;
  username: string;
  email: string;
  institution?: string;
  bio?: string;
  profilePicUrl?: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt?: string; // Added to match DB
}

export type AppView = 'home' | 'gallery' | 'upload' | 'edit' | 'viewer' | 'login' | 'register' | 'profile' | 'users' | 'my-projects' | 'help';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: AppView;
}
