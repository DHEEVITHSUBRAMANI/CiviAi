import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, HardHat, Mail, Phone, Building2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Avatar } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/Loading';
import { supabase } from '../lib/supabase';
import type { Profile, Complaint } from '../types';

export function WorkersPage() {
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [workersRes, complaintsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'worker'),
      supabase.from('complaints').select('*'),
    ]);
    setWorkers((workersRes.data as Profile[]) ?? []);
    setComplaints((complaintsRes.data as Complaint[]) ?? []);
    setLoading(false);
  }

  const departments = Array.from(new Set(workers.map((w) => w.department).filter(Boolean)));

  const filtered = workers.filter((w) => {
    if (search && !w.full_name.toLowerCase().includes(search.toLowerCase()) && !w.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && w.department !== deptFilter) return false;
    return true;
  });

  const getWorkerStats = (workerId: string) => {
    const workerComplaints = complaints.filter((c) => c.worker_id === workerId);
    return {
      total: workerComplaints.length,
      completed: workerComplaints.filter((c) => ['resolved', 'citizen_verified', 'closed'].includes(c.status)).length,
      active: workerComplaints.filter((c) => ['worker_assigned', 'accepted', 'in_progress'].includes(c.status)).length,
    };
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">Field Workers</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and view field worker assignments</p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search workers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="sm:w-48">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<HardHat className="w-8 h-8" />} title="No workers found" message="No field workers match your search." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w, i) => {
            const stats = getWorkerStats(w.id);
            return (
              <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={w.full_name} src={w.avatar_url || undefined} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{w.full_name}</p>
                      {w.department && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {w.department}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{w.email}</span>
                    </p>
                    {w.phone && (
                      <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5" />
                        {w.phone}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{stats.active}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gov-600">{stats.completed}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
