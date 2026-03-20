import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import RoleLayout from '../components/RoleLayout';
import useRoleNav from '../hooks/useRoleNav';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({ roomNo: '', type: 'Class', buildingName: 'Main Building', floor: 'Ground', customBuilding: '', customFloor: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ roomNo: '', type: 'Class', buildingName: '', floor: 'Ground', customBuilding: '', customFloor: '' });
  const [addLoading, setAddLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user role from location or localStorage
  const userRole = location.pathname.startsWith('/admin') ? 'admin' : 
                   location.pathname.startsWith('/hod') ? 'hod' : 'admin';
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { navItems, loading: navLoading } = useRoleNav(userRole);

  // Check if this is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    fetchRooms();
  }, [userRole]);

  const fetchRooms = () => {
    setLoading(true);
    axios.get('/api/room', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        const roomsData = res.data.data;
        setRooms(roomsData);
        
        // Extract unique buildings from existing rooms
        const uniqueBuildings = [...new Set(roomsData.map(room => room.buildingName).filter(Boolean))];
        setBuildings(uniqueBuildings);
      })
      .catch(() => setError('Failed to load rooms'))
      .finally(() => setLoading(false));
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const roomData = { ...addFormData };
      
      // Set custom fields if custom options are selected
      if (roomData.buildingName === 'Custom') {
        roomData.buildingName = roomData.customBuilding;
      }
      if (roomData.floor === 'Custom') {
        roomData.floor = roomData.customFloor;
      }
      
      await axios.post('/api/room', roomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Room added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowAddModal(false);
      setAddFormData({ roomNo: '', type: 'Class', buildingName: '', floor: 'Ground', customBuilding: '', customFloor: '' });
      fetchRooms(); // This will refresh both rooms and buildings
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add room');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Room deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchRooms();
    } catch (err) {
      setError('Failed to delete room');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room._id);
    setEditFormData({ 
      roomNo: room.roomNo, 
      type: room.type, 
      buildingName: room.buildingName || 'Main Building',
      floor: room.floor || 'Ground',
      customBuilding: '',
      customFloor: ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const roomData = { ...editFormData };
      
      // Set custom fields if custom options are selected
      if (roomData.buildingName === 'Custom') {
        roomData.buildingName = roomData.customBuilding;
      }
      if (roomData.floor === 'Custom') {
        roomData.floor = roomData.customFloor;
      }
      
      await axios.put(`/api/room/${editingRoom}`, roomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Room updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingRoom(null);
      fetchRooms(); // This will refresh both rooms and buildings
    } catch (err) {
      setError('Failed to update room');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddChange = (e) => {
    setAddFormData({
      ...addFormData,
      [e.target.name]: e.target.value
    });
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditFormData({ roomNo: '', type: 'Class', buildingName: '', floor: 'Ground', customBuilding: '', customFloor: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getLayoutTitle = () => {
    if (userRole === 'hod') {
      return 'HOD Rooms Management';
    }
    return 'Rooms Management';
  };

  const getLayoutDescription = () => {
    if (userRole === 'hod') {
      return `Manage rooms for ${storedUser.branch?.name || 'your branch'} - classrooms and laboratories for timetable scheduling`;
    }
    return 'Manage classrooms and laboratories for timetable scheduling';
  };

  // Content component that will be wrapped by different layouts
  const RoomsContent = () => (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getLayoutTitle()}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{getLayoutDescription()}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Room
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Rooms Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No rooms</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new room.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add New Room
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Room Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Floor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rooms.map(room => (
                  <tr key={room._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room._id ? (
                        <input
                          type="text"
                          name="roomNo"
                          value={editFormData.roomNo}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {room.roomNo}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room._id ? (
                        <select
                          name="type"
                          value={editFormData.type}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="Class">Classroom</option>
                          <option value="Lab">Laboratory</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          room.type === 'Lab' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {room.type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room._id ? (
                        <select
                          name="buildingName"
                          value={editFormData.buildingName}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Building</option>
                          {buildings.map(building => (
                            <option key={building} value={building}>{building}</option>
                          ))}
                          <option value="Custom">Custom</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {room.buildingName || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRoom === room._id ? (
                        <select
                          name="floor"
                          value={editFormData.floor}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="Ground">Ground</option>
                          <option value="1st">1st</option>
                          <option value="2nd">2nd</option>
                          <option value="3rd">3rd</option>
                          <option value="Custom">Custom</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {room.floor || 'Ground'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        room.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingRoom === room._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditSubmit}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Room</h2>
            
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNo"
                  value={addFormData.roomNo}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter room number (e.g., 101, Lab-1)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Type *
                </label>
                <select
                  name="type"
                  value={addFormData.type}
                  onChange={handleAddChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Class">Classroom</option>
                  <option value="Lab">Laboratory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building Name *
                </label>
                <select
                  name="buildingName"
                  value={addFormData.buildingName}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Building</option>
                  {buildings.map(building => (
                    <option key={building} value={building}>{building}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {addFormData.buildingName === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Building Name *
                  </label>
                  <input
                    type="text"
                    name="customBuilding"
                    value={addFormData.customBuilding}
                    onChange={handleAddChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom building name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Floor *
                </label>
                <select
                  name="floor"
                  value={addFormData.floor}
                  onChange={handleAddChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Ground">Ground</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {addFormData.floor === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Floor *
                  </label>
                  <input
                    type="text"
                    name="customFloor"
                    value={addFormData.customFloor}
                    onChange={handleAddChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom floor"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {addLoading ? 'Adding...' : 'Add Room'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddFormData({ roomNo: '', type: 'Class', buildingName: '', floor: 'Ground', customBuilding: '', customFloor: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Use different layouts based on user role
  if (isAdminRoute) {
    return (
      <AdminLayout title={getLayoutTitle()} userName={storedUser.name || 'Admin'}>
        <RoomsContent />
      </AdminLayout>
    );
  } else {
    return (
      <RoleLayout
        title={getLayoutTitle()}
        userName={storedUser.name || 'User'}
        onLogout={handleLogout}
        navItems={navItems}
        navLoading={navLoading}
        panelLabel={`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Panel`}
      >
        <RoomsContent />
      </RoleLayout>
    );
  }
};

export default RoomsPage;
