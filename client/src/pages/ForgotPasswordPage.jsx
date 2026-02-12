import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [formData, setFormData] = useState({
    identifier: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.identifier) {
      setError('Please enter your email or mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.identifier })
      });
      const data = await response.json();

      if (data.success) {
        setSecurityQuestion(data.securityQuestion);
        setUserId(data.userId);
        setStep(2);
        setSuccess('Security question loaded. Please answer to continue.');
      } else {
        setError(data.message || 'Unable to fetch security question');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.securityAnswer) {
      setError('Please enter your security answer');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-security-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answer: formData.securityAnswer })
      });
      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setStep(3);
        setSuccess('Answer verified. Set a new password.');
      } else {
        setError(data.message || 'Security answer is incorrect');
      }
    } catch (err) {
      setError('Error verifying security answer');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resetToken}`
        },
        body: JSON.stringify({ newPassword: formData.newPassword })
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-white/40 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 md:px-20 lg:px-40 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-5xl">lock_reset</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-slate-900 dark:text-white text-lg font-black tracking-tight">SmartAcademics</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Password Recovery</p>
            </div>
          </a>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center rounded-lg h-11 px-6 bg-primary/10 dark:bg-primary/15 border border-primary/30 dark:border-primary/40 hover:bg-primary hover:text-white text-primary dark:text-primary text-sm font-bold transition-all duration-300 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg mr-2">arrow_back</span>
            <span>Return to Login</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6 md:p-12 pt-32 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-[100px] -z-10"></div>

        <div className="w-full max-w-[540px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-500 border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="p-8 pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Security Protocol</p>
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg">Identity Verification</h3>
                </div>
                <p className="text-primary text-sm font-bold bg-primary/5 px-3 py-1 rounded-full">Step {step} of 3</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700 ease-in-out" style={{ width: `${(step / 3) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="px-8 pt-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/5 text-primary mb-6 ring-1 ring-primary/10">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight">Account Recovery</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium leading-relaxed">
              Verify your identity and reset your password securely.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">
                {success}
              </div>
            )}

            {step === 1 && (
              <form className="space-y-6" onSubmit={handleFetchQuestion}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email or Mobile</label>
                  <div className="relative flex items-stretch">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">badge</span>
                    </div>
                    <input
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      className="w-full rounded-xl h-14 border border-slate-200 bg-white/50 pl-12 pr-5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Email or mobile number"
                      type="text"
                    />
                  </div>
                </div>
                <button
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Get Security Question'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form className="space-y-6" onSubmit={handleVerifyAnswer}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assigned Security Challenge</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="size-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-primary">
                      <span className="material-symbols-outlined text-lg">psychology</span>
                    </div>
                    <p className="text-slate-600 text-sm font-semibold italic">"{securityQuestion}"</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Response</label>
                  <div className="relative flex items-stretch">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">vpn_key</span>
                    </div>
                    <input
                      name="securityAnswer"
                      value={formData.securityAnswer}
                      onChange={handleChange}
                      className="w-full rounded-xl h-14 border border-slate-200 bg-white/50 pl-12 pr-5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Type your security answer"
                      type="password"
                    />
                  </div>
                </div>
                <button
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Answer'}
                </button>
              </form>
            )}

            {step === 3 && (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                  <input
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl h-14 border border-slate-200 bg-white/50 px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="Enter new password"
                    type="password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl h-14 border border-slate-200 bg-white/50 px-5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="Confirm new password"
                    type="password"
                  />
                </div>
                <button
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full mt-16 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="px-6 md:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded text-white">
                <svg className="size-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="font-bold text-slate-900">SmartAcademics</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a className="text-slate-600 hover:text-primary transition-colors font-semibold" href="/privacy">Privacy</a>
              <a className="text-slate-600 hover:text-primary transition-colors font-semibold" href="/terms">Terms</a>
              <a className="text-slate-600 hover:text-primary transition-colors font-semibold" href="/contact">Contact</a>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8">
            <p className="text-xs text-slate-500 text-center font-medium">© 2026 SmartAcademics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
