import React, { useEffect, useState } from 'react';
import api from '../api';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransactionsProxy = () => {
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchT = async () => {
            try {
                const res = await api.get('/transactions');
                setTransactions(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchT();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
                <div className="bg-gray-900 text-white p-6">
                    <button onClick={() => navigate(-1)} className="mb-4 text-gray-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Wallet & History</h1>
                    <p className="text-gray-400 text-sm">Track your payments</p>
                </div>

                <div className="p-6">
                    {transactions.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10">No transactions yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map(t => (
                                <div key={t._id} className="bg-white border p-4 rounded-xl flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'acceptance_fee' || t.type === 'confirmation_fee' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {t.type === 'acceptance_fee' || t.type === 'confirmation_fee' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 capitalize">{t.type.replace('_', ' ')}</p>
                                            <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-red-600">- ₹{t.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionsProxy;
