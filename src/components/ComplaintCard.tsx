import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Brain } from 'lucide-react';
import type { Complaint } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { CATEGORY_ICONS } from '../lib/constants';
import { timeAgo, truncate } from '../lib/utils';
import { Avatar } from './ui/Badge';

interface ComplaintCardProps {
  complaint: Complaint;
  showCitizen?: boolean;
  index?: number;
}

export function ComplaintCard({ complaint, showCitizen, index = 0 }: ComplaintCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/complaints/${complaint.id}`}>
        <div className="card p-4 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all group cursor-pointer h-full">
          <div className="flex gap-4">
            {complaint.image_url ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                <img src={complaint.image_url} alt={complaint.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-3xl shrink-0">
                {CATEGORY_ICONS[complaint.category] ?? '📋'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                  {complaint.title}
                </h3>
                <StatusBadge status={complaint.status} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                {truncate(complaint.description || complaint.ai_summary, 100)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {CATEGORY_ICONS[complaint.category]} {complaint.category}
                </span>
                <PriorityBadge priority={complaint.priority} />
                {complaint.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300">
                    {complaint.department}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(complaint.created_at)}
                </span>
                {complaint.ai_confidence > 0 && (
                  <span className="flex items-center gap-1 text-brand-500">
                    <Brain className="w-3 h-3" />
                    {Math.round(complaint.ai_confidence)}% AI
                  </span>
                )}
              </div>
              {showCitizen && complaint.citizen && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Avatar name={complaint.citizen.full_name} src={complaint.citizen.avatar_url || undefined} size="sm" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{complaint.citizen.full_name}</span>
                  {complaint.address && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                      <MapPin className="w-3 h-3" />
                      {truncate(complaint.address, 30)}
                    </span>
                  )}
                </div>
              )}
              {!showCitizen && complaint.address && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                  <MapPin className="w-3 h-3" />
                  {truncate(complaint.address, 50)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
