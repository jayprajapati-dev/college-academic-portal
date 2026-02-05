import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    branch: '',
    semester: '',
    subjects: [],
    hod: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProfileData({
          name: data.data.name || '',
          email: data.data.email || '',
          mobile: data.data.mobile || '',
          role: data.data.role || '',
          branch: data.data.branch?.name || 'Not Assigned',
          semester: data.data.semester?.name || 'Not Assigned',
          subjects: data.data.assignedSubjects?.map(s => s.name) || [],
          hod: data.data.assignedHOD?.name || 'Not Assigned'
        });
      } else {
        alert('Error loading profile');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/profile/complete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Profile completed successfully!');
        // Navigate to appropriate dashboard based on role
        const dashboardMap = {
          'student': '/student/dashboard',
          'teacher': '/teacher/dashboard',
          'hod': '/hod/dashboard',
          'admin': '/admin/dashboard'
        };
        navigate(dashboardMap[profileData.role] || '/');
      } else {
        alert(data.message || 'Error completing profile');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#194ce6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#194ce6] to-purple-500">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Review your information and complete setup</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Editable Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Personal Information (Editable)
              </h3>
              
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email (if student) */}
              {profileData.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#194ce6] focus:border-transparent outline-none transition"
                    placeholder="Enter your email"
                  />
                </div>
              )}
            </div>

            {/* Read-only Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                System Information (Auto-assigned)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={profileData.mobile}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profileData.role.toUpperCase()}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Branch */}
                {profileData.branch && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={profileData.branch}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Semester */}
                {profileData.semester && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={profileData.semester}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}

                {/* HOD */}
                {profileData.role === 'teacher' && profileData.hod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned HOD
                    </label>
                    <input
                      type="text"
                      value={profileData.hod}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              {/* Assigned Subjects */}
              {profileData.subjects.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Subjects
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-[#194ce6] to-purple-500 text-white text-sm rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Note:</p>
                  <p className="text-sm text-blue-700 mt-1">
                    System-assigned fields (grey background) cannot be modified. Contact your administrator if any information is incorrect.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#194ce6] to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Completing Profile...' : 'Complete Profile & Continue'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            v4.2.0 Profile Setup | Smart College Academic Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
