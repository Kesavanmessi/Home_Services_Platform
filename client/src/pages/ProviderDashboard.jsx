import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { User, Zap, MapPin } from 'lucide-react';
import NotificationPanel from '../components/NotificationPanel';

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
    const [filterCategory, setFilterCategory] = useState({ category: 'All', location: '' });

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/nearby');
            setRequests(res.data);
            setFilteredRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let res = requests;
        if (filterCategory.location) {
            res = res.filter(r => r.location.toLowerCase().includes(filterCategory.location.toLowerCase()));
        }
        setFilteredRequests(res);
    }, [filterCategory, requests]);

    useEffect(() => {
        if (user) setIsAvailable(user.isAvailable);
        fetchRequests();
    }, [user]);

    const toggleAvailability = async () => {
        try {
            const res = await api.put('/provider/availability');
            setIsAvailable(res.data.isAvailable);
        } catch (err) {
            console.error('Failed to toggle availability', err);
        }
    };

    const handleAccept = async (id) => {
        if (!window.confirm('Accepting this request will deduct ₹30 from your wallet. Proceed?')) return;
        setLoading(true);
        try {
            await api.put(`/requests/${id}/accept`);
            alert('Request Accepted! Client will be notified.');
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to accept request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-b-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome, {user?.name.split(' ')[0]}!</h1>
                            <p className="text-green-100 text-sm mb-1">{user?.category} • Verified {user?.isVerified ? '✓' : '(Pending)'}</p>
                            <a href="/provider/transactions" className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">View Wallet</a>
                        </div>
                        <div className="flex gap-2">
                            <NotificationPanel />
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <User size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3 rounded-xl mb-4">
                        <span className="font-medium text-sm">Status: {isAvailable ? 'Available' : 'Unavailable'}</span>
                        <button
                            onClick={toggleAvailability}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isAvailable ? 'bg-white text-green-600' : 'bg-gray-400 text-gray-100'
                                }`}
                        >
                            {isAvailable ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">4.8</p>
                            <p className="text-xs text-green-100">Rating</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">{user?.jobsCompleted || 0}</p>
                            <p className="text-xs text-green-100">Jobs</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold">12</p>
                            <p className="text-xs text-green-100">This Month</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm mb-4">
                        <input
                            type="text"
                            placeholder="Filter by Location..."
                            className="w-full bg-white/20 placeholder-green-100 text-white p-2 rounded-lg text-sm border-none focus:ring-1 focus:ring-white"
                            value={filterCategory.location}
                            onChange={(e) => setFilterCategory({ ...filterCategory, location: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                        New Requests ({filteredRequests.length})
                    </h2>

                    <div className="space-y-4">
                        {filteredRequests.length === 0 ? <p className="text-center text-gray-500">No new requests nearby.</p> : filteredRequests.map(req => (
                            <div key={req._id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3">
                                        <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center">
                                            <Zap className="text-yellow-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{req.category}</h3>
                                            <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{req.problemDescription}</p>
                                <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                                    <MapPin size={14} />
                                    <span>{req.location}</span>
                                </div>
                                <button
                                    onClick={() => handleAccept(req._id)}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    Accept Request (₹30)
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                        <p className="text-sm text-gray-700">
                            <strong>Info:</strong> Accepting a request costs ₹30. Your phone number will be shared with the client after they confirm you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDashboard;
