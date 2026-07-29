import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Brain, MapPin, Bell, Shield, Zap, Users, TrendingUp, CheckCircle2,
  Camera, FileText, BarChart3, Eye, Star, ChevronDown, ArrowRight, X,
  Phone, Mail, MapPinned, Leaf, Droplets, Trash2, Lightbulb, TrafficCone,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

const FEATURES = [
  { icon: Brain, title: 'AI Image Analysis', desc: 'Automatically categorize issues, estimate severity, and route to the right department using computer vision.' },
  { icon: MapPin, title: 'GPS & Maps Integration', desc: 'Pinpoint complaint locations with GPS, manual map selection, and visual heatmaps of issue hotspots.' },
  { icon: Bell, title: 'Real-Time Notifications', desc: 'Citizens get instant updates at every status change — from submission to resolution and closure.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Separate dashboards and permissions for Citizens, Municipal Officers, and Field Workers.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Officers get charts, trends, department performance, and complaint heatmaps for data-driven decisions.' },
  { icon: Eye, title: 'Public Transparency', desc: 'A public dashboard shows aggregate civic data without exposing any personal user information.' },
];

const STEPS = [
  { icon: Camera, title: 'Report Issue', desc: 'Citizens snap a photo, add a description, and share their location.' },
  { icon: Brain, title: 'AI Analysis', desc: 'AI identifies the category, severity, and recommended department instantly.' },
  { icon: FileText, title: 'Officer Review', desc: 'Municipal officers review, approve, and assign complaints to field workers.' },
  { icon: CheckCircle2, title: 'Resolution & Feedback', desc: 'Workers fix the issue, upload proof, and citizens verify and rate the resolution.' },
];

const STATS = [
  { value: '12K+', label: 'Complaints Resolved' },
  { value: '98%', label: 'AI Accuracy' },
  { value: '4.2h', label: 'Avg. Response Time' },
  { value: '7', label: 'Departments Connected' },
];

const TESTIMONIALS = [
  { name: 'Sarah Mitchell', role: 'Resident, District 4', rating: 5, text: 'I reported a pothole and got a response within hours. The AI correctly identified it as road damage and routed it to the right team. Incredible transparency.' },
  { name: 'Officer James Park', role: 'Municipal Officer', rating: 5, text: 'The analytics dashboard transformed how our department operates. We can see hotspots, track performance, and assign work efficiently. A game changer.' },
  { name: 'Maria Rodriguez', role: 'Field Worker, Sanitation', rating: 5, text: 'Having all my assigned jobs on my phone with navigation makes my work so much easier. The before/after photo workflow keeps everything documented.' },
];

const FAQS = [
  { q: 'How does the AI image analysis work?', a: 'When you upload a photo, our AI vision system analyzes the image to identify the issue category (garbage, potholes, water leakage, etc.), estimate severity, predict priority, and recommend the appropriate municipal department — all within seconds.' },
  { q: 'Is my personal information safe?', a: 'Yes. We use row-level security and encryption. Your personal data is never exposed on the public transparency dashboard, which only shows aggregate, anonymized civic data.' },
  { q: 'How do I track my complaint?', a: 'After submitting, you can track your complaint in real time from your citizen dashboard. You will receive notifications at every status change until the issue is resolved and closed.' },
  { q: 'What if the AI categorizes my complaint incorrectly?', a: 'You can review and edit the AI-suggested category, priority, and department before submitting your complaint. The AI prediction is a recommendation, not a final decision.' },
  { q: 'Can I report issues from my mobile phone?', a: 'Absolutely. The platform is fully responsive and supports mobile camera capture. You can take a photo directly from the complaint form on any device.' },
  { q: 'How are field workers assigned?', a: 'Municipal officers review complaints and assign them to available field workers based on department, location, and workload. Workers then accept, start, and complete tasks from their dashboard.' },
];

