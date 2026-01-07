import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { RefreshCw, Upload, Clock, CheckCircle, XCircle, Calendar, Zap, MapPin, Shield, Plus } from 'lucide-react';

const ProviderDashboard = () => {
    const { user, login } = useAuth(); // Re-fetch user profile mechanism
    const [profile, setProfile] = useState(user);
    const [files, setFiles] = useState({ idProof: '', selfie: '' });
    const [loading, setLoading] = useState(false);

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

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/nearby');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error(err);
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

        try {
            await api.post('/transactions/add', { amount: Number(amount) });
            alert('Money Added Successfully!');
            fetchProfile(); // Update balance
        } catch (err) {
            console.error(err);
            alert('Failed to add money');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
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
                                <label className="block font-medium mb-2">Service Radius ({settings.radius} km)</label>
                                <input
                                    type="range" min="5" max="30" step="1"
                                    value={settings.radius}
                                    onChange={e => setSettings({ ...settings, radius: parseInt(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            <button onClick={saveSettings} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Settings</button>
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
                    </div>

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
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Nearby Requests</h2>
                    <div className="space-y-4">
                        {requests.length === 0 ? <p className="text-center text-gray-500 py-8">No requests found nearby.</p> : requests.map(req => (
                            <div key={req._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="flex justify-between mb-3">
                                    <h3 className="font-bold text-gray-800">{req.category}</h3>
                                    <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{req.problemDescription}</p>
                                <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                                    <MapPin size={14} /> {req.location}
                                </div>
                                <button
                                    onClick={() => handleAccept(req._id)}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
                                >
                                    {profile.trialJobsLeft > 0 ? `Accept Details (Trial Job)` : 'Accept Request (₹30)'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDashboard;
