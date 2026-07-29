import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, CheckCircle2, Download,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';
import { useToast } from '../context/ToastContext';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#64748b'];

export function AnalyticsPage() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    setLoading(true);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const resolved = complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status));
    const pending = complaints.filter((c) => !['resolved', 'citizen_verified', 'closed', 'rejected'].includes(c.status));
    const resolvedComplaints = complaints.filter((c) => c.completed_at);
    const avgMs = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, c) => sum + (new Date(c.completed_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolvedComplaints.length
      : 0;
    return {
      total: complaints.length,
      resolved: resolved.length,
      pending: pending.length,
      avgHours: avgMs > 0 ? (avgMs / (1000 * 60 * 60)).toFixed(1) : '0',
    };
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

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    complaints.forEach((c) => { counts[c.priority] = (counts[c.priority] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; complaints: number; resolved: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = { month: key, complaints: 0, resolved: 0 };
    }
    complaints.forEach((c) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].complaints++;
      if (['resolved', 'citizen_verified', 'closed'].includes(c.status) && c.completed_at) {
        const rd = new Date(c.completed_at);
        const rkey = rd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (months[rkey]) months[rkey].resolved++;
      }
    });
    return Object.values(months);
  }, [complaints]);

  const handleExport = () => {
    const csv = ['ID,Title,Category,Priority,Department,Status,Created,Completed'];
    complaints.forEach((c) => {
      csv.push([c.id, c.title, c.category, c.priority, c.department, c.status, c.created_at, c.completed_at ?? ''].join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civicconnect-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('success', 'Report exported', 'CSV file has been downloaded.');
  };

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: BarChart3, color: 'from-brand-500 to-brand-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'from-gov-500 to-emerald-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Avg Resolution', value: `${stats.avgHours}h`, icon: TrendingUp, color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive complaint analytics and insights</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">12-Month Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="complaints" stroke="#3b82f6" fill="url(#cGrad)" name="Complaints" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#rGrad)" name="Resolved" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {priorityData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={110} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Department Workload</h3>
          <ResponsiveContainer width="100%" height={280}>
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
    </DashboardLayout>
  );
}
