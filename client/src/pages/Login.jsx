import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { User, Lock, Briefcase } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('client');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(email, password, role);
        if (res.success) {
            if (role === 'client') navigate('/client/home');
            else if (role === 'provider') navigate('/provider/dashboard');
        } else {
            setError(res.message);
        }
    };

    // Forgot Pass State
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    const handleForgot = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/forgot-password', { email: forgotEmail });
            alert('Password reset link sent to your email.');
            setShowForgot(false);
        } catch (err) {
            console.error('Forgot Password Error:', err);
            alert(err.response?.data?.message || 'Failed to send email. Check console for details.');
        }
    };

    if (showForgot) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
                    <p className="text-center text-gray-500 mb-6">Enter your email to receive a reset link.</p>
                    <form onSubmit={handleForgot} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="john@example.com"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                            Send Reset Link
                        </button>
                        <button type="button" onClick={() => setShowForgot(false)} className="w-full text-indigo-600 font-medium py-2">
                            Back to Login
                        </button>
                    </form>

                    <div className="mt-6 border-t pt-4 text-center">
                        <p className="text-gray-500 text-sm mb-2">Already have a code?</p>
                        <button
                            onClick={() => {
                                const code = prompt('Enter your reset code:');
                                if (code) navigate(`/reset-password/${code}`);
                            }}
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            Enter Code Here
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        ServiceLink
                    </h1>
                    <p className="text-gray-500 mt-2">Welcome back!</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <button
                        onClick={() => setRole('client')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${role === 'client' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        User
                    </button>
                    <button
                        onClick={() => setRole('provider')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${role === 'provider' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Provider
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-transform active:scale-95 ${role === 'client'
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-indigo-500/30'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/30'
                            }`}
                    >
                        Login
                    </button>

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                            Forgot Password?
                        </button>
                    </div>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    New to ServiceLink?{' '}
                    <Link
                        to={role === 'client' ? '/register-client' : '/register-provider'}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
