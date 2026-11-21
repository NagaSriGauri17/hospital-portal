'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

export default function AppointmentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
      const hospitalId = localStorage.getItem('hospitalId');
if (!hospitalId) { setLoading(false); return; }
const res = await api.get(`/api/hospital/${hospitalId}/appointments/today`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
    setLoading(false);
  };

  const markCompleted = async (id) => {
    try {
      await api.put(`/api/booking/${id}/reschedule`, { status: 'COMPLETED' });
      setMessage(t('appointments.msg.completed'));
      loadAppointments();
    } catch (err) {
      // Try direct status update
      setMessage(t('appointments.msg.statusAttempted'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const cancelAppointment = async (id) => {
    try {
      await api.post(`/api/booking/${id}/cancel`);
      setMessage(t('appointments.msg.cancelled'));
      loadAppointments();
    } catch (err) {
      setMessage(t('appointments.msg.cancelFailed'));
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

  const statusLabels = {
    CONFIRMED: t('appointments.status.CONFIRMED'),
    COMPLETED: t('appointments.status.COMPLETED'),
    CANCELLED: t('appointments.status.CANCELLED'),
    CHECKED_IN: t('appointments.status.CHECKED_IN'),
    PENDING_PAYMENT: t('appointments.status.PENDING_PAYMENT'),
    BOOKED: t('appointments.status.BOOKED'),
    PENDING: t('appointments.status.PENDING'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">{t('appointments.back')}</Link>
          <h1 className="text-xl font-bold text-gray-800">{t('appointments.title')}</h1>
        </div>
        <span className="text-sm text-gray-500">{t('appointments.total', { count: appointments.length })}</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">{t('appointments.loading')}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t('appointments.empty')}</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {apt.user?.name || t('patient')}
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                        {statusLabels[apt.status] || apt.status}
                      </span>
                      {apt.type === 'WALK_IN' && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {t('appointments.walkIn')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">{t('appointments.date')}</span> {apt.slot?.date}
                      </div>
                      <div>
                        <span className="font-medium">{t('appointments.time')}</span> {apt.slot?.startTime} - {apt.slot?.endTime}
                      </div>
                      <div>
                        <span className="font-medium">{t('appointments.amount')}</span> ₹{apt.amount}
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-400 mt-2">{t('appointments.notes', { notes: apt.notes })}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => markCompleted(apt.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                      >
                        {t('appointments.markDone')}
                      </button>
                    )}
                    {(apt.status === 'CONFIRMED' || apt.status === 'PENDING_PAYMENT') && (
                      <button
                        onClick={() => cancelAppointment(apt.id)}
                        className="text-xs bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                      >
                        {t('appointments.cancel')}
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