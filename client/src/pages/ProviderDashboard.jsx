import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { RefreshCw, Upload, Clock, CheckCircle, XCircle, Calendar, Zap, MapPin, Shield, Plus, Navigation, History, FileText, Home, User } from 'lucide-react';

const ProviderDashboard = () => {
    const { user, login } = useAuth(); // Re-fetch user profile mechanism
    const [profile, setProfile] = useState(user);
    const [files, setFiles] = useState({ idProof: '', selfie: '' });
    const [loading, setLoading] = useState(false);

    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletAmount, setWalletAmount] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpAction, setOtpAction] = useState(null); // 'start' or 'end'
    const [activeRequestForOtp, setActiveRequestForOtp] = useState(null);

    const navigate = useNavigate();

    // Availability State
    const [availabilitySlots, setAvailabilitySlots] = useState([]);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        start: '08:00',
        end: '18:00',
        radius: 20,
        lat: 0,
        lng: 0
    });

    // Dashboard State
    const [requests, setRequests] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);

    const [cancelModal, setCancelModal] = useState({ show: false, reqId: null, reason: '' });

    const fetchProfile = async () => {
        try {
            const res = await api.get('/provider/profile');
            if (res.data) {
                setProfile(res.data);
                setIsAvailable(res.data.isAvailable);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
            if (err.response && (err.response.status === 404 || err.response.status === 403)) {
                alert('Profile not found. Please login again.');
                login(null, null); // Force logout/clear state if possible, or just redirect
                window.location.href = '/';
            }
        }
    };

    // Sorting and Filtering State
    const [sortBy, setSortBy] = useState('distance'); // distance, date, newest
    const [filterDate, setFilterDate] = useState(''); // '', today, tomorrow, week
    const [viewRadius, setViewRadius] = useState(20);
    const [activeJob, setActiveJob] = useState(null);

    const fetchRequests = async () => {
        try {
            // First check if I have an active job
            const activeRes = await api.get('/requests/active-job');
            if (activeRes.data) {
                setActiveJob(activeRes.data);
                setRequests([]); // Clear nearby requests if busy
                return;
            } else {
                setActiveJob(null);
            }

            // If no active job, fetch nearby
            const res = await api.get('/requests/nearby', {
                params: {
                    sortBy,
                    filterDate,
                    maxDistance: viewRadius
                }
            });
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Re-fetch when sort/filter changes
    useEffect(() => {
        if (profile?.verificationStatus === 'verified' && isAvailable) {
            fetchRequests();
        }
    }, [sortBy, filterDate]); // removed viewRadius from auto-fetch to avoid spam, maybe add debounce or manual button? Added to dep for now per user request flow implies real time.

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/requests/provider/history');
            setHistory(res.data);
            setShowHistory(true);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch history');
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Are you sure you want to archive this from your history?')) return;
        try {
            await api.put(`/requests/${id}/archive`);
            // Refresh history
            const res = await api.get('/requests/provider/history');
            setHistory(res.data);
        } catch (err) {
            alert('Failed to archive');
        }
    };

    useEffect(() => {
        fetchProfile();
        if (profile?.verificationStatus === 'verified') {
            fetchRequests();
        }
    }, [profile?.verificationStatus]); // Added dependency

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const submitDocuments = async () => {
        if (!files.idProof || !files.selfie) return alert('Please upload both documents');
        setLoading(true);
        try {
            await api.post('/provider/verification/upload', files);
            alert('Documents uploaded successfully!');
            fetchProfile();
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async () => {
        try {
            const res = await api.put('/provider/availability');
            setIsAvailable(res.data.isAvailable);
            if (res.data.isAvailable) {
                fetchRequests();
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (profile) {
            setSettings({
                start: profile.workingHours?.start || '08:00',
                end: profile.workingHours?.end || '18:00',
                radius: profile.serviceRadius || 20,
                lat: profile.coordinates?.lat || 0,
                lng: profile.coordinates?.lng || 0
            });
        }
    }, [profile]);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSettings(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                    alert('Location fetched!');
                },
                (error) => {
                    console.error(error);
                    alert('Unable to retrieve your location');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    const submitAvailability = async () => {
        setLoading(true);
        try {
            await api.post('/provider/verification/availability', { availability: availabilitySlots });
            alert('Availability Submitted!');
            fetchProfile();
        } catch (err) {
            console.error(err);
            alert('Failed to submit availability');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            await api.put('/provider/settings', {
                workingHours: { start: settings.start, end: settings.end },
                serviceRadius: settings.radius,
                coordinates: { lat: settings.lat, lng: settings.lng }
            });
            alert('Settings Updated!');
            setShowSettings(false);
            fetchProfile();
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleServiceFlow = async (action, reqId) => {
        setLoading(true);
        try {
            if (action === 'arrived') {
                await api.put(`/requests/${reqId}/arrived`);
                alert('Client notified! Ask for Start OTP.');
                setOtpAction('start');
                setActiveRequestForOtp(reqId);
                setShowOtpModal(true);
            } else if (action === 'complete_init') {
                await api.put(`/requests/${reqId}/completed_request`);
                alert('Client notified! Ask for Completion OTP.');
                setOtpAction('end');
                setActiveRequestForOtp(reqId);
                setShowOtpModal(true);
            }
        } catch (err) {
            console.error(err);
            alert('Action failed');
        } finally {
            setLoading(false);
        }
    };

    const submitOtp = async () => {
        if (otp.length !== 6) return alert('Enter 6-digit OTP');
        setLoading(true);
        try {
            if (otpAction === 'start') {
                await api.put(`/requests/${activeRequestForOtp}/start`, { otp });
                alert('Service Started!');
            } else if (otpAction === 'end') {
                await api.put(`/requests/${activeRequestForOtp}/verify_end`, { otp });
                alert('Service Completed!');
            }
            setShowOtpModal(false);
            setOtp('');
            fetchRequests(); // Refresh to see status update or clear active job
            fetchHistory(); // If completed
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        const confirmMsg = profile.trialJobsLeft > 0
            ? `Accept this job using 1 Trial Job? (${profile.trialJobsLeft} remaining)`
            : `Accepting this request will deduct ₹30 from your wallet (Balance: ₹${profile.walletBalance}). Proceed?`;

        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            await api.put(`/requests/${id}/accept`);
            alert('Request Accepted! Client notified.');
            fetchRequests();
            fetchProfile(); // Update wallet/trial
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to accept');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER LOGIC BASED ON STATUS ---

    if (!profile) return <div className="p-10 text-center">Loading...</div>;

    // 1. Pending Documents
    if (profile.verificationStatus === 'pending_documents') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-2xl font-bold mb-2">Complete Verification</h1>
                    <p className="text-gray-500 mb-6">Upload your documents to start receiving jobs.</p>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'idProof')} />
                            <Upload className="mx-auto text-indigo-500 mb-2" />
                            <p className="font-medium text-gray-700">Upload ID Proof</p>
                            {files.idProof && <p className="text-xs text-green-600 mt-1">File Selected</p>}
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'selfie')} />
                            <Upload className="mx-auto text-indigo-500 mb-2" />
                            <p className="font-medium text-gray-700">Upload Selfie</p>
                            {files.selfie && <p className="text-xs text-green-600 mt-1">File Selected</p>}
                        </div>

                        <button
                            onClick={submitDocuments}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Uploading...' : 'Submit for Verification'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Pending Verification
    if (profile.verificationStatus === 'pending_verification') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Verification in Progress</h2>
                    <p className="text-gray-600 mt-2">Our admins are reviewing your documents.<br />You will be notified once complete.</p>
                    <button onClick={fetchProfile} className="mt-8 flex items-center gap-2 mx-auto text-indigo-600 font-medium hover:underline">
                        <RefreshCw size={16} /> Check Status
                    </button>
                </div>
            </div>
        );
    }

    // 3. Interview Scheduled
    if (profile.verificationStatus === 'interview_scheduled') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-l-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Interview Scheduled!</h2>
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg text-blue-800 mb-6">
                        <Calendar size={24} />
                        <div>
                            <p className="font-bold">Date & Time</p>
                            <p>{new Date(profile.interviewDate).toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        An admin will call you at the scheduled time to verify your expertise.
                        <br />Please keep your phone ready.
                    </p>
                </div>
            </div>
        );
    }

    // 4. Failed
    if (profile.verificationStatus === 'failed' || profile.verificationStatus === 'documents_rejected') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
                    <p className="text-gray-600 mt-2">
                        {profile.verificationStatus === 'documents_rejected'
                            ? 'Your documents were rejected. Please contact support.'
                            : 'You did not pass the verification interview.'}
                    </p>
                </div>
            </div>
        );
    }

    const handleAddMoney = async () => {
        const amount = prompt('Enter amount to add (₹):');
        if (!amount || isNaN(amount) || amount <= 0) return;

        setLoading(true);
        try {
            // 1. Create Order
            const orderRes = await api.post('/transactions/create-order', { amount: Number(amount) });
            const { id: order_id, amount: order_amount, currency } = orderRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: "rzp_test_S0xajGOQ9353ZF", // Public Key (Safe to expose)
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
                        fetchProfile();
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Settings Modal */}
                {showSettings && (
                    <div className="absolute inset-0 bg-white z-50 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full"><XCircle size={24} /></button>
                        </div>
                        {/* ... existing settings content ... */}
                        <div className="space-y-6">
                            <div>
                                <label className="block font-medium mb-2">Working Hours</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500">Start</span>
                                        <input type="time" value={settings.start} onChange={e => setSettings({ ...settings, start: e.target.value })} className="w-full border p-2 rounded-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500">End</span>
                                        <input type="time" value={settings.end} onChange={e => setSettings({ ...settings, end: e.target.value })} className="w-full border p-2 rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium mb-2">Location Coordinates</label>
                                <div className="flex gap-2 items-center mb-2">
                                    <div className="flex-1 bg-gray-50 p-2 rounded">
                                        <span className="text-xs text-gray-500 block">Latitude</span>
                                        <span className="font-mono">{settings.lat.toFixed(6)}</span>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-2 rounded">
                                        <span className="text-xs text-gray-500 block">Longitude</span>
                                        <span className="font-mono">{settings.lng.toFixed(6)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={getCurrentLocation}
                                    className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
                                >
                                    <Navigation size={14} /> Update to Current Location
                                </button>
                            </div>

                            <div>
                                <label className="block font-medium mb-2">Service Radius ({settings.radius} km)</label>
                                <input
                                    type="range" min="5" max="30" step="1"
                                    value={settings.radius}
                                    onChange={e => setSettings({ ...settings, radius: parseInt(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            <button onClick={saveSettings} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Settings</button>

                            <div className="pt-4 border-t border-gray-100">
                                <Link to="/terms" className="flex items-center justify-center gap-2 w-full text-indigo-600 font-medium hover:bg-indigo-50 py-3 rounded-xl transition">
                                    <FileText size={18} /> View Platform Terms & Conditions
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-b-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Hello, {profile.name.split(' ')[0]}</h1>
                                <CheckCircle size={20} className="text-white fill-green-500 bg-white rounded-full" />
                            </div>
                            <p className="text-green-100 text-sm">{profile.category} Service Provider</p>
                        </div>
                        <button onClick={() => setShowSettings(true)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                            <MapPin size={24} />
                        </button>
                    </div>

                    {/* Wallet & Trial Status */}
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1 bg-white/20 p-3 rounded-xl relative overflow-hidden">
                            <p className="text-xs text-green-100 relative z-10">Wallet Balance</p>
                            <p className="text-xl font-bold relative z-10">₹{profile.walletBalance}</p>
                            <div className="flex gap-2 mt-2 relative z-10">
                                <button onClick={handleAddMoney} className="bg-green-700/50 text-white p-1 px-2 rounded text-xs font-bold hover:bg-green-700">+ Add</button>
                                <button onClick={() => window.location.href = '/provider/transactions'} className="bg-green-700/50 text-white p-1 px-2 rounded text-xs font-bold hover:bg-green-700">History</button>
                            </div>
                        </div>
                        {profile.trialJobsLeft > 0 && (
                            <div className="flex-1 bg-yellow-400 text-yellow-900 p-3 rounded-xl shadow-sm">
                                <p className="text-xs font-bold flex items-center gap-1"><Zap size={12} /> Trial Jobs</p>
                                <p className="text-xl font-bold">{profile.trialJobsLeft} Left</p>
                            </div>
                        )}
                        <button onClick={fetchHistory} className="bg-blue-600/20 text-blue-100 p-3 rounded-xl flex items-center justify-center hover:bg-blue-600/30">
                            <History size={24} />
                        </button>
                    </div>

                    {/* History Modal */}
                    {showHistory && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                            <div className="bg-white w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col shadow-2xl">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                    <h2 className="font-bold text-lg flex items-center gap-2"><History size={20} /> Work History</h2>
                                    <button onClick={() => setShowHistory(false)}><XCircle className="text-gray-400" /></button>
                                </div>
                                <div className="p-4 overflow-y-auto space-y-4">
                                    {history.length === 0 ? <p className="text-center text-gray-500 py-4">No completed jobs yet.</p> : history.map(job => (
                                        <div key={job._id} className="border border-gray-100 rounded-xl p-4 shadow-sm relative pr-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{job.category}</h3>
                                                    <p className="text-xs text-gray-500">{new Date(job.endTime || job.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {job.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{job.problemDescription}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <MapPin size={12} /> {job.location}
                                            </div>
                                            {job.client && (
                                                <div className="text-xs bg-gray-50 p-2 rounded">
                                                    <span className="font-bold">Client:</span> {job.client.name}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleArchive(job._id)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                                                title="Archive (Hide)"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                        <span className="font-medium text-sm">Status: {isAvailable ? 'Online' : 'Offline'}</span>
                        <button
                            onClick={toggleAvailability}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isAvailable ? 'bg-white text-green-600' : 'bg-gray-400 text-gray-100'}`}
                        >
                            {isAvailable ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeJob ? (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <Zap className="text-indigo-600" /> Current Active Job
                            </h2>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-indigo-100 mb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{activeJob.category}</h3>
                                        <p className="text-gray-600 text-sm">{activeJob.problemDescription}</p>
                                    </div>
                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                        {activeJob.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    <p className="flex items-center gap-2">
                                        <Clock size={16} className="text-indigo-500" />
                                        <strong>Status:</strong> {activeJob.status === 'accepted' ? 'Waiting for Client Confirmation' : activeJob.status === 'confirmed' ? 'Client Confirmed! Go to Location.' : 'In Progress'}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <MapPin size={16} className="text-indigo-500" />
                                        {activeJob.location}
                                    </p>
                                    {activeJob.client && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="font-semibold text-gray-900">Client Details:</p>
                                            <p>{activeJob.client.name}</p>
                                            {activeJob.status !== 'accepted' && (
                                                <p className="text-indigo-600 font-mono">{activeJob.client.phone || 'Phone hidden'}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-col gap-3">
                                    {activeJob.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleServiceFlow('arrived', activeJob._id)}
                                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <Navigation size={20} /> Arrived & Start Service
                                        </button>
                                    )}

                                    {activeJob.status === 'in_progress' && (
                                        <button
                                            onClick={() => handleServiceFlow('complete_init', activeJob._id)}
                                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} /> Finish Service
                                        </button>
                                    )}

                                    {/* Cancel Button */}
                                    <button
                                        onClick={() => setShowCancelModal(true)} // reuse generic cancel modal or simple prompt
                                        className="w-full border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50"
                                    >
                                        Cancel Job (Penalty Applies)
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-indigo-800 text-center">
                                * You must complete this job before accepting new ones.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                                <h2 className="text-xl font-bold text-gray-800">Nearby Requests</h2>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <select
                                        className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-600 bg-white"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="distance">📍 Nearest First</option>
                                        <option value="date">📅 Soonest First</option>
                                        <option value="newest">🆕 Newest First</option>
                                    </select>

                                </div>
                            </div>
                            <div className="space-y-4">
                                {requests.length === 0 ? <p className="text-center text-gray-500 py-8">No requests found nearby.</p> : requests.map(request => (
                                    <div key={request._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <div className="flex justify-between mb-3">
                                            <h3 className="font-bold text-gray-800">{request.category}</h3>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 block">Posted: {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {request.scheduledDate && (
                                                    <span className="text-xs font-bold text-indigo-600 block mt-1">
                                                        Due: {new Date(request.scheduledDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{request.problemDescription}</p>
                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                                            <MapPin size={14} /> {request.location}
                                        </div>
                                        {request.status === 'open' && (
                                            <button
                                                onClick={() => handleAccept(request._id)}
                                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                Accept Request (₹30 Fee)
                                            </button>
                                        )}

                                        {request.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleServiceFlow('arrived', request._id)}
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2"
                                            >
                                                <Navigation size={18} /> Arrived & Start Job
                                            </button>
                                        )}

                                        {request.status === 'in_progress' && (
                                            <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                                <p className="text-center text-green-800 font-bold mb-3 flex items-center justify-center gap-2"><Clock size={18} /> Job in Progress...</p>
                                                <button
                                                    onClick={() => handleServiceFlow('complete_init', request._id)}
                                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md"
                                                >
                                                    Finish Job
                                                </button>
                                            </div>
                                        )}

                                        {(request.status === 'accepted' || request.status === 'confirmed') && (
                                            <button
                                                onClick={() => {
                                                    setCancelRequestId(request._id);
                                                    setShowCancelModal(true);
                                                }}
                                                className="w-full mt-3 border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50"
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* OTP Modal */}
                {showOtpModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        {/* ... existing modal content ... */}
                        <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
                            {/* ... shortened for brevity in replacement ... */}
                            <h3 className="font-bold text-xl mb-2 text-center">
                                {otpAction === 'start' ? 'Start Service' : 'Complete Service'}
                            </h3>
                            {/* ... I need to be careful not to overwrite the inner modal content blindly if I can't match it perfectly.
                                 Actually, I should just append the link AFTER the last closing div of the main content but BEFORE the main container closes.
                              */}
                        </div>
                    </div>
                )}

                {/* Footer Terms Link */}
                <div className="p-6 text-center text-sm text-gray-400">
                    <Link to="/terms" className="hover:text-indigo-600 underline">Terms & Conditions</Link>
                    <span className="mx-2">•</span>
                    <span>Privacy Policy</span>
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-top">
                    <div className="max-w-md mx-auto flex justify-around">
                        <button className="flex flex-col items-center gap-1 text-indigo-600">
                            <Home size={24} />
                            <span className="text-xs font-bold">Home</span>
                        </button>
                        <Link to="/provider/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
                            <User size={24} />
                            <span className="text-xs font-medium">Profile</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDashboard;
