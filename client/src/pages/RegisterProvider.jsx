import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Briefcase } from 'lucide-react';

const RegisterProvider = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '',
        category: 'Electrician', location: '', experience: '', termsAccepted: false
    });
    const { registerProvider } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const serviceCategories = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Other'];

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await registerProvider(formData);
        if (res.success) {
            navigate('/provider/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Join as Provider</h1>
                    <p className="text-gray-500">Grow your business with us</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone"
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-400" size={20} />
                            <select
                                name="category"
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500 appearance-none"
                            >
                                {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="location"
                                placeholder="Location"
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            name="experience"
                            placeholder="Experience (e.g. 5 Years)"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-green-500"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-green-500"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="termsAccepted"
                            id="terms"
                            onChange={handleChange}
                            required
                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600">
                            I agree to the <Link to="/terms" className="text-green-600 hover:underline">Terms and Conditions</Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-white font-semibold shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/30 transition-all"
                    >
                        Register as Provider
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/" className="text-green-600 font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterProvider;
