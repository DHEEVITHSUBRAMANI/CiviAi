import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, MapPin, Brain, Loader2, CheckCircle2, AlertCircle,
  Edit3, X, Sparkles, FileText, Send, Navigation, MapPinned, LocateFixed,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SimpleMap } from '../components/SimpleMap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { analyzeImage, isDuplicateLocation } from '../lib/ai';
import { ISSUE_CATEGORIES, CATEGORY_DEPARTMENT_MAP, PRIORITY_CONFIG } from '../lib/constants';
import type { AIAnalysisResult, Complaint, IssueCategory, Priority } from '../types';
import { cn } from '../lib/utils';

export function SubmitComplaintPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'details' | 'review'>('upload');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [editingAI, setEditingAI] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Others' as IssueCategory,
    customCategory: '',
    priority: 'Medium' as Priority,
    department: '',
    latitude: null as number | null,
    longitude: null as number | null,
    address: '',
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationMode, setLocationMode] = useState<'live' | 'manual' | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  useEffect(() => {
    supabase.from('departments').select('name').eq('is_active', true).order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDepartments(data.map((d) => d.name));
        }
      });
  }, []);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('error', 'Invalid file', 'Please upload an image file.');
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setStep('details');
    runAIAnalysis(file);
    detectLocation();
  };

  const runAIAnalysis = async (file: File) => {
    setAnalyzing(true);
    setAiResult(null);
    try {
      const result = await analyzeImage(file);
      setAiResult(result);
      setForm((f) => ({
        ...f,
        category: result.category,
        priority: result.priority,
        department: result.department,
      }));
      toast('success', 'AI Analysis Complete', `Category: ${result.category} (${result.confidence}% confidence)`);
    } catch (err) {
      toast('error', 'AI Analysis Failed', 'Could not analyze image. You can set details manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error('Address lookup failed');
      const result = await response.json() as { display_name?: string };
      if (result.display_name) {
        setForm((f) => ({ ...f, address: result.display_name ?? '' }));
      }
    } catch {
      toast('warning', 'Address unavailable', 'The location was saved, but we could not find its street address.');
    } finally {
      setReverseGeocoding(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('warning', 'Location unavailable', 'Geolocation is not supported. Please select on map.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocationMode('live');
        setLocating(false);
        toast('success', 'Location detected', 'Your GPS location has been set.');
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        checkDuplicates(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        const msg = err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Please select your location on the map.'
          : 'Could not detect your location. Please select it on the map.';
        toast('warning', 'Location unavailable', msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const checkDuplicates = async (lat: number, lng: number) => {
    if (!profile) return;
    const { data } = await supabase
      .from('complaints')
      .select('id, latitude, longitude, category, created_at')
      .eq('citizen_id', profile.id);
    const dupId = isDuplicateLocation(lat, lng, form.category, (data as any[]) ?? []);
    setDuplicateWarning(dupId);
    if (dupId) {
      toast('warning', 'Possible duplicate', 'A similar complaint was found nearby in the last 7 days.');
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    setLocationMode('manual');
    void reverseGeocode(lat, lng);
    checkDuplicates(lat, lng);
  };

  const handleSubmit = async () => {
    if (!profile || !image) return;
    if (!form.title.trim()) {
      toast('error', 'Title required', 'Please enter a complaint title.');
      return;
    }
    if (!form.description.trim()) {
      toast('error', 'Description required', 'Please describe the issue.');
      return;
    }
    if (form.category === 'Others' && !form.customCategory.trim()) {
      toast('error', 'Category required', 'Please describe what category this issue is.');
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      toast('error', 'Location required', 'Please set your location on the map.');
      return;
    }

    setSubmitting(true);
    try {
      // Upload image
      const fileExt = image.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('complaints')
        .upload(fileName, image);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('complaints').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // Insert complaint
      const { data: complaint, error } = await supabase
        .from('complaints')
        .insert({
          citizen_id: profile.id,
          title: form.title,
          description: form.description,
          image_url: imageUrl,
          latitude: form.latitude,
          longitude: form.longitude,
          address: form.address,
          category: form.category === 'Others' && form.customCategory.trim() ? form.customCategory.trim() : form.category,
          priority: form.priority,
          department: form.department,
          severity: aiResult?.severity ?? 'Moderate',
          ai_confidence: aiResult?.confidence ?? 0,
          ai_summary: aiResult?.summary ?? '',
          status: 'department_assigned',
          is_duplicate: !!duplicateWarning,
          duplicate_of: duplicateWarning,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        complaint_id: (complaint as Complaint).id,
        user_id: profile.id,
        action: 'Complaint submitted',
        from_status: null,
        to_status: 'submitted',
        notes: 'Complaint submitted with AI analysis',
      });

      await supabase.from('activity_logs').insert({
        complaint_id: (complaint as Complaint).id,
        user_id: profile.id,
        action: 'AI analysis completed',
        from_status: 'submitted',
        to_status: 'department_assigned',
        notes: `Category: ${form.category === 'Others' && form.customCategory.trim() ? form.customCategory.trim() : form.category}, Priority: ${form.priority}, Department: ${form.department}`,
      });

      toast('success', 'Complaint submitted!', 'Your issue has been reported and routed to the department.');
      navigate(`/complaints/${(complaint as Complaint).id}`);
    } catch (err: any) {
      toast('error', 'Submission failed', err.message ?? 'Could not submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">Submit a Complaint</h1>
          <p className="text-gray-500 dark:text-gray-400">Report a civic issue with AI-powered analysis</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {['Upload', 'Details', 'Review'].map((s, i) => {
            const stepNum = ['upload', 'details', 'review'].indexOf(step);
            const active = i <= stepNum;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  active ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                )}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                    {active && i < stepNum ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </span>
                  {s}
                </div>
                {i < 2 && <div className={cn('flex-1 h-0.5 mx-2', active ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700')} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Upload a Photo</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Take a photo or upload an image of the civic issue</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/40 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <Camera className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Take Photo</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use your camera</p>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gov-100 dark:bg-gov-950/40 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gov-600 dark:text-gov-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Upload Image</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Choose from device</p>
                    </div>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </Card>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Image preview */}
              <Card className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    <img src={imagePreview} alt="Complaint" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Image uploaded</h3>
                      <button
                        onClick={() => { setImage(null); setImagePreview(''); setAiResult(null); setStep('upload'); }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI is analyzing your image to identify the issue.</p>
                  </div>
                </div>
              </Card>

              {/* AI Analysis */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-brand-50 to-gov-50 dark:from-brand-950/40 dark:to-gov-950/40 border border-brand-200 dark:border-brand-800 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Brain className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        <Loader2 className="w-6 h-6 text-brand-600 dark:text-brand-400 animate-spin absolute inset-0" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-700 dark:text-brand-300">AI is analyzing your image...</p>
                        <p className="text-sm text-brand-600 dark:text-brand-400">Identifying category, severity, and department</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {aiResult && !analyzing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gov-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-display font-semibold text-gray-900 dark:text-white">AI Analysis Result</h3>
                      </div>
                      <button
                        onClick={() => setEditingAI(!editingAI)}
                        className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {editingAI ? 'Done' : 'Edit'}
                      </button>
                    </div>

                    {editingAI ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Select label="Category" value={form.category} onChange={(e) => {
                          const cat = e.target.value as IssueCategory;
                          setForm((f) => ({ ...f, category: cat, department: CATEGORY_DEPARTMENT_MAP[cat] }));
                        }}>
                          {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                          <div className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span>{form.priority}</span>
                            <span className="text-xs text-gray-400">(auto-assigned)</span>
                          </div>
                        </div>
                        <Select label="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                          <option value="">Select...</option>
                          {departments.length > 0 ? departments.map((d) => <option key={d} value={d}>{d}</option>) : Array.from(new Set(Object.values(CATEGORY_DEPARTMENT_MAP))).map((d) => <option key={d} value={d}>{d}</option>)}
                        </Select>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confidence</label>
                          <div className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {Math.round(aiResult.confidence)}%
                          </div>
                        </div>
                        {form.category === 'Others' && (
                          <div className="sm:col-span-2">
                            <Input
                              label="What category best describes this issue?"
                              value={form.customCategory}
                              onChange={(e) => setForm((f) => ({ ...f, customCategory: e.target.value }))}
                              placeholder="e.g., Noise pollution, Stray animals, Signage..."
                              required
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: 'Category', value: form.category === 'Others' && form.customCategory ? form.customCategory : aiResult.category },
                            { label: 'Priority', value: aiResult.priority },
                            { label: 'Department', value: aiResult.department },
                            { label: 'Confidence', value: `${Math.round(aiResult.confidence)}%` },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-3">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{aiResult.summary}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Duplicate warning */}
              {duplicateWarning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Possible duplicate detected</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">A similar complaint with the same category was found within 100m in the last 7 days. You can still submit this complaint.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Complaint details form */}
              <Card className="p-5 space-y-4">
                <h3 className="font-display font-semibold text-gray-900 dark:text-white">Complaint Details</h3>
                <Input
                  label="Title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Large pothole on Main Street"
                  required
                />
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                />
                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Choose a location below or enter an address"
                  icon={<MapPin className="w-4 h-4" />}
                />
              </Card>

              {/* Location */}
              <Card className="p-5">
                <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-1">Location</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how you want to set the complaint location</p>

                {/* Two options */}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
                      locationMode === 'live'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20',
                      locating && 'opacity-70 cursor-wait',
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      locationMode === 'live' ? 'bg-brand-600 text-white' : 'bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400',
                    )}>
                      {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Use Live Location</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Detect via GPS</p>
                    </div>
                    {locationMode === 'live' && <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 ml-auto shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode('manual');
                      if (form.latitude == null || form.longitude == null) {
                        toast('info', 'Pick on map', 'Click anywhere on the map below to set the location.');
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
                      locationMode === 'manual'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20',
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      locationMode === 'manual' ? 'bg-brand-600 text-white' : 'bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400',
                    )}>
                      <MapPinned className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Pick on Map</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Set manually</p>
                    </div>
                    {locationMode === 'manual' && <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 ml-auto shrink-0" />}
                  </button>
                </div>

                {/* Map - shown when manual is selected or when a location is already set */}
                {(locationMode === 'manual' || (form.latitude != null && form.longitude != null)) && (
                  <>
                    <SimpleMap
                      height="300px"
                      selectable={locationMode === 'manual' || locationMode === null}
                      onLocationSelect={handleLocationSelect}
                      center={form.latitude != null && form.longitude != null ? { lat: form.latitude, lng: form.longitude } : undefined}
                    />
                    <div className="mt-2 space-y-1.5">
                      {form.latitude != null && form.longitude != null ? (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {locationMode === 'live' ? 'Live GPS location' : 'Selected location'} · {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                            </p>
                          </div>
                          <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
                            {reverseGeocoding ? <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin mt-0.5 shrink-0" /> : <MapPinned className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />}
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {reverseGeocoding ? 'Finding the address…' : form.address || 'Address not available — you can enter it above.'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click on the map to set the complaint location</p>
                      )}
                    </div>
                  </>
                )}

                {locationMode === null && form.latitude == null && (
                  <div className="flex items-center justify-center h-[120px] rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Select an option above to set location
                    </p>
                  </div>
                )}
              </Card>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('upload')}>Back</Button>
                <Button className="flex-1" onClick={() => setStep('review')} disabled={!form.title || !form.description || (form.category === 'Others' && !form.customCategory.trim())}>
                  Review Complaint
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Card className="p-5">
                <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Review Your Complaint</h3>
                <div className="flex gap-4 mb-4">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    <img src={imagePreview} alt="Complaint" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{form.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{form.description}</p>
                    {form.address && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{form.address}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Category', value: form.category === 'Others' && form.customCategory ? form.customCategory : form.category },
                    { label: 'Priority', value: form.priority },
                    { label: 'Department', value: form.department },
                    { label: 'AI Confidence', value: aiResult ? `${Math.round(aiResult.confidence)}%` : 'N/A' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                {aiResult && (
                  <div className="mt-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiResult.summary}</p>
                  </div>
                )}
              </Card>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('details')}>Back</Button>
                <Button className="flex-1" onClick={handleSubmit} loading={submitting} size="lg">
                  <Send className="w-5 h-5" />
                  Submit Complaint
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
