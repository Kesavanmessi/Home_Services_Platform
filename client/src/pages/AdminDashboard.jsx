import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shield, CheckCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
    const [pendingProviders, setPendingProviders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/providers/pending');
            setPendingProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch pending providers', err);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this provider?')) return;
        setLoading(true);
        try {
            await api.put(`/admin/providers/${id}/approve`);
            setPendingProviders(pendingProviders.filter(p => p._id !== id));
            alert('Provider Approved');
        } catch (err) {
            console.error(err);
            alert('Failed to approve');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gray-800 text-white p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="text-yellow-400" size={32} />
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    </div>
                    <p className="text-gray-400">Manage Platform & Verification</p>
                </div>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" />
                        Pending Approvals
                    </h2>

                    {pendingProviders.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                            <p className="text-gray-500">All caught up! No pending providers.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingProviders.map(provider => (
                                <div key={provider._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{provider.name}</h3>
                                            <p className="text-indigo-600 font-medium text-sm mb-1">{provider.category}</p>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <p>📍 {provider.location}</p>
                                                <p>💼 {provider.experience || 'No exp listed'}</p>
                                                <p>📧 {provider.email}</p>
                                                <p>📱 {provider.phone}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleApprove(provider._id)}
                                            disabled={loading}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
