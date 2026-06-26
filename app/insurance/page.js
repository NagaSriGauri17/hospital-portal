'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function InsurancePage() {
  const router = useRouter();
  const [claimId, setClaimId] = useState('');
  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(false);

  const insurers = [
    { name: 'Star Health Insurance', cashless: true },
    { name: 'HDFC Ergo Health', cashless: true },
    { name: 'New India Assurance', cashless: false },
    { name: 'United India Insurance', cashless: true },
    { name: 'Max Bupa Health', cashless: true },
  ];

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
  }, []);

  const checkClaim = async () => {
    if (!claimId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/insurance/claim/${claimId}/status`);
      setClaimData(res.data);
    } catch (err) {
      console.error('Error checking claim:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">← Back</Link>
        <h1 className="text-xl font-bold text-gray-800">🛡 Insurance</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Accepted Insurers</h2>
            <div className="space-y-3">
              {insurers.map((ins, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700">{ins.name}</p>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    ins.cashless ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {ins.cashless ? 'Cashless' : 'Reimbursement'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Check Claim Status</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                placeholder="Enter claim ID"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={checkClaim} disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Check
              </button>
            </div>

            {claimData && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-800">Claim #{claimData.claimId}</p>
                <p className="text-blue-700">Status: <strong>{claimData.status}</strong></p>
                <p className="text-blue-700">Insurer: {claimData.insurer}</p>
                <p className="text-blue-700">Amount: ₹{claimData.claimAmount}</p>
                <div className="mt-3">
                  {claimData.timeline?.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm mb-1">
                      <span className={step.done ? 'text-green-500' : 'text-gray-300'}>
                        {step.done ? '✅' : '⭕'}
                      </span>
                      <span className={step.done ? 'text-gray-700' : 'text-gray-400'}>
                        {step.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}