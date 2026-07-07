'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function QueuePage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queue, setQueue] = useState({
    currentToken: 0,
    waitingCount: 0,
    estimatedWaitMinutes: 0,
    waitingTokens: []
  });
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [allDoctorsSummary, setAllDoctorsSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkinLoadingId, setCheckinLoadingId] = useState(null);
  const [message, setMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    initLoad();
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (selectedDoctorId) {
        loadSingleDoctorQueue(selectedDoctorId);
      } else {
        loadAllDoctorsSummary(doctors);
      }
    }, 8000);
    return () => clearInterval(intervalRef.current);
  }, [selectedDoctorId, doctors]);

  const initLoad = async () => {
    const hospitalId = localStorage.getItem('hospitalId');
    if (!hospitalId) { setLoading(false); return; }
    try {
      const res = await api.get(`/api/hospital/${hospitalId}/doctors`);
      const docs = res.data || [];
      setDoctors(docs);
      await loadAllDoctorsSummary(docs);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
    setLoading(false);
  };

  const loadAllDoctorsSummary = async (docs) => {
    if (!docs || docs.length === 0) {
      setAllDoctorsSummary([]);
      return;
    }
    try {
      const results = await Promise.all(
        docs.map(async (d) => {
          try {
            const res = await api.get(`/api/queue/status/${d.id}`);
            return {
              doctorId: d.id,
              doctorName: d.name,
              specialty: d.specialty?.name || '',
              currentToken: res.data.currentToken || 0,
              waitingCount: res.data.waitingCount || 0,
              estimatedWaitMinutes: res.data.estimatedWaitMinutes || 0
            };
          } catch (err) {
            return {
              doctorId: d.id,
              doctorName: d.name,
              specialty: d.specialty?.name || '',
              currentToken: 0,
              waitingCount: 0,
              estimatedWaitMinutes: 0
            };
          }
        })
      );
      setAllDoctorsSummary(results);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading all-doctors summary:', err);
    }
  };

  const loadSingleDoctorQueue = async (doctorId) => {
    try {
      const [statusRes, pendingRes, boardRes] = await Promise.all([
        api.get(`/api/queue/status/${doctorId}`),
        api.get(`/api/queue/pending-checkins/${doctorId}`),
        api.get(`/api/queue/board/${doctorId}`)
      ]);
      setQueue(statusRes.data);
      setPendingCheckins(pendingRes.data || []);
      setCompletedList((boardRes.data && boardRes.data.completed) || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Queue load error:', err);
    }
  };

  const handleDoctorSelect = async (doctorId) => {
    setSelectedDoctorId(doctorId);
    setMessage('');
    setLoading(true);
    if (doctorId) {
      await loadSingleDoctorQueue(doctorId);
    } else {
      await loadAllDoctorsSummary(doctors);
    }
    setLoading(false);
  };

  const handleNext = async () => {
    if (!selectedDoctorId) return;
    setActionLoading(true);
    try {
      await api.post(`/api/queue/next/${selectedDoctorId}`);
      setMessage('✅ Queue advanced to next patient');
      loadSingleDoctorQueue(selectedDoctorId);
    } catch (err) {
      setMessage('❌ Failed to advance queue');
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSkip = async () => {
    if (!selectedDoctorId) return;
    setActionLoading(true);
    try {
      await api.post(`/api/queue/skip/${selectedDoctorId}`);
      setMessage('⏭ Current token skipped');
      loadSingleDoctorQueue(selectedDoctorId);
    } catch (err) {
      setMessage('❌ Failed to skip token');
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCheckin = async (appointmentId) => {
    setCheckinLoadingId(appointmentId);
    try {
      const res = await api.post(`/api/queue/checkin/${appointmentId}`);
      setMessage(`✅ Token ${res.data.tokenNumber} assigned to patient`);
      loadSingleDoctorQueue(selectedDoctorId);
    } catch (err) {
      setMessage('❌ Check-in failed: ' + (err.response?.data?.message || 'Error'));
    }
    setCheckinLoadingId(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const manualRefresh = () => {
    if (selectedDoctorId) {
      loadSingleDoctorQueue(selectedDoctorId);
    } else {
      loadAllDoctorsSummary(doctors);
    }
  };

  const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
          <h1 className="text-xl font-bold text-gray-800">🎫 Queue Management</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={manualRefresh}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Viewing:</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorSelect(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">🏥 All Doctors (Hospital Overview)</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                👨‍⚕️ {d.name} {d.specialty ? `— ${d.specialty.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading queue data...</div>
        ) : !selectedDoctorId ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">All Doctors — Queue Overview</h2>
              <span className="text-sm text-gray-400">{doctors.length} doctors</span>
            </div>

            {allDoctorsSummary.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No doctors found for this hospital</p>
            ) : (
              <div className="space-y-2">
                {allDoctorsSummary.map((d) => (
                  <button
                    key={d.doctorId}
                    onClick={() => handleDoctorSelect(d.doctorId.toString())}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left border border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {d.doctorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{d.doctorName}</p>
                        {d.specialty && <p className="text-xs text-gray-500">{d.specialty}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Current</p>
                        <p className="font-bold text-green-600">{d.currentToken}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Waiting</p>
                        <p className={`font-bold ${d.waitingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {d.waitingCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Est. Wait</p>
                        <p className="font-bold text-blue-600">{d.estimatedWaitMinutes}m</p>
                      </div>
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedDoctor?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedDoctor?.name}</p>
                  <p className="text-xs text-gray-500">{selectedDoctor?.specialty?.name}</p>
                </div>
              </div>
              <button
                onClick={() => handleDoctorSelect('')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← All Doctors
              </button>
            </div>

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

            {/* Pending check-ins — replaces the old manual ID entry box */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Today's Bookings — Awaiting Check-in</h2>
              <p className="text-sm text-gray-500 mb-4">Patients booked for today who haven't been checked in yet</p>
              {pendingCheckins.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No pending check-ins for today</p>
              ) : (
                <div className="space-y-2">
                  {pendingCheckins.map((p) => (
                    <div key={p.appointmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                          {p.patientName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{p.patientName}</p>
                          <p className="text-xs text-gray-500">ID #{p.appointmentId} • {p.patientPhone || 'no phone'} • {p.slotTime}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckin(p.appointmentId)}
                        disabled={checkinLoadingId === p.appointmentId}
                        className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                      >
                        {checkinLoadingId === p.appointmentId ? 'Checking in...' : '✓ Check In'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed today */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Completed Today</h2>
              <p className="text-sm text-gray-500 mb-4">Patients already checked out</p>
              {completedList.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No patients completed yet today</p>
              ) : (
                <div className="space-y-2">
                  {completedList.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                        {p.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.patientName || 'Patient'}</p>
                        <p className="text-xs text-gray-500">ID #{p.appointmentId} • {p.patientPhone || 'no phone'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}