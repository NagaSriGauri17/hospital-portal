'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    fee: '',
    experience: '',
    hospitalId: '1',
    specialtyId: '1'
  });
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadDoctors();
    loadSpecialties();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await api.get('/api/doctor/hospital/1');
      setDoctors(res.data);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
    setLoading(false);
  };

  const loadSpecialties = async () => {
    try {
      const res = await api.get('/api/specialty/all');
      setSpecialties(res.data);
    } catch (err) {
      console.error('Error loading specialties:', err);
    }
  };

  const handleAddDoctor = async () => {
    if (!form.name || !form.phone || !form.fee || !form.experience) {
      setMessage('❌ Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/doctor/add', {
        name: form.name,
        phone: form.phone,
        email: form.email,
        fee: parseFloat(form.fee),
        experience: form.experience,
        hospitalId: parseInt(form.hospitalId),
        specialtyId: parseInt(form.specialtyId)
      });
      setMessage('✅ Doctor added successfully!');
      setShowForm(false);
      setForm({ name: '', phone: '', email: '', fee: '', experience: '', hospitalId: '1', specialtyId: '1' });
      loadDoctors();
    } catch (err) {
      setMessage('❌ Failed to add doctor: ' + (err.response?.data?.message || 'Error'));
    }
    setSubmitting(false);
    setTimeout(() => setMessage(''), 4000);
  };

  const specialtyColors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-800">👨‍⚕️ Doctors</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{doctors.length} doctors</span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {showForm ? '✕ Cancel' : '+ Add Doctor'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            message.includes('✅')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Add Doctor Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Add New Doctor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. Ravi Kumar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@hospital.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                <input
                  type="number"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience *</label>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="8 years"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                <select
                  value={form.specialtyId}
                  onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {specialties.length === 0 ? (
                    <option value="1">Specialty ID 1</option>
                  ) : (
                    specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleAddDoctor}
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Doctor'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Doctors List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">👨‍⚕️</p>
            <p className="text-gray-500 font-medium">No doctors added yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "+ Add Doctor" to add your first doctor</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {doctors.map((doctor, idx) => (
              <div key={doctor.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {doctor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base">{doctor.name}</h3>
                    {doctor.specialty && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${
                        specialtyColors[idx % specialtyColors.length]
                      }`}>
                        {doctor.specialty.name}
                      </span>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>📞</span>
                        <span className="truncate">{doctor.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏥</span>
                        <span>{doctor.experience || 'N/A'} exp</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>💰</span>
                        <span className="font-semibold text-gray-700">₹{doctor.consultationFee}</span>
                      </div>
                      {doctor.rating && (
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>{doctor.rating}/5</span>
                        </div>
                      )}
                    </div>
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