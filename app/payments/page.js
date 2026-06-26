'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function PaymentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await api.get('/api/booking/doctor/1');
      setAppointments(res.data.filter(a => a.paymentStatus === 'PAID' || a.amount > 0));
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const totalRevenue = appointments.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">💰 Payments & Revenue</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{totalRevenue}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{appointments.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">Avg per Patient</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              ₹{appointments.length > 0 ? Math.round(totalRevenue / appointments.length) : 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h2>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading...</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{apt.user?.name || 'Patient'}</p>
                    <p className="text-sm text-gray-500">{apt.slot?.date} • {apt.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{apt.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      apt.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      apt.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'}`}>
                      {apt.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}