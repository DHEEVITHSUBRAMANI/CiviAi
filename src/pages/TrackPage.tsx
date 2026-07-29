import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, Layers } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SimpleMap, type MapMarker } from '../components/SimpleMap';
import { EmptyState } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Complaint } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CATEGORY_ICONS } from '../lib/constants';
import { timeAgo, truncate } from '../lib/utils';

export function TrackPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchComplaints();
  }, [profile]);

  async function fetchComplaints() {
    if (!profile) return;
    let query = supabase.from('complaints').select('*');
    if (profile.role === 'citizen') {
      query = query.eq('citizen_id', profile.id);
    } else if (profile.role === 'worker') {
      query = query.eq('worker_id', profile.id);
    }
    const { data } = await query.order('created_at', { ascending: false });
    setComplaints((data as Complaint[]) ?? []);
    setLoading(false);
  }

  const markers: MapMarker[] = complaints
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      lat: c.latitude!,
      lng: c.longitude!,
      label: c.title,
      category: c.category,
      priority: c.priority,
    }));

  const filtered = complaints.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {profile?.role === 'worker' ? 'Task Map' : 'Track Complaints'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {profile?.role === 'worker' ? 'Navigate to your assigned tasks' : 'View your complaints on the map'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">Complaint Map</h3>
              <Button
                variant={showHeatmap ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Layers className="w-4 h-4" />
                {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
              </Button>
            </div>
            <SimpleMap
              height="500px"
              markers={markers}
              showHeatmap={showHeatmap}
              onMarkerClick={(id) => setSelected(id)}
            />
          </Card>
        </div>

        {/* List */}
        <div>
          <div className="mb-3">
            <Input
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Card className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-5 text-center text-sm text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={<MapPin className="w-8 h-8" />} title="No complaints" message="No complaints with location data." />
            ) : (
              filtered.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelected(c.id); navigate(`/complaints/${c.id}`); }}
                  className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left ${selected === c.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
                    {CATEGORY_ICONS[c.category] ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                    {c.address && <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{truncate(c.address, 30)}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
