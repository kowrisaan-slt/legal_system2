import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
// import { Link } from 'react-router-dom';

const AgreementDashboard: React.FC = () => {

    const [stats, setStats] = useState({
        active: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://backend-service:5000/agreements/stats');
                if (res.data.counts) {
                    setStats(res.data.counts);
                    setActivities(res.data.activity || []);
                } else {
                    // Fallback for backward compatibility if backend isn't updated instantly or cache issues
                    setStats(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { name: 'Active Agreements', value: stats.active, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', link: '/agreements?status=active' },
        { name: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/agreements?status=pending' },
        { name: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/agreements?status=approved' },
        { name: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', link: '/agreements?status=rejected' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agreement Approval Management SYSTEM</h1> */}
                    <h1 className="text-2xl font-bold text-gray-900">Agreement Approval Management System</h1>
                    <p className="mt-2 text-sm text-gray-500">Welcome back. Here's what's happening with your agreements today.</p>
                </div>
                {/* <Link to="/create" className="btn-primary flex items-center shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5">
                    <span className="mr-2 text-xl">+</span> New Agreement
                </Link> */}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.name} className="card group hover:shadow-md transition-all duration-200">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 rounded-md p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                                    <dd>
                                        <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                                    </dd>
                                </dl>
                            </div>
                            <div className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart/Table Area Placeholder */}
                <div className="card lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Agreement Activity</h3>
                    <div className="bg-white rounded-xl border border-gray-200 h-96 overflow-y-auto">
                        <ul className="divide-y divide-gray-100">
                            {activities.length === 0 ? (
                                <li className="p-6 text-center text-gray-500">No recent activity</li>
                            ) : (
                                activities.map((act: any) => (
                                    <li key={act.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {act.user?.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {act.user?.name} <span className="text-gray-500 font-normal">performed</span> {act.action}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    on <span className="font-medium text-gray-700">{act.agreement.title}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(act.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Recent Items / Quick Actions */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Upload Draft Template</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">View Pending Reviews</span>
                            <div className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                                {stats.pending}
                            </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Expiring Soon</span>
                            <span className="text-xs text-gray-500">Check Reports</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgreementDashboard;
