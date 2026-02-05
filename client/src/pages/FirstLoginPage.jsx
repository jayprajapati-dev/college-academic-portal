import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FirstLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: '',
    newPassword: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    caseInsensitive: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const securityQuestions = [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your favorite color?',
    'What was the name of your elementary school?',
    'What is your favorite food?',
    'What is your father\'s middle name?'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    }

    if (!formData.securityAnswer) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/first-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer,
          caseInsensitiveAnswer: formData.caseInsensitive
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Password changed successfully!');
        navigate('/complete-profile');
      } else {
        alert(data.message || 'Error changing password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#194ce6] to-purple-500">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">First Login – Setup Required</h1>
          <p className="text-gray-600">Please change your password and set your security question to continue.</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Number (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                value={formData.mobile}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                placeholder="Will be auto-filled from login"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Security Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Question <span className="text-red-500">*</span>
              </label>
              <select
                name="securityQuestion"
                value={formData.securityQuestion}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition ${
                  errors.securityQuestion ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a security question</option>
                {securityQuestions.map((question, index) => (
                  <option key={index} value={question}>{question}</option>
                ))}
              </select>
              {errors.securityQuestion && (
                <p className="text-red-500 text-sm mt-1">{errors.securityQuestion}</p>
              )}
            </div>

            {/* Security Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition ${
                  errors.securityAnswer ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your answer"
              />
              {errors.securityAnswer && (
                <p className="text-red-500 text-sm mt-1">{errors.securityAnswer}</p>
              )}
            </div>

            {/* Case Insensitive Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="caseInsensitive"
                name="caseInsensitive"
                checked={formData.caseInsensitive}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-[#194ce6] border-gray-300 rounded focus:ring-[#194ce6]"
              />
              <div>
                <label htmlFor="caseInsensitive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Make answer case-insensitive
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  If checked, 'yellow' and 'YELLOW' will be treated the same.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#194ce6] to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            v4.2.0 First Login Setup | Secure Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPage;
