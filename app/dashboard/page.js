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
    waitingCount: 0,
    completedCount: 0
  });
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [board, setBoard] = useState({ inProgress: [], waiting: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);

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
      const [apptRes, queueRes, doctorsRes] = await Promise.all([
        api.get(`/api/hospital/${hospitalId}/appointments/today`),
        api.get(`/api/hospital/${hospitalId}/queue/summary`),
        api.get(`/api/hospital/${hospitalId}/doctors`)
      ]);
      setStats({
        todayAppointments: apptRes.data.length,
        currentToken: queueRes.data.currentToken,
        waitingCount: queueRes.data.waitingCount,
        completedCount: queueRes.data.completedCount || 0
      });
      setDoctors(doctorsRes.data || []);
      if (doctorsRes.data && doctorsRes.data.length > 0) {
        const firstId = doctorsRes.data[0].id.toString();
        setSelectedDoctorId(firstId);
        loadBoard(firstId);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  };

  const loadBoard = async (doctorId) => {
    if (!doctorId) return;
    setBoardLoading(true);
    try {
      const res = await api.get(`/api/queue/board/${doctorId}`);
      setBoard(res.data);
    } catch (err) {
      console.error('Queue board error:', err);
      setBoard({ inProgress: [], waiting: [], completed: [] });
    }
    setBoardLoading(false);
  };

  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctorId(doctorId);
    loadBoard(doctorId);
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
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🏥 Hospital Portal</h1>
        <div className="flex gap-4 items-center">
          <button onClick={logout} className="text-red-500 text-sm hover:text-red-700">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Today's Appointments</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.todayAppointments}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Current Token (all doctors)</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.currentToken}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">Waiting Patients (all doctors)</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.waitingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Completed Today (all doctors)</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.completedCount}</p>
          </div>
        </div>

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

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Live Queue</h2>
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorSelect(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {doctors.length === 0 ? (
                <option value="">No doctors found</option>
              ) : (
                doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              )}
            </select>
          </div>

          {boardLoading ? (
            <p className="text-gray-400 text-center py-8">Loading queue...</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {/* In Progress */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">In Progress</h3>
                  <span className="text-xs text-gray-400">({board.inProgress.length})</span>
                </div>
                <div className="space-y-2">
                  {board.inProgress.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-6 bg-gray-50 rounded-lg">No one currently in progress</p>
                  ) : (
                    board.inProgress.map((p, i) => (
                      <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-gray-800 text-sm">Token #{p.tokenNumber}</p>
                        <p className="text-xs text-gray-600">{p.patientName || 'Patient'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Next / Waiting */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Next / Waiting</h3>
                  <span className="text-xs text-gray-400">({board.waiting.length})</span>
                </div>
                <div className="space-y-2">
                  {board.waiting.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-6 bg-gray-50 rounded-lg">No one waiting</p>
                  ) : (
                    board.waiting.map((p, i) => (
                      <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-gray-800 text-sm">Token #{p.tokenNumber}</p>
                        <p className="text-xs text-gray-600">{p.patientName || 'Patient'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Completed */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Completed</h3>
                  <span className="text-xs text-gray-400">({board.completed.length})</span>
                </div>
                <div className="space-y-2">
                  {board.completed.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-6 bg-gray-50 rounded-lg">No one checked out yet</p>
                  ) : (
                    board.completed.map((p, i) => (
                      <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-gray-800 text-sm">Token #{p.tokenNumber}</p>
                        <p className="text-xs text-gray-600">{p.patientName || 'Patient'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}