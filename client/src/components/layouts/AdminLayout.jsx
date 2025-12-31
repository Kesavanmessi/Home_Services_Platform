import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Shield, Home, LogOut, LayoutDashboard, Users, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <Shield className="text-red-500" size={24} />
                    <span className="text-xl font-bold">Admin Portal</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/providers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                        <Users size={20} />
                        <span>Providers</span>
                    </Link>
                    <Link to="/admin/requests" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                        <FileText size={20} />
                        <span>Requests</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-700">Platform Administration</h2>
                    <div className="text-sm text-gray-500">
                        Administrator Access
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
