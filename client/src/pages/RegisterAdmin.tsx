import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { ArrowLeft, Lock, Eye, EyeOff, Building2, CreditCard, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';
import { authAPI } from '../lib/api';
import { useCurrency } from '../lib/currency';
import { PricingPlan } from '../lib/types';

export default function RegisterAdmin({ mode }: { mode: 'free-trial' | 'paid' }) {
  const { setCurrentPage, login, registerPlan, setRegisterPlan } = useApp();
  const { isIndian, currencySymbol } = useCurrency();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(mode === 'free-trial' ? 1 : 1); // 1 = form, 2 = payment (only for paid)
  const [tempRegistrationData, setTempRegistrationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    phone: '',
    address: '',
  });
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  // Fetch pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await authAPI.getPricing();
        if (res.success && res.data) {
          // Sort in fixed order: Basic → Pro → Enterprise
          const planOrder = ['Basic', 'Pro', 'Enterprise'];
          const sortedPlans = [...res.data].sort((a, b) => 
            planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan)
          );
          setPlans(sortedPlans);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback to default pricing if API fails
        setPlans([
          { plan: 'Basic', priceInr: 299, priceUsd: 4, employeeLimit: 50, features: ['Up to 50 employees', 'Basic attendance', 'Leave management', 'Email support', 'Mobile app'] },
          { plan: 'Pro', priceInr: 799, priceUsd: 9.99, employeeLimit: 500, features: ['Up to 500 employees', 'AI attendance', 'Full HRM suite', 'Priority support', 'Custom reports', 'API access', 'AI Assistant'] },
          { plan: 'Enterprise', priceInr: 0, priceUsd: 0, employeeLimit: -1, features: ['Unlimited employees', 'Advanced AI', 'Dedicated manager', '24/7 support', 'Custom integrations', 'SLA guarantee'] },
        ]);
      } finally {
        setPricingLoading(false);
      }
    };

    fetchPricing();
  }, []);

  // Step 1: Submit form - for free-trial submit directly, for paid go to payment
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (mode === 'free-trial') {
      // Free trial: call registerAdmin directly
      setLoading(true);
      try {
        const res = await authAPI.registerAdmin(formData);
        if (res.success && res.data?.user) {
          const user = res.data.user;
          if (user._id && !user.id) user.id = user._id;
          if (user.id && !user._id) user._id = user.id;
          alert('Free trial started! Welcome aboard!');
          login(user);
        }
      } catch (error) {
        console.error(error);
        alert('Registration failed! Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Paid: go to payment step
      setTempRegistrationData(formData);
      setStep(2);
    }
  };

  // Step 2: Handle payment
  const handlePayment = async () => {
    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.plan === registerPlan);
      if (!selectedPlan) throw new Error('Invalid plan');

      let amount: number;
      if (selectedPlan.plan === 'Enterprise') {
        // For Enterprise, show a message (or handle custom pricing)
        alert('Enterprise plan requires custom pricing. Please contact sales.');
        setLoading(false);
        return;
      }

      // Set amounts based on plan
      const price = isIndian ? selectedPlan.priceInr : selectedPlan.priceUsd;
      amount = price * 100; // Convert to smallest currency unit
      const currency = isIndian ? 'INR' : 'USD';

      // First create payment order
      const orderRes = await authAPI.createPaymentOrder(amount, currency);
      if (!orderRes.success || !orderRes.data) throw new Error('Failed to create payment order');
      const order = orderRes.data;

      // Initialize Razorpay
      const options = {
        key: order.key_id || '',
        amount: order.amount || 0,
        currency: order.currency || 'INR',
        name: 'Traxale HRM',
        description: `${selectedPlan.plan} Subscription`,
        order_id: order.id || '',
        prefill: {
          name: tempRegistrationData.name,
          email: tempRegistrationData.email,
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: any) => {
          try {
            // Verify payment and create user/organization in one call
            const verifyRes = await authAPI.verifyPaymentAndRegister({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              registrationData: tempRegistrationData,
              plan: registerPlan,
            });

            if (verifyRes.success && verifyRes.data?.user) {
              const user = verifyRes.data.user;
              if (user._id && !user.id) user.id = user._id;
              if (user.id && !user._id) user._id = user.id;
              alert('Payment successful! Your account is now active! 🎉');
              login(user);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed! Please contact support.');
          } finally {
            setLoading(false);
          }
        },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed! Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: '#3B82F6' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: '#F97316' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04] blur-[120px]" style={{ background: 'linear-gradient(135deg, #3B82F6, #F97316)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
          <button 
            onClick={() => step === 1 ? setCurrentPage('landing') : setStep(1)} 
            className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors hover:text-electric" 
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} /> {step === 1 ? 'Back to home' : 'Back to form'}
          </button>

          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{mode === 'free-trial' ? 'Start Free Trial' : 'Sign Up'}</h3>
                <p className="text-xs" style={{ color: '#3B82F6' }}>{mode === 'free-trial' ? 'Create your admin account' : 'Create your admin account'}</p>
              </div>
            </div>

            {/* Step Indicator - only show for paid mode */}
            {mode === 'paid' && (
              <div className="flex items-center gap-2 mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 1 ? 'text-white' : step > 1 ? 'text-white' : ''}`} style={step >=1 ? { background: 'linear-gradient(135deg, #3B82F6, #2563EB)' } : { background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  {step > 1 ? <CheckCircle2 size={14} /> : 1}
                </div>
                <div className="flex-1 h-1 rounded" style={step >1 ? { background: 'linear-gradient(90deg, #3B82F6, #2563EB)' } : { background: 'var(--border-color)' }} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 2 ? 'text-white' : ''}`} style={step >=2 ? { background: 'linear-gradient(135deg, #3B82F6, #2563EB)' } : { background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  2
                </div>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{mode === 'free-trial' ? 'Start Your Free Trial' : 'Create Admin Account'}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{mode === 'free-trial' ? 'Fill in your details' : 'Fill in your details'}</p>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Organization Name</label>
                  <input 
                    type="text" 
                    value={formData.organizationName} 
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    placeholder="+91 00000 00000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> Office Address</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 resize-none"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="4th Floor, Office No. 401 Shree Ram Commercial Park Shardhapuri Phase 2, Kankar Khera. Meerut UP 250002"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      required 
                      className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 pr-12" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                      placeholder="••••••••"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1" 
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.confirmPassword} 
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                      required 
                      className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 pr-12" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50" 
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                  {loading ? 'Loading...' : (
                    <span className="flex items-center justify-center gap-2">
                      {mode === 'free-trial' ? 'Start Free Trial' : 'Next'} 
                      {mode === 'paid' && <ArrowRight size={16} />}
                    </span>
                  )}
                </button>
                <div className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <button onClick={() => setCurrentPage('login')} style={{ color: '#3B82F6' }} className="font-semibold hover:underline">
                    Sign In
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Choose Your Plan</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Select the perfect plan for your team</p>

                {pricingLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p style={{ color: 'var(--text-muted)' }}>Loading plans...</p>
                  </div>
                ) : (
                  <>
                    {/* Plan Selection */}
                    <div className="space-y-3 mb-6">
                      {plans.map((plan) => {
                        const price = isIndian ? plan.priceInr : plan.priceUsd;
                        const priceDisplay = plan.plan === 'Enterprise' ? 'Custom' : `${currencySymbol}${price}`;
                        const selected = registerPlan === plan.plan;
                        
                        return (
                          <button 
                            key={plan.plan} 
                            onClick={() => setRegisterPlan(plan.plan as any)} 
                            className={`w-full text-left p-4 rounded-2xl transition-all hover:scale-[1.01] border-2 ${selected ? 'border-blue-500' : 'border-transparent'}`} 
                            style={{ background: 'var(--bg-glass)', borderColor: selected ? '#3B82F6' : 'var(--border-color)' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{plan.plan} Plan</h4>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {plan.features.length} features
                                </p>
                              </div>
                              <div className="text-right">
                                {priceDisplay !== 'Custom' ? (
                                  <>
                                    <p className="text-2xl font-black gradient-text">{priceDisplay}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/user/mo</p>
                                  </>
                                ) : (
                                  <p className="text-lg font-bold gradient-text">Custom</p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {plan.features.slice(0, 3).map((f, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  <CheckCircle2 size={12} style={{ color: '#10B981' }} /> {f}
                                </div>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Plan Details */}
                    {(() => {
                      const selectedPlan = plans.find(p => p.plan === registerPlan);
                      if (!selectedPlan) return null;
                      
                      const price = isIndian ? selectedPlan.priceInr : selectedPlan.priceUsd;
                      const priceDisplay = selectedPlan.plan === 'Enterprise' ? 'Custom' : `${currencySymbol}${price}`;
                      
                      return (
                        <div className="p-5 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedPlan.plan} Plan</h4>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full access to all features</p>
                            </div>
                            {priceDisplay !== 'Custom' && (
                              <div className="text-right">
                                <p className="text-3xl font-black gradient-text">{priceDisplay}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/user/mo</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {selectedPlan.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><CheckCircle2 size={14} style={{ color: '#10B981' }} />{f}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                <button 
                  onClick={handlePayment} 
                  disabled={loading} 
                  className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50" 
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                  {loading ? 'Processing...' : <span className="flex items-center justify-center gap-2"><CreditCard size={16} /> Pay Now</span>}
                </button>
                <div className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                  Secure payment powered by Razorpay
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
