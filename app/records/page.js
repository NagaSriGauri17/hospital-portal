'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function RecordsPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    patientId: '',
    appointmentId: '',
    recordType: 'PRESCRIPTION',
    uploadedBy: 'STAFF'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [searchPatientId, setSearchPatientId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
  }, []);

  const handleUpload = async () => {
    if (!file || !form.patientId || !form.appointmentId) {
      setMessage('❌ Please fill all fields and select a file');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', form.patientId);
    formData.append('appointmentId', form.appointmentId);
    formData.append('recordType', form.recordType);
    formData.append('uploadedBy', form.uploadedBy);

    try {
      await api.post('/api/records/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Record uploaded successfully to patient health locker');
      setFile(null);
      setForm({ patientId: '', appointmentId: '', recordType: 'PRESCRIPTION', uploadedBy: 'STAFF' });
    } catch (err) {
      setMessage('❌ Upload failed: ' + (err.response?.data || 'Error'));
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const searchRecords = async () => {
    if (!searchPatientId) return;
    try {
      const res = await api.get(`/api/records/patient/${searchPatientId}`);
      setRecords(res.data);
    } catch (err) {
      setMessage('❌ No records found for this patient');
    }
  };

  const getDownloadUrl = async (recordId, fileName) => {
    try {
      const res = await api.get(`/api/records/download/${recordId}`);
      window.open(res.data.downloadUrl, '_blank');
    } catch (err) {
      setMessage('❌ Failed to get download link');
    }
  };

  const recordTypes = ['PRESCRIPTION', 'BLOOD_REPORT', 'XRAY', 'MRI', 'CT_SCAN', 'DISCHARGE_SUMMARY'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">📁 Health Records</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">

          {/* Upload section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Record</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
                <input type="number" value={form.patientId}
                  onChange={(e) => setForm({...form, patientId: e.target.value})}
                  placeholder="Enter patient ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appointment ID</label>
                <input type="number" value={form.appointmentId}
                  onChange={(e) => setForm({...form, appointmentId: e.target.value})}
                  placeholder="Enter appointment ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
                <select value={form.recordType}
                  onChange={(e) => setForm({...form, recordType: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {recordTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                {file && <p className="text-sm text-gray-500 mt-1">Selected: {file.name}</p>}
              </div>
              <button onClick={handleUpload} disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Uploading...' : '📤 Upload to Health Locker'}
              </button>
            </div>
          </div>

          {/* Search records section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">View Patient Records</h2>
            <div className="flex gap-2 mb-4">
              <input type="number" value={searchPatientId}
                onChange={(e) => setSearchPatientId(e.target.value)}
                placeholder="Enter patient ID"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={searchRecords}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Search
              </button>
            </div>
            {records.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Enter patient ID to view records</p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{record.fileName}</p>
                      <p className="text-xs text-gray-500">{record.recordType} • {record.uploadedAt?.split('T')[0]}</p>
                    </div>
                    <button onClick={() => getDownloadUrl(record.id, record.fileName)}
                      className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">
                      Download
                    </button>
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