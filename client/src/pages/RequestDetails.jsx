import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Phone, CheckCircle, Star, User } from 'lucide-react';

const RequestDetails = () => {
    const { user } = useAuth(); // Need user for wallet
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [review, setReview] = useState({ rating: 5, comment: '' });
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    // Cancellation State
    const [cancelModal, setCancelModal] = useState({ show: false, reason: '' });

    const fetchRequest = async () => {
        try {
            const res = await api.get(`/requests/${id}`);
            setRequest(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequest();
    }, [id]);

    const handleConfirm = async () => {
        const fee = 20;
        if (!window.confirm(`Confirming provider will cost ₹${fee} from your wallet. Proceed?`)) return;
        setLoading(true);
        try {
            await api.put(`/requests/${id}/confirm`);
            alert('Provider Confirmed! Contact details unlocked.');
            fetchRequest();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to confirm provider');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelModal.reason) return alert('Please provide a reason');
        if (!window.confirm('Are you sure you want to cancel? Penalties may apply.')) return;

        setLoading(true);
        try {
            const res = await api.put(`/requests/${id}/cancel`, { reason: cancelModal.reason });
            alert(res.data.message);
            setCancelModal({ show: false, reason: '' });
            fetchRequest();
        } catch (err) {
            console.error(err);
            alert('Failed to cancel request');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reviews', {
                requestId: id,
                rating: review.rating,
                comment: review.comment
            });
            alert('Review Submitted');
            setReviewSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    if (!request) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Cancel Modal */}
                {cancelModal.show && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                            <h3 className="text-xl font-bold mb-4">Cancel Request</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {request.status === 'accepted' || request.status === 'confirmed'
                                    ? 'Note: Cleaning fees (₹50) may apply for late cancellations.'
                                    : 'No penalty for cancelling open requests.'}
                            </p>
                            <textarea
                                className="w-full border p-3 rounded-lg mb-4 text-sm"
                                placeholder="Reason for cancellation..."
                                value={cancelModal.reason}
                                onChange={e => setCancelModal({ ...cancelModal, reason: e.target.value })}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setCancelModal({ show: false, reason: '' })} className="flex-1 py-2 text-gray-600 font-bold">Back</button>
                                <button onClick={handleCancel} disabled={loading} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold">Cancel Service</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-start mb-4">
                        <button onClick={() => navigate('/client/home')}>← Back</button>
                        {request.status !== 'cancelled' && request.status !== 'completed' && (
                            <button onClick={() => setCancelModal({ show: true, reason: '' })} className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition">
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold">Request Details</h1>
                            <p className="text-blue-100 text-sm capitalize">Status: {request.status}</p>
                        </div>
                        {/* Wallet Display (Mocked from User Context if available, else fetch) */}
                        <div className="bg-white/20 p-2 rounded-lg text-right">
                            <p className="text-xs text-blue-100">My Wallet</p>
                            {/* Note: Ideally fetch user.walletBalance from context/api re-fetch */}
                            <p className="font-bold">₹{user?.walletBalance || '---'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Cancellation Banner */}
                    {request.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800">
                            <p className="font-bold">Request Cancelled</p>
                            <p className="text-sm">Reason: {request.cancellationReason}</p>
                            <p className="text-xs mt-1 text-red-600 uppercase">By: {request.cancelledBy}</p>
                        </div>
                    )}

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
                                        <div className="mt-4">
                                            <div className="flex items-start gap-2 mb-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <input
                                                    type="checkbox"
                                                    id="disclaimer"
                                                    className="mt-1"
                                                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                                />
                                                <label htmlFor="disclaimer" className="text-xs text-blue-800 leading-tight">
                                                    I understand that this platform only connects me with the provider. Service quality, safety, and payments are handled entirely offline between me and the provider.
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleConfirm}
                                                disabled={loading || !disclaimerAccepted}
                                                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Processing...' : 'Confirm Provider (₹20)'}
                                            </button>
                                        </div>
                                    )}

                                    {request.status === 'confirmed' && (
                                        <div className="space-y-3">
                                            <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                                                <Phone size={16} />
                                                {request.provider.phone}
                                            </div>

                                            {!reviewSubmitted && (
                                                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-3 rounded-xl border mt-4">
                                                    <p className="text-xs font-semibold mb-2">Service Completed?</p>
                                                    <div className="flex gap-2 mb-3">
                                                        <label className="flex items-center gap-1 text-xs text-gray-600 bg-white border px-2 py-1 rounded cursor-pointer">
                                                            <input type="radio" name="completed" value="yes" required /> Yes
                                                        </label>
                                                        <label className="flex items-center gap-1 text-xs text-gray-600 bg-white border px-2 py-1 rounded cursor-pointer">
                                                            <input type="radio" name="completed" value="no" /> No
                                                        </label>
                                                    </div>

                                                    <p className="text-xs font-semibold mb-2">Rate Service</p>
                                                    <div className="flex gap-2 mb-2">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setReview({ ...review, rating: star })}
                                                                className={`${review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                                            >
                                                                <Star size={20} fill="currentColor" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        placeholder="Comment..."
                                                        className="w-full text-xs p-2 rounded border mb-2"
                                                        value={review.comment}
                                                        onChange={e => setReview({ ...review, comment: e.target.value })}
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="w-full bg-indigo-600 text-white text-xs py-2 rounded"
                                                    >
                                                        Submit Review
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        request.status !== 'cancelled' && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-center">
                                Waiting for a provider to accept...
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;
