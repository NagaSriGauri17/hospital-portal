'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEmail = (val) => val.includes('@');

  const passwordRules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
    { label: 'At least one special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const allRulesPassed = passwordRules.every((r) => r.test(password));

  const reset = () => {
    setStep(1);
    setIdentifier('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    reset();
  };

  // ── LOGIN ──
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { identifier, password });
      if (res.data === 'User not found') {
        setError('No account found. Please sign up first.');
      } else if (res.data === 'Invalid password') {
        setError('Wrong password. Try again or use Forgot Password.');
      } else if (res.data === 'Please complete signup first') {
        setError('Please sign up and set a password first.');
      } else {
        localStorage.setItem('authToken', res.data);
        localStorage.setItem('userIdentifier', identifier);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  // ── SIGNUP: Step 1 — send OTP ──
  const handleSignupSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      if (isEmail(identifier)) {
        await api.post('/api/auth/send-otp/email', { email: identifier });
      } else {
        await api.post('/api/auth/send-otp/phone', { phone: identifier });
      }
      setStep(2);
      setSuccess('OTP sent! Check your ' + (isEmail(identifier) ? 'email' : 'phone'));
    } catch (err) {
      setError('Failed to send OTP. Check your email/phone and try again.');
    }
    setLoading(false);
  };

  // ── SIGNUP: Step 2 — verify OTP ──
  const handleSignupVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isEmail(identifier)) {
        res = await api.post('/api/auth/verify-otp/email', { email: identifier, otp });
      } else {
        res = await api.post('/api/auth/verify-otp/phone', { phone: identifier, otp });
      }
      if (res.data === 'Invalid OTP') {
        setError('Invalid OTP. Please try again.');
      } else {
        setStep(3);
        setSuccess('OTP verified! Now set your password.');
      }
    } catch (err) {
      setError('OTP verification failed.');
    }
    setLoading(false);
  };

  // ── SIGNUP: Step 3 — set password ──
  const handleSetPassword = async () => {
    if (!allRulesPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/set-password', { identifier, password });
      localStorage.setItem('authToken', res.data);
      localStorage.setItem('userIdentifier', identifier);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to set password. Please try again.');
    }
    setLoading(false);
  };

  // ── FORGOT: Step 1 — send OTP ──
  const handleForgotSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password/send-otp', { identifier });
      setStep(2);
      setSuccess('OTP sent to your ' + (isEmail(identifier) ? 'email' : 'phone'));
    } catch (err) {
      setError('Failed to send OTP.');
    }
    setLoading(false);
  };

  // ── FORGOT: Step 2 — verify OTP + new password ──
  const handleForgotReset = async () => {
    if (!allRulesPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/forgot-password/reset', {
        identifier,
        otp,
        newPassword: password,
      });
      if (res.data === 'Invalid OTP') {
        setError('Invalid OTP. Please try again.');
      } else {
        localStorage.setItem('authToken', res.data);
        localStorage.setItem('userIdentifier', identifier);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Reset failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">🏥 HealthCare</h1>
          <p className="text-gray-500 mt-1">Hospital Staff Portal</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* ── LOGIN MODE ── */}
        {mode === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="admin@hospital.com or 9876543210"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading || !identifier || !password}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              onClick={() => switchMode('forgot')}
              className="w-full text-blue-600 text-sm hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* ── SIGNUP MODE ── */}
        {mode === 'signup' && (
          <div>
            {/* Step indicator */}
            <div className="flex items-center mb-6">
              {['Enter Email/Phone', 'Verify OTP', 'Set Password'].map((label, idx) => (
                <div key={idx} className="flex items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > idx + 1 ? 'bg-green-500 text-white' :
                    step === idx + 1 ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  {idx < 2 && (
                    <div className={`flex-1 h-0.5 mx-1 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignupSendOtp()}
                    placeholder="admin@hospital.com or 9876543210"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSignupSendOtp}
                  disabled={loading || !identifier}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  OTP sent to <strong>{identifier}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSignupVerifyOtp()}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  />
                </div>
                <button
                  onClick={handleSignupVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm">
                  ← Change email/phone
                </button>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>

                  {/* Password rules */}
                  {password.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {passwordRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={rule.test(password) ? 'text-green-500' : 'text-gray-400'}>
                            {rule.test(password) ? '✅' : '⭕'}
                          </span>
                          <span className={rule.test(password) ? 'text-green-600' : 'text-gray-400'}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
                    placeholder="Repeat your password"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400'
                        : 'border-gray-300'
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  onClick={handleSetPassword}
                  disabled={loading || !allRulesPassed || password !== confirmPassword}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account & Login'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FORGOT PASSWORD MODE ── */}
        {mode === 'forgot' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reset Password</h2>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered Email or Phone
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotSendOtp()}
                    placeholder="admin@hospital.com or 9876543210"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleForgotSendOtp}
                  disabled={loading || !identifier}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                </button>
                <button
                  onClick={() => switchMode('login')}
                  className="w-full text-gray-500 text-sm"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 text-sm"
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {passwordRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className={rule.test(password) ? 'text-green-500' : 'text-gray-400'}>
                            {rule.test(password) ? '✅' : '⭕'}
                          </span>
                          <span className={rule.test(password) ? 'text-green-600' : 'text-gray-400'}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                <button
                  onClick={handleForgotReset}
                  disabled={loading || otp.length < 6 || !allRulesPassed || password !== confirmPassword}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password & Login'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}