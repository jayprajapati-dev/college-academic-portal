import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminLayout, Card, HodLayout, LoadingSpinner, TeacherLayout } from '../components';

const parseStoredUser = () => {
	try {
		return JSON.parse(localStorage.getItem('user') || '{}');
	} catch (_) {
		return {};
	}
};

const ExamManagement = () => {
	const navigate = useNavigate();
	const storedUser = parseStoredUser();
	const role = storedUser?.role;
	const token = localStorage.getItem('token');

	const Layout = useMemo(() => {
		if (role === 'admin') return AdminLayout;
		if (role === 'hod') return HodLayout;
		return TeacherLayout;
	}, [role]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [schedules, setSchedules] = useState([]);

	const examStats = useMemo(() => {
		const total = schedules.length;
		const scheduled = schedules.filter((item) => (item.status || 'scheduled') === 'scheduled').length;
		const completed = schedules.filter((item) => item.status === 'completed').length;
		const cancelled = schedules.filter((item) => item.status === 'cancelled').length;
		return { total, scheduled, completed, cancelled };
	}, [schedules]);

	const statusPill = (status = 'scheduled') => {
		if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
		if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
		return 'bg-amber-100 text-amber-700';
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		navigate('/login');
	};

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}
		if (!['admin', 'hod', 'teacher'].includes(role)) {
			navigate('/login');
			return;
		}

		let isMounted = true;
		const load = async () => {
			try {
				setLoading(true);
				setError('');
				const response = await axios.get('/api/exams/schedules', {
					headers: { Authorization: `Bearer ${token}` },
					params: { page: 1, limit: 10, status: 'all' }
				});

				if (!isMounted) return;
				if (response.data?.success) {
					setSchedules(Array.isArray(response.data.data) ? response.data.data : []);
				} else {
					setSchedules([]);
				}
			} catch (err) {
				if (!isMounted) return;
				setError(err?.response?.data?.message || 'Failed to load exams');
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		load();
		return () => {
			isMounted = false;
		};
	}, [navigate, role, token]);

	if (loading) {
		return (
			<Layout title="Exams" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
				<LoadingSpinner />
			</Layout>
		);
	}

	return (
		<Layout title="Exams" userName={storedUser?.name || 'User'} onLogout={handleLogout}>
			<div className="space-y-6">
				<section className="rounded-3xl bg-gradient-to-r from-[#1e293b] via-[#1d4ed8] to-[#0ea5e9] text-white p-6 md:p-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-sky-100">Assessment Desk</p>
							<h1 className="text-2xl md:text-3xl font-black mt-1">Exam Management</h1>
							<p className="text-sm text-sky-100 mt-1">Manage schedules and review exam records in one place.</p>
						</div>
						<div className="flex flex-wrap gap-2 text-xs font-semibold">
							<span className="px-3 py-1 rounded-full bg-white/15">Total: {examStats.total}</span>
							<span className="px-3 py-1 rounded-full bg-white/15">Scheduled: {examStats.scheduled}</span>
							<span className="px-3 py-1 rounded-full bg-white/15">Completed: {examStats.completed}</span>
						</div>
					</div>
				</section>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
						<p className="text-xs text-[#6B7280]">All Exams</p>
						<p className="text-2xl font-black text-[#111827] mt-1">{examStats.total}</p>
					</div>
					<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
						<p className="text-xs text-[#6B7280]">Scheduled</p>
						<p className="text-2xl font-black text-amber-600 mt-1">{examStats.scheduled}</p>
					</div>
					<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
						<p className="text-xs text-[#6B7280]">Completed</p>
						<p className="text-2xl font-black text-emerald-600 mt-1">{examStats.completed}</p>
					</div>
					<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
						<p className="text-xs text-[#6B7280]">Cancelled</p>
						<p className="text-2xl font-black text-rose-600 mt-1">{examStats.cancelled}</p>
					</div>
				</div>

				{error && (
					<Card className="border border-rose-200 bg-rose-50">
						<p className="text-sm font-semibold text-rose-700">{error}</p>
					</Card>
				)}

				<Card className="border border-[#E5E7EB]">
					<h2 className="text-xl font-bold text-gray-900 mb-4">Recent Schedules</h2>
					{schedules.length === 0 ? (
						<p className="text-sm text-gray-500">No exam schedules found.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Exam</th>
										<th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Subject</th>
										<th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Date</th>
										<th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-600">Status</th>
									</tr>
								</thead>
								<tbody>
									{schedules.map((schedule) => (
										<tr key={schedule._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
											<td className="px-4 py-3 text-sm font-semibold text-gray-800">{schedule.examName || 'Exam'}</td>
											<td className="px-4 py-3 text-sm text-gray-700">{schedule.subjectId?.name || 'N/A'}</td>
											<td className="px-4 py-3 text-sm text-gray-600">{schedule.date ? String(schedule.date).slice(0, 10) : 'N/A'}</td>
											<td className="px-4 py-3 text-sm">
												<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${statusPill(schedule.status || 'scheduled')}`}>
													{schedule.status || 'scheduled'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</div>
		</Layout>
	);
};

export default ExamManagement;
