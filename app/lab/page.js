'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function LabPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const searchTimer = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const res = await api.get('/api/lab/tests');
      setTests(res.data);
    } catch (err) {
      console.error('Error loading lab tests:', err);
    }
    setLoading(false);
  };

  const handlePatientQueryChange = (value) => {
    setPatientQuery(value);
    setSelectedPatientId('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      setPatientResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/patient/search?query=${encodeURIComponent(value)}`);
        setPatientResults(res.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
  };

  const selectPatient = async (patient) => {
    setSelectedPatientId(patient.id.toString());
    setPatientQuery(`${patient.name} (${patient.phone || patient.email})`);
    setShowDropdown(false);
    try {
      const res = await api.get(`/api/lab/patient/${patient.id}`);
      setBookings(res.data);
    } catch (err) {
      setBookings([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🧪 Lab Tests</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Tests</h2>
            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="space-y-3">
                {tests.map((test, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{test.testName}</p>
                      <p className="text-xs text-gray-500">{test.centerName} • {test.reportTat}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₹{test.price}</p>
                      {test.homeCollectionAvailable && (
                        <p className="text-xs text-green-600">🏠 Home collection</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Test Bookings</h2>
            <div className="relative mb-4">
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => handlePatientQueryChange(e.target.value)}
                onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
                placeholder="Type patient name to search..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && patientResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.phone || p.email} — ID: {p.id}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Search and select a patient to view bookings</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{booking.testName}</p>
                    <p className="text-sm text-gray-500">{booking.centerName}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{booking.status}</span>
                      <span className="text-sm font-medium text-gray-700">₹{booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}