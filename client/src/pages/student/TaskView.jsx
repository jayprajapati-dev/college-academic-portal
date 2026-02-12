import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudentLayout, Card, Badge, LoadingSpinner, Button } from '../../components';
import axios from 'axios';

const StudentTaskView = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fetch tasks for the subject
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const res = await axios.get(`/api/tasks/subject/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setTasks(res.data.data);
        if (res.data.subject) setSubject(res.data.subject);
        setPagination(prev => ({
          ...prev,
          total: res.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  }, [subjectId, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleViewTask = (taskId) => {
    navigate(`/student/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <StudentLayout title="Subject Tasks" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Subject Tasks" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-green-500">task_alt</span>
            {subject?.name || 'Tasks'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            {subject?.code ? `Code: ${subject.code}` : 'Subject tasks and assignments'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
          <select
            value={filters.category}
            onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="Task">Task</option>
            <option value="Assignment">Assignment</option>
            <option value="Custom">Custom</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Tasks List */}
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
              </div>
            </Card>
          ) : (
            tasks.map(task => (
              <Card
                key={task._id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewTask(task._id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                      <Badge variant={task.category === 'Task' ? 'blue' : task.category === 'Assignment' ? 'green' : 'purple'}>
                        {task.category}
                      </Badge>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {task.description.substring(0, 150)}
                      {task.description.length > 150 ? '...' : ''}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">person</span>
                        <span>By {task.createdBy?.name}</span>
                      </div>
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">attachment</span>
                          <span>{task.attachments.length} file(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge
                      variant={
                        task.status === 'Completed'
                          ? 'green'
                          : task.status === 'Submitted'
                          ? 'blue'
                          : task.status === 'In Progress'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {task.status}
                    </Badge>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTask(task._id);
                      }}
                      variant="secondary"
                      className="text-sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentTaskView;
