
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
  model_id?: string;
  position: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
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
  optimizedUrl?: string;
  aiAnalysis?: string;
  optimizationStats?: string; // JSON string
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

export type AppView = 'home' | 'gallery' | 'lessons' | 'lesson-view' | 'lesson-edit' | 'my-lessons' | 'upload' | 'edit' | 'viewer' | 'login' | 'register' | 'profile' | 'users' | 'my-projects' | 'help' | 'teacher-dashboard' | 'academy' | 'admin-settings';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: AppView;
}

export interface LessonStep {
  id: string;
  lesson_id: string;
  step_order: number;
  title: string;
  content: string; // Markdown/HTML
  model_id?: string;
  hotspot_id?: string;
  image_url?: string;
  interaction_type?: 'read' | 'quiz' | 'find_part';
  interaction_data?: string; // JSON string
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  sector_id?: string; // Optional because sector might be deleted? 
  // actually in DB it is FK, so it exists or is null. But for UI, let's keep it string usually.
  // Wait, in `models` we used `sector: EDUSector`. Let's stick to string ID for now to be safe with DB.
  sector: string; // map to sector_id in DB, but let's call it sector in frontend to match model interface if possible? 
  // The DB has `sector_id`. The backend response should probably alias it or I just use partial mapping.
  // Let's stick to what I defined in DB: sector_id.
  author_id: string;
  created_at: string;
  steps?: LessonStep[];
  authorName?: string; // For display
  sectorName?: string; // For display
  image_url?: string;
  authorPic?: string;
}