const DEPARTMENTS = [
  { icon: Trash2, name: 'Sanitation', color: 'from-green-500 to-emerald-600' },
  { icon: TrafficCone, name: 'Roads & Infrastructure', color: 'from-orange-500 to-amber-600' },
  { icon: Droplets, name: 'Water & Sewage', color: 'from-blue-500 to-cyan-600' },
  { icon: Lightbulb, name: 'Electricity', color: 'from-yellow-500 to-amber-500' },
  { icon: Leaf, name: 'Parks & Trees', color: 'from-green-600 to-teal-600' },
  { icon: TrafficCone, name: 'Traffic & Transport', color: 'from-red-500 to-rose-600' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 hero-gradient">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-gov-500 animate-pulse" />
                AI-Powered Smart City Platform
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight text-balance">
                Report. Track. Resolve.
                <span className="block gradient-text mt-2">Civic issues, reimagined.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                CivicConnect AI connects citizens, municipal officers, and field workers on one platform.
                Report issues with a photo, let AI categorize and route them, and track resolution in real time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate(session ? '/dashboard' : '/register')}>
                  {session ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  See How It Works
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gov-500" />
                  No setup required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gov-500" />
                  Free for citizens
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative glass-card rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">civicconnect.ai/report</span>
                </div>
                <div className="space-y-3">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-green-900/20" />
                    <Camera className="w-12 h-12 text-gray-400" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium">
                      Image captured
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">AI Analysis Complete</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-semibold">Potholes</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Priority</span><span className="font-semibold text-orange-600">High</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Dept</span><span className="font-semibold">Roads</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Confidence</span><span className="font-semibold text-gov-600">94%</span></div>
                    </div>
                  </motion.div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status: Submitted</span>
                    <span className="flex items-center gap-1 text-gov-600 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Routed to Roads Dept
                    </span>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 glass-card rounded-2xl p-3 shadow-xl hidden sm:block"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gov-100 dark:bg-gov-900/40 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gov-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Resolved today</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">247 issues</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About CivicConnect AI
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              We are reimagining how citizens and municipalities interact. Traditional complaint systems are slow,
              opaque, and inefficient. CivicConnect AI uses artificial intelligence to make reporting and resolving
              civic issues faster, smarter, and fully transparent — building trust between communities and their government.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Our Mission', desc: 'Eliminate the friction between citizens and municipal services through AI-driven automation and real-time transparency.' },
              { icon: Eye, title: 'Our Vision', desc: 'A world where every civic issue is reported, tracked, and resolved with full accountability and public trust.' },
              { icon: Users, title: 'Our Approach', desc: 'Connect all stakeholders — citizens, officers, and workers — on a single intelligent platform with clear workflows.' },
            ].map((item) => (
              <motion.div key={item.title} {...fadeUp} className="card p-6 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Project Objectives
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Solving the problems that plague traditional civic complaint systems.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { problem: 'Complaints take too long to resolve', solution: 'AI auto-routing and real-time worker assignment cut resolution time dramatically.' },
              { problem: 'Citizens cannot track progress', solution: 'Full transparency with real-time status updates and notifications at every step.' },
              { problem: 'Complaints are manually categorized', solution: 'AI vision automatically identifies issue type, severity, and department in seconds.' },
              { problem: 'Departments receive incorrect complaints', solution: 'Smart department routing based on AI category detection eliminates misassignment.' },
              { problem: 'Officers have no centralized dashboard', solution: 'A unified analytics dashboard with charts, heatmaps, and performance metrics.' },
              { problem: 'There is little transparency', solution: 'A public transparency dashboard shows aggregate data without exposing personal information.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                className="card p-5 flex gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-through mb-1">{item.problem}</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gov-500 shrink-0 mt-0.5" />
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{item.solution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to manage civic issues from report to resolution.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-gov-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Four simple steps from reporting to resolution.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-gov-200 to-brand-200 dark:from-brand-800 dark:via-gov-800 dark:to-brand-800" />
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="relative inline-flex w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 border-2 border-brand-200 dark:border-brand-800 flex items-center justify-center shadow-lg">
                    <step.icon className="w-10 h-10 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-gov-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Connected Departments
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              AI routes complaints to the right municipal department automatically.
            </p>
          </motion.div>
          <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DEPARTMENTS.map((dept) => (
              <motion.div key={dept.name} {...fadeUp} className="card p-5 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center mb-3`}>
                  <dept.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dept.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section id="statistics" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-gov-800" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Real Impact, Real Numbers
            </h2>
            <p className="text-lg text-brand-100">
              See how CivicConnect AI is transforming civic management.
            </p>
          </motion.div>
          <motion.div {...stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <motion.div key={stat.label} {...fadeUp} className="text-center">
                <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-brand-100 text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Communities
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Hear from citizens, officers, and workers using CivicConnect AI.
            </p>
          </motion.div>
          <motion.div {...stagger} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} {...fadeUp} className="card p-6 hover:shadow-xl transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-gov-600 flex items-center justify-center text-white font-semibold text-sm">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i} {...fadeUp} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Have questions about CivicConnect AI? Want to bring it to your city? We would love to hear from you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Call us</p>
                    <p className="font-semibold text-gray-900 dark:text-white">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gov-100 dark:bg-gov-900/40 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gov-600 dark:text-gov-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email us</p>
                    <p className="font-semibold text-gray-900 dark:text-white">contact@civicconnect.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <MapPinned className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visit us</p>
                    <p className="font-semibold text-gray-900 dark:text-white">City Hall, 100 Government Plaza</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="card p-6">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <input className="input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input type="email" className="input-field" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                  <input className="input-field" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                  <textarea rows={4} className="input-field resize-none" placeholder="Tell us more..." />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-gov-700" />
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="relative p-10 sm:p-16 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to transform your city?
              </h2>
              <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of citizens and municipal teams using CivicConnect AI to build better, more responsive communities.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(session ? '/dashboard' : '/register')}
                className="bg-white text-brand-700 hover:bg-gray-50 shadow-2xl"
              >
                {session ? 'Go to Dashboard' : 'Create Your Account'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-gov-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-white">CivicConnect AI</p>
                  <p className="text-[10px] text-brand-400 tracking-wider">AI POWERED</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                AI-powered civic issue reporting and management platform connecting citizens, officers, and field workers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => navigate('/transparency')} className="hover:text-white transition-colors">Transparency Dashboard</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Users</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Citizen Portal</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Officer Portal</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Worker Portal</button></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>contact@civicconnect.ai</li>
                <li>+1 (555) 123-4567</li>
                <li>City Hall, Government Plaza</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 CivicConnect AI. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
