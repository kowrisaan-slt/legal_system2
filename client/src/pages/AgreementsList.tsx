import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import type { Agreement } from '../types';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';  ///////////////////////////////////////////////////////

const AgreementsList: React.FC = () => {
    const { user } = useAuth(); ///////////////////////////////////////////
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAgreements = async () => {
            try {
                const res = await axios.get('http://backend-service:5000/agreements');
                setAgreements(res.data);
            } catch (err) {
                setError('Failed to fetch agreements');
            } finally {
                setLoading(false);
            }
        };

        fetchAgreements();
    }, []);

    const filteredAgreements = agreements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.createdBy?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    );

    if (error) return <div className="text-red-500 p-6 text-center">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agreements</h1>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search agreements..."
                            className="input-field pl-10 py-2 w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-secondary flex items-center justify-center">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </button>
                    {/* <Link to="/create" className="btn-primary flex items-center justify-center">
                        + New
                    </Link> */}
                    {(user?.role === 'USER' || user?.role === 'ADMIN') && (
                        <Link to="/create" className="btn-primary flex items-center justify-center">
                            + New
                        </Link>
                    )}
                </div>
            </div>

            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title / Type</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredAgreements.map((agreement) => (
                                <tr key={agreement.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{agreement.title}</span>
                                            <span className="text-xs text-gray-500 mt-0.5">{agreement.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                {agreement.createdBy?.name.charAt(0)}
                                            </div>
                                            <div className="text-sm font-medium text-gray-700">{agreement.createdBy?.name || 'Unknown'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border 
                                            ${agreement.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                agreement.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                            {agreement.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(agreement.createdAt), 'yyyy, MMM d, h:mm a')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/agreements/${agreement.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredAgreements.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">No agreements found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgreementsList;
