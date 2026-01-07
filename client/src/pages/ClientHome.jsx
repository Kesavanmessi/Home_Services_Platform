import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Home, Search, User, Zap, Droplet, Hammer, PaintBucket, Wind, Wrench, MapPin } from 'lucide-react';

const ClientHome = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const serviceCategories = [
        { id: 1, name: 'Electrician', icon: Zap, color: 'bg-yellow-500' },
        { id: 2, name: 'Plumber', icon: Droplet, color: 'bg-blue-500' },
        { id: 3, name: 'Carpenter', icon: Hammer, color: 'bg-amber-600' },
        { id: 4, name: 'Painter', icon: PaintBucket, color: 'bg-purple-500' },
        { id: 5, name: 'AC Repair', icon: Wind, color: 'bg-cyan-500' },
        { id: 6, name: 'Other', icon: Wrench, color: 'bg-gray-500' }
    ];

    const filteredCategories = serviceCategories.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests/my-requests');
                setRequests(res.data);
            } catch (err) {
                console.error('Failed to fetch requests', err);
            }
        };
        fetchRequests();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-b-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Hi, {user?.name.split(' ')[0]}! 👋</h1>
                            <p className="text-blue-100 text-sm">What service do you need today?</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                <span className="font-serif">₹</span> {user?.walletBalance || 0}
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <User size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search for services..."
                            className="flex-1 outline-none text-gray-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Service Categories */}
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Services</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {filteredCategories.length === 0 ? (
                            <div className="col-span-3 text-center text-gray-500 py-4">
                                No services found.
                            </div>
                        ) : (
                            filteredCategories.map(service => {
                                const Icon = service.icon;
                                return (
                                    <Link
                                        key={service.id}
                                        to={`/client/create-request?category=${service.name}`}
                                        className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-col items-center gap-3"
                                    >
                                        <div className={`${service.color} w-14 h-14 rounded-xl flex items-center justify-center text-white`}>
                                            <Icon size={28} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 text-center">{service.name}</span>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Recent Requests */}
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Requests</h2>
                        {requests.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center">No active requests. Post one now!</p>
                        ) : (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req._id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center">
                                                    <Zap className="text-indigo-600" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{req.category}</h3>
                                                    <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                                    req.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{req.problemDescription}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <MapPin size={14} />
                                                <span>{req.location}</span>
                                            </div>
                                            <Link to={`/client/request/${req._id}`} className="text-indigo-600 text-sm font-medium">View Details</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-top">
                    <div className="max-w-md mx-auto flex justify-around">
                        <button className="flex flex-col items-center gap-1 text-indigo-600">
                            <Home size={24} />
                            <span className="text-xs font-medium">Home</span>
                        </button>
                        <Link to="/client/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
                            <User size={24} />
                            <span className="text-xs">Profile</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientHome;
