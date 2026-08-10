import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { reviewsAPI } from '../lib/api';
import { Review } from '../lib/types';
import { Star, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function SuperAdminReviews() {
  const { currentUser, setCurrentPage } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      setCurrentPage('dashboard');
      return;
    }
    fetchReviews();
  }, [currentUser, setCurrentPage]);

  const fetchReviews = async () => {
    try {
      const res = await reviewsAPI.getAll();
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string | undefined, isApproved: boolean) => {
    if (!reviewId) return;
    try {
      await reviewsAPI.updateStatus(reviewId, isApproved);
      fetchReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    }
  };

  const handleDelete = async (reviewId: string | undefined) => {
    if (!reviewId) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsAPI.delete(reviewId);
      fetchReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Manage Reviews
        </h1>
      </div>

      <div className="grid gap-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <p style={{ color: 'var(--text-muted)' }}>No reviews submitted yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {review.userName}
                    </h3>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>
                      {review.organizationName}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: review.isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: review.isApproved ? '#10B981' : '#F97316' }}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={16} 
                        fill={star <= review.rating ? '#F59E0B' : 'none'} 
                        style={{ color: '#F59E0B' }} 
                      />
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{review.comment}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, true)}
                      className="p-2 rounded-lg transition-all hover:bg-green-500/10"
                      style={{ color: '#10B981' }}
                      title="Approve"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, false)}
                      className="p-2 rounded-lg transition-all hover:bg-orange-500/10"
                      style={{ color: '#F97316' }}
                      title="Disapprove"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 rounded-lg transition-all hover:bg-red-500/10"
                    style={{ color: '#EF4444' }}
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
