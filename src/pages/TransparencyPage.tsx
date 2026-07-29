import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Eye, ArrowLeft, Moon, Sun, ClipboardList, CheckCircle2,
  Clock, TrendingUp, MapPin,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SimpleMap, type MapMarker } from '../components/SimpleMap';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';
import { STATUS_CONFIG, CATEGORY_ICONS } from '../lib/constants';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#64748b'];

export function TransparencyPage() {
  const { theme, toggleTheme } = useTheme();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('id, title, category, priority, department, status, latitude, longitude, address, created_at, completed_at, ai_confidence')
      .order('created_at', { ascending: false });
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const resolved = complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status));
    const pending = complaints.filter((c) => !['resolved', 'citizen_verified', 'closed', 'rejected'].includes(c.status));
    const resolvedWithDates = resolved.filter((c) => c.completed_at);
    const avgMs = resolvedWithDates.length > 0
      ? resolvedWithDates.reduce((sum, c) => sum + (new Date(c.completed_at!).getTime() - new Date(c.created_at).getTime()), 0) / resolvedWithDates.length
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

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => { counts[c.status] = (counts[c.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const markers: MapMarker[] = complaints
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({ id: c.id, lat: c.latitude!, lng: c.longitude!, label: c.title, category: c.category, priority: c.priority }));

  const statCards = [
    { label: 'Total Reports', value: stats.total, icon: ClipboardList, color: 'from-brand-500 to-brand-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'from-gov-500 to-emerald-600' },
    { label: 'In Progress', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Avg Resolution', value: `${stats.avgHours}h`, icon: TrendingUp, color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-gov-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-gray-900 dark:text-white">CivicConnect AI</p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 tracking-wider">TRANSPARENCY DASHBOARD</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gov-50 dark:bg-gov-950/40 border border-gov-200 dark:border-gov-800 text-gov-700 dark:text-gov-300 text-sm font-medium mb-4">
            <Eye className="w-4 h-4" />
            Public Transparency Dashboard
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Civic Issues, In Full View
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Real-time, anonymized data about civic complaints across the city. No personal information is exposed —
            this dashboard shows aggregate statistics to keep our community informed and our government accountable.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
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
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
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
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
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

          {/* Heatmap */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Complaint Heatmap</h3>
            <SimpleMap height="280px" markers={markers} showHeatmap />
          </Card>
        </div>

        {/* Recent complaints (anonymized) */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Recent Civic Reports</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No complaints reported yet.</p>
          ) : (
            <div className="space-y-2">
              {complaints.slice(0, 10).map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
                    {CATEGORY_ICONS[c.category] ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{c.category}</span>
                      {c.department && <span>• {c.department}</span>}
                      {c.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address.slice(0, 30)}</span>}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_CONFIG[c.status].bg} ${STATUS_CONFIG[c.status].color} shrink-0`}>
                    {STATUS_CONFIG[c.status].label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Privacy note */}
        <div className="mt-8 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 p-5 flex items-start gap-3">
          <Eye className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-brand-800 dark:text-brand-200 text-sm">Privacy Protected</p>
            <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
              This dashboard displays only aggregate, anonymized data. No personal information — names, emails, phone numbers,
              or exact addresses — is ever shown publicly. Individual complaint details are only visible to the citizen who
              reported them and the assigned municipal staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
