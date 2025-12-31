import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Force 'admin' role for this login page
        const res = await login(email, password, 'admin');
        if (res.success) {
            navigate('/admin');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-800 p-8 text-center border-b border-gray-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
                        <Shield className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-gray-400 text-sm mt-1">Restricted Access Only</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pl-10 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                                    required
                                />
                                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors shadow-lg mt-2"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Unauthorized access is monitored and reported.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
