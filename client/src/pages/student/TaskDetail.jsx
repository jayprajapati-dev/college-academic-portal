import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudentLayout, Card, LoadingSpinner, Button } from '../../components';
import axios from 'axios';

const StudentTaskDetail = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setTask(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmitTask = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/tasks/${taskId}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        const updated = await axios.get(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (updated.data?.success) {
          setTask(updated.data.data);
        }
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert(error.response?.data?.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Task Details" onLogout={handleLogout}>
        <LoadingSpinner />
      </StudentLayout>
    );
  }

  if (!task) {
    return (
      <StudentLayout title="Task Details" onLogout={handleLogout}>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Task not found</p>
          </div>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Task Details" onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-1">{task.subjectId?.name}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Description</h3>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap">{task.description}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {task.dueDate && (
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              )}
              {task.createdBy?.name && <span>By: {task.createdBy.name}</span>}
              {task.category && <span>Category: {task.category}</span>}
              {task.studentStatus && (
                <span className="capitalize">Status: {task.studentStatus}</span>
              )}
            </div>
          </div>
        </Card>

        {task.studentStatus !== 'submitted' && task.studentStatus !== 'completed' && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Submission</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tap submit to mark this task as completed.
                </p>
              </div>
              <Button
                onClick={handleSubmitTask}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? 'Submitting...' : 'Mark as Submitted'}
              </Button>
            </div>
          </Card>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
            <div className="space-y-2">
              {task.attachments.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>{file.name || 'Attachment'}</span>
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentTaskDetail;
