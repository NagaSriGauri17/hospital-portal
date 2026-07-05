'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function WalkinPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    slotId: '',
    doctorId: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [booked, setBooked] = useState(null);

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
        const firstDoctorId = res.data[0].id.toString();
        setForm(f => ({ ...f, doctorId: firstDoctorId }));
        loadSlots(firstDoctorId);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadSlots = async (doctorId) => {
    if (!doctorId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/schedule/doctor/${doctorId}/slots?date=${today}`);
      setSlots(res.data || []);
    } catch (err) {
      console.error('Error loading slots:', err);
      setSlots([]);
    }
  };

  const handleDoctorChange = (doctorId) => {
    setForm({ ...form, doctorId, slotId: '' });
    loadSlots(doctorId);
  };

  const handleSubmit = async () => {
    if (!form.patientName || !form.patientPhone || !form.slotId || !form.doctorId) {
      setMessage('❌ Please fill all fields and select an available slot');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/queue/walkin', {
        doctorId: parseInt(form.doctorId),
        slotId: parseInt(form.slotId),
        patientName: form.patientName,
        patientPhone: form.patientPhone
      });
      setBooked(res.data);
      setMessage('✅ Walk-in booking created successfully!');
      setForm({ ...form, patientName: '', patientPhone: '', slotId: '' });
      loadSlots(form.doctorId);
    } catch (err) {
      setMessage('❌ Booking failed: ' + (err.response?.data?.message || 'Slot may not be available'));
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🚶 Walk-in Booking</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        {booked && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Booking Confirmed</h3>
            <p className="text-blue-700">Patient: <strong>{booked.user?.name}</strong></p>
            <p className="text-blue-700">Slot: <strong>{booked.slot?.date} at {booked.slot?.startTime}</strong></p>
            <p className="text-blue-700">Appointment ID: <strong>#{booked.id}</strong></p>
            <p className="text-sm text-blue-500 mt-2">Use this ID to check-in the patient in Queue Management</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Patient Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
              <select
                value={form.doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
              <input
                type="text"
                value={form.patientName}
                onChange={(e) => setForm({...form, patientName: e.target.value})}
                placeholder="Enter patient full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={form.patientPhone}
                onChange={(e) => setForm({...form, patientPhone: e.target.value})}
                placeholder="10-digit mobile number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Today's Slots ({slots.filter(s => s.status === 'AVAILABLE').length} available)
              </label>
              <div className="flex gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded inline-block"></span> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-400 rounded inline-block"></span> Booked</span>
              </div>
              {slots.length === 0 ? (
                <p className="text-gray-400 text-sm py-3">No slots found for this doctor today</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isAvailable = slot.status === 'AVAILABLE';
                    const isSelected = form.slotId === slot.id.toString();
                    return (
                      <button
                        key={slot.id}
                        disabled={!isAvailable}
                        onClick={() => isAvailable && setForm({...form, slotId: slot.id.toString()})}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isAvailable
                              ? 'bg-green-50 text-green-700 border-green-300 hover:border-green-500'
                              : 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating booking...' : 'Create Walk-in Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}