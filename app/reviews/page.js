'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function ReviewsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const res = await api.get('/api/review/doctor/1');
      setData(res.data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
    setLoading(false);
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">⭐ Reviews & Ratings</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading reviews...</div>
        ) : !data ? (
          <div className="text-center py-20 text-gray-400">No review data</div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
              <p className="text-6xl font-bold text-yellow-500">{data.averageRating}</p>
              <p className="text-2xl text-yellow-400 mt-2">{renderStars(Math.round(data.averageRating))}</p>
              <p className="text-gray-500 mt-2">{data.totalReviews} reviews for Dr. Rajesh Kumar</p>
            </div>

            <div className="space-y-4">
              {data.reviews?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                  No reviews yet
                </div>
              ) : (
                data.reviews?.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-yellow-400 text-xl">{renderStars(review.rating)}</p>
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      </div>
                      <p className="text-xs text-gray-400">{review.createdAt?.split('T')[0]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}