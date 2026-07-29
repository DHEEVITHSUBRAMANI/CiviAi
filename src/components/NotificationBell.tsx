import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Info, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../types';
import { NOTIFICATION_TYPE_CONFIG } from '../lib/constants';
import { timeAgo } from '../lib/utils';
import { cn } from '../lib/utils';

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  assignment: Bell,
  status: CheckCircle2,
  comment: Info,
};

export function NotificationBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!profile) return;
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function fetchNotifications() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    fetchNotifications();
  }

  async function markRead(id: string, complaintId: string | null) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
    if (complaintId) {
      setOpen(false);
      navigate(`/complaints/${complaintId}`);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? Info;
                  const config = NOTIFICATION_TYPE_CONFIG[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id, n.complaint_id)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left',
                        !n.is_read && 'bg-brand-50/50 dark:bg-brand-950/20',
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
