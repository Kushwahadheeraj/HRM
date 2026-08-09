import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useApp } from '../App';
import { useCurrency } from '../lib/currency';
import { authAPI, reviewsAPI } from '../lib/api';
import { ArrowRight, Zap, Shield, Globe, Brain, Clock, Users, BarChart3, CheckCircle2, Star, ChevronRight, Sparkles, Fingerprint, MapPin, QrCode, Bot, TrendingUp, Calendar, Download, Menu, X, Sun, Moon } from 'lucide-react';

const features = [
  { icon: Fingerprint, title: 'Face Recognition', desc: 'AI-powered biometric attendance with 99.9% accuracy' },
  { icon: MapPin, title: 'GPS Tracking', desc: 'Location-based check-in with geofencing support' },
  { icon: QrCode, title: 'QR Attendance', desc: 'Instant scan-based attendance for large teams' },
  { icon: Bot, title: 'AI HR Assistant', desc: 'Smart chatbot for HR queries and automation' },
  { icon: TrendingUp, title: 'Predictive Analytics', desc: 'AI-driven insights on trends and absenteeism' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Auto shift planning with conflict detection' },
];

const stats = [
  { value: '10K+', label: 'Companies Trust Us' },
  { value: '2.5M+', label: 'Employees Managed' },
  { value: '99.9%', label: 'System Uptime' },
  { value: '150+', label: 'Countries Served' },
];

const defaultTestimonials = [
  { name: 'Jennifer Walsh', role: 'CHRO, TechCorp', text: 'Traxale HRM transformed our entire HR operations. The AI features save us 20+ hours weekly.', rating: 5 },
  { name: 'Raj Malhotra', role: 'VP People, StartupXYZ', text: 'The most intuitive HR platform we have ever used. Our employees actually enjoy using it.', rating: 5 },
  { name: 'Maria Santos', role: 'HR Director, GlobalInc', text: 'From attendance to payroll, everything just works. The predictive analytics are game-changing.', rating: 5 },
];

const capabilities = [
  { icon: Shield, text: 'Role-based access control with enterprise security' },
  { icon: Globe, text: 'Multi-location, multi-timezone support' },
  { icon: Clock, text: 'Real-time attendance with auto shift tracking' },
  { icon: Users, text: 'Complete employee lifecycle management' },
  { icon: BarChart3, text: 'Advanced analytics with AI-generated insights' },
  { icon: Brain, text: 'Predictive absenteeism and productivity modeling' },
];

export default function Landing() {
  const currentYear = new Date().getFullYear();
  const { setCurrentPage, setRegisterMode, setRegisterPlan, theme, toggleTheme } = useApp();
  const { currencySymbol, isIndian } = useCurrency();
  const [pricing, setPricing] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch pricing and reviews from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pricingRes, reviewsRes] = await Promise.all([
          authAPI.getPricing(),
          reviewsAPI.getApproved()
        ]);
        
        if (pricingRes.success && pricingRes.data) {
          // Sort in fixed order: Basic → Pro → Enterprise
          const planOrder = ['Basic', 'Pro', 'Enterprise'];
          const sortedPricing = [...pricingRes.data].sort((a, b) => 
            planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan)
          );
          setPricing(sortedPricing);
        }
        
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to default pricing if API fails
        setPricing([
          { plan: 'Basic', priceInr: 299, priceUsd: 4, employeeLimit: 50, features: ['Up to 50 employees', 'Basic attendance', 'Leave management', 'Email support', 'Mobile app'] },
          { plan: 'Pro', priceInr: 799, priceUsd: 9.99, employeeLimit: 500, features: ['Up to 500 employees', 'AI attendance', 'Full HRM suite', 'Priority support', 'Custom reports', 'API access', 'AI Assistant'] },
          { plan: 'Enterprise', priceInr: 0, priceUsd: 0, employeeLimit: -1, features: ['Unlimited employees', 'Advanced AI', 'Dedicated manager', '24/7 support', 'Custom integrations', 'SLA guarantee'] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFreeTrial = () => {
    setMobileMenuOpen(false);
    setRegisterMode('free-trial');
    setCurrentPage('register-admin');
  };

  const handleGetStarted = (planKey: 'Basic' | 'Pro' | 'Enterprise' = 'Pro') => {
    setMobileMenuOpen(false);
    setRegisterMode('paid');
    setRegisterPlan(planKey);
    setCurrentPage('register-admin');
  };

  return (
    <div className="min-h-screen hero-grid" style={{ background: 'var(--bg-primary)' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4" style={{ background: theme === 'dark' ? 'rgba(4, 8, 16, 0.85)' : 'rgba(248, 250, 252, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/logo.png" alt="Traxale Logo" className="h-12 w-12 rounded-xl neon-glow sm:h-14 sm:w-14 md:h-16 md:w-16" />
              <h1 className="hidden text-xl font-bold gradient-text md:block">Traxale Private Limited</h1>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium transition-colors hover:text-electric" style={{ color: 'var(--text-secondary)' }}>Features</a>
              <a href="#pricing" className="text-sm font-medium transition-colors hover:text-electric" style={{ color: 'var(--text-secondary)' }}>Pricing</a>
              <a href="#testimonials" className="text-sm font-medium transition-colors hover:text-electric" style={{ color: 'var(--text-secondary)' }}>Testimonials</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
              <a href="/traxale-app.apk" download className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <Download size={16} />
                Download App
              </a>
              <button onClick={() => setCurrentPage('login')} className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:scale-105" style={{ color: 'var(--text-primary)' }}>Sign In</button>
              <button onClick={handleFreeTrial} className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>Start Free Trial</button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center rounded-xl p-2.5"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
              <a
                href="/traxale-app.apk"
                download
                className="flex items-center justify-center rounded-xl p-2.5"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                aria-label="Download App"
              >
                <Download size={18} className='mr-2' />
                Download App
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="flex items-center justify-center rounded-xl p-2.5"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="mt-3 rounded-2xl p-4 md:hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex flex-col gap-2">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>Pricing</a>
                <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>Testimonials</a>
              </div>
              <div className="my-4 h-px" style={{ background: 'var(--border-color)' }} />
              <div className="flex flex-col gap-3">
                <button onClick={() => { setMobileMenuOpen(false); setCurrentPage('login'); }} className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Sign In</button>
                <button onClick={handleFreeTrial} className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>Start Free Trial</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Sparkles size={14} style={{ color: '#F97316' }} />
                <span className="text-xs font-semibold" style={{ color: '#60A5FA' }}>AI-Powered HR Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
                Track. Manage. <span className="gradient-text">Scale.</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                The world's most advanced AI-powered HR and attendance management platform. Built for modern teams that demand excellence.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <button onClick={handleFreeTrial} className="group flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                  Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => handleGetStarted()} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Get Started (Paid)</button>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {['#3B82F6', '#F97316', '#10B981', '#8B5CF6'].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold" style={{ background: c, borderColor: 'var(--bg-primary)' }}>{['S', 'M', 'A', 'D'][i]}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />)}</div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Loved by 10,000+ companies</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden glass-card p-1">
                <img src="/images/dashboard-preview.jpg" alt="Dashboard" className="rounded-2xl w-full" />
              </div>
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-4 -right-4 glass-card p-3 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}><CheckCircle2 size={16} style={{ color: '#10B981' }} /></div>
                  <div><p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>94% Present</p><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Today</p></div>
                </div>
              </motion.div>
              <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-4 -left-4 glass-card p-3 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}><Brain size={16} style={{ color: '#3B82F6' }} /></div>
                  <div><p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Insights</p><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>3 new</p></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center glass-card p-6 rounded-2xl glass-card-hover transition-all">
              <p className="text-3xl md:text-4xl font-black gradient-text">{stat.value}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <Zap size={14} style={{ color: '#F97316' }} />
              <span className="text-xs font-semibold" style={{ color: '#FB923C' }}>Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Everything You Need to <span className="gradient-text">Manage Your Workforce</span></h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card glass-card-hover p-6 rounded-2xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Icon size={24} style={{ color: '#3B82F6' }} /></div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3B82F6' }}>Learn more <ChevronRight size={14} /></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div><img src="/images/team.jpg" alt="Team" className="rounded-2xl w-full glass-card" /></div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Enterprise-Grade <span className="gradient-text">HR Capabilities</span></h2>
            {capabilities.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-4 py-3 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Icon size={20} style={{ color: '#3B82F6' }} /></div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>Simple, Transparent <span className="gradient-text">Pricing</span></h2>
          <p className="text-lg text-center mb-16" style={{ color: 'var(--text-secondary)' }}>Start free. Scale as you grow.</p>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading pricing...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {pricing.map((plan, i) => {
                const isPopular = plan.plan === 'Pro';
                const price = isIndian ? plan.priceInr : plan.priceUsd;
                const priceDisplay = plan.plan === 'Enterprise' ? 'Custom' : `${currencySymbol}${price}`;
                
                return (
                  <motion.div key={plan.plan} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={'glass-card p-8 rounded-2xl transition-all hover:scale-[1.02] relative ' + (isPopular ? 'neon-glow' : '')} style={isPopular ? { border: '1px solid rgba(59, 130, 246, 0.3)' } : {}}>
                    {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #F97316)' }}>Most Popular</div>}
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{plan.plan}</h3>
                    <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-black gradient-text">{priceDisplay}</span>{plan.plan !== 'Enterprise' && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/user/mo</span>}</div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f: string, j: number) => <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><CheckCircle2 size={14} style={{ color: '#10B981' }} />{f}</li>)}
                    </ul>
                    <button onClick={() => handleGetStarted(plan.plan as any)} className={'w-full py-3 rounded-xl font-semibold transition-all hover:scale-105 ' + (isPopular ? 'text-white' : '')} style={isPopular ? { background: 'linear-gradient(135deg, #3B82F6, #2563EB)' } : { background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Get Started</button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16" style={{ color: 'var(--text-primary)' }}>Trusted by <span className="gradient-text">Industry Leaders</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(reviews.length > 0 ? reviews : defaultTestimonials).map((item, i) => (
              <motion.div key={item.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} fill={star <= (item.rating || 5) ? '#F59E0B' : 'none'} style={{ color: '#F59E0B' }} />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>"{item.comment || item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: ['#3B82F6', '#F97316', '#10B981'][i % 3] }}>
                    {(item.userName || item.name)[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.userName || item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.organizationName || item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass-card p-12 rounded-3xl relative overflow-hidden" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.08), transparent 50%)' }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Ready to Transform Your HR?</h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>Join 10,000+ companies already using Traxale HRM</p>
            <button onClick={() => handleGetStarted('Pro')} className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Traxale Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-bold gradient-text">Powered by Traxale Private Limited</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>© {currentYear} Traxale Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
