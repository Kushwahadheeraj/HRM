import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { reviewsAPI } from '../lib/api';
import { Star } from 'lucide-react';
import { Review } from '../lib/types';

export default function SubmitReview() {
  const { currentUser } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchMyReview = async () => {
      try {
        const res = await reviewsAPI.getMyReview();
        if (res.success && res.data) {
          setExistingReview(res.data);
          setRating(res.data.rating);
          setComment(res.data.comment);
        }
      } catch (err) {
        console.error('Failed to fetch review:', err);
      }
    };

    fetchMyReview();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      alert('Please provide both rating and comment');
      return;
    }

    setLoading(true);
    try {
      await reviewsAPI.submit({ rating, comment });
      alert('Review submitted successfully! It will be reviewed by the admin.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Submit Your Review
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Share your experience with Traxale HRM
        </p>

        {existingReview ? (
          <div className="p-6 rounded-xl mb-6" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Your Review:</span>
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: existingReview.isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: existingReview.isApproved ? '#10B981' : '#F97316' }}>
                {existingReview.isApproved ? 'Approved' : 'Pending Review'}
              </span>
            </div>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={20} 
                  fill={star <= existingReview.rating ? '#F59E0B' : 'none'} 
                  style={{ color: '#F59E0B' }} 
                />
              ))}
            </div>
            <p style={{ color: 'var(--text-primary)' }}>{existingReview.comment}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Rating
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      size={32} 
                      fill={star <= rating ? '#F59E0B' : 'none'} 
                      style={{ color: '#F59E0B' }} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about Traxale HRM..."
                className="w-full h-40 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
