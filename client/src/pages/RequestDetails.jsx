import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { MapPin, Phone, CheckCircle, Star, User } from 'lucide-react';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(`/requests/${id}`);
                setRequest(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRequest();
    }, [id]);

    const handleConfirm = async () => {
        if (!window.confirm('Confirming provider will cost ₹20. Proceed?')) return;
        setLoading(true);
        try {
            await api.put(`/requests/${id}/confirm`);
            alert('Provider Confirmed! Contact details unlocked.');
            // Reload
            const res = await api.get(`/requests/${id}`);
            setRequest(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to confirm provider');
        } finally {
            setLoading(false);
        }
    };

    if (!request) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <button onClick={() => navigate('/client/home')} className="mb-4">← Back</button>
                    <h1 className="text-2xl font-bold">Request Details</h1>
                    <p className="text-blue-100 text-sm">Status: {request.status}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <h2 className="font-semibold text-gray-800 mb-2">{request.category}</h2>
                        <p className="text-gray-600 text-sm mb-4">{request.problemDescription}</p>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <MapPin size={14} />
                            <span>{request.location}</span>
                        </div>
                    </div>

                    {/* Provider Section */}
                    {request.provider ? (
                        <div className="bg-white rounded-2xl p-5 shadow-md border border-green-100 ring-2 ring-green-50">
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Assigned Provider</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                    {request.provider.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-800">{request.provider.name}</h3>
                                        {request.provider.isVerified && (
                                            <CheckCircle className="text-green-500" size={16} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="text-yellow-500 fill-yellow-500" size={14} />
                                            <span className="font-medium">{request.provider.rating || 'New'}</span>
                                        </div>
                                        <span>{request.provider.jobsCompleted || 0} jobs</span>
                                    </div>

                                    {request.status === 'accepted' && (
                                        <button
                                            onClick={handleConfirm}
                                            disabled={loading}
                                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                        >
                                            {loading ? 'Processing...' : 'Confirm Provider (₹20)'}
                                        </button>
                                    )}

                                    {request.status === 'confirmed' && (
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                                            <Phone size={16} />
                                            {request.provider.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-center">
                            Waiting for a provider to accept...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;
