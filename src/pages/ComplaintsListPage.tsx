import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, PlusCircle, X, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ComplaintCard } from '../components/ComplaintCard';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';
import { STATUS_CONFIG, ISSUE_CATEGORIES } from '../lib/constants';

export function ComplaintsListPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchComplaints();
  }, [profile]);

  async function fetchComplaints() {
    if (!profile) return;
    setLoading(true);
    let query = supabase.from('complaints').select('*');

    if (profile.role === 'citizen') {
      query = query.eq('citizen_id', profile.id);
    } else if (profile.role === 'worker') {
      query = query.eq('worker_id', profile.id);
    }
    // officers see all complaints

    const { data } = await query.order('created_at', { ascending: false });
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (priorityFilter && c.priority !== priorityFilter) return false;
      return true;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  const hasFilters = statusFilter || categoryFilter || priorityFilter;

  if (!profile) return null;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {profile.role === 'citizen' ? 'My Complaints' : profile.role === 'worker' ? 'My Tasks' : 'All Complaints'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
          </p>
        </div>
        {profile.role === 'citizen' && (
          <Button onClick={() => navigate('/complaints/new')}>
            <PlusCircle className="w-4 h-4" />
            New Complaint
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          </Button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid sm:grid-cols-3 gap-3 mt-3"
          >
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>
            {hasFilters && (
              <button
                onClick={() => { setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 col-span-full"
              >
                <X className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No complaints found"
            message={hasFilters ? "Try adjusting your filters or search." : "No complaints to display yet."}
            action={profile.role === 'citizen' ? <Button onClick={() => navigate('/complaints/new')}><PlusCircle className="w-4 h-4" />New Complaint</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c, i) => (
            <ComplaintCard key={c.id} complaint={c} index={i} showCitizen={profile.role === 'officer'} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
