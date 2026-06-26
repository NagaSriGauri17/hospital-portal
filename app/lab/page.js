'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function LabPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const res = await api.get('/api/lab/tests');
      setTests(res.data);
    } catch (err) {
      console.error('Error loading lab tests:', err);
    }
    setLoading(false);
  };

  const searchBookings = async () => {
    if (!searchId) return;
    try {
      const res = await api.get(`/api/lab/patient/${searchId}`);
      setBookings(res.data);
    } catch (err) {
      setBookings([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🧪 Lab Tests</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Tests</h2>
            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="space-y-3">
                {tests.map((test, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{test.testName}</p>
                      <p className="text-xs text-gray-500">{test.centerName} • {test.reportTat}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₹{test.price}</p>
                      {test.homeCollectionAvailable && (
                        <p className="text-xs text-green-600">🏠 Home collection</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Test Bookings</h2>
            <div className="flex gap-2 mb-4">
              <input type="number" value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter patient ID"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={searchBookings}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Search
              </button>
            </div>
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Enter patient ID to view bookings</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{booking.testName}</p>
                    <p className="text-sm text-gray-500">{booking.centerName}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{booking.status}</span>
                      <span className="text-sm font-medium text-gray-700">₹{booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}