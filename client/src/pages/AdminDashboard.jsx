import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shield, Clock, CheckCircle, XCircle, FileText, Calendar, X, Filter, Users, Star, LayoutList } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('verification'); // 'verification' or 'providers'

    // Verification State
    const [pendingProviders, setPendingProviders] = useState([]);

    // All Providers State
    const [allProviders, setAllProviders] = useState([]);
    const [filters, setFilters] = useState({ search: '', category: 'All', sortBy: 'createdAt', order: 'desc' });

    // Review State
    const [providerReviews, setProviderReviews] = useState([]);

    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [interviewDate, setInterviewDate] = useState('');

    const serviceCategories = ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Other'];

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/providers/pending');
            setPendingProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch pending providers', err);
        }
    };

    const fetchAllProviders = async () => {
        setLoading(true);
        try {
            const { search, category, sortBy, order } = filters;
            const query = new URLSearchParams({ search, category, sortBy, order }).toString();
            const res = await api.get(`/admin/providers/all?${query}`);
            setAllProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch providers', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (providerId) => {
        try {
            const res = await api.get(`/admin/reviews/${providerId}`);
            setProviderReviews(res.data);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
            setProviderReviews([]);
        }
    };

    useEffect(() => {
        if (activeTab === 'verification') fetchPending();
        if (activeTab === 'providers') fetchAllProviders();
    }, [activeTab, filters]);

    useEffect(() => {
        if (selectedProvider && activeTab === 'providers') {
            fetchReviews(selectedProvider._id);
        }
    }, [selectedProvider]);

    const handleAction = async (action, id, data = {}) => {
        if (!window.confirm('Are you sure you want to perform this action?')) return;
        setLoading(true);
        try {
            let url = `/admin/providers/${id}`;
            let method = 'put';

            if (action === 'verify_docs') url += '/verify-docs';
            if (action === 'reject_docs') url += '/reject-docs';
            if (action === 'schedule_interview') {
                url += '/schedule-interview';
                data = { date: interviewDate };
            }
            if (action === 'approve') url += '/approve';
            if (action === 'fail') url += '/fail';

            await api.put(url, data);
            alert('Action Successful');
            setSelectedProvider(null);
            fetchPending();
            if (activeTab === 'providers') fetchAllProviders(); // Refresh list if needed
        } catch (err) {
            console.error(err);
            alert('Action Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-gray-800" size={32} />
                    <h1 className="text-2xl font-bold text-gray-800">Admin Control Center</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${activeTab === 'verification' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Shield size={16} /> Verification
                    </button>
                    <button
                        onClick={() => setActiveTab('providers')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${activeTab === 'providers' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users size={16} /> All Providers
                    </button>
                </div>
            </div>

            {/* --- VERIFICATION TAB --- */}
            {activeTab === 'verification' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pendingProviders.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No pending verifications.</p>}

                    {pendingProviders.map(provider => (
                        <div key={provider._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{provider.name}</h3>
                                    <p className="text-indigo-600 text-sm">{provider.category}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold h-fit ${provider.verificationStatus.includes('pending') ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {provider.verificationStatus.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="text-sm text-gray-500 space-y-1 mb-4">
                                <p>📧 {provider.email}</p>
                                <p>📱 {provider.phone}</p>
                                <p>📍 {provider.location}</p>
                            </div>

                            <button
                                onClick={() => setSelectedProvider(provider)}
                                className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800"
                            >
                                Open Details
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- ALL PROVIDERS TAB --- */}
            {activeTab === 'providers' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search Name, Email, Phone..."
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
                            />
                        </div>

                        <select
                            value={filters.category}
                            onChange={e => setFilters({ ...filters, category: e.target.value })}
                            className="border rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
                        >
                            {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>

                        <select
                            value={filters.sortBy}
                            onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
                            className="border rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="createdAt">Date Joined</option>
                            <option value="rating">Rating</option>
                            <option value="jobsCompleted">Jobs Completed</option>
                            <option value="walletBalance">Wallet Balance</option>
                        </select>

                        <button
                            onClick={() => setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })}
                            className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"
                        >
                            {filters.order === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-sm border-b">
                                    <th className="p-3">Provider</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Location</th>
                                    <th className="p-3">Stats</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProviders.map(provider => (
                                    <tr key={provider._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <p className="font-bold text-gray-800">{provider.name}</p>
                                            <p className="text-xs text-gray-500">{provider.email}</p>
                                        </td>
                                        <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{provider.category}</span></td>
                                        <td className="p-3 text-sm">{provider.location}</td>
                                        <td className="p-3 text-sm">
                                            <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {provider.rating.toFixed(1)}</div>
                                            <div className="text-xs text-gray-500">{provider.jobsCompleted} Jobs</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs font-bold ${provider.isVerified ? 'text-green-600' : 'text-red-500'}`}>
                                                {provider.isVerified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => setSelectedProvider(provider)}
                                                className="text-indigo-600 font-bold text-sm hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedProvider && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedProvider(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex gap-6 mb-8">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-1">{selectedProvider.name}</h2>
                                <p className="text-gray-500">{selectedProvider.category} • {selectedProvider.location}</p>
                                <div className="flex gap-3 mt-4">
                                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                                        <p className="text-xs font-bold">Wallet</p>
                                        <p className="text-xl font-bold">₹{selectedProvider.walletBalance}</p>
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                                        <p className="text-xs font-bold">Jobs</p>
                                        <p className="text-xl font-bold">{selectedProvider.jobsCompleted}</p>
                                    </div>
                                    <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg">
                                        <p className="text-xs font-bold">Rating</p>
                                        <p className="text-xl font-bold flex items-center gap-1">{selectedProvider.rating.toFixed(1)} <Star size={16} fill="currentColor" /></p>
                                    </div>
                                </div>
                            </div>

                            {/* Only show verification buttons if in verification process */}
                            {!selectedProvider.isVerified && selectedProvider.verificationStatus !== 'failed' && (
                                <div className="border-l pl-6 w-1/3">
                                    <h3 className="font-bold mb-2">Verification Actions</h3>
                                    {/* Simplified Reuse of existing verification buttons logic */}
                                    {/* (Copying relevant parts from original modal logic here if needed, or keeping it strictly for status updates) */}
                                    <p className="text-sm text-gray-500 italic">Please use the Verification Tab to process approval for new providers. This view is for management and review.</p>
                                </div>
                            )}
                        </div>

                        {/* TABS INSIDE MODAL */}
                        <div className="mb-6">
                            <h3 className="font-bold text-xl border-b pb-2 mb-4">Documents & Info</h3>
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText size={18} /> ID Proof</h3>
                                    {selectedProvider.documents?.idProof ? (
                                        <img src={selectedProvider.documents.idProof} alt="ID" className="w-full h-48 object-cover rounded-lg border" />
                                    ) : <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">No Document</div>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText size={18} /> Selfie</h3>
                                    {selectedProvider.documents?.selfie ? (
                                        <img src={selectedProvider.documents.selfie} alt="Selfie" className="w-full h-48 object-cover rounded-lg border" />
                                    ) : <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">No Document</div>}
                                </div>
                            </div>
                        </div>

                        {/* REVIEWS SECTION */}
                        {activeTab === 'providers' && (
                            <div>
                                <h3 className="font-bold text-xl border-b pb-2 mb-4">Client Reviews</h3>
                                {providerReviews.length === 0 ? (
                                    <p className="text-gray-500 italic">No reviews yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {providerReviews.map(review => (
                                            <div key={review._id} className="bg-gray-50 p-4 rounded-xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-800">{review.client?.name || 'Unknown Client'}</p>
                                                        <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm">"{review.comment}"</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SHOW VERIFICATION ACTIONS ONLY IF IN VERIFICATION TAB OR STATUS IS RELEVANT */}
                        {activeTab === 'verification' && (
                            <div className="mt-6 border-t pt-6 bg-gray-50 -mx-8 -mb-8 p-8 rounded-b-2xl">
                                <h3 className="font-bold text-gray-800 mb-4">Verification Actions</h3>
                                <div className="flex gap-3 flex-wrap">
                                    {(selectedProvider.verificationStatus === 'pending_documents' || selectedProvider.verificationStatus === 'pending_verification') && (
                                        <>
                                            <button onClick={() => handleAction('verify_docs', selectedProvider._id)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Approve Documents</button>
                                            <button onClick={() => handleAction('reject_docs', selectedProvider._id)} className="flex-1 bg-red-100 text-red-600 py-3 rounded-lg font-bold hover:bg-red-200">Reject</button>
                                        </>
                                    )}
                                    {/* ... (Include other action buttons logic similarly if strictly needed, or trust the simplified view) ... */}
                                    {selectedProvider.verificationStatus === 'interview_scheduled' && (
                                        <>
                                            <button onClick={() => handleAction('approve', selectedProvider._id)} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700">Pass Interview (Activate)</button>
                                            <button onClick={() => handleAction('fail', selectedProvider._id)} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">Fail</button>
                                        </>
                                    )}
                                    {(selectedProvider.verificationStatus === 'pending_admin_schedule' || selectedProvider.verificationStatus === 'documents_verified') && (
                                        <div className="w-full flex gap-3">
                                            <input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="flex-1 border p-3 rounded-lg outline-none" />
                                            <button onClick={() => handleAction('schedule_interview', selectedProvider._id)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">Schedule</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
