import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { AdminLayout, Card, StatsCard, Button } from '../components';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateHOD, setShowCreateHOD] = useState(false);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    hods: 0,
    branches: 3,
    subjects: 6
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        if (data.data.role !== 'admin') {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchSystemData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch total user count
      const usersResponse = await fetch('/api/admin/users?page=1&limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();

      const [branchesRes, subjectsRes] = await Promise.all([
        fetch('/api/academic/branches').then((r) => r.json()),
        fetch('/api/academic/subjects').then((r) => r.json())
      ]);

      const branchCount = Array.isArray(branchesRes.data) ? branchesRes.data.length : 0;
      const subjectCount = Array.isArray(subjectsRes.data) ? subjectsRes.data.length : 0;
      
      if (usersData.success && Array.isArray(usersData.data)) {
        const allUsers = usersData.data;
        // Calculate stats
        const students = allUsers.filter(u => u.role === 'student').length;
        const teachers = allUsers.filter(u => u.role === 'teacher').length;
        const hods = allUsers.filter(u => u.role === 'hod').length;
        
        setStats({
          totalUsers: usersData.total || allUsers.length,
          students,
          teachers,
          hods,
          branches: branchCount,
          subjects: subjectCount
        });
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchSystemData();
  }, [fetchProfile, fetchSystemData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#111318] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Dashboard" userName={user?.name || 'Admin'} onLogout={handleLogout}>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#6B7280]">System Administrator</p>
            <h2 className="text-2xl font-bold">Welcome, {user?.name || 'Administrator'}</h2>
            <p className="text-sm text-[#6B7280] mt-1">Manage users, academics, and system setup.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F1F5F9] text-sm font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            System Online
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <StatsCard icon="group" title="Total Users" value={stats.totalUsers} color="indigo" />
        <StatsCard icon="school" title="Students" value={stats.students} color="blue" />
        <StatsCard icon="person" title="Teachers" value={stats.teachers} color="green" />
        <StatsCard icon="supervisor_account" title="Department Heads" value={stats.hods} color="purple" />
        <StatsCard icon="apartment" title="Branches" value={stats.branches} color="orange" />
        <StatsCard icon="menu_book" title="Subjects" value={stats.subjects} color="indigo" />
      </div>

      <Card title="Administration Tools" subtitle="Quick access to academic management" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <button onClick={() => navigate('/admin/academic-structure')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">account_tree</span>
              <div>
                <p className="text-sm font-bold">Academic Explorer</p>
                <p className="text-xs text-[#6B7280]">Browse structure</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/semesters')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">calendar_month</span>
              <div>
                <p className="text-sm font-bold">Semesters</p>
                <p className="text-xs text-[#6B7280]">Academic terms</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/branches')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">apartment</span>
              <div>
                <p className="text-sm font-bold">Branches</p>
                <p className="text-xs text-[#6B7280]">Manage departments</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/subjects')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">menu_book</span>
              <div>
                <p className="text-sm font-bold">Subjects</p>
                <p className="text-xs text-[#6B7280]">Course catalog</p>
              </div>
            </div>
          </button>
          <button onClick={() => setShowCreateHOD(true)} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">person_add</span>
              <div>
                <p className="text-sm font-bold">Add HOD</p>
                <p className="text-xs text-[#6B7280]">Create new HOD</p>
              </div>
            </div>
          </button>
          <button onClick={() => setShowCreateTeacher(true)} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">person_add</span>
              <div>
                <p className="text-sm font-bold">Add Teacher</p>
                <p className="text-xs text-[#6B7280]">Create new teacher</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/users')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">group</span>
              <div>
                <p className="text-sm font-bold">Manage Users</p>
                <p className="text-xs text-[#6B7280]">View all users</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/timetable')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">schedule</span>
              <div>
                <p className="text-sm font-bold">Timetable</p>
                <p className="text-xs text-[#6B7280]">Manage schedules</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/notices')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <div>
                <p className="text-sm font-bold">Notice Board</p>
                <p className="text-xs text-[#6B7280]">Publish notices</p>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/tasks')} className="group rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left hover:bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">assignment</span>
              <div>
                <p className="text-sm font-bold">Task/Assignment</p>
                <p className="text-xs text-[#6B7280]">Manage tasks</p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* Modals */}
      {showCreateHOD && (
        <CreateHODModal onClose={() => setShowCreateHOD(false)} onSuccess={fetchSystemData} />
      )}

      {showCreateTeacher && (
        <CreateTeacherModal onClose={() => setShowCreateTeacher(false)} onSuccess={fetchSystemData} />
      )}
    </AdminLayout>
  );
};

// Create HOD Modal
const CreateHODModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', branch: 'IT' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/create-hod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(`HOD created!\nTemp Password: ${data.data.tempPassword}`);
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to create HOD');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create New HOD</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
            <input type="tel" required pattern="[0-9]{10}" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
            <select required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
              <option value="IT">Information Technology</option>
              <option value="CS">Computer Science</option>
              <option value="ME">Mechanical</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" loading={loading} className="flex-1">
              Create HOD
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Teacher Modal
const CreateTeacherModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', branch: 'IT', subjects: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(`Teacher created!\nTemp Password: ${data.data.tempPassword}`);
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to create teacher');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create New Teacher</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
            <input type="tel" required pattern="[0-9]{10}" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
            <select required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
              <option value="IT">Information Technology</option>
              <option value="CS">Computer Science</option>
              <option value="ME">Mechanical</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" loading={loading} className="flex-1">
              Create Teacher
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
