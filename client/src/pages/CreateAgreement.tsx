import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileText } from 'lucide-react';

const CreateAgreement: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        type: 'NDA',
        parties: '',
        value: '',
        duration: '',
        caseId: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload a draft document');
            return;
        }

        setLoading(true);
        setError('');

        if (formData.caseId.trim()) {
            const caseIdRegex = /^[MDALCO]\d+$/;
            if (!caseIdRegex.test(formData.caseId.trim())) {
                setError('Linked Case ID must follow the format: A single uppercase letter (M, D, A, L, C, O) followed by digits (e.g., M1234, C7890).');
                setLoading(false);
                return;
            }
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('type', formData.type);
        data.append('parties', JSON.stringify(formData.parties.split(',').map(p => p.trim()))); // Simple comma separation
        data.append('value', formData.value);
        data.append('duration', formData.duration);
        data.append('caseId', formData.caseId);
        data.append('document', file);

        try {
            await axios.post('http://backend-service:5000/agreements', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/agreements');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create agreement');
        } finally {
            setLoading(false);
        }
    };

    if (user && user.role !== 'USER' && user.role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="p-4 bg-red-50 text-red-800 rounded-lg">
                    You do not have permission to create agreements.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Agreement</h1>
                <p className="mt-2 text-gray-500">Fill in the details below to initiate a new agreement workflow.</p>
            </div>

            <div className="card">
                {error && <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Information Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">General Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Title</label>
                                <input name="title" required value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Master Services Agreement 2026" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <div className="relative">
                                    <select name="type" value={formData.type} onChange={handleChange} className="input-field appearance-none">
                                        <option value="NDA">NDA</option>
                                        <option value="MSA">MSA</option>
                                        <option value="SOW">SOW</option>
                                        <option value="Licensing">Licensing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parties (comma separated)</label>
                                <input name="parties" required value={formData.parties} onChange={handleChange} placeholder="Company A, Company B" className="input-field" />
                            </div>
                        </div>
                    </div>

                    {/* Commercial Terms Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Commercial Terms & Metadata</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Value (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input name="value" type="number" value={formData.value} onChange={handleChange} className="input-field pl-7" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <input name="duration" value={formData.duration} onChange={handleChange} className="input-field" placeholder="e.g. 1 Year" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Linked Case (ID or Reference)</label>
                                <input name="caseId" value={formData.caseId} onChange={handleChange} className="input-field" placeholder="e.g. M1234, C7890, L3456" />
                            </div>
                        </div>
                    </div>

                    {/* Document Upload Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Document Upload</h3>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                {file ? (
                                    <div className="flex items-center text-green-600">
                                        <FileText className="w-8 h-8 mr-2" />
                                        <span className="font-medium text-lg">{file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => navigate('/agreements')} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary min-w-[150px]">
                            {loading ? 'Creating...' : 'Create Agreement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAgreement;
