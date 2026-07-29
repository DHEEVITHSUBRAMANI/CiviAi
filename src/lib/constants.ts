import type { ComplaintStatus, IssueCategory, Priority, Severity } from '../types';

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Garbage',
  'Overflowing Garbage',
  'Road Damage',
  'Potholes',
  'Broken Streetlight',
  'Water Leakage',
  'Drainage Blockage',
  'Sewage Overflow',
  'Illegal Dumping',
  'Tree Fallen',
  'Traffic Signal Damage',
  'Public Property Damage',
  'Others',
];

export const CATEGORY_DEPARTMENT_MAP: Record<IssueCategory, string> = {
  Garbage: 'Sanitation',
  'Overflowing Garbage': 'Sanitation',
  'Road Damage': 'Roads & Infrastructure',
  Potholes: 'Roads & Infrastructure',
  'Broken Streetlight': 'Electricity',
  'Water Leakage': 'Water & Sewage',
  'Drainage Blockage': 'Water & Sewage',
  'Sewage Overflow': 'Water & Sewage',
  'Illegal Dumping': 'Sanitation',
  'Tree Fallen': 'Parks & Trees',
  'Traffic Signal Damage': 'Traffic & Transport',
  'Public Property Damage': 'General Administration',
  Others: 'General Administration',
};

export const STATUS_FLOW: ComplaintStatus[] = [
  'submitted',
  'ai_processing',
  'department_assigned',
  'officer_review',
  'worker_assigned',
  'accepted',
  'in_progress',
  'resolved',
  'citizen_verified',
  'closed',
];

export const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bg: string; dot: string }> = {
  submitted: { label: 'Submitted', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-500' },
  ai_processing: { label: 'AI Processing', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/40', dot: 'bg-purple-500' },
  department_assigned: { label: 'Department Assigned', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', dot: 'bg-blue-500' },
  officer_review: { label: 'Officer Review', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40', dot: 'bg-indigo-500' },
  worker_assigned: { label: 'Worker Assigned', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/40', dot: 'bg-cyan-500' },
  accepted: { label: 'Accepted', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-900/40', dot: 'bg-teal-500' },
  in_progress: { label: 'In Progress', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40', dot: 'bg-green-500' },
  citizen_verified: { label: 'Citizen Verified', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-500' },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40', dot: 'bg-red-500' },
};

export const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string }> = {
  Low: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-700' },
  Medium: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700' },
  High: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-300 dark:border-orange-700' },
  Critical: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700' },
};

export const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string }> = {
  Low: { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40' },
  Moderate: { color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
  High: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  Severe: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40' },
};

export const CATEGORY_ICONS: Record<string, string> = {
  Garbage: '🗑️',
  'Overflowing Garbage': '🗑️',
  'Road Damage': '🛣️',
  Potholes: '🕳️',
  'Broken Streetlight': '💡',
  'Water Leakage': '💧',
  'Drainage Blockage': '🚰',
  'Sewage Overflow': '🌊',
  'Illegal Dumping': '🚯',
  'Tree Fallen': '🌳',
  'Traffic Signal Damage': '🚦',
  'Public Property Damage': '🏛️',
  Others: '📋',
};

export const NOTIFICATION_TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  info: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  success: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/40' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  error: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40' },
  assignment: { color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
  status: { color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  comment: { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' },
};
