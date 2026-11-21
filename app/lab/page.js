'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

// Parses "24 hours" or "3 days" style strings into a report-ready date from today
function calculateReportDate(reportTat) {
  const today = new Date();
  const match = reportTat?.match(/(\d+)\s*(hour|day)/i);
  if (!match) return today;
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const result = new Date(today);
  if (unit === 'hour') {
    result.setHours(result.getHours() + amount);
  } else {
    result.setDate(result.getDate() + amount);
  }
  return result;
}

function formatDate(date, locale) {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LabPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Search/view existing bookings
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimer = useRef(null);

  // Booking modal state
  const [bookingTest, setBookingTest] = useState(null); // which test is being booked
  const [bookPatientQuery, setBookPatientQuery] = useState('');
  const [bookPatientResults, setBookPatientResults] = useState([]);
  const [bookShowDropdown, setBookShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookedResult, setBookedResult] = useState(null);
  const bookSearchTimer = useRef(null);

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

  // ── Existing bookings search ──
  const handlePatientQueryChange = (value) => {
    setPatientQuery(value);
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

  const selectPatientForView = async (patient) => {
    setPatientQuery(`${patient.name} (${patient.phone || patient.email})`);
    setShowDropdown(false);
    try {
      const res = await api.get(`/api/lab/patient/${patient.id}`);
      setBookings(res.data);
    } catch (err) {
      setBookings([]);
    }
  };

  // ── New booking flow ──
  const openBookingModal = (test) => {
    setBookingTest(test);
    setBookPatientQuery('');
    setBookPatientResults([]);
    setSelectedPatient(null);
    setPaymentStep(false);
    setBookedResult(null);
  };

  const closeBookingModal = () => {
    setBookingTest(null);
  };

  const handleBookPatientQueryChange = (value) => {
    setBookPatientQuery(value);
    setSelectedPatient(null);
    if (bookSearchTimer.current) clearTimeout(bookSearchTimer.current);
    if (value.trim().length < 2) {
      setBookPatientResults([]);
      setBookShowDropdown(false);
      return;
    }
    bookSearchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/patient/search?query=${encodeURIComponent(value)}`);
        setBookPatientResults(res.data || []);
        setBookShowDropdown(true);
      } catch (err) {
        console.error('Patient search error:', err);
      }
    }, 300);
  };

  const selectPatient = async (patient) => {
    setForm({ ...form, patientId: patient.id.toString(), patientName: patient.name });
    setShowDropdown(false);
    const hospitalId = localStorage.getItem('hospitalId');
    try {
      const res = await api.get(`/api/patient/code?hospitalId=${hospitalId}&userId=${patient.id}`);
      setPatientQuery(`${patient.name} (${res.data}) — ${patient.phone || patient.email}`);
    } catch (err) {
      setPatientQuery(`${patient.name} (${patient.phone || patient.email})`);
    }
  };

  const proceedToPayment = () => {
    if (!selectedPatient) {
      setMessage(t('lab.selectPatientFirst'));
      return;
    }
    setPaymentStep(true);
  };

  const handlePayment = async (method) => {
    setBooking(true);
    try {
      const res = await api.post('/api/lab/book', {
        patientId: selectedPatient.id,
        testCode: bookingTest.testCode,
        testName: bookingTest.testName,
        centerName: bookingTest.centerName,
        price: bookingTest.price,
        paymentMethod: method
      });
      setBookedResult(res.data);
    } catch (err) {
      setMessage(t('lab.bookingFailed', { error: err.response?.data?.message || t('lab.errorGeneric') }));
    }
    setBooking(false);
  };

  const paymentLabel = (m) => {
    switch (m) {
      case 'CASH': return t('lab.cash');
      case 'UPI': return t('lab.upi');
      case 'CARD': return t('lab.card');
      default: return m;
    }
  };
  const statusLabel = (s) => {
    switch (s) {
      case 'BOOKED': return t('lab.status.booked');
      case 'CONFIRMED': return t('lab.status.confirmed');
      case 'COMPLETED': return t('lab.status.completed');
      case 'CANCELLED': return t('lab.status.cancelled');
      case 'PENDING': return t('lab.status.pending');
      default: return s;
    }
  };

  const today = new Date();
  const reportDate = bookingTest ? calculateReportDate(bookingTest.reportTat) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">{t('lab.back')}</Link>
        <h1 className="text-xl font-bold text-gray-800">{t('lab.title')}</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">

          {/* Available tests with Book button */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('lab.availableTests')}</h2>
            {loading ? <p className="text-gray-400">{t('lab.loading')}</p> : (
              <div className="space-y-3">
                {tests.map((test, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{test.testName}</p>
                      <p className="text-xs text-gray-500">{t('lab.reportIn', { center: test.centerName, tat: test.reportTat })}</p>
                      {test.homeCollectionAvailable && (
                        <p className="text-xs text-green-600">{t('lab.homeCollection')}</p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-semibold text-blue-600">₹{test.price}</p>
                      <button
                        onClick={() => openBookingModal(test)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {t('lab.bookTest')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search existing bookings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('lab.patientBookings')}</h2>
            <div className="relative mb-4">
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => handlePatientQueryChange(e.target.value)}
                onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
                placeholder={t('lab.searchPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && patientResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPatientForView(p)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">{t('lab.contactId', { contact: p.phone || p.email, id: p.id })}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {bookings.length === 0 ? (
              <p className="text-gray-400 text-center py-10">{t('lab.searchPrompt')}</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{booking.testName}</p>
                    <p className="text-sm text-gray-500">{booking.centerName}</p>
                    <div className="flex justify-between mt-1 items-center">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{statusLabel(booking.status)}</span>
                      <span className="text-xs text-gray-400">{paymentLabel(booking.paymentMethod)}</span>
                      <span className="text-sm font-medium text-gray-700">₹{booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {bookingTest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">

            {!bookedResult ? (
              <>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{t('lab.bookTitle', { name: bookingTest.testName })}</h2>
                    <p className="text-sm text-gray-500">{bookingTest.centerName} • ₹{bookingTest.price}</p>
                  </div>
                  <button onClick={closeBookingModal} aria-label={t('lab.close')} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                {!paymentStep ? (
                  <>
                    {/* Patient search */}
                    <div className="relative mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('lab.patientName')}</label>
                      <input
                        type="text"
                        value={bookPatientQuery}
                        onChange={(e) => handleBookPatientQueryChange(e.target.value)}
                        onFocus={() => bookPatientResults.length > 0 && setBookShowDropdown(true)}
                        placeholder={t('lab.searchPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {bookShowDropdown && bookPatientResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                          {bookPatientResults.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => selectPatientForBooking(p)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-500">{t('lab.contactId', { contact: p.phone || p.email, id: p.id })}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedPatient && (
                      <div className="space-y-3 mb-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('lab.phoneNumber')}</p>
                            <p className="font-medium text-gray-800 text-sm">{selectedPatient.phone || t('lab.na')}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('lab.patientId')}</p>
                            <p className="font-medium text-gray-800 text-sm">#{selectedPatient.id}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('lab.bookingDate')}</p>
                            <p className="font-medium text-gray-800 text-sm">{formatDate(today, locale)}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{t('lab.reportReadyBy')}</p>
                            <p className="font-medium text-green-700 text-sm">{formatDate(reportDate, locale)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={proceedToPayment}
                      disabled={!selectedPatient}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('lab.continuePayment')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-5">
                      <p className="text-sm text-gray-500">{t('lab.amountToCollect')}</p>
                      <p className="text-3xl font-bold text-gray-800">₹{bookingTest.price}</p>
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-3">{t('lab.selectPaymentMethod')}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePayment('CASH')}
                        disabled={booking}
                        className="w-full flex items-center justify-between bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg font-medium hover:bg-green-100 disabled:opacity-50"
                      >
                        <span>💵 {t('lab.cash')}</span>
                        <span className="text-xs text-green-600">{t('lab.markPaid')}</span>
                      </button>
                      <button
                        onClick={() => handlePayment('UPI')}
                        disabled={booking}
                        className="w-full flex items-center justify-between bg-purple-50 border border-purple-300 text-purple-800 px-4 py-3 rounded-lg font-medium hover:bg-purple-100 disabled:opacity-50"
                      >
                        <span>📱 {t('lab.upi')}</span>
                        <span className="text-xs text-purple-500">{t('lab.demoNotIntegrated')}</span>
                      </button>
                      <button
                        onClick={() => handlePayment('CARD')}
                        disabled={booking}
                        className="w-full flex items-center justify-between bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg font-medium hover:bg-blue-100 disabled:opacity-50"
                      >
                        <span>💳 {t('lab.card')}</span>
                        <span className="text-xs text-blue-500">{t('lab.demoNotIntegrated')}</span>
                      </button>
                    </div>

                    {booking && <p className="text-center text-sm text-gray-400 mt-4">{t('lab.processing')}</p>}

                    <button
                      onClick={() => setPaymentStep(false)}
                      className="w-full text-gray-500 text-sm mt-4"
                    >
                      {t('lab.back')}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">✅</div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">{t('lab.paymentConfirmed')}</h2>
                  <p className="text-sm text-gray-500 mb-5">{t('lab.bookedSuccess')}</p>

                  <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('lab.test')}</span>
                      <span className="font-medium text-gray-800">{bookedResult.testName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('lab.patient')}</span>
                      <span className="font-medium text-gray-800">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('lab.amount')}</span>
                      <span className="font-medium text-gray-800">₹{bookedResult.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('lab.paymentMethod')}</span>
                      <span className="font-medium text-gray-800">{paymentLabel(bookedResult.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('lab.reportReadyBy')}</span>
                      <span className="font-medium text-green-700">{formatDate(reportDate, locale)}</span>
                    </div>
                  </div>

                  <button
                    onClick={closeBookingModal}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mt-5"
                  >
                    {t('lab.done')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}