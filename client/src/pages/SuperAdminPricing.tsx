import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { authAPI } from '../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import { PricingPlan } from '../lib/types';

export default function SuperAdminPricing() {
  const { setCurrentPage } = useApp();
  const [pricing, setPricing] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch pricing from API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await authAPI.getPricing();
        if (res.success && res.data) {
          // Sort in fixed order: Basic → Pro → Enterprise
          const planOrder = ['Basic', 'Pro', 'Enterprise'];
          const sortedPricing = [...res.data].sort((a, b) => 
            planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan)
          );
          setPricing(sortedPricing);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  // Update a single plan
  const handleUpdatePlan = async (plan: any) => {
    setSaving(true);
    try {
      const res = await authAPI.updatePricing(plan);
      if (res.success) {
        // Refresh pricing
        const fetchRes = await authAPI.getPricing();
        if (fetchRes.success && fetchRes.data) {
          setPricing(fetchRes.data);
        }
        alert('Plan updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      alert('Failed to update plan! Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle input change
  const handleChange = (planKey: string, field: string, value: any) => {
    setPricing(prev => 
      prev.map(p => 
        p.plan === planKey ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setCurrentPage('super-admin-dashboard')} 
          className="p-2 rounded-xl transition-all hover:bg-blue-500/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Manage Pricing
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Update plan prices, features and employee limits
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {pricing.map((plan) => (
            <div key={plan.plan} className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plan.plan} Plan</h3>
              
              {/* Price in INR */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Price (INR)</label>
                <input 
                  type="number" 
                  value={plan.priceInr} 
                  onChange={(e) => handleChange(plan.plan, 'priceInr', Number(e.target.value))} 
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Price in USD */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Price (USD)</label>
                <input 
                  type="number" 
                  value={plan.priceUsd} 
                  onChange={(e) => handleChange(plan.plan, 'priceUsd', Number(e.target.value))} 
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Employee Limit */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Employee Limit (-1 = unlimited)</label>
                <input 
                  type="number" 
                  value={plan.employeeLimit} 
                  onChange={(e) => handleChange(plan.plan, 'employeeLimit', Number(e.target.value))} 
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Features (JSON string for simplicity) */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Features (comma-separated)</label>
                <textarea 
                  value={plan.features.join(', ')} 
                  onChange={(e) => handleChange(plan.plan, 'features', e.target.value.split(', '))} 
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" 
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', minHeight: '120px' }}
                />
              </div>

              {/* Save Button */}
              <button 
                onClick={() => handleUpdatePlan(plan)} 
                disabled={saving} 
                className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50" 
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
