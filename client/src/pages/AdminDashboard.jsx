import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shield, Clock, CheckCircle, XCircle, FileText, Calendar, X, Filter, Users, Star, LayoutList } from 'lucide-react';

import { useLocation } from 'react-router-dom';

const AdminDashboard = () => {
    const location = useLocation();
    const getInitialTab = () => {
        if (location.pathname.includes('/providers')) return 'providers';
        if (location.pathname.includes('/users')) return 'users';
        if (location.pathname.includes('/requests')) return 'jobs';
        return 'verification';
    };
    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Update tab if location changes (e.g. sidebar navigation)
    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location]);

    // Verification State
    const [pendingProviders, setPendingProviders] = useState([]);

    // All Providers State
    const [allProviders, setAllProviders] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filters, setFilters] = useState({ search: '', category: 'All', sortBy: 'createdAt', order: 'desc' });

    // Review State
    const [providerReviews, setProviderReviews] = useState([]);

    // Job Reports State
    const [jobReports, setJobReports] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null); // Contains { job, reviews }
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [statusModal, setStatusModal] = useState({ show: false, type: '', entity: null, entityType: '' }); // type: 'suspend' | 'ban'
    const [statusReason, setStatusReason] = useState('');
    const [statusDuration, setStatusDuration] = useState(0); // 0 = indefinite, else days
    const [loading, setLoading] = useState(false);

    const fetchJobs = async () => {
        try {
            const res = await api.get('/admin/jobs/report');
            setJobReports(res.data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        }
    };

    const fetchJobDetails = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/jobs/${id}/details`);
            setSelectedJob(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'verification') fetchPending();
        if (activeTab === 'providers') fetchAllProviders();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'jobs') fetchJobs();
    }, [activeTab, filters]);

    // ... (rest of useEffects)

    // Missing Handlers Implementation
    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/providers/pending');
            setPendingProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch pending providers', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProviders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/providers/all', { params: filters });
            setAllProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch all providers', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users/all');
            setAllUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusReason) return alert('Reason is required');
        try {
            const url = statusModal.entityType === 'user'
                ? `/admin/users/${statusModal.entity._id}/status`
                : `/admin/providers/${statusModal.entity._id}/status`;

            const newStatus = statusModal.type === 'ban' ? 'banned' : statusModal.type === 'suspend' ? 'suspended' : 'active';

            await api.put(url, { status: newStatus, reason: statusReason, suspensionDuration: statusDuration });

            setStatusModal({ show: false, type: '', entity: null, entityType: '' });
            setStatusReason('');

            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'providers') fetchAllProviders();

            // Close details modals if open
            setSelectedProvider(null);
            setSelectedUser(null);
        } catch (err) {
            console.error('Status update failed', err);
            alert('Failed to update status');
        }
    };

    const openStatusModal = (type, entity, entityType) => {
        setStatusModal({ show: true, type, entity, entityType });
        setStatusReason('');
        setStatusDuration(0);
    };

    const handleAction = async (action, id, data = {}) => {
        try {
            let url = '';
            if (action === 'verify_docs') url = `/admin/providers/${id}/verify-docs`;
            else if (action === 'reject_docs') url = `/admin/providers/${id}/reject-docs`;
            else if (action === 'approve') url = `/admin/providers/${id}/approve`;
            else if (action === 'fail') url = `/admin/providers/${id}/fail`;
            else if (action === 'schedule_interview') url = `/admin/providers/${id}/schedule-interview`;

            if (url) {
                await api.put(url, data);
                // Refresh data
                if (activeTab === 'verification') fetchPending();
                if (activeTab === 'providers') fetchAllProviders();
                setSelectedProvider(null); // Close modal
            }
        } catch (err) {
            console.error('Action failed', err);
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-gray-800" size={32} />
                    <h1 className="text-2xl font-bold text-gray-800">Admin Control Center</h1>
                </div>
            </div> */
            /* Removed redundant header and tabs as per user request */}

            {/* --- VERIFICATION TAB --- */}
            {activeTab === 'verification' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* ... existing verification code ... */}
                    {pendingProviders.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No pending verifications.</p>}
                    {pendingProviders.map(provider => (
                        <div key={provider._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                            {/* ... provider card content ... */}
                            <div className="flex justify-between mb-4">
                                <h3 className="font-bold text-lg">{provider.name}</h3>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">{provider.verificationStatus}</span>
                            </div>
                            <button onClick={() => setSelectedProvider(provider)} className="bg-gray-900 text-white w-full py-2 rounded-lg">Details</button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- ALL PROVIDERS TAB --- */}
            {activeTab === 'providers' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b"><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Account</th><th className="p-3">Action</th></tr>
                            </thead>
                            <tbody>
                                {allProviders.map(p => (
                                    <tr key={p._id} className="border-b">
                                        <td className="p-3">{p.name}</td>
                                        <td className="p-3">{p.isVerified ? 'Verified' : 'Pending'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.accountStatus === 'banned' ? 'bg-red-100 text-red-800' : p.accountStatus === 'suspended' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                {p.accountStatus?.toUpperCase() || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="p-3"><button onClick={() => setSelectedProvider(p)} className="text-indigo-600 hover:underline">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-bold mb-4">All Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Joined</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u._id} className="border-b">
                                        <td className="p-3 font-medium">{u.name}</td>
                                        <td className="p-3 text-sm text-gray-500">{u.email}</td>
                                        <td className="p-3 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.accountStatus === 'banned' ? 'bg-red-100 text-red-800' : u.accountStatus === 'suspended' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.accountStatus?.toUpperCase() || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => setSelectedUser(u)} className="text-indigo-600 font-medium hover:underline">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- JOB REPORTS TAB --- */}
            {activeTab === 'jobs' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-bold mb-4">Job Reports</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Client</th>
                                    <th className="p-3">Provider</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobReports.map(job => (
                                    <tr key={job._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm">{new Date(job.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{job.category}</span></td>
                                        <td className="p-3 text-sm">{job.client?.name || 'Unknown'}</td>
                                        <td className="p-3 text-sm">{job.provider?.name || 'Pending'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                job.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {job.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => fetchJobDetails(job._id)}
                                                className="text-indigo-600 font-bold text-sm hover:underline"
                                            >
                                                View Report
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* JOB DETAIL (REPORT) MODAL */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 relative">
                        <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>

                        <h2 className="text-2xl font-bold mb-1">Job Report</h2>
                        <p className="text-gray-500 text-sm mb-6">ID: {selectedJob.job._id}</p>

                        <div className="space-y-6">
                            {/* 1. Timeline */}
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock size={18} /> Job Timeline</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b pb-1"><span>📅 Scheduled:</span> <span className="font-medium">{new Date(selectedJob.job.scheduledDate).toLocaleString()}</span></div>
                                    <div className="flex justify-between border-b pb-1"><span>✅ Accepted:</span> <span className="font-medium">{selectedJob.job.acceptedAt ? new Date(selectedJob.job.acceptedAt).toLocaleString() : 'Not Accepted'}</span></div>
                                    <div className="flex justify-between border-b pb-1"><span>▶️ Work Started:</span> <span className="font-medium">{selectedJob.job.startTime ? new Date(selectedJob.job.startTime).toLocaleString() : 'Not Started'}</span></div>
                                    <div className="flex justify-between"><span>🏁 Finished:</span> <span className="font-medium">{selectedJob.job.endTime ? new Date(selectedJob.job.endTime).toLocaleString() : 'Not Finished'}</span></div>
                                </div>
                            </div>

                            {/* 2. Status & Cancellation */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-blue-50 border-blue-100">
                                    <h4 className="font-bold text-blue-800">Status</h4>
                                    <p className="text-2xl font-bold text-blue-600 capitalize">{selectedJob.job.status.replace('_', ' ')}</p>
                                </div>
                                {selectedJob.job.status === 'cancelled' && (
                                    <div className="p-4 rounded-xl border bg-red-50 border-red-100">
                                        <h4 className="font-bold text-red-800">Cancellation</h4>
                                        <p className="text-sm"><strong>By:</strong> {selectedJob.job.cancelledBy}</p>
                                        <p className="text-sm"><strong>Reason:</strong> {selectedJob.job.cancellationReason}</p>
                                    </div>
                                )}
                            </div>

                            {/* 3. Parties */}
                            <div className="flex gap-4">
                                <div className="flex-1 p-3 border rounded-lg">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Client</p>
                                    <p className="font-bold">{selectedJob.job.client?.name}</p>
                                    <p className="text-xs text-gray-500">{selectedJob.job.client?.phone}</p>
                                </div>
                                <div className="flex-1 p-3 border rounded-lg">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Provider</p>
                                    <p className="font-bold">{selectedJob.job.provider?.name || 'None'}</p>
                                    <p className="text-xs text-gray-500">{selectedJob.job.provider?.phone}</p>
                                </div>
                            </div>

                            {/* 4. Reviews */}
                            {selectedJob.reviews && selectedJob.reviews.length > 0 ? (
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Star size={18} /> Reviews & Ratings</h3>
                                    <div className="space-y-3">
                                        {selectedJob.reviews.map(r => (
                                            <div key={r._id} className="bg-gray-50 p-3 rounded-lg border">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-sm">
                                                        {r.reviewerModel === 'User' ? 'Client' : 'Provider'} Review
                                                    </span>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />)}
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold mt-1">Reviewer: {r.reviewer?.name}</p>
                                                <p className="text-sm italic text-gray-600 mt-1">"{r.comment}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border text-gray-500 text-sm">No reviews for this job yet.</div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* Provider Detail Modal (Existing) */}
            {selectedProvider && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedProvider(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} />
                        </button>
                        {/* ... existing modal content ... reuse what was there or recreate simple ... */}
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800">{selectedProvider.name}</h2>
                                    <div className="flex items-center gap-2 mt-2 text-gray-500">
                                        <span className="font-medium bg-gray-100 px-2 py-1 rounded text-sm">{selectedProvider.category}</span>
                                        <span>•</span>
                                        <span className="text-sm">{selectedProvider.email}</span>
                                        <span>•</span>
                                        <span className="text-sm">{selectedProvider.phone}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedProvider.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {selectedProvider.verificationStatus.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">Joined: {new Date(selectedProvider.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Experience</p>
                                    <p className="font-bold">{selectedProvider.experience || 'N/A'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                                    <div className="flex justify-center items-center gap-1 font-bold">
                                        {selectedProvider.rating.toFixed(1)} <Star size={14} className="text-yellow-500 fill-current" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Jobs Done</p>
                                    <p className="font-bold">{selectedProvider.jobsCompleted}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Wallet</p>
                                    <p className="font-bold text-green-600">₹{selectedProvider.walletBalance}</p>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText size={20} /> Identity Documents</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Selfie */}
                                    <div className="border rounded-xl p-4">
                                        <p className="font-bold text-sm mb-2 text-gray-600">Selfie / Photo</p>
                                        {selectedProvider.documents?.selfie ? (
                                            <img
                                                src={selectedProvider.documents.selfie}
                                                alt="Selfie"
                                                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                                            />
                                        ) : (
                                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 italic">No Selfie Uploaded</div>
                                        )}
                                    </div>

                                    {/* ID Proof */}
                                    <div className="border rounded-xl p-4">
                                        <p className="font-bold text-sm mb-2 text-gray-600">ID Proof (PDF/Image)</p>
                                        {selectedProvider.documents?.idProof ? (
                                            selectedProvider.documents.idProof.includes('application/pdf') ? (
                                                <iframe
                                                    src={selectedProvider.documents.idProof}
                                                    className="w-full h-64 rounded-lg bg-gray-100 border"
                                                    title="ID Proof PDF"
                                                ></iframe>
                                            ) : (
                                                <img
                                                    src={selectedProvider.documents.idProof}
                                                    alt="ID Proof"
                                                    className="w-full h-64 object-contain rounded-lg bg-gray-100"
                                                />
                                            )
                                        ) : (
                                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 italic">No ID Proof Uploaded</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* documents section end */}

                            {/* Account Status Actions */}
                            <div className="pt-4 border-t">
                                <h3 className="font-bold text-gray-800 mb-2">Account Actions</h3>
                                <div className="flex gap-2">
                                    {selectedProvider.accountStatus !== 'suspended' && (
                                        <button
                                            onClick={() => openStatusModal('suspend', selectedProvider, 'provider')}
                                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-bold text-sm"
                                        >
                                            Suspend Account
                                        </button>
                                    )}
                                    {selectedProvider.accountStatus === 'suspended' && (
                                        <button
                                            onClick={() => openStatusModal('active', selectedProvider, 'provider')}
                                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold text-sm"
                                        >
                                            Re-activate Account
                                        </button>
                                    )}
                                    {selectedProvider.accountStatus !== 'banned' && (
                                        <button
                                            onClick={() => openStatusModal('ban', selectedProvider, 'provider')}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold text-sm"
                                        >
                                            Ban Permanently
                                        </button>
                                    )}
                                </div>
                                {selectedProvider.banReason && (
                                    <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded border border-red-100">
                                        <strong>Reason for Action:</strong> {selectedProvider.banReason}
                                    </div>
                                )}
                            </div>

                            {/* Verification Actions */}
                            {selectedProvider.verificationStatus.includes('pending') && (
                                <div className="flex gap-4 pt-4 border-t">
                                    <button
                                        onClick={() => handleAction('verify_docs', selectedProvider._id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle size={20} /> Approve Documents
                                    </button>
                                    <button
                                        onClick={() => handleAction('reject_docs', selectedProvider._id)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
                                    >
                                        <XCircle size={20} /> Reject Documents
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>

                        <h2 className="text-2xl font-bold mb-4">{selectedUser.name}</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium">{selectedUser.email}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-500">Phone</span>
                                <span className="font-medium">{selectedUser.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-500">Joined</span>
                                <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${selectedUser.accountStatus === 'banned' ? 'bg-red-100 text-red-800' : selectedUser.accountStatus === 'suspended' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                    {selectedUser.accountStatus?.toUpperCase() || 'ACTIVE'}
                                </span>
                            </div>

                            {selectedUser.banReason && (
                                <div className="bg-red-50 p-3 rounded border border-red-100 text-sm text-red-800">
                                    <strong>Status Reason:</strong> {selectedUser.banReason}
                                </div>
                            )}

                            <div className="pt-4 flex gap-2">
                                {selectedUser.accountStatus !== 'suspended' && (
                                    <button
                                        onClick={() => openStatusModal('suspend', selectedUser, 'user')}
                                        className="flex-1 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-bold text-sm"
                                    >
                                        Suspend
                                    </button>
                                )}
                                {selectedUser.accountStatus === 'suspended' && (
                                    <button
                                        onClick={() => openStatusModal('active', selectedUser, 'user')}
                                        className="flex-1 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-bold text-sm"
                                    >
                                        Re-activate
                                    </button>
                                )}
                                {selectedUser.accountStatus !== 'banned' && (
                                    <button
                                        onClick={() => openStatusModal('ban', selectedUser, 'user')}
                                        className="flex-1 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold text-sm"
                                    >
                                        Ban
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal (Reason) */}
            {statusModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6">
                        <h3 className="text-lg font-bold mb-2 capitalize">{statusModal.type === 'active' ? 'Re-activate Account' : `${statusModal.type} Account`}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {statusModal.type === 'active'
                                ? 'Are you sure you want to re-activate this account?'
                                : `Please provide a reason for ${statusModal.type}ing this account.`}
                        </p>

                        {statusModal.type !== 'active' && (
                            <div className="space-y-4 mb-4">
                                {statusModal.type === 'suspend' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Suspension Duration</label>
                                        <select
                                            value={statusDuration}
                                            onChange={(e) => setStatusDuration(Number(e.target.value))}
                                            className="w-full border rounded-lg p-3 text-sm focus:outline-indigo-500 bg-white"
                                        >
                                            <option value={0}>Indefinite (Manual Reactivation)</option>
                                            <option value={1}>24 Hours</option>
                                            <option value={3}>3 Days</option>
                                            <option value={7}>7 Days</option>
                                            <option value={30}>30 Days</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                                    <textarea
                                        value={statusReason}
                                        onChange={(e) => setStatusReason(e.target.value)}
                                        placeholder="Enter reason (e.g. Violation of T&C)..."
                                        className="w-full border rounded-lg p-3 text-sm h-24 focus:outline-indigo-500"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setStatusModal({ ...statusModal, show: false })}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-bold ${statusModal.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
