'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

export default function EmergencyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // The logged-in hospital's own ICU details (editable)
  const [myHospitalId, setMyHospitalId] = useState('');
  const [total, setTotal] = useState('');
  const [available, setAvailable] = useState('');
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    const hospitalId = localStorage.getItem('hospitalId');
    if (hospitalId) {
      setMyHospitalId(hospitalId);
      loadMine(hospitalId);
    }
    loadBeds();
  }, []);

  const loadBeds = async () => {
    try {
      const res = await api.get('/api/emergency/beds');
      setBeds(res.data);
    } catch (err) {
      console.error('Error loading beds:', err);
    }
    setLoading(false);
  };

  const fillForm = (data) => {
    setTotal(String(data.icuBedsTotal ?? 0));
    setAvailable(String(data.icuBedsAvailable ?? 0));
    setEmergencyOpen(!!data.emergencyOpen);
    setContact(data.emergencyContact || '');
  };

  const loadMine = async (hospitalId) => {
    try {
      const res = await api.get(`/api/emergency/beds/${hospitalId}`);
      fillForm(res.data);
    } catch (err) {
      console.error('Error loading your hospital beds:', err);
    }
  };

  // + / − buttons next to "Available"
  const changeAvailable = (delta) => {
    const max = parseInt(total, 10);
    const next = (parseInt(available, 10) || 0) + delta;
    if (next < 0) return;
    if (!Number.isNaN(max) && next > max) return;
    setAvailable(String(next));
  };

  const saveBeds = async () => {
    const totalNum = Number(total);
    const availableNum = Number(available);
    if (total === '' || available === '' || !Number.isInteger(totalNum) || !Number.isInteger(availableNum) || totalNum < 0 || availableNum < 0) {
      setMessage(t('emergency.manage.err.number'));
      return;
    }
    if (availableNum > totalNum) {
      setMessage(t('emergency.manage.err.range'));
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put(`/api/emergency/beds/${myHospitalId}`, {
        icuBedsTotal: totalNum,
        icuBedsAvailable: availableNum,
        emergencyOpen,
        emergencyContact: contact.trim(),
      });
      fillForm(res.data);
      setMessage(t('emergency.manage.saved'));
      loadBeds();
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setMessage(t('emergency.manage.err.login'));
      else if (status === 403) setMessage(t('emergency.manage.err.denied'));
      else setMessage(t('emergency.manage.err.generic'));
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 6000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">{t('emergency.back')}</Link>
        <h1 className="text-xl font-bold text-gray-800">🚨 {t('emergency.title')}</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hospital staff: add / update this hospital's ICU beds */}
        {myHospitalId && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-800">{t('emergency.manage.title')}</h2>
            <p className="text-sm text-gray-500 mb-5">{t('emergency.manage.hint')}</p>

            {message && (
              <div className={`px-4 py-3 rounded-lg mb-5 text-sm ${
                message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.manage.total')}</label>
                <input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.manage.available')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => changeAvailable(-1)} aria-label={t('emergency.manage.minus')}
                    className="w-12 rounded-lg border border-gray-300 text-xl text-gray-700 hover:bg-gray-100">−</button>
                  <input type="number" min="0" value={available} onChange={(e) => setAvailable(e.target.value)}
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => changeAvailable(1)} aria-label={t('emergency.manage.plus')}
                    className="w-12 rounded-lg border border-gray-300 text-xl text-gray-700 hover:bg-gray-100">+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.manage.contact')}</label>
                <input type="text" value={contact} maxLength={30} onChange={(e) => setContact(e.target.value)}
                  placeholder={t('emergency.manage.contactPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-3 sm:mt-7 cursor-pointer">
                <input type="checkbox" checked={emergencyOpen} onChange={(e) => setEmergencyOpen(e.target.checked)}
                  className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{t('emergency.manage.open')}</span>
              </label>
            </div>

            <button onClick={saveBeds} disabled={saving}
              className="mt-6 w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? t('emergency.manage.saving') : t('emergency.manage.save')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">{t('emergency.loading')}</div>
        ) : beds.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('emergency.empty')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beds.map((hospital, idx) => {
              const mine = myHospitalId && String(hospital.hospitalId) === String(myHospitalId);
              return (
                <div key={idx} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                  hospital.icuBedsAvailable > 0 ? 'border-green-500' : 'border-red-500'} ${mine ? 'ring-2 ring-blue-300' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{hospital.hospitalName}</h3>
                      <p className="text-sm text-gray-500">{hospital.city}</p>
                      {mine && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {t('emergency.yourHospital')}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      hospital.emergencyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hospital.emergencyOpen ? t('emergency.open') : t('emergency.closed')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${
                        hospital.icuBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hospital.icuBedsAvailable}
                      </p>
                      <p className="text-xs text-gray-500">{t('emergency.available')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-400">{hospital.icuBedsTotal}</p>
                      <p className="text-xs text-gray-500">{t('emergency.totalIcu')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">{hospital.emergencyContact}</p>
                      <p className="text-xs text-gray-500">{t('emergency.emergency')}</p>
                    </div>
                  </div>
                  {hospital.lastUpdated && (
                    <p className="text-xs text-gray-400 mt-4">{t('emergency.updated', { time: hospital.lastUpdated })}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
