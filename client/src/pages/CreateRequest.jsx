import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { MapPin, Zap, Droplet, Hammer, PaintBucket, Wind, Wrench } from 'lucide-react';

const CreateRequest = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Default to 'Other' if not specified, or pre-select from URL
    const categoryParam = searchParams.get('category');

    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'Electrician');
    const [problemDescription, setProblemDescription] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);

    const serviceCategories = [
        { id: 1, name: 'Electrician', icon: Zap },
        { id: 2, name: 'Plumber', icon: Droplet },
        { id: 3, name: 'Carpenter', icon: Hammer },
        { id: 4, name: 'Painter', icon: PaintBucket },
        { id: 5, name: 'AC Repair', icon: Wind },
        { id: 6, name: 'Other', icon: Wrench }
    ];

    const handleSubmit = async () => {
        if (!problemDescription || !location) return alert('Please fill all fields');
        setLoading(true);
        try {
            await api.post('/requests', { category: selectedCategory, problemDescription, location });
            navigate('/client/home');
        } catch (err) {
            console.error(err);
            alert('Failed to post request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
                    <h1 className="text-2xl font-bold">Post Service Request</h1>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                        <div className="grid grid-cols-3 gap-3">
                            {serviceCategories.slice(0, 6).map(service => {
                                const Icon = service.icon;
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedCategory(service.name)}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedCategory === service.name
                                                ? 'border-indigo-600 bg-indigo-50 color-indigo-600'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <Icon className={`mx-auto mb-1 ${selectedCategory === service.name ? 'text-indigo-600' : 'text-gray-500'}`} size={24} />
                                        <p className={`text-xs text-center ${selectedCategory === service.name ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>{service.name}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Describe Your Problem</label>
                        <textarea
                            className="w-full border-2 border-gray-200 rounded-xl p-4 outline-none focus:border-indigo-600 transition-colors"
                            rows="4"
                            placeholder="e.g., My bedroom power outlet stopped working suddenly..."
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <div className="border-2 border-gray-200 rounded-xl p-4 flex items-center gap-3">
                            <MapPin className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Enter your location"
                                className="flex-1 outline-none"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'Post Request (Free)'}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        You'll only pay ₹20 when you confirm a provider
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateRequest;
