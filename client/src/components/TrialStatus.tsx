import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { authAPI } from '../lib/api';
import { Zap, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { useCurrency } from '../lib/currency';

export default function TrialStatus() {
  const { currentUser, logout } = useApp();
  const { isIndian } = useCurrency();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchStatus = async () => {
      try {
        const res = await authAPI.getOrganizationStatus();
        if (res.success) {
          setStatus(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch organization status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [currentUser]);

  const handlePayment = async () => {
    if (processingPayment) return;
    setProcessingPayment(true);
    try {
      // Set fixed amounts: ₹799 INR or $9.99 USD per month
      const amount = isIndian ? 799 * 100 : 999; // Amount in smallest currency unit (paise/cents)
      const currency = isIndian ? 'INR' : 'USD';

      // Create payment order on backend
      const orderRes = await authAPI.createPaymentOrder(amount, currency);
      if (!orderRes.success) throw new Error('Failed to create payment order');

      const order = orderRes.data;
      if (!order) return;
      
      // Initialize Razorpay checkout
      const options = {
        key: order.key_id || '',
        amount: order.amount || 0,
        currency: order.currency || 'INR',
        name: 'Traxale HRM',
        description: 'Professional Plan Subscription',
        order_id: order.id || '',
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          contact: '',
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyRes = await authAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setStatus(verifyRes.data);
              alert('Payment successful! 🎉');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
      };

      // Check if Razorpay is available
      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!currentUser || !status || loading) return null;
  
  const isPaid = status.isPaid;
  const daysRemaining = status.daysRemaining;

  // If user is super admin, don't show trial status
  if (currentUser.role === 'super_admin') return null;

  if (isPaid) {
    return (
      <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={13} style={{ color: '#10B981' }} />
          <span className="text-[10px] font-bold" style={{ color: '#10B981' }}>Paid Plan Active</span>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Full access to all features</p>
      </div>
    );
  }

  if (daysRemaining === 0) {
    return (
      <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <XCircle size={13} style={{ color: '#EF4444' }} />
          <span className="text-[10px] font-bold" style={{ color: '#EF4444' }}>Trial Expired</span>
        </div>
        <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>Please upgrade to continue using the system</p>
        <button
          onClick={handlePayment}
          disabled={processingPayment}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
        >
          {processingPayment ? 'Processing...' : 'Upgrade Now'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Clock size={13} style={{ color: '#F97316' }} />
        <span className="text-[10px] font-bold" style={{ color: '#F97316' }}>Free Trial Active</span>
      </div>
      <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
      </p>
      <button
        onClick={handlePayment}
        disabled={processingPayment}
        className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
      >
        {processingPayment ? 'Processing...' : 'Upgrade Early'}
      </button>
    </div>
  );
}
