import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, FileText } from 'lucide-react';

const ModuleSelection: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isLegal = user?.role !== 'APPROVER';

    const handleModuleSelect = (module: string) => {
        if (module === 'agreement') {
            navigate('/');
        } else if (module === 'legal') {
            if (isLegal) navigate('/cases');
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Select Module</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                <div className={`
                    p-8 rounded-xl border-2 transition-all duration-300 w-80 text-center
                    ${isLegal
                        ? 'border-gray-200 bg-white hover:border-black cursor-pointer shadow-sm hover:shadow-lg'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}
                `}
                    onClick={() => {
                        if (isLegal) navigate('/cases');
                    }}
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Scale className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Legal Case Handling</h2>
                    <p className="text-gray-500 text-sm">
                        Manage court cases, hearings, and litigation.
                    </p>
                    {!isLegal && <p className="text-xs text-red-500 mt-4 font-semibold">Restricted Access</p>}
                </div>

                <div
                    onClick={() => handleModuleSelect('agreement')}
                    className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:border-black cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 w-80 text-center"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Agreement Management</h2>
                    <p className="text-gray-500 text-sm">
                        Create, review, and approve legal agreements.
                    </p>
                </div>

                {user.role === 'ADMIN' && (
                    <div
                        onClick={() => navigate('/users')}
                        className="p-8 rounded-xl border-2 border-gray-200 bg-white hover:border-black cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 w-80 text-center"
                    >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">User Management</h2>
                        <p className="text-gray-500 text-sm">
                            Add new users and manage system access.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleSelection;
