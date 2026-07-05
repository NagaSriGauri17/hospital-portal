'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

export default function DoctorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadDoctor();
  }, []);

  const loadDoctor = async () => {
    try {
      const res = await api.get(`/api/doctor/${params.id}/profile`);
      setDoctor(res.data);
    } catch (err) {
      console.error('Error loading doctor profile:', err);
      setError('Could not load doctor profile. This endpoint may need to be checked.');
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/doctors" className="text-blue-600 hover:text-blue-800">← Back to Doctors</Link>
        <h1 className="text-xl font-bold text-gray-800">Doctor Profile</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {doctor && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-3xl">
                {doctor.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{doctor.name}</h2>
                {doctor.specialty && (
                  <p className="text-blue-600 font-medium">{doctor.specialty.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{doctor.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{doctor.email || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Experience</p>
                <p className="font-medium text-gray-800">{doctor.experience || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Consultation Fee</p>
                <p className="font-medium text-gray-800">₹{doctor.consultationFee}</p>
              </div>
              {doctor.rating && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Rating</p>
                  <p className="font-medium text-gray-800">⭐ {doctor.rating}/5</p>
                </div>
              )}
              {doctor.hospital && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Hospital</p>
                  <p className="font-medium text-gray-800">{doctor.hospital.name}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href={`/schedule?doctorId=${doctor.id}`}
                className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                🗓 Manage Schedule
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}