'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function SchedulePage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDays, setSelectedDays] = useState({
    MONDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    TUESDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    WEDNESDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    THURSDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    FRIDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    SATURDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const hospitalId = localStorage.getItem('hospitalId');
    if (!hospitalId) return;
    try {
      const res = await api.get(`/api/hospital/${hospitalId}/doctors`);
      setDoctors(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedDoctorId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateDay = (day, field, value) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const saveSchedule = async () => {
    if (!selectedDoctorId) {
      setMessage('❌ Please select a doctor');
      return;
    }

    const days = Object.entries(selectedDays).filter(([_, v]) => v.enabled);

    if (days.length === 0) {
      setMessage('❌ Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      // Backend expects ONE day per call — loop through each selected day
      for (const [day, config] of days) {
        await api.post('/api/schedule/set', {
          doctorId: parseInt(selectedDoctorId),
          dayOfWeek: day,
          startTime: config.start,
          endTime: config.end,
          slotDurationMinutes: config.slotMinutes
        });
      }

      // Then regenerate slots once, for the whole schedule
      await api.post(`/api/schedule/regenerate/${selectedDoctorId}`);

      setMessage('✅ Schedule saved and slots regenerated for 30 days!');
    } catch (err) {
      console.error('Schedule save error:', err);
      setMessage('❌ Failed to save schedule: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🗓 Doctor Schedule</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {doctors.length === 0 ? (
              <option value="">No doctors found</option>
            ) : (
              doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.specialty ? `— ${d.specialty.name}` : ''}
                </option>
              ))
            )}
          </select>

          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {selectedDoctor ? `${selectedDoctor.name} — Weekly Schedule` : 'Weekly Schedule'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">Select working days and hours. Slots are auto-generated for 30 days.</p>

          <div className="space-y-4">
            {Object.entries(selectedDays).map(([day, config]) => (
              <div key={day} className={`border rounded-xl p-4 transition-colors ${
                config.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={config.enabled}
                    onChange={() => toggleDay(day)}
                    className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800 w-28">{day}</span>

                  {config.enabled && (
                    <div className="flex gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Start:</label>
                        <input type="time" value={config.start}
                          onChange={(e) => updateDay(day, 'start', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">End:</label>
                        <input type="time" value={config.end}
                          onChange={(e) => updateDay(day, 'end', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Slot:</label>
                        <select value={config.slotMinutes}
                          onChange={(e) => updateDay(day, 'slotMinutes', parseInt(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm">
                          <option value={10}>10 min</option>
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={saveSchedule} disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving & generating slots...' : '💾 Save Schedule & Generate Slots'}
          </button>
        </div>
      </div>
    </div>
  );
}