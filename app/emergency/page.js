'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function EmergencyPage() {
  const router = useRouter();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadBeds();
  }, []);

  const loadBeds = async () => {
    try {
      const res = await api.get('/api/emergency/beds');
      setBeds(res.data);
    } catch (err) {
      console.error('Error loading beds:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🚨 Emergency & ICU Beds</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {beds.map((hospital, idx) => (
              <div key={idx} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                hospital.icuBedsAvailable > 0 ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{hospital.hospitalName}</h3>
                    <p className="text-sm text-gray-500">{hospital.city}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    hospital.emergencyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {hospital.emergencyOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${
                      hospital.icuBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hospital.icuBedsAvailable}
                    </p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-400">{hospital.icuBedsTotal}</p>
                    <p className="text-xs text-gray-500">Total ICU</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">{hospital.emergencyContact}</p>
                    <p className="text-xs text-gray-500">Emergency</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}