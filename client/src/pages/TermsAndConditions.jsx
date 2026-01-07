import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 p-8 text-white relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-8 left-8 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center text-center mt-4">
                        <Shield size={64} className="mb-4 text-indigo-200" />
                        <h1 className="text-3xl font-bold mb-2">Platform Code of Conduct</h1>
                        <p className="text-indigo-100 max-w-lg">Ensuring a fair, safe, and professional experience for everyone. Please read carefully.</p>
                    </div>
                </div>

                <div className="p-8 md:p-12 space-y-10">
                    {/* Introduction */}
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <p className="text-xl text-gray-700 font-medium">
                            Our platform is built on trust. Both Clients and Providers must adhere to these genuine guidelines to create a <span className="text-indigo-600 font-bold">Win-Win</span> situation for everyone.
                        </p>
                    </div>

                    {/* For Providers */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">👷</span> For Service Providers
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-800">
                                    <CheckCircle size={18} /> Professionalism
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Arrive on time, be polite, and maintain a professional appearance. Respect the client's home and privacy at all times.
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-800">
                                    <CheckCircle size={18} /> Fair Pricing
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Adhere to the agreed-upon rates. Do not demand extra hidden charges after reaching the location.
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-800">
                                    <CheckCircle size={18} /> Service Quality
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Complete the job to the best of your ability. Do not leave work half-done. Ensure the client is satisfied before marking a job as complete.
                                </p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-800">
                                    <AlertTriangle size={18} /> Zero Tolerance
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Any form of harassment, theft, or rude behavior will result in an immediate and permanent ban from the platform.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* For Clients */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 p-2 rounded-lg">🏠</span> For Clients
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-green-800">
                                    <CheckCircle size={18} /> Respect & Safety
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Treat providers with respect. Ensure a safe working environment for them.
                                </p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-green-800">
                                    <CheckCircle size={18} /> Timely Payment
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Release payments promptly upon successful completion of the service.
                                </p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-green-800">
                                    <CheckCircle size={18} /> Clear Communication
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Provide accurate details about the problem and your address to avoid confusion and delays.
                                </p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-800">
                                    <AlertTriangle size={18} /> Fair Cancellations
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Do not cancel requests last minute without a valid reason, as this affects the provider's livelihood.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Mutual Agreement */}
                    <div className="bg-gray-900 text-white p-8 rounded-2xl text-center">
                        <h3 className="text-2xl font-bold mb-4">By using this platform, you agree to these terms.</h3>
                        <p className="text-gray-400 mb-6">
                            We are committed to building a community of trust. Violations of these terms may lead to account suspension.
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition transform hover:scale-105"
                        >
                            I Understand & Agree
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
