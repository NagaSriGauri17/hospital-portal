'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const hospitalId = localStorage.getItem('hospitalId');
    if (!hospitalId) { setLoading(false); return; }
    try {
      const res = await api.get(`/api/review/hospital/${hospitalId}/list`);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
    setLoading(false);
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/api/review/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">⭐ Hospital Reviews</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            No reviews for this hospital yet
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{r.patientName}</p>
                    <p className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                      className="text-gray-400 hover:text-gray-600 px-2 text-xl"
                    >
                      ⋮
                    </button>
                    {openMenuId === r.id && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="text-red-600 text-sm px-4 py-2 hover:bg-red-50 rounded-lg whitespace-nowrap"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">{r.createdAt?.split('T')[0]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}