import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PasswordSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    mobileNumber: '',
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  const securityQuestions = [
    "What is your mother's name?",
    "What city were you born in?",
    "What is your pet's name?",
    "What is your favorite color?",
    "What is your favorite book?",
    "What is your favorite food?",
    "What school did you attend?",
    "What is your favorite sport?"
  ];

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.mobileNumber || !formData.tempPassword) {
      setError('Mobile Number and Temporary Password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-temp-credentials', {
        mobileNumber: formData.mobileNumber,
        tempPassword: formData.tempPassword
      });

      if (response.data.success) {
        localStorage.setItem('setupToken', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        setSuccess('Credentials verified! Setting up new password...');
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter password in both fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.securityQuestion) {
      setError('Please select a security question');
      return;
    }

    if (!formData.securityAnswer) {
      setError('Please answer the security question');
      return;
    }

    setLoading(true);

    try {
      const setupToken = localStorage.getItem('setupToken');
      const userId = localStorage.getItem('userId');

      const response = await axios.post('/api/auth/setup-password', {
        userId,
        newPassword: formData.newPassword,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      }, {
        headers: { Authorization: `Bearer ${setupToken}` }
      });

      if (response.data.success) {
        localStorage.removeItem('setupToken');
        localStorage.removeItem('userId');
        setSuccess('Password setup completed! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error setting up password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Setup</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === 1 ? 'Verify your temporary credentials' : 'Set your new password'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Step 1: Verify Credentials */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobileNumber: value });
                }}
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Your mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password *</label>
              <input
                type="password"
                value={formData.tempPassword}
                onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Temporary password provided"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
        )}

        {/* Step 2: Set New Password */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password *</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter new password (min 8 characters)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters required</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Security Question *</label>
              <select
                value={formData.securityQuestion}
                onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a question</option>
                {securityQuestions.map((q, idx) => (
                  <option key={idx} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Answer *</label>
              <input
                type="text"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Your answer to the security question"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <span className="font-semibold">Tip:</span> Your security question and answer will help you recover your account if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetup;
