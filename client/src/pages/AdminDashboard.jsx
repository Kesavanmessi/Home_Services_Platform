import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shield, Clock, CheckCircle, XCircle, FileText, Calendar, X } from 'lucide-react';

const AdminDashboard = () => {
    const [pendingProviders, setPendingProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [interviewDate, setInterviewDate] = useState('');

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/providers/pending');
            setPendingProviders(res.data);
        } catch (err) {
            console.error('Failed to fetch pending providers', err);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (action, id, data = {}) => {
        if (!window.confirm('Are you sure you want to perform this action?')) return;
        setLoading(true);
        try {
            let url = `/admin/providers/${id}`;
            let method = 'put';

            if (action === 'verify_docs') url += '/verify-docs';
            if (action === 'reject_docs') url += '/reject-docs';
            if (action === 'schedule_interview') {
                url += '/schedule-interview';
                data = { date: interviewDate };
            }
            if (action === 'approve') url += '/approve';
            if (action === 'fail') url += '/fail';

            await api.put(url, data);
            alert('Action Successful');
            setSelectedProvider(null);
            fetchPending();
        } catch (err) {
            console.error(err);
            alert('Action Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="text-gray-800" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">Verification Center</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingProviders.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No pending verifications.</p>}

                {pendingProviders.map(provider => (
                    <div key={provider._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{provider.name}</h3>
                                <p className="text-indigo-600 text-sm">{provider.category}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold h-fit ${provider.verificationStatus.includes('pending') ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {provider.verificationStatus.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1 mb-4">
                            <p>📧 {provider.email}</p>
                            <p>📱 {provider.phone}</p>
                            <p>📍 {provider.location}</p>
                        </div>

                        <button
                            onClick={() => setSelectedProvider(provider)}
                            className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800"
                        >
                            Open Details
                        </button>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedProvider && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 relative">
                        <button
                            onClick={() => setSelectedProvider(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-1">{selectedProvider.name}</h2>
                        <p className="text-gray-500 mb-6">Current Status: <span className="font-bold text-indigo-600">{selectedProvider.verificationStatus}</span></p>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText size={18} /> ID Proof</h3>
                                {selectedProvider.documents?.idProof ? (
                                    <img src={selectedProvider.documents.idProof} alt="ID" className="w-full h-48 object-cover rounded-lg border" />
                                ) : <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">No Document</div>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText size={18} /> Selfie</h3>
                                {selectedProvider.documents?.selfie ? (
                                    <img src={selectedProvider.documents.selfie} alt="Selfie" className="w-full h-48 object-cover rounded-lg border" />
                                ) : <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">No Document</div>}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Actions</h3>

                            {/* Actions based on Status */}
                            {selectedProvider.verificationStatus === 'pending_verification' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction('verify_docs', selectedProvider._id)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Approve Docs</button>
                                    <button onClick={() => handleAction('reject_docs', selectedProvider._id)} className="flex-1 bg-red-100 text-red-600 py-3 rounded-lg font-bold hover:bg-red-200">Reject Docs</button>
                                </div>
                            )}

                            {(selectedProvider.verificationStatus === 'documents_verified' || selectedProvider.verificationStatus === 'interview_scheduled') && (
                                <div className="space-y-4">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1">Schedule Interview</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full border rounded-lg p-2"
                                                value={interviewDate}
                                                onChange={(e) => setInterviewDate(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleAction('schedule_interview', selectedProvider._id)}
                                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700"
                                            disabled={!interviewDate}
                                        >
                                            Schedule
                                        </button>
                                    </div>

                                    <div className="border-t pt-4 mt-4 flex gap-3">
                                        <button onClick={() => handleAction('approve', selectedProvider._id)} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700">Pass Interview (Activate)</button>
                                        <button onClick={() => handleAction('fail', selectedProvider._id)} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">Fail</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
