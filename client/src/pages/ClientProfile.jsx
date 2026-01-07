import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Home, Wallet } from 'lucide-react';

const ClientProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAddMoney = async () => {
        const amount = prompt('Enter amount to add (₹):');
        if (!amount || isNaN(amount) || Number(amount) <= 0) return;

        try {
            await api.post('/transactions/add', { amount: Number(amount) });
            alert('Money Added Successfully!');
            // Refresh logic would go here, maybe re-login or refetch user context
            window.location.reload(); // Simple refresh to update balance
        } catch (err) {
            console.error(err);
            alert('Failed to add money');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8 rounded-b-3xl text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <User size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-blue-100">{user.email}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Wallet Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Wallet Balance</p>
                                <h2 className="text-3xl font-bold text-gray-800">₹{user.walletBalance || 0}</h2>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <Wallet size={24} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAddMoney} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                                + Add Money
                            </button>
                            <Link to="/client/transactions" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm text-center hover:bg-gray-200 transition">
                                History
                            </Link>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b flex items-center gap-4">
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-medium text-gray-800">{user.phone}</p>
                            </div>
                        </div>
                        <div className="p-4 border-b flex items-center gap-4">
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-gray-800">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-top">
                    <div className="max-w-md mx-auto flex justify-around">
                        <Link to="/client/home" className="flex flex-col items-center gap-1 text-gray-400">
                            <Home size={24} />
                            <span className="text-xs font-medium">Home</span>
                        </Link>
                        <button className="flex flex-col items-center gap-1 text-indigo-600">
                            <User size={24} />
                            <span className="text-xs font-bold">Profile</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientProfile;
