import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Search, FolderOpen, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const CaseDashboard: React.FC = () => {
    const { user } = useAuth();
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchCases();
    }, [filterStatus]);

    const fetchCases = async () => {
        try {
            const params: any = {};
            if (filterStatus) params.status = filterStatus;
            const res = await axios.get('http://backend-service:5000/cases', { params });
            setCases(res.data);
        } catch (error) {
            console.error('Failed to fetch cases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, referenceNumber: string) => {
        if (!window.confirm(`Are you sure you want to delete case ${referenceNumber}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://backend-service:5000/cases/${id}`);
            fetchCases(); // Refresh list after deletion
        } catch (error: any) {
            console.error('Failed to delete case', error);
            alert(error.response?.data?.message || 'Failed to delete case');
        }
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: cases.length,
        active: cases.filter(c => c.status === 'ACTIVE').length,
        pending: cases.filter(c => c.initialDocStatus === 'PENDING_APPROVAL').length,
        new: cases.filter(c => c.status === 'NEW').length
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Legal Case Handling System</h1>
                    <p className="text-sm text-gray-500">Manage and track your legal cases efficiently.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/cases/new" className="btn-primary flex items-center">
                        <PlusCircle className="w-4 h-4 mr-2" /> New Case
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center justify-between bg-blue-50 border-blue-100">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase">Total Cases</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-blue-300" />
                </div>
                <div className="card p-4 flex items-center justify-between bg-green-50 border-green-100">
                    <div>
                        <p className="text-xs font-semibold text-green-600 uppercase">Active</p>
                        <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <div className="card p-4 flex items-center justify-between bg-yellow-50 border-yellow-100">
                    <div>
                        <p className="text-xs font-semibold text-yellow-600 uppercase">Pending Approval</p>
                        <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-300" />
                </div>
            </div>

            {/* Filters & Search */}
            <div className="card p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Title or Ref Number..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field w-full md:w-48"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="NEW">New</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                </select>
            </div>

            {/* Cases List */}
            <div className="card overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date & Time</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : filteredCases.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No cases found.</td></tr>
                        ) : filteredCases.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{c.title}</span>
                                        <span className="text-xs text-gray-500">{c.referenceNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            c.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {c.status}
                                    </span>
                                    {c.initialDocStatus !== 'APPROVED' && (
                                        <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {c.initialDocStatus.replace('_', ' ')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.assignedLo?.name || 'Unassigned'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(c.createdAt), 'yyyy, MMM d, h:mm a')}</td>
                                <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-3 items-center">
                                    <Link to={`/cases/${c.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">View</Link>

                                    {user?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => handleDelete(c.id, c.referenceNumber)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete Case"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CaseDashboard;
