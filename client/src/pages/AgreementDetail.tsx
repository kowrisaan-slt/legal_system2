import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Agreement } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Download, Upload, MessageSquare, History, FileText, Send, CheckCircle, XCircle, AlertCircle, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const AgreementDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [agreement, setAgreement] = useState<Agreement | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
    const [changeLog, setChangeLog] = useState('');
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Metadata State
    const [metaParties, setMetaParties] = useState('');
    const [metaValue, setMetaValue] = useState('');
    const [metaDuration, setMetaDuration] = useState('');
    const [metaType, setMetaType] = useState('NDA');

    useEffect(() => {
        if (agreement) {
            setMetaParties(Array.isArray(agreement.parties) ? agreement.parties.join(', ') : '');
            setMetaValue(agreement.value ? agreement.value.toString() : '');
            setMetaDuration(agreement.duration || '');
            setMetaType(agreement.type);
        }
    }, [agreement, showUploadModal]);

    const fetchAgreement = async () => {
        try {
            const res = await axios.get(`http://backend-service:5000/agreements/${id}`);
            setAgreement(res.data);
        } catch (error) {
            console.error('Failed to fetch agreement', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgreement();
    }, [id]);

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        try {
            await axios.post(`http://backend-service:5000/agreements/${id}/comments`, { content: comment });
            setComment('');
            fetchAgreement();
        } catch (error) {
            alert('Failed to add comment');
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if ((status === 'REJECT' || status === 'REQUEST_CHANGE') && !remarks) {
            alert('Remarks are required for this action');
            return;
        }
        setActionLoading(true);
        try {
            await axios.put(`http://backend-service:5000/agreements/${id}/status`, { status, remarks });
            setRemarks('');
            fetchAgreement();
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUploadVersion = async () => {
        if (!newVersionFile) return;
        const data = new FormData();
        data.append('document', newVersionFile);
        data.append('changeLog', changeLog);
        // Append Metadata
        data.append('parties', metaParties);
        data.append('value', metaValue);
        data.append('duration', metaDuration);
        data.append('type', metaType);

        try {
            await axios.post(`http://backend-service:5000/agreements/${id}/versions`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShowUploadModal(false);
            setNewVersionFile(null);
            setChangeLog('');
            fetchAgreement();
        } catch (error) {
            alert('Failed to upload version');
        }
    };

    const handleDeleteAgreement = async () => {
        if (!window.confirm('Are you certain you wish to delete this agreement? This action cannot be reversed.')) return;

        setActionLoading(true);
        try {
            await axios.delete(`http://backend-service:5000/agreements/${id}`);
            navigate('/');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete agreement');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    );
    if (!agreement) return <div className="text-center p-12 text-gray-500">Agreement not found</div>;

    const latestVersion = agreement.versions?.[0];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-50 text-green-700 border-green-100';
            case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
            case 'EXECUTED': return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-100';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Back Link */}
            <Link to="/agreements" className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Agreements
            </Link>

            {/* Header Card */}
            <div className="card flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{agreement.title}</h1>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(agreement.status)}`}>
                            {agreement.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center"><FileText className="w-4 h-4 mr-1" /> Type: {agreement.type}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Created: {format(new Date(agreement.createdAt), 'MMM d, yyyy')}</span>
                        <span>By: {agreement.createdBy?.name}</span>
                        {(agreement as any).case && (
                            <span className="flex items-center">
                                Case ID:
                                <Link to={`/cases/${agreement.caseId}`} className="ml-1 text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                    {(agreement as any).case.referenceNumber}
                                </Link>
                            </span>
                        )}
                    </div>
                </div>

                {/* Primary Actions based on Role and Status - Floating or Fixed */}
                <div className="flex flex-wrap gap-2">
                    {user?.role === 'USER' && (agreement.status === 'DRAFT' || agreement.status === 'REVISION_REQUIRED') && (
                        <>
                            <button onClick={() => setShowUploadModal(true)} className="btn-secondary flex items-center">
                                <Upload className="w-4 h-4 mr-2" /> New Version
                            </button>
                            {agreement.status === 'DRAFT' && (
                                <button onClick={() => handleStatusUpdate('SUBMIT')} disabled={actionLoading} className="btn-primary flex items-center">
                                    <Send className="w-4 h-4 mr-2" /> Submit
                                </button>
                            )}
                        </>
                    )}
                    {user?.role === 'CLO' && agreement.status === 'APPROVED' && (
                        <button onClick={() => handleStatusUpdate('EXECUTED')} disabled={actionLoading} className="btn-primary bg-purple-600 hover:bg-purple-700">
                            Sign & Execute
                        </button>
                    )}
                    {user?.role === 'ADMIN' && (
                        <button onClick={handleDeleteAgreement} disabled={actionLoading} className="btn-danger flex items-center">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Document & Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Document Preview Card */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Document Preview</h3>
                            {latestVersion && (
                                <a href={`http://backend-service:5000/${latestVersion.filePath}`} target="_blank" rel="noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                                    <Download className="w-4 h-4 mr-2" /> Download v{latestVersion.versionNumber}
                                </a>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                            <FileText className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Preview Unavailable</p>
                            <p className="text-xs text-gray-400 mt-1">Please download the file to view contents.</p>
                            {latestVersion && (
                                <a href={`http://backend-service:5000/${latestVersion.filePath}`} className="mt-4 btn-secondary text-sm py-2 px-4">
                                    Download File
                                </a>
                            )}
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</span>
                                <span className="block mt-1 text-sm font-semibold text-gray-900">{agreement.parties.join(', ')}</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Value</span>
                                <span className="block mt-1 text-sm font-semibold text-gray-900">{agreement.value ? `$${agreement.value}` : 'N/A'}</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</span>
                                <span className="block mt-1 text-sm font-semibold text-gray-900">{agreement.duration || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Actions for Reviewers/Approvers */}
                    {(
                        ((user?.role === 'REVIEWER' || user?.role === 'SUPERVISOR' || user?.role === 'LO') && agreement.status === 'PENDING_REVIEW') ||
                        (user?.role === 'APPROVER' && agreement.status === 'PENDING_APPROVAL')
                    ) && (
                            <div className="card border-l-4 border-l-yellow-400 bg-yellow-50/10">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" /> Action Required
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Feedback</label>
                                        <textarea
                                            className="input-field min-h-[100px]"
                                            placeholder={user.role === 'REVIEWER' ? 'Required for Change Request...' : 'Required for Rejection...'}
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate('APPROVE')}
                                            disabled={actionLoading}
                                            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                        </button>
                                        {user.role === 'REVIEWER' ? (
                                            <button
                                                onClick={() => handleStatusUpdate('REQUEST_CHANGE')}
                                                disabled={actionLoading}
                                                className="btn-danger bg-yellow-600 hover:bg-yellow-700 flex items-center"
                                            >
                                                <History className="w-4 h-4 mr-2" /> Request Change
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate('REJECT')}
                                                disabled={actionLoading}
                                                className="btn-danger flex items-center"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" /> Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Comments Section */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2" /> Discussion
                        </h3>
                        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {agreement.comments?.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
                            {agreement.comments?.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {c.user?.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg p-3 rounded-tl-none border border-gray-100">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-semibold text-gray-900">{c.user?.name}</span>
                                                <span className="text-xs text-gray-500">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{c.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="input-field pr-12"
                                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!comment.trim()}
                                    className="absolute right-2 top-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Metadata */}
                <div className="space-y-6">
                    {/* Version History */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <History className="w-5 h-5 mr-2" /> Version History
                        </h3>
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-2">
                            {agreement.versions?.map((v, idx) => (
                                <div key={v.id} className="ml-6 relative">
                                    <span className={clsx(
                                        "absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white",
                                        idx === 0 ? "bg-blue-600 ring-4 ring-blue-50" : "bg-gray-300"
                                    )} />
                                    <div className="flex justify-between items-baseline">
                                        <span className={clsx("text-sm font-medium", idx === 0 ? "text-blue-600" : "text-gray-900")}>
                                            Version {v.versionNumber}
                                        </span>
                                        <span className="text-xs text-gray-500">{format(new Date(v.createdAt), 'MMM d')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Uploaded by {v.uploadedBy?.name}</p>
                                    {v.changeLog && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">"{v.changeLog}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2" /> Audit Log
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {agreement.actions?.map(a => (
                                <div key={a.id} className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs font-medium text-gray-900">
                                            {a.action}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            by {a.user?.name} • {format(new Date(a.timestamp), 'MMM d, HH:mm')}
                                        </p>
                                        {a.details && <p className="text-xs text-gray-500 italic mt-0.5">{a.details}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal - Premium Style */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Upload New Version</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Metadata Editing Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type</label>
                                    <select value={metaType} onChange={e => setMetaType(e.target.value)} className="input-field">
                                        <option value="NDA">NDA</option>
                                        <option value="MSA">MSA</option>
                                        <option value="SOW">SOW</option>
                                        <option value="Licensing">Licensing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parties (comma separated)</label>
                                    <input value={metaParties} onChange={e => setMetaParties(e.target.value)} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input type="number" value={metaValue} onChange={e => setMetaValue(e.target.value)} className="input-field" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <input value={metaDuration} onChange={e => setMetaDuration(e.target.value)} className="input-field" />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Document</label>
                                <input type="file" onChange={e => setNewVersionFile(e.target.files?.[0] || null)} className="input-field p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Change Log / Remarks</label>
                                <textarea
                                    placeholder="Describe what changed in this version..."
                                    value={changeLog}
                                    onChange={e => setChangeLog(e.target.value)}
                                    className="input-field min-h-[100px]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowUploadModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleUploadVersion} className="btn-primary">
                                    Upload Version
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgreementDetail;
