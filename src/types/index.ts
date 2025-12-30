export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ClassFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  materialsCount: number;
  lastStudied?: Date;
  createdAt: Date;
}

export interface Material {
  id: string;
  classId: string;
  name: string;
  type: 'slides' | 'notes' | 'readings' | 'videos' | 'other';
  fileUrl?: string;
  uploadedAt: Date;
  size?: number;
}

export interface ChatMessage {
  id: string;
  classId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StudySession {
  id: string;
  classId: string;
  startedAt: Date;
  endedAt?: Date;
  topicsCovered: string[];
}
