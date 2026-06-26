'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState({
    currentToken: 0,
    waitingCount: 0,
    estimatedWaitMinutes: 0,
    waitingTokens: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await api.get('/api/queue/status/1');
      setQueue(res.data);
    } catch (err) {
      console.error('Queue load error:', err);
    }
    setLoading(false);
  };

  const handleNext = async () => {
    setActionLoading(true);
    try {
      await api.post('/api/queue/next/1');
      setMessage('✅ Queue advanced to next patient');
      loadQueue();
    } catch (err) {
      setMessage('❌ Failed to advance queue');
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSkip = async () => {
    setActionLoading(true);
    try {
      await api.post('/api/queue/skip/1');
      setMessage('⏭ Current token skipped');
      loadQueue();
    } catch (err) {
      setMessage('❌ Failed to skip token');
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCheckin = async (appointmentId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/api/queue/checkin/${appointmentId}`);
      setMessage(`✅ Token ${res.data.tokenNumber} assigned to patient`);
      loadQueue();
    } catch (err) {
      setMessage('❌ Check-in failed: ' + (err.response?.data?.message || 'Error'));
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
          <h1 className="text-xl font-bold text-gray-800">🎫 Queue Management</h1>
        </div>
        <span className="text-sm text-gray-500">Dr. Rajesh Kumar — Apollo Hospital</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Live queue status */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center border-2 border-green-200">
            <p className="text-gray-500 text-sm mb-1">Current Token</p>
            <p className="text-5xl font-bold text-green-600">{queue.currentToken}</p>
            <p className="text-xs text-gray-400 mt-2">Being seen now</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center border-2 border-orange-200">
            <p className="text-gray-500 text-sm mb-1">Waiting</p>
            <p className="text-5xl font-bold text-orange-600">{queue.waitingCount}</p>
            <p className="text-xs text-gray-400 mt-2">Patients in queue</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center border-2 border-blue-200">
            <p className="text-gray-500 text-sm mb-1">Est. Wait</p>
            <p className="text-5xl font-bold text-blue-600">{queue.estimatedWaitMinutes}</p>
            <p className="text-xs text-gray-400 mt-2">Minutes</p>
          </div>
        </div>

        {/* Queue controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Queue Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={handleNext}
              disabled={actionLoading}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✅ Next Patient
            </button>
            <button
              onClick={handleSkip}
              disabled={actionLoading}
              className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 disabled:opacity-50"
            >
              ⏭ Skip Current
            </button>
          </div>
        </div>

        {/* Waiting tokens list */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Waiting Queue</h2>
          {queue.waitingTokens && queue.waitingTokens.length > 0 ? (
            <div className="space-y-2">
              {queue.waitingTokens.map((token, index) => (
                <div key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                      {token}
                    </span>
                    <span className="text-gray-600">Token #{token}</span>
                  </div>
                  <span className="text-sm text-gray-400">~{index * 15} min wait</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">No patients currently waiting</p>
          )}
        </div>

        {/* Check-in section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Check-in Patient</h2>
          <CheckinForm onCheckin={handleCheckin} loading={actionLoading} />
        </div>

      </div>
    </div>
  );
}

function CheckinForm({ onCheckin, loading }) {
  const [appointmentId, setAppointmentId] = useState('');

  return (
    <div className="flex gap-3">
      <input
        type="number"
        value={appointmentId}
        onChange={(e) => setAppointmentId(e.target.value)}
        placeholder="Enter Appointment ID"
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => { onCheckin(appointmentId); setAppointmentId(''); }}
        disabled={loading || !appointmentId}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        Check In
      </button>
    </div>
  );
}