import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { MapPin, Zap, Droplet, Hammer, PaintBucket, Wind, Wrench, Search, Navigation, Calendar, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks and fly to functionality
const LocationMarker = ({ position, setPosition, setLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition(e.latlng);
            try {
                // Reverse Geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                if (data.display_name) {
                    setLocation(data.display_name);
                }
            } catch (err) {
                console.error("Geocoding error:", err);
            }
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const CreateRequest = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const categoryParam = searchParams.get('category');
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'Electrician');
    const [problemDescription, setProblemDescription] = useState('');
    const [location, setLocation] = useState('');
    const [position, setPosition] = useState(null); // { lat, lng }
    const [scheduledDate, setScheduledDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    // Get current location on mount
    useEffect(() => {
        handleGetCurrentLocation();
    }, []);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setPosition(newPos);

                try {
                    // Reverse Geocoding for current location
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data.display_name) {
                        setLocation(data.display_name);
                    }
                } catch (err) {
                    console.error("Geocoding error:", err);
                } finally {
                    setIsLocating(false);
                }
            }, (err) => {
                console.error(err);
                setIsLocating(false);
                alert("Could not pull location. Please check browser permissions.");
            });
        }
    };

    // Fetch stats when category or position changes
    useEffect(() => {
        if (selectedCategory && position) {
            fetchStats();
        }
    }, [selectedCategory, position]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/requests/provider-stats', {
                params: {
                    category: selectedCategory,
                    lat: position.lat,
                    lng: position.lng
                }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const handleSearchLocation = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setPosition(newPos);
                setLocation(display_name); // Auto-fill address
            } else {
                alert("Location not found");
            }
        } catch (err) {
            alert("Search failed");
        }
    };

    const handleSubmit = async () => {
        if (!problemDescription || !location || !position) return alert('Please fill all fields and select location.');
        setLoading(true);
        try {
            await api.post('/requests', {
                category: selectedCategory,
                problemDescription,
                location,
                coordinates: position,
                scheduledDate: new Date().toISOString() // Force ASAP
            });
            navigate('/client/home');
        } catch (err) {
            console.error(err);
            alert('Failed to post request');
        } finally {
            setLoading(false);
        }
    };

    const serviceCategories = [
        { id: 1, name: 'Electrician', icon: Zap },
        { id: 2, name: 'Plumber', icon: Droplet },
        { id: 3, name: 'Carpenter', icon: Hammer },
        { id: 4, name: 'Painter', icon: PaintBucket },
        { id: 5, name: 'AC Repair', icon: Wind },
        { id: 6, name: 'Other', icon: Wrench }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
                    <h1 className="text-2xl font-bold">Post Service Request</h1>
                </div>

                <div className="p-6 space-y-6">
                    {/* Category Selection */}
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

                    {/* Description */}
                    <div>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-start gap-2">
                            <Clock className="text-blue-600 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-blue-800">
                                <strong>Immediate Service Only:</strong> To protect our providers' livelihoods, we only support "On-Demand" bookings. Your request will be broadcast to providers available <strong>right now</strong>.
                            </p>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Describe Your Problem</label>
                        <textarea
                            className="w-full border-2 border-gray-200 rounded-xl p-4 outline-none focus:border-indigo-600 transition-colors"
                            rows="4"
                            placeholder="e.g., My bedroom power outlet stopped working..."
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                        />
                    </div>

                    {/* Location & Map */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>

                        {/* Search & Current Location */}
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search Area (e.g. Anna Nagar)"
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                                />
                            </div>
                            <button
                                onClick={handleSearchLocation}
                                className="bg-indigo-600 text-white px-4 rounded-lg font-medium text-sm hover:bg-indigo-700"
                            >
                                Go
                            </button>
                        </div>

                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleGetCurrentLocation}
                                className="text-sm text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                            >
                                <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
                                {isLocating ? 'Locating...' : 'Use Current Location'}
                            </button>
                        </div>

                        {/* Map */}
                        <div className="h-64 rounded-xl overflow-hidden border-2 border-gray-200 z-0 relative mb-3">
                            {position ? (
                                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <LocationMarker
                                        position={position}
                                        setPosition={setPosition}
                                        setLocation={setLocation}
                                    />
                                </MapContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    Loading Map...
                                </div>
                            )}
                        </div>

                        {/* Address Display */}
                        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-start gap-3">
                            <MapPin className="text-indigo-600 mt-1 shrink-0" size={20} />
                            <textarea
                                placeholder="Exact address will appear here..."
                                className="flex-1 bg-transparent outline-none text-sm text-gray-700 resize-none"
                                rows="2"
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

                    {/* Provider Stats Display - Always Visible Container */}
                    <div className="bg-white border rounded-xl p-4 shadow-sm mt-4">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Search size={16} /> Market Report: {selectedCategory}
                        </h3>

                        {!stats ? (
                            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                <p>Select a location on the map to see provider availability.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-green-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-green-600">{stats.availableNow}</p>
                                        <p className="text-gray-600 text-xs">Available Now</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-orange-600">{stats.busy}</p>
                                        <p className="text-gray-600 text-xs">Busy (On Job)</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
                                        <p className="text-gray-600 text-xs">Offline</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                        <p className="text-gray-600 text-xs">Total Nearby</p>
                                    </div>
                                    <div className="col-span-2 bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-lg text-center text-white shadow-md">
                                        <p className="text-xl font-bold">
                                            ₹{stats.minPrice} - ₹{stats.maxPrice}
                                        </p>
                                        <p className="text-indigo-100 text-xs">Estimated Service Charge</p>
                                    </div>
                                </div>
                                {stats.offline > 0 && stats.availableNow === 0 && (
                                    <p className="text-xs text-gray-500 mt-3 text-center italic">
                                        Note: Offline providers may receive your request but might not accept immediately.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRequest;
