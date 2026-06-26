'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/api/booking/doctor/1');
      setAppointments(res.data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
    setLoading(false);
  };

  const markCompleted = async (id) => {
    try {
      await api.put(`/api/booking/${id}/reschedule`, { status: 'COMPLETED' });
      setMessage('✅ Marked as completed');
      loadAppointments();
    } catch (err) {
      // Try direct status update
      setMessage('Status update attempted');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const cancelAppointment = async (id) => {
    try {
      await api.post(`/api/booking/${id}/cancel`);
      setMessage('✅ Appointment cancelled');
      loadAppointments();
    } catch (err) {
      setMessage('❌ Cancel failed');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-700';
      case 'PENDING_PAYMENT': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
          <h1 className="text-xl font-bold text-gray-800">📅 Appointments</h1>
        </div>
        <span className="text-sm text-gray-500">{appointments.length} total</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No appointments found</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {apt.user?.name || 'Patient'}
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                      {apt.type === 'WALK_IN' && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Date:</span> {apt.slot?.date}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {apt.slot?.startTime} - {apt.slot?.endTime}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹{apt.amount}
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-400 mt-2">Notes: {apt.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => markCompleted(apt.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Mark Done
                      </button>
                    )}
                    {(apt.status === 'CONFIRMED' || apt.status === 'PENDING_PAYMENT') && (
                      <button
                        onClick={() => cancelAppointment(apt.id)}
                        className="text-xs bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    )}
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