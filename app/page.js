'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/send-otp/email', { email });
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Check your email and try again.');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/verify-otp/email', { email, otp });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', email);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">🏥 HealthCare</h1>
          <p className="text-gray-500 mt-2">Hospital Staff Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hospital.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">OTP sent to <strong>{email}</strong></p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
            />
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="w-full mt-2 text-blue-600 py-2 text-sm"
            >
              Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}