'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    currentToken: 0,
    waitingCount: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState('Hospital');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const hospitalId = localStorage.getItem('hospitalId');
    if (!token) {
      router.push('/');
      return;
    }
    if (!hospitalId) {
      console.error('No hospitalId found — this account may not be linked to a hospital.');
      setLoading(false);
      return;
    }
    loadDashboard(hospitalId);
  }, []);

  const loadDashboard = async (hospitalId) => {
    try {
      const [apptRes, queueRes] = await Promise.all([
        api.get(`/api/hospital/${hospitalId}/appointments/today`),
        api.get(`/api/hospital/${hospitalId}/queue/summary`)
      ]);
      setAppointments(apptRes.data.slice(0, 5));
      setStats({
        todayAppointments: apptRes.data.length,
        currentToken: queueRes.data.currentToken,
        waitingCount: queueRes.data.waitingCount
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('hospitalId');
    localStorage.removeItem('userName');
    router.push('/');
  };

  const navItems = [
    { label: 'Queue Management', icon: '🎫', href: '/queue', color: 'bg-green-50 border-green-200' },
    { label: 'Appointments', icon: '📅', href: '/appointments', color: 'bg-blue-50 border-blue-200' },
    { label: 'Walk-in Booking', icon: '🚶', href: '/walkin', color: 'bg-purple-50 border-purple-200' },
    { label: 'Upload Records', icon: '📁', href: '/records', color: 'bg-yellow-50 border-yellow-200' },
    { label: 'Schedule Setup', icon: '🗓', href: '/schedule', color: 'bg-indigo-50 border-indigo-200' },
    { label: 'Doctors', icon: '👨‍⚕️', href: '/doctors', color: 'bg-teal-50 border-teal-200' },
    { label: 'Lab Tests', icon: '🧪', href: '/lab', color: 'bg-red-50 border-red-200' },
    { label: 'Emergency', icon: '🚨', href: '/emergency', color: 'bg-orange-50 border-orange-200' },
    { label: 'Insurance', icon: '🛡', href: '/insurance', color: 'bg-pink-50 border-pink-200' },
    { label: 'Payments', icon: '💰', href: '/payments', color: 'bg-emerald-50 border-emerald-200' },
    { label: 'Reviews', icon: '⭐', href: '/reviews', color: 'bg-amber-50 border-amber-200' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🏥 Hospital Portal</h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-600 text-sm">{hospitalName}</span>
          <button onClick={logout} className="text-red-500 text-sm hover:text-red-700">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Today's Appointments</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.todayAppointments}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Current Token</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.currentToken}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">Waiting Patients</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.waitingCount}</p>
          </div>
        </div>

        {/* Nav grid — 11 coloured cards */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Access</h2>
          <div className="grid grid-cols-4 gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl p-4 border text-center hover:shadow-md transition-all hover:-translate-y-0.5 ${item.color}`}
              >
                <div className="text-2xl mb-1.5">{item.icon}</div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{item.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent appointments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{apt.user?.name || 'Patient'}</p>
                    <p className="text-sm text-gray-500">{apt.slot?.date} — {apt.slot?.startTime}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}