import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HodLayout } from '../../components';

const ManageTeachers = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTeachers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=teacher', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleRemoveTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to remove this teacher?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTeachers(teachers.filter(t => t._id !== teacherId));
        alert('Teacher removed successfully');
      } else {
        alert('Error removing teacher');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to remove teacher');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <HodLayout title="Manage Teachers" userName={currentUser?.name || 'HOD'} onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
        </div>
      </HodLayout>
    );
  }

  return (
    <HodLayout title="Manage Teachers" userName={currentUser?.name || 'HOD'} onLogout={() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }}>
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/hod/dashboard')} className="text-gray-700 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Manage Teachers</h1>
            </div>
          </div>

          {/* Search and Add Teacher */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Faculty Members</h2>
              <button
                onClick={() => navigate('/hod/add-teacher')}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                + Add Teacher
              </button>
            </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Teachers Table */}
          {filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Specialization</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Experience</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{teacher.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.specialization || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.experience ? `${teacher.experience} years` : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRemoveTeacher(teacher._id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No teachers found</p>
              <button
                onClick={() => navigate('/hod/add-teacher')}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Add First Teacher
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </HodLayout>
  );
};

export default ManageTeachers;
