import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, UserPlus, Building2, HardHat } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../types';
import { cn } from '../lib/utils';

const ROLES: { value: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { value: 'citizen', label: 'Citizen', icon: User, desc: 'Report and track civic issues' },
  { value: 'officer', label: 'Municipal Officer', icon: Building2, desc: 'Review, assign, and manage complaints' },
  { value: 'worker', label: 'Field Worker', icon: HardHat, desc: 'Execute assigned tasks in the field' },
];

const DEPARTMENTS = [
  'Sanitation', 'Roads & Infrastructure', 'Water & Sewage', 'Electricity',
  'Parks & Trees', 'Traffic & Transport', 'General Administration',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('citizen');
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '', phone: '', department: '', address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (role !== 'citizen' && !form.department) {
      setError('Please select your department');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      phone: form.phone,
      role,
      department: form.department,
      address: form.address,
    });
    setLoading(false);

    if (error) {
      setError(error);
      toast('error', 'Registration failed', error);
    } else {
      toast('success', 'Account created!', 'Please sign in with your credentials.');
      navigate('/login');
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join CivicConnect AI and start making a difference">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                  role === r.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                )}
              >
                <r.icon className={cn('w-5 h-5', role === r.value ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400')} />
                <span className={cn('text-xs font-semibold', role === r.value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400')}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {ROLES.find((r) => r.value === role)?.desc}
          </p>
        </div>

        <Input
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          placeholder="John Doe"
          required
          icon={<User className="w-4 h-4" />}
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@example.com"
          required
          icon={<Mail className="w-4 h-4" />}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            icon={<Phone className="w-4 h-4" />}
          />
          {role !== 'citizen' && (
            <Select
              label="Department"
              name="department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              required
            >
              <option value="">Select...</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          )}
        </div>
        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="123 Main St, City"
          icon={<MapPin className="w-4 h-4" />}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="At least 6 characters"
            required
            icon={<Lock className="w-4 h-4" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="float-right -mt-9 mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          name="confirm"
          value={form.confirm}
          onChange={(e) => update('confirm', e.target.value)}
          placeholder="Re-enter your password"
          required
          icon={<Lock className="w-4 h-4" />}
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <UserPlus className="w-5 h-5" />
          Create Account
        </Button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
