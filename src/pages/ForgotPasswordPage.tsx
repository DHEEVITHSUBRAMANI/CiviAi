import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast('error', 'Request failed', error);
    } else {
      setSent(true);
      toast('success', 'Reset link sent', 'Check your email for password reset instructions.');
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gov-100 dark:bg-gov-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gov-600 dark:text-gov-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a password reset link to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>.
            Check your inbox and follow the instructions.
          </p>
          <Button variant="secondary" onClick={() => navigate('/login')}>
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Send className="w-5 h-5" />
            Send Reset Link
          </Button>
          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
