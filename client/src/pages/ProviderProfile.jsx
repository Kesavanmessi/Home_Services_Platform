import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Home, Wallet, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';

const ProviderProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/provider/profile');
                if (res.data) setProfile(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAddMoney = async () => {
        const amount = prompt('Enter amount to add (₹):');
        if (!amount || isNaN(amount) || Number(amount) <= 0) return;

        setLoading(true);
        try {
            // 1. Create Order
            const orderRes = await api.post('/transactions/create-order', { amount: Number(amount) });
            const { id: order_id, amount: order_amount, currency } = orderRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: "rzp_test_S0xajGOQ9353ZF", // Public Key
                amount: order_amount,
                currency: currency,
                name: "Home Services Platform",
                description: "Wallet Top-up",
                order_id: order_id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        await api.post('/transactions/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: Number(amount)
                        });
                        alert('Payment Successful! Wallet Credited.');
                        window.location.reload();
                    } catch (verifyErr) {
                        console.error(verifyErr);
                        alert('Payment Verification Failed');
                    }
                },
                prefill: {
                    name: profile.name,
                    email: profile.email,
                    contact: profile.phone
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            rzp.open();

        } catch (err) {
            console.error(err);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return <div className="p-10 text-center">Loading...</div>;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified': return <CheckCircle size={20} className="text-green-500" />;
            case 'pending_documents':
            case 'pending_verification': return <Clock size={20} className="text-orange-500" />;
            default: return <XCircle size={20} className="text-red-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-8 rounded-b-3xl text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative">
                        <User size={40} className="text-white" />
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                            {getStatusIcon(profile.verificationStatus)}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-green-100">{profile.category} Specialist</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Wallet Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-green-50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Wallet Balance</p>
                                <h2 className="text-3xl font-bold text-gray-800">₹{profile.walletBalance || 0}</h2>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full text-green-600">
                                <Wallet size={24} />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAddMoney} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50">
                                {loading ? 'Processing...' : '+ Add Money'}
                            </button>
                            <Link to="/provider/transactions" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm text-center hover:bg-gray-200 transition">
                                History
                            </Link>
                        </div>
                    </div>

                    {/* Stats / Trials */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Zap size={12} className="text-yellow-500" /> Trial Jobs</p>
                            <p className="text-xl font-bold">{profile.trialJobsLeft} Left</p>
                        </div>
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><CheckCircle size={12} className="text-blue-500" /> Status</p>
                            <p className="text-sm font-bold capitalize">{profile.verificationStatus.replace('_', ' ')}</p>
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
                                <p className="font-medium text-gray-800">{profile.phone}</p>
                            </div>
                        </div>
                        <div className="p-4 border-b flex items-center gap-4">
                            <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-gray-800">{profile.email}</p>
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
                        <Link to="/provider/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
                            <Home size={24} />
                            <span className="text-xs font-medium">Home</span>
                        </Link>
                        <button className="flex flex-col items-center gap-1 text-green-600">
                            <User size={24} />
                            <span className="text-xs font-bold">Profile</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProviderProfile;
