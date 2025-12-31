import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';

const RegisterClient = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: ''
    });
    const { registerClient } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await registerClient(formData);
        if (res.success) {
            navigate('/client/home');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Create Client Account</h1>
                    <p className="text-gray-500">Find the best services near you</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone Number"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-500/30 transition-all"
                    >
                        Register
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/" className="text-indigo-600 font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterClient;
