import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      toast('error', 'Sign in failed', error);
    } else {
      toast('success', 'Welcome back!', 'You have been signed in successfully.');
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your CivicConnect AI account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <Input
          label="Email address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          icon={<Mail className="w-4 h-4" />}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <LogIn className="w-5 h-5" />
          Sign In
        </Button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            Sign up free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
