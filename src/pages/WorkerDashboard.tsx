import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, CheckCircle2, Activity, ArrowRight,
  HardHat, Calendar,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ComplaintCard } from '../components/ComplaintCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';

export function WorkerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchComplaints();
  }, [profile]);

  async function fetchComplaints() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('worker_id', profile.id)
      .order('created_at', { ascending: false });
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const assigned = complaints.filter((c) => c.status === 'worker_assigned').length;
    const accepted = complaints.filter((c) => c.status === 'accepted').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const completed = complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status)).length;
    const today = complaints.filter((c) => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { assigned, accepted, inProgress, completed, today, total: complaints.length };
  }, [complaints]);

  const pendingTasks = complaints.filter((c) => ['worker_assigned', 'accepted'].includes(c.status));
  const activeTasks = complaints.filter((c) => c.status === 'in_progress');
  const completedTasks = complaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status));

  const statCards = [
    { label: 'Assigned', value: stats.assigned, icon: ClipboardList, color: 'from-cyan-500 to-blue-600' },
    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'from-amber-500 to-orange-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-gov-500 to-emerald-600' },
    { label: "Today's Tasks", value: stats.today, icon: Calendar, color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-700 to-brand-800 p-6 sm:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardHat className="w-5 h-5 text-white" />
                <p className="text-cyan-100 text-sm">Field Worker Dashboard</p>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">{profile?.full_name}</h1>
              <p className="text-cyan-100 text-sm">
                {profile?.department && `${profile.department} • `}
                {stats.assigned + stats.accepted + stats.inProgress} active tasks
              </p>
            </div>
            <Button
              onClick={() => navigate('/complaints')}
              className="bg-white text-brand-700 hover:bg-gray-50 shadow-xl"
              size="lg"
            >
              View All Tasks
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

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
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Active Tasks</h2>
          <span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            {pendingTasks.length + activeTasks.length} pending
          </span>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        ) : pendingTasks.length + activeTasks.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="No active tasks"
              message="You have no pending or in-progress tasks. Great job!"
            />
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {[...pendingTasks, ...activeTasks].map((c, i) => (
              <ComplaintCard key={c.id} complaint={c} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Completed Tasks</h2>
          <span className="badge bg-gov-100 dark:bg-gov-900/40 text-gov-700 dark:text-gov-300">
            {completedTasks.length} done
          </span>
        </div>
        {completedTasks.length === 0 ? (
          <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No completed tasks yet.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {completedTasks.slice(0, 4).map((c, i) => (
              <ComplaintCard key={c.id} complaint={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
