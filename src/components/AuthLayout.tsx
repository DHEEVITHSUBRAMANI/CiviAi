import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Moon, Sun, CheckCircle2, Brain, MapPin, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Automatic issue categorization and routing' },
  { icon: MapPin, title: 'Real-Time Tracking', desc: 'Track complaints from report to resolution' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Data-driven municipal decision making' },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-gov-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-lg">CivicConnect AI</p>
              <p className="text-[10px] text-brand-200 tracking-wider">AI POWERED</p>
            </div>
          </Link>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-bold leading-tight mb-4"
            >
              Building smarter, more responsive cities together.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-brand-100 text-lg leading-relaxed mb-8"
            >
              Join the platform that connects citizens, officers, and field workers to resolve civic issues faster.
            </motion.p>
            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-sm text-brand-200">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-200">
            <CheckCircle2 className="w-4 h-4" />
            Trusted by 12,000+ citizens and municipal teams
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-gov-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 dark:text-white">CivicConnect</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
