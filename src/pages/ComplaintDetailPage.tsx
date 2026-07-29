import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Brain, User, Building2, HardHat, CheckCircle2,
  XCircle, Star, AlertCircle, Camera,
  History, Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select, Textarea } from '../components/ui/Input';
import { StatusBadge, PriorityBadge, SeverityBadge } from '../components/StatusBadge';
import { SimpleMap } from '../components/SimpleMap';
import { EmptyState } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import type { Complaint, ActivityLog, Feedback, Profile, Priority } from '../types';
import { STATUS_CONFIG, STATUS_FLOW, CATEGORY_ICONS, PRIORITY_CONFIG } from '../lib/constants';
import { formatDateTime, timeAgo, cn } from '../lib/utils';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [officerComment, setOfficerComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [workerRemarks, setWorkerRemarks] = useState('');
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchComplaint();
  }, [id]);

  async function fetchComplaint() {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setComplaint(data as Complaint | null);

    const [logsRes, feedbackRes, workersRes] = await Promise.all([
      supabase.from('activity_logs').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
      supabase.from('feedback').select('*').eq('complaint_id', id).maybeSingle(),
      supabase.from('profiles').select('*').eq('role', 'worker'),
    ]);
    setLogs((logsRes.data as ActivityLog[]) ?? []);
    setFeedback((feedbackRes.data as Feedback) ?? null);
    setWorkers((workersRes.data as Profile[]) ?? []);
    setLoading(false);
  }

  async function logActivity(complaintId: string, action: string, fromStatus: string | null, toStatus: string, notes: string = '') {
    if (!profile) return;
    await supabase.from('activity_logs').insert({
      complaint_id: complaintId,
      user_id: profile.id,
      action,
      from_status: fromStatus,
      to_status: toStatus,
      notes,
    });
  }

  async function sendNotification(userId: string, title: string, message: string, type: string) {
    await supabase.from('notifications').insert({
      user_id: userId,
      complaint_id: id,
      title,
      message,
      type,
    });
  }

  // Officer: Approve
  const handleApprove = async () => {
    if (!complaint || !profile) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'officer_review', officer_id: profile.id, officer_comment: officerComment })
      .eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Complaint approved by officer', complaint.status, 'officer_review', officerComment);
      await sendNotification(complaint.citizen_id, 'Complaint Approved', 'Your complaint has been approved by a municipal officer.', 'status');
      toast('success', 'Complaint approved', 'The complaint is now under officer review.');
      fetchComplaint();
    }
    setActionLoading(false);
    setOfficerComment('');
  };

  // Officer: Assign worker
  const handleAssignWorker = async () => {
    if (!complaint || !selectedWorker) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'worker_assigned', worker_id: selectedWorker })
      .eq('id', complaint.id);
    if (!error) {
      await supabase.from('assignments').insert({
        complaint_id: complaint.id,
        officer_id: profile?.id,
        worker_id: selectedWorker,
        assigned_by: profile?.id,
        status: 'assigned',
      });
      await logActivity(complaint.id, 'Worker assigned', complaint.status, 'worker_assigned', `Worker assigned`);
      await sendNotification(selectedWorker, 'New Task Assigned', `You have been assigned a complaint: ${complaint.title}`, 'assignment');
      await sendNotification(complaint.citizen_id, 'Worker Assigned', 'A field worker has been assigned to your complaint.', 'assignment');
      toast('success', 'Worker assigned', 'The field worker has been notified.');
      setShowAssign(false);
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Officer: Reject
  const handleReject = async () => {
    if (!complaint) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'rejected', officer_comment: rejectReason })
      .eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Complaint rejected', complaint.status, 'rejected', rejectReason);
      await sendNotification(complaint.citizen_id, 'Complaint Rejected', `Your complaint was rejected: ${rejectReason}`, 'warning');
      toast('success', 'Complaint rejected', 'The citizen has been notified.');
      setShowReject(false);
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Officer: Change priority
  const handlePriorityChange = async (priority: Priority) => {
    if (!complaint) return;
    await supabase.from('complaints').update({ priority }).eq('id', complaint.id);
    await logActivity(complaint.id, 'Priority changed', complaint.status, complaint.status, `${complaint.priority} → ${priority}`);
    toast('success', 'Priority updated', `Priority set to ${priority}`);
    fetchComplaint();
  };

  // Worker: Accept task
  const handleAcceptTask = async () => {
    if (!complaint) return;
    setActionLoading(true);
    const { error } = await supabase.from('complaints').update({ status: 'accepted' }).eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Task accepted', complaint.status, 'accepted');
      await sendNotification(complaint.citizen_id, 'Worker Accepted Task', 'A field worker has accepted your complaint and will start soon.', 'status');
      toast('success', 'Task accepted', 'You can now start working on this complaint.');
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Worker: Start work
  const handleStartWork = async () => {
    if (!complaint) return;
    setActionLoading(true);
    const { error } = await supabase.from('complaints').update({ status: 'in_progress' }).eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Work started', complaint.status, 'in_progress');
      await sendNotification(complaint.citizen_id, 'Work In Progress', 'A field worker has started working on your complaint.', 'status');
      toast('success', 'Work started', 'Status updated to in progress.');
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Worker: Complete work
  const handleComplete = async () => {
    if (!complaint) return;
    setActionLoading(true);
    let resolutionImages = complaint.resolution_images ?? [];

    if (afterImage) {
      const fileExt = afterImage.name.split('.').pop();
      const fileName = `${complaint.citizen_id}/resolution-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('complaints').upload(fileName, afterImage);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('complaints').getPublicUrl(fileName);
        resolutionImages = [...resolutionImages, urlData.publicUrl];
      }
    }

    const { error } = await supabase
      .from('complaints')
      .update({ status: 'resolved', resolution_images: resolutionImages, remarks: workerRemarks, completed_at: new Date().toISOString() })
      .eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Work completed', complaint.status, 'resolved', workerRemarks);
      await sendNotification(complaint.citizen_id, 'Complaint Resolved!', 'Your complaint has been resolved. Please verify and leave feedback.', 'success');
      toast('success', 'Work completed', 'The citizen has been notified to verify.');
      setAfterImage(null);
      setAfterImagePreview('');
      setWorkerRemarks('');
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Citizen: Verify
  const handleVerify = async () => {
    if (!complaint) return;
    setActionLoading(true);
    const { error } = await supabase.from('complaints').update({ status: 'citizen_verified' }).eq('id', complaint.id);
    if (!error) {
      await logActivity(complaint.id, 'Citizen verified resolution', complaint.status, 'citizen_verified');
      await supabase.from('complaints').update({ status: 'closed' }).eq('id', complaint.id);
      await logActivity(complaint.id, 'Complaint closed', 'citizen_verified', 'closed');
      if (complaint.officer_id) await sendNotification(complaint.officer_id, 'Complaint Closed', `Complaint "${complaint.title}" has been verified and closed.`, 'status');
      toast('success', 'Verified & Closed', 'Thank you for verifying the resolution.');
      fetchComplaint();
    }
    setActionLoading(false);
  };

  // Citizen: Submit feedback
  const handleSubmitFeedback = async () => {
    if (!complaint || !profile) return;
    setActionLoading(true);
    const { error } = await supabase.from('feedback').insert({
      complaint_id: complaint.id,
      citizen_id: profile.id,
      rating: feedbackRating,
      comment: feedbackComment,
    });
    if (!error) {
      toast('success', 'Feedback submitted', 'Thank you for your feedback!');
      setShowFeedback(false);
      fetchComplaint();
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!complaint) {
    return (
      <DashboardLayout>
        <Card>
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="Complaint not found"
            message="This complaint may have been deleted."
            action={<Button onClick={() => navigate('/complaints')}>Back to list</Button>}
          />
        </Card>
      </DashboardLayout>
    );
  }

  const isCitizen = profile?.role === 'citizen' && profile?.id === complaint.citizen_id;
  const isOfficer = profile?.role === 'officer';
  const isWorker = profile?.role === 'worker' && profile?.id === complaint.worker_id;
  const currentStepIndex = STATUS_FLOW.indexOf(complaint.status);

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                {complaint.image_url ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    <img src={complaint.image_url} alt={complaint.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl shrink-0">
                    {CATEGORY_ICONS[complaint.category] ?? '📋'}
                  </div>
                )}
                <div>
                  <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">{complaint.title}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    <SeverityBadge severity={complaint.severity} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{complaint.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                <p className="font-semibold text-gray-900 dark:text-white">{CATEGORY_ICONS[complaint.category]} {complaint.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                <p className="font-semibold text-gray-900 dark:text-white">{complaint.department || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
                <p className="font-semibold text-gray-900 dark:text-white">{timeAgo(complaint.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Confidence</p>
                <p className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  {Math.round(complaint.ai_confidence)}%
                </p>
              </div>
            </div>

            {complaint.ai_summary && (
              <div className="mt-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{complaint.ai_summary}</p>
                </div>
              </div>
            )}

            {complaint.address && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                {complaint.address}
              </div>
            )}
          </Card>

          {/* Location map */}
          {complaint.latitude != null && complaint.longitude != null && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Location</h3>
              <SimpleMap
                height="300px"
                center={{ lat: complaint.latitude, lng: complaint.longitude }}
                markers={[{
                  id: complaint.id,
                  lat: complaint.latitude,
                  lng: complaint.longitude,
                  label: complaint.title,
                  priority: complaint.priority,
                  category: complaint.category,
                }]}
              />
            </Card>
          )}

          {/* Resolution images */}
          {complaint.resolution_images && complaint.resolution_images.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Resolution Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.resolution_images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={img} alt={`Resolution ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {complaint.remarks && (
                <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Worker Remarks</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{complaint.remarks}</p>
                </div>
              )}
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">Complaint Timeline</h3>
            </div>

            {/* Status flow visual */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {STATUS_FLOW.map((s, i) => {
                const config = STATUS_CONFIG[s];
                const completed = i <= currentStepIndex;
                return (
                  <div key={s} className="flex items-center">
                    <div className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                      completed ? config.bg + ' ' + config.color : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                    )}>
                      {completed && <CheckCircle2 className="w-3 h-3" />}
                      {config.label}
                    </div>
                    {i < STATUS_FLOW.length - 1 && <div className={cn('w-3 h-0.5 mx-0.5', completed ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700')} />}
                  </div>
                );
              })}
            </div>

            {/* Activity logs */}
            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
              ) : (
                logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.action}</p>
                      {log.notes && <p className="text-sm text-gray-500 dark:text-gray-400">{log.notes}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.created_at)}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* People */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Assigned People</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Citizen</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Reported by citizen</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Officer</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {complaint.officer_id ? 'Assigned' : 'Not assigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center">
                  <HardHat className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Field Worker</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {complaint.worker_id ? 'Assigned' : 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Officer actions */}
          {isOfficer && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Officer Actions</h3>
              <div className="space-y-3">
                {/* Priority change */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Change Priority</label>
                  <Select
                    value={complaint.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                  >
                    {Object.keys(PRIORITY_CONFIG).map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>

                {/* Officer comment */}
                <Textarea
                  label="Officer Comment"
                  value={officerComment}
                  onChange={(e) => setOfficerComment(e.target.value)}
                  placeholder="Add a comment for the citizen..."
                  rows={2}
                />

                {complaint.status === 'department_assigned' && (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleApprove} loading={actionLoading} size="sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button variant="danger" onClick={() => setShowReject(true)} size="sm">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {(complaint.status === 'officer_review' || complaint.status === 'department_assigned') && (
                  <Button className="w-full" onClick={() => setShowAssign(true)} size="sm">
                    <HardHat className="w-4 h-4" />
                    Assign Worker
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Worker actions */}
          {isWorker && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Worker Actions</h3>
              <div className="space-y-3">
                {complaint.status === 'worker_assigned' && (
                  <Button className="w-full" onClick={handleAcceptTask} loading={actionLoading}>
                    <CheckCircle2 className="w-4 h-4" />
                    Accept Task
                  </Button>
                )}
                {complaint.status === 'accepted' && (
                  <Button className="w-full" onClick={handleStartWork} loading={actionLoading}>
                    Start Work
                  </Button>
                )}
                {complaint.status === 'in_progress' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Upload After Photo</label>
                      <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 cursor-pointer transition-colors">
                        <Camera className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {afterImage ? afterImage.name : 'Upload completion photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setAfterImage(f);
                              const reader = new FileReader();
                              reader.onload = (ev) => setAfterImagePreview(ev.target?.result as string);
                              reader.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                      {afterImagePreview && (
                        <div className="mt-2 rounded-xl overflow-hidden">
                          <img src={afterImagePreview} alt="After" className="w-full h-32 object-cover" />
                        </div>
                      )}
                    </div>
                    <Textarea
                      label="Remarks"
                      value={workerRemarks}
                      onChange={(e) => setWorkerRemarks(e.target.value)}
                      placeholder="Describe the work done..."
                      rows={3}
                    />
                    <Button className="w-full" onClick={handleComplete} loading={actionLoading}>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Completed
                    </Button>
                  </>
                )}
                {['resolved', 'citizen_verified', 'closed'].includes(complaint.status) && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-gov-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">This task has been completed.</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Citizen actions */}
          {isCitizen && complaint.status === 'resolved' && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Verify Resolution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                The field worker has marked this complaint as resolved. Please verify and leave feedback.
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleVerify} loading={actionLoading}>
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Close
                </Button>
                {!feedback && (
                  <Button variant="secondary" className="w-full" onClick={() => setShowFeedback(true)}>
                    <Star className="w-4 h-4" />
                    Leave Feedback
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Feedback display */}
          {feedback && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-3">Feedback</h3>
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700')} />
                ))}
              </div>
              {feedback.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{feedback.comment}</p>}
            </Card>
          )}
        </div>
      </div>

      {/* Assign worker modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Field Worker">
        <div className="space-y-4">
          <Select label="Select Worker" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
            <option value="">Choose a worker...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.full_name} {w.department ? `— ${w.department}` : ''}</option>
            ))}
          </Select>
          {workers.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">No field workers registered yet.</p>
          )}
          <Button className="w-full" onClick={handleAssignWorker} loading={actionLoading} disabled={!selectedWorker}>
            Assign Worker
          </Button>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={showReject} onClose={() => setShowReject(false)} title="Reject Complaint">
        <div className="space-y-4">
          <Textarea
            label="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this complaint is being rejected..."
            rows={3}
          />
          <Button variant="danger" className="w-full" onClick={handleReject} loading={actionLoading} disabled={!rejectReason}>
            Reject Complaint
          </Button>
        </div>
      </Modal>

      {/* Feedback modal */}
      <Modal open={showFeedback} onClose={() => setShowFeedback(false)} title="Leave Feedback">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setFeedbackRating(i + 1)}>
                  <Star className={cn('w-8 h-8 transition-colors', i < feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700 hover:text-amber-300')} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Comment (optional)"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
          />
          <Button className="w-full" onClick={handleSubmitFeedback} loading={actionLoading}>
            Submit Feedback
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
