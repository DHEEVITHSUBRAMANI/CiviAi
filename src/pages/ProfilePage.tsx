import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building2, Save, Camera, HardHat } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import type { UserRole } from '../types';

const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  officer: 'Municipal Officer',
  worker: 'Field Worker',
};

const ROLE_ICONS: Record<UserRole, typeof User> = {
  citizen: User,
  officer: Building2,
  worker: HardHat,
};

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    department: profile?.department ?? '',
  });

  if (!profile) return null;

  const RoleIcon = ROLE_ICONS[profile.role];

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      toast('error', 'Update failed', error);
    } else {
      toast('success', 'Profile updated', 'Your profile has been saved.');
      setEditing(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('complaints').upload(fileName, file);
    if (uploadError) {
      toast('error', 'Upload failed', uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('complaints').getPublicUrl(fileName);
    const { error } = await updateProfile({ avatar_url: urlData.publicUrl });
    if (error) {
      toast('error', 'Update failed', error);
    } else {
      toast('success', 'Photo updated', 'Your profile photo has been updated.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your account information</p>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <Avatar name={profile.full_name} src={profile.avatar_url || undefined} size="lg" />
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center cursor-pointer hover:bg-brand-700 shadow-lg border-2 border-white dark:border-gray-900">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                  />
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                    <RoleIcon className="w-3.5 h-3.5" />
                    {ROLE_LABELS[profile.role]}
                  </span>
                  {profile.department && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                      <Building2 className="w-3.5 h-3.5" />
                      {profile.department}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Member since {formatDate(profile.created_at)}</p>
              </div>
              <Button variant={editing ? 'secondary' : 'primary'} onClick={() => editing ? handleSave() : setEditing(true)} loading={saving}>
                {editing ? <><Save className="w-4 h-4" /> Save</> : 'Edit Profile'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Details */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              {editing ? (
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{profile.full_name}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{profile.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              {editing ? (
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Add phone number" />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{profile.phone || 'Not set'}</span>
                </div>
              )}
            </div>
            {profile.role !== 'citizen' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
                {editing ? (
                  <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Department" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{profile.department || 'Not set'}</span>
                  </div>
                )}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
              {editing ? (
                <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Your address" rows={2} />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{profile.address || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
