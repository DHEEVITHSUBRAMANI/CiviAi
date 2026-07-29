import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, CheckCircle2, AlertCircle, TrendingUp, Users,
  Building2, ArrowRight, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import { ComplaintCard } from '../components/ComplaintCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#64748b'];

export function OfficerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    setLoading(true);
    const [complaintsRes, workersRes] = await Promise.all([
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id').eq('role', 'worker'),
    ]);
    setComplaints((complaintsRes.data as Complaint[]) ?? []);
    setWorkerCount((workersRes.data?.length ?? 0));
    setLoading(false);
  }

  const stats = useMemo(() => {
    const pending = complaints.filter((c) => ['submitted', 'ai_processing', 'department_assigned', 'officer_review'].includes(c.status)).length;
    const inProgress = complaints.filter((c) => ['worker_assigned', 'accepted', 'in_progress'].includes(c.status)).length;
    const resolved = complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status)).length;
    const emergency = complaints.filter((c) => c.priority === 'Critical').length;

    // Avg resolution time
    const resolvedComplaints = complaints.filter((c) => c.completed_at);
    const avgResolutionMs = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, c) => sum + (new Date(c.completed_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolvedComplaints.length
      : 0;
    const avgResolutionHours = avgResolutionMs > 0 ? (avgResolutionMs / (1000 * 60 * 60)).toFixed(1) : '0';

    return { total: complaints.length, pending, inProgress, resolved, emergency, avgResolutionHours };
  }, [complaints]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => { counts[c.category] = (counts[c.category] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [complaints]);

  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => { if (c.department) counts[c.department] = (counts[c.department] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [complaints]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; complaints: number; resolved: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = { month: key, complaints: 0, resolved: 0 };
    }
    complaints.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (months[key]) months[key].complaints++;
      if (['resolved', 'citizen_verified', 'closed'].includes(c.status) && c.completed_at) {
        const rd = new Date(c.completed_at);
        const rkey = rd.toLocaleDateString('en-US', { month: 'short' });
        if (months[rkey]) months[rkey].resolved++;
      }
    });
    return Object.values(months);
  }, [complaints]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => { counts[c.status] = (counts[c.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: ClipboardList, color: 'from-brand-500 to-brand-700' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'from-cyan-500 to-blue-600' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'from-gov-500 to-emerald-600' },
    { label: 'Emergency', value: stats.emergency, icon: AlertCircle, color: 'from-red-500 to-rose-600' },
    { label: 'Avg Resolution', value: `${stats.avgResolutionHours}h`, icon: TrendingUp, color: 'from-purple-500 to-indigo-600' },
    { label: 'Field Workers', value: workerCount, icon: Users, color: 'from-teal-500 to-cyan-600' },
    { label: 'Departments', value: 7, icon: Building2, color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">Officer Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor and manage all civic complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly trend */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2} name="Complaints" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status distribution */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Category chart */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Department chart */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent complaints */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Recent Complaints</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/complaints')}>
          View all <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : complaints.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">No complaints to display.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {complaints.slice(0, 6).map((c, i) => (
            <ComplaintCard key={c.id} complaint={c} index={i} showCitizen />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
