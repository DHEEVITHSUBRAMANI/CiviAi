export type UserRole = 'citizen' | 'officer' | 'worker';

export type ComplaintStatus =
  | 'submitted'
  | 'ai_processing'
  | 'department_assigned'
  | 'officer_review'
  | 'worker_assigned'
  | 'accepted'
  | 'in_progress'
  | 'resolved'
  | 'citizen_verified'
  | 'closed'
  | 'rejected';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Severity = 'Low' | 'Moderate' | 'High' | 'Severe';

export type IssueCategory =
  | 'Garbage'
  | 'Overflowing Garbage'
  | 'Road Damage'
  | 'Potholes'
  | 'Broken Streetlight'
  | 'Water Leakage'
  | 'Drainage Blockage'
  | 'Sewage Overflow'
  | 'Illegal Dumping'
  | 'Tree Fallen'
  | 'Traffic Signal Damage'
  | 'Public Property Damage'
  | 'Others';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  address: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head_officer_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  citizen_id: string;
  officer_id: string | null;
  worker_id: string | null;
  title: string;
  description: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  category: string;
  priority: Priority;
  department: string;
  severity: Severity;
  ai_confidence: number;
  ai_summary: string;
  status: ComplaintStatus;
  resolution_images: string[];
  remarks: string;
  officer_comment: string;
  is_duplicate: boolean;
  duplicate_of: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  citizen?: Profile;
  officer?: Profile;
  worker?: Profile;
}

export interface Assignment {
  id: string;
  complaint_id: string;
  officer_id: string | null;
  worker_id: string | null;
  assigned_by: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  worker?: Profile;
  complaint?: Complaint;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'status' | 'comment';
  is_read: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  complaint_id: string;
  citizen_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  complaint_id: string;
  user_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  notes: string;
  created_at: string;
  user?: Profile;
}

export interface AIAnalysisResult {
  category: IssueCategory;
  severity: Severity;
  priority: Priority;
  department: string;
  confidence: number;
  summary: string;
}
