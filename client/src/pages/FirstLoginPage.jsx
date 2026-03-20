import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingFrame } from '../components';
import useLandingAuth from '../hooks/useLandingAuth';

const FirstLoginPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, userProfile, notifications } = useLandingAuth();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    securityQuestion: '',
    customSecurityQuestion: '',
    securityAnswer: '',
    caseInsensitive: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const securityQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?",
    "What is your favorite movie?",
    "What was the name of your first school?",
    "What is your favorite food?",
    "What is your favorite sport?",
    "What is your favorite color?"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'securityQuestion' && value !== 'custom' ? { customSecurityQuestion: '' } : {})
    }));

    if (message.text) {
      setMessage({ type: '', text: '' });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.securityQuestion) {
      newErrors.securityQuestion = 'Please select a security question';
    } else if (formData.securityQuestion === 'custom' && !formData.customSecurityQuestion.trim()) {
      newErrors.customSecurityQuestion = 'Please enter a custom security question';
    }

    if (!formData.securityAnswer) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordStrength = useMemo(() => {
    const value = formData.newPassword || '';
    let score = 0;

    if (value.length >= 6) score += 30;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 20;
    if (/\d/.test(value)) score += 20;
    if (/[^A-Za-z0-9]/.test(value)) score += 20;
    if (value.length >= 10) score += 10;

    const clamped = Math.min(score, 100);
    const label = clamped >= 80 ? 'Strong' : clamped >= 50 ? 'Medium' : clamped > 0 ? 'Weak' : 'N/A';
    const barColor = clamped >= 80 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-amber-500' : 'bg-rose-500';

    return { score: clamped, label, barColor };
  }, [formData.newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/auth/first-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
          securityQuestion: formData.securityQuestion === 'custom'
            ? formData.customSecurityQuestion.trim()
            : formData.securityQuestion,
          securityAnswer: formData.securityAnswer,
          caseInsensitiveAnswer: formData.caseInsensitive
        })
      });

      const data = await response.json();

      if (data.success) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          passwordChangeRequired: false,
          firstLoginCompleted: true
        }));

        setMessage({ type: 'success', text: 'Account setup completed successfully. Redirecting...' });
        navigate('/complete-profile');
      } else {
        setMessage({ type: 'error', text: data.message || 'Error changing password' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const userMobile = currentUser?.mobile || currentUser?.phone || 'Auto-filled from your account';
  const userName = currentUser?.name || 'User';

  return (
    <LandingFrame
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      userProfile={userProfile}
      notifications={notifications}
    >
      <section className="max-w-[1150px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-[#E5EAF3] bg-gradient-to-b from-[#F9FBFF] to-white p-5 md:p-8 shadow-[0_30px_60px_-35px_rgba(25,93,230,0.45)]">
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#195de6]/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -right-14 bottom-12 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl"></div>

          <div className="relative mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#195de6]">First-Time Login</p>
              <h1 className="mt-2 text-2xl md:text-3xl font-black text-[#111318]">Secure Your Account</h1>
              <p className="mt-1.5 text-sm text-[#5B647A]">Welcome {userName}. Set your permanent password and recovery answer to continue.</p>
            </div>
            <div className="rounded-2xl bg-white/70 border border-[#DDE5F3] px-4 py-3 min-w-[240px]">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">Registered Mobile</p>
              <p className="mt-1 text-sm font-bold text-[#111318]">{userMobile}</p>
            </div>
          </div>

          {message.text && (
            <div
              className={`relative mb-5 rounded-xl px-4 py-3 text-sm border ${
                message.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-[#2A3248] mb-2">New Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full h-12 rounded-xl border bg-white px-3.5 pr-11 outline-none transition ${
                      errors.newPassword ? 'border-rose-400' : 'border-[#D6DDEB] focus:border-[#195de6] focus:ring-2 focus:ring-[#195de6]/20'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A859F] hover:text-[#195de6]"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-rose-600 mt-1.5">{errors.newPassword}</p>}
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-[#7A859F]">
                    <span>Strength: {passwordStrength.label}</span>
                    <span>{passwordStrength.score}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#EDF1F8] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${passwordStrength.barColor}`} style={{ width: `${passwordStrength.score}%` }}></div>
                  </div>
                  <p className="text-[11px] text-[#697286] mt-1.5">Use at least 6 characters with letters, numbers, and symbols.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2A3248] mb-2">Confirm Password <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full h-12 rounded-xl border bg-white px-3.5 pr-11 outline-none transition ${
                      errors.confirmPassword ? 'border-rose-400' : 'border-[#D6DDEB] focus:border-[#195de6] focus:ring-2 focus:ring-[#195de6]/20'
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A859F] hover:text-[#195de6]"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-600 mt-1.5">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#DFE6F2] to-transparent"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-[#2A3248] mb-2">Security Question <span className="text-rose-500">*</span></label>
                <select
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  className={`w-full h-12 rounded-xl border bg-white px-3.5 outline-none transition ${
                    errors.securityQuestion ? 'border-rose-400' : 'border-[#D6DDEB] focus:border-[#195de6] focus:ring-2 focus:ring-[#195de6]/20'
                  }`}
                >
                  <option value="">Select a security question</option>
                  {securityQuestions.map((question, index) => (
                    <option key={index} value={question}>{question}</option>
                  ))}
                  <option value="custom">Custom question...</option>
                </select>
                {errors.securityQuestion && <p className="text-xs text-rose-600 mt-1.5">{errors.securityQuestion}</p>}
                {formData.securityQuestion === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="customSecurityQuestion"
                      value={formData.customSecurityQuestion}
                      onChange={handleChange}
                      className={`w-full h-12 rounded-xl border bg-white px-3.5 outline-none transition ${
                        errors.customSecurityQuestion ? 'border-rose-400' : 'border-[#D6DDEB] focus:border-[#195de6] focus:ring-2 focus:ring-[#195de6]/20'
                      }`}
                      placeholder="Type your custom security question"
                    />
                    {errors.customSecurityQuestion && <p className="text-xs text-rose-600 mt-1.5">{errors.customSecurityQuestion}</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2A3248] mb-2">Security Answer <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="securityAnswer"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  className={`w-full h-12 rounded-xl border bg-white px-3.5 outline-none transition ${
                    errors.securityAnswer ? 'border-rose-400' : 'border-[#D6DDEB] focus:border-[#195de6] focus:ring-2 focus:ring-[#195de6]/20'
                  }`}
                  placeholder="Enter your answer"
                />
                {errors.securityAnswer && <p className="text-xs text-rose-600 mt-1.5">{errors.securityAnswer}</p>}
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="caseInsensitive"
                name="caseInsensitive"
                checked={formData.caseInsensitive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[#BFC8DB] text-[#195de6] focus:ring-[#195de6]"
              />
              <span className="text-sm text-[#566079]">Treat security answer as case-insensitive (recommended)</span>
            </label>

            <div className="rounded-xl border border-[#D9E4F8] bg-[#F5F9FF] p-4 text-xs text-[#4E5B74]">
              <p className="font-semibold text-[#2A3248] mb-1">Security Note</p>
              This answer is used only for account recovery verification. Choose an answer that you can remember but others cannot guess easily.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-[#195de6] text-white font-bold hover:bg-[#164fc4] transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>}
                {loading ? 'Completing Setup...' : 'Complete Setup'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="h-12 px-6 rounded-xl border border-[#D6DDEB] bg-white text-[#374151] font-semibold hover:bg-[#F8FAFD] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel & Logout
              </button>
            </div>
          </form>
        </div>
      </section>
    </LandingFrame>
  );
};

export default FirstLoginPage;
