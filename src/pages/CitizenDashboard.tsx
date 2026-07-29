import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, ClipboardList, CheckCircle2, Clock,
  Bell, MapPin, ArrowRight, Activity,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ComplaintCard } from '../components/ComplaintCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Complaint, Notification } from '../types';
import { timeAgo } from '../lib/utils';
import { NOTIFICATION_TYPE_CONFIG } from '../lib/constants';

export function CitizenDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    if (!profile) return;
    setLoading(true);
    const [complaintsRes, notifRes] = await Promise.all([
      supabase
        .from('complaints')
        .select('*')
        .eq('citizen_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    setComplaints((complaintsRes.data as Complaint[]) ?? []);
    setNotifications((notifRes.data as Notification[]) ?? []);
    setLoading(false);
  }

  if (!profile) return null;

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => ['submitted', 'ai_processing', 'department_assigned', 'officer_review', 'worker_assigned'].includes(c.status)).length,
    inProgress: complaints.filter((c) => ['accepted', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status)).length,
  };

  const statCards = [
    { label: 'Total Complaints', value: stats.total, icon: ClipboardList, color: 'from-brand-500 to-brand-700', bg: 'bg-brand-50 dark:bg-brand-950/40' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'from-gov-500 to-emerald-600', bg: 'bg-gov-50 dark:bg-gov-950/40' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-gov-700 p-6 sm:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-brand-100 text-sm mb-1">Welcome back,</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">{profile.full_name}</h1>
              <p className="text-brand-100 text-sm">
                You have {stats.pending} pending and {stats.inProgress} in-progress complaints.
              </p>
            </div>
            <Button
              onClick={() => navigate('/complaints/new')}
              className="bg-white text-brand-700 hover:bg-gray-50 shadow-xl"
              size="lg"
            >
              <PlusCircle className="w-5 h-5" />
              New Complaint
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent complaints */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Recent Complaints</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/complaints')}>
              View all <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ClipboardList className="w-8 h-8" />}
                title="No complaints yet"
                message="Report your first civic issue and let AI help categorize and route it."
                action={<Button onClick={() => navigate('/complaints/new')}><PlusCircle className="w-4 h-4" />New Complaint</Button>}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((c, i) => (
                <ComplaintCard key={c.id} complaint={c} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Notifications</h2>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <div className="p-5 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = NOTIFICATION_TYPE_CONFIG[n.type];
                return (
                  <div key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Bell className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/complaints')}>
              <ClipboardList className="w-4 h-4" />
              Complaint History
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/track')}>
              <MapPin className="w-4 h-4" />
              Track Complaint
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
