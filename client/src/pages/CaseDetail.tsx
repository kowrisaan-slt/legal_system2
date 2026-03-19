import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Send, Users, Scale, FileText, Calendar, Clock, Activity, Edit2, Save, Upload, File as FileIcon, Download } from 'lucide-react';

const CaseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [legalOfficers, setLegalOfficers] = useState<any[]>([]);
    const [selectedLo, setSelectedLo] = useState('');
    const [isEditingType, setIsEditingType] = useState(false);
    const [newCaseType, setNewCaseType] = useState('');
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);
    const [editMetadata, setEditMetadata] = useState<any>({});

    // Land Case Documents Upload State
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docTitle, setDocTitle] = useState('');
    const [docCategory, setDocCategory] = useState<'Deed' | 'Survey Plan'>('Deed');

    useEffect(() => {
        fetchCase();
    }, [id]);

    useEffect(() => {
        if (user && (user.role === 'SUPERVISOR' || user.role === 'CLO' || user.role === 'ADMIN')) {
            fetchLegalOfficers();
        }
    }, [user]);

    const fetchCase = async () => {
        try {
            const res = await axios.get(`http://backend-service:5000/cases/${id}`);
            setCaseData(res.data);
        } catch (error) {
            console.error('Failed to fetch case', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLegalOfficers = async () => {
        try {
            const res = await axios.get('http://backend-service:5000/users/legal-officers');
            setLegalOfficers(res.data);
        } catch (error) {
            console.error('Failed to fetch LOs');
        }
    };

    const handleSubmitForApproval = async () => {
        if (!confirm('Are you sure you want to submit the Initial Document for approval?')) return;
        setActionLoading(true);
        try {
            await axios.post(`http://backend-service:5000/cases/${id}/submit`);
            fetchCase();
        } catch (error) {
            alert('Failed to submit case');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprovalAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGE') => {
        if (action !== 'APPROVE' && !remarks) {
            alert('Remarks are required for rejection or change request.');
            return;
        }
        setActionLoading(true);
        try {
            await axios.post(`http://backend-service:5000/cases/${id}/review`, { action, remarks });
            setRemarks('');
            fetchCase();
        } catch (error) {
            alert('Failed to process action');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignCase = async (loId?: string) => {
        if (!confirm(loId ? 'Assign this case to selected Legal Officer?' : 'Pick this case for yourself?')) return;
        setActionLoading(true);
        try {
            await axios.post(`http://backend-service:5000/cases/${id}/assign`, { assignedLoId: loId });
            fetchCase();
            alert('Assignment successful');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to assign case');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCaseTypeChangeRequest = async () => {
        if (!newCaseType || newCaseType === caseData.type) {
            setIsEditingType(false);
            return;
        }

        setActionLoading(true);
        try {
            await axios.post(`http://backend-service:5000/cases/${id}/change-type`, { newType: newCaseType });
            setIsEditingType(false);
            fetchCase();
            alert('Case type change request submitted to Supervisor');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReviewChangeRequest = async (changeId: string, action: 'APPROVE' | 'REJECT') => {
        setActionLoading(true);
        try {
            await axios.post(`http://backend-service:5000/cases/changes/${changeId}/review`, { action });
            fetchCase();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to process request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateMetadata = async () => {
        setActionLoading(true);
        try {
            await axios.put(`http://backend-service:5000/cases/${id}/metadata`, { metadata: editMetadata });
            setIsEditingMetadata(false);
            fetchCase();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update details');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditMetadataClick = () => {
        setEditMetadata(caseData.metadata || {});
        setIsEditingMetadata(true);
    };

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFile) return;

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append('document', docFile);
        formData.append('title', docTitle || docFile.name);
        formData.append('category', docCategory);

        try {
            await axios.post(`http://backend-service:5000/cases/${id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocFile(null);
            setDocTitle('');
            fetchCase();
            alert('Document uploaded successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const renderMetadataField = (label: string, field: string, type: 'text' | 'number' | 'date' | 'textarea' = 'text', readOnlyValue?: any) => {
        if (!isEditingMetadata) {
            return (
                <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span>
                    <span className="font-medium text-sm">
                        {readOnlyValue !== undefined ? readOnlyValue : (caseData.metadata?.[field] || 'N/A')}
                    </span>
                </div>
            );
        }

        if (type === 'textarea') {
            return (
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <textarea
                        className="input-field text-sm"
                        value={editMetadata[field] || ''}
                        onChange={e => setEditMetadata({ ...editMetadata, [field]: e.target.value })}
                        rows={3}
                    />
                </div>
            );
        }

        return (
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                    type={type}
                    className="input-field text-sm py-1"
                    value={editMetadata[field] || ''}
                    onChange={e => setEditMetadata({ ...editMetadata, [field]: e.target.value })}
                />
            </div>
        );
    };

    const renderMetadataCard = () => {
        const canEdit = user?.role === 'ADMIN' || user?.role === 'CLO' || user?.role === 'SUPERVISOR' || (user?.role === 'USER' && user.id === caseData.createdById) || (user?.role === 'LO' && user.id === caseData.assignedLoId);

        let content = null;
        let title = 'Case Specific Details';

        switch (caseData.type) {
            case 'Money Recovery':
                title = 'Money Recovery Details';
                const claimValue = parseFloat(caseData.metadata?.claimAmount) || 0;
                const recoveredValue = parseFloat(caseData.metadata?.recoveredAmount) || 0;
                const outstanding = claimValue - recoveredValue;

                content = (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {renderMetadataField('Claim Amount', 'claimAmount', 'number')}
                        {renderMetadataField('Recovered Amount', 'recoveredAmount', 'number')}
                        <div>
                            <span className="block text-gray-500 text-xs uppercase tracking-wider">Outstanding Balance</span>
                            <span className="font-medium text-sm text-red-600">${outstanding.toLocaleString()}</span>
                        </div>
                    </div>
                );
                break;
            case 'Damages Recovery':
                title = 'Damages Recovery Details';
                content = (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {renderMetadataField('Damage Assessment Value', 'damageAssessmentValue', 'number')}
                        {renderMetadataField('Tracked Compensation', 'trackedCompensation', 'number')}
                        <div className="md:col-span-2">
                            {renderMetadataField('Settlement Status / Outcome', 'settlementStatus', 'textarea')}
                        </div>
                    </div>
                );
                break;
            case 'Appeals':
                title = 'Appeal Details';
                content = (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {renderMetadataField('Original Case Reference', 'originalCaseReference', 'text')}
                        {renderMetadataField('Appeal Deadline Date', 'appealDeadlineDate', 'date')}
                        <div className="md:col-span-2">
                            {renderMetadataField('Appeal Outcome', 'appealOutcome', 'textarea')}
                        </div>
                    </div>
                );
                break;
            case 'Land Cases':
                title = 'Land Case Details';
                content = (
                    <div className="grid grid-cols-1 gap-y-4">
                        {renderMetadataField('Land Reference Number', 'landReferenceNumber', 'text')}
                        {renderMetadataField('Ownership History', 'ownershipHistory', 'textarea')}
                    </div>
                );
                break;
            case 'Criminal Cases':
                title = 'Criminal Case Details';
                content = (
                    <div className="grid grid-cols-1 gap-y-4">
                        {renderMetadataField('Charges and Statutes', 'chargesAndStatutes', 'textarea')}
                        {renderMetadataField('Hearing History Log', 'hearingHistory', 'textarea')}
                    </div>
                );
                break;
            case 'Inquiries / Disciplinary':
                title = 'Inquiry / Disciplinary Details';
                content = (
                    <div className="grid grid-cols-1 gap-y-4">
                        {renderMetadataField('Inquiry Panel Members', 'inquiryPanelMembers', 'textarea')}
                        {renderMetadataField('Findings & Recommendations', 'findings', 'textarea')}
                        {renderMetadataField('Management Decision', 'managementDecision', 'textarea')}
                    </div>
                );
                break;
            case 'Other Court / Legal Matters':
                title = 'Other Legal Matter Attributes';
                content = (
                    <div className="grid grid-cols-1 gap-y-4">
                        {renderMetadataField('Custom Attributes / Details', 'customAttributes', 'textarea')}
                    </div>
                );
                break;
            default:
                return null;
        }

        return (
            <div className="card mt-6 border-t-4 border-indigo-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" /> {title}
                    </h3>
                    {canEdit && !isEditingMetadata && (
                        <button onClick={handleEditMetadataClick} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center btn-secondary py-1 px-2">
                            <Edit2 className="w-3 h-3 mr-1" /> Update / Track Details
                        </button>
                    )}
                    {canEdit && isEditingMetadata && (
                        <div className="flex gap-2">
                            <button onClick={handleUpdateMetadata} disabled={actionLoading} className="text-xs text-green-700 hover:text-green-900 flex items-center btn-primary bg-green-100 hover:bg-green-200 border-green-200 py-1 px-2">
                                <Save className="w-3 h-3 mr-1" /> Save Details
                            </button>
                            <button onClick={() => setIsEditingMetadata(false)} disabled={actionLoading} className="text-xs text-red-600 hover:text-red-800 flex items-center btn-secondary py-1 px-2">
                                <XCircle className="w-3 h-3 mr-1" /> Cancel
                            </button>
                        </div>
                    )}
                </div>
                {content}
            </div>
        );
    };

    const renderLandDocuments = () => {
        if (caseData?.type !== 'Land Cases') return null;

        const landDocs = caseData.documents?.filter((d: any) => d.category === 'Deed' || d.category === 'Survey Plan') || [];

        return (
            <div className="card mt-6 border-t-4 border-green-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FileIcon className="w-5 h-5 mr-2 text-green-600" /> Deeds & Survey Plans
                </h3>

                {landDocs.length > 0 ? (
                    <div className="space-y-3 mb-6">
                        {landDocs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                <div className="flex items-center">
                                    <FileIcon className="w-4 h-4 text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                                        <p className="text-xs text-gray-500">{doc.category} • Uploaded on {format(new Date(doc.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                <a
                                    href={`http://backend-service:5000/${doc.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Download/View"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic mb-6">No deeds or survey plans uploaded yet.</p>
                )}

                {(user?.id === caseData.createdById || user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'CLO') && (
                    <form onSubmit={handleUploadDocument} className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Upload New Document</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    className="input-field text-sm py-1.5"
                                    value={docCategory}
                                    onChange={(e) => setDocCategory(e.target.value as any)}
                                >
                                    <option value="Deed">Deed</option>
                                    <option value="Survey Plan">Survey Plan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Custom Title (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field text-sm py-1.5"
                                    placeholder="Leave blank to use filename"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                className="text-sm flex-1 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={uploadingDoc || !docFile}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center"
                            >
                                <Upload className="w-3 h-3 mr-1" />
                                {uploadingDoc ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!caseData) return <div className="p-8 text-center">Case not found</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <Link to="/cases" className="inline-flex items-center text-sm text-gray-500 hover:text-black">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>

            {/* Header */}
            <div className="card flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border 
                            ${caseData.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {caseData.status}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="flex items-center">
                            <Scale className="w-4 h-4 mr-1" />
                            {isEditingType ? (
                                <div className="flex items-center gap-2 ml-1">
                                    <select
                                        className="input-field py-1 text-xs"
                                        value={newCaseType}
                                        onChange={(e) => setNewCaseType(e.target.value)}
                                    >
                                        <option value="Money Recovery">Money Recovery</option>
                                        <option value="Land Dispute">Land Dispute</option>
                                        <option value="Intellectual Property">Intellectual Property</option>
                                        <option value="Employment">Employment</option>
                                        <option value="Corporate">Corporate</option>
                                    </select>
                                    <button onClick={handleCaseTypeChangeRequest} disabled={actionLoading} className="text-green-600 hover:text-green-800"><CheckCircle className="w-4 h-4" /></button>
                                    <button onClick={() => setIsEditingType(false)} disabled={actionLoading} className="text-red-600 hover:text-red-800"><XCircle className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="ml-1">{caseData.type}</span>
                                    {caseData.status === 'ACTIVE' && user?.id === caseData.createdById && !caseData.changeRequests?.some((cr: any) => cr.status === 'PENDING' && cr.type === 'CASE_TYPE') && (
                                        <button
                                            onClick={() => { setIsEditingType(true); setNewCaseType(caseData.type); }}
                                            className="ml-2 text-xs text-blue-600 hover:underline"
                                        >
                                            Edit Type
                                        </button>
                                    )}
                                    {caseData.changeRequests?.some((cr: any) => cr.status === 'PENDING' && cr.type === 'CASE_TYPE') && (
                                        <span className="ml-2 text-xs text-orange-500 italic">(Type change pending)</span>
                                    )}
                                </>
                            )}
                        </span>
                        <span className="flex items-center font-mono bg-gray-100 px-2 rounded w-fit">#{caseData.referenceNumber}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {/* Creator Actions */}
                    {user?.id === caseData.createdById && (caseData.initialDocStatus === 'DRAFT' || caseData.initialDocStatus === 'REVISION_REQUIRED') && (
                        <button onClick={handleSubmitForApproval} disabled={actionLoading} className="btn-primary flex items-center">
                            <Send className="w-4 h-4 mr-2" /> Submit for Approval
                        </button>
                    )}

                    {/* Supervisor Actions */}
                    {(user?.role === 'SUPERVISOR' || user?.role === 'CLO' || user?.role === 'ADMIN') && caseData.initialDocStatus === 'PENDING_APPROVAL' && (
                        <div className="flex flex-col gap-2 items-end">
                            <div className="flex gap-2">
                                <button onClick={() => handleApprovalAction('APPROVE')} disabled={actionLoading} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                </button>
                                <button onClick={() => handleApprovalAction('REJECT')} disabled={actionLoading} className="btn-danger flex items-center">
                                    <XCircle className="w-4 h-4 mr-2" /> Reject
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Remarks (Required for Reject)"
                                className="input-field text-sm py-1"
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Case Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2" /> Initial Document
                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${caseData.initialDocStatus === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                {caseData.initialDocStatus.replace('_', ' ')}
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Court</span>
                                <span className="font-medium">{caseData.court || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Judge</span>
                                <span className="font-medium">{caseData.judge || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Filing Date</span>
                                <span className="font-medium">{caseData.filingDate ? format(new Date(caseData.filingDate), 'MMM d, yyyy') : 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Location</span>
                                <span className="font-medium">{caseData.location || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Financial Exposure</span>
                                <span className="font-medium font-mono">{caseData.financialExposure ? `$${caseData.financialExposure.toLocaleString()}` : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <span className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Description / Facts</span>
                            <p className="text-gray-700 whitespace-pre-wrap">{caseData.description || 'No description provided.'}</p>
                        </div>
                    </div>

                    {/* Dynamic Case Details */}
                    {renderMetadataCard()}

                    {/* Deeds and Survey Plans (Land Cases only) */}
                    {renderLandDocuments()}

                    {/* Parties */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Parties Involved
                        </h3>
                        {caseData.parties && Array.isArray(caseData.parties) && caseData.parties.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {caseData.parties.map((p: any, i: number) => (
                                    <div key={i} className="py-2 flex justify-between items-center">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.role}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No parties listed.</p>
                        )}
                    </div>
                </div>

                {/* Right: Meta & Events */}
                <div className="space-y-6">
                    {/* Change Requests (Supervisors) */}
                    {(user?.role === 'SUPERVISOR' || user?.role === 'CLO' || user?.role === 'ADMIN') &&
                        caseData.changeRequests &&
                        caseData.changeRequests.filter((cr: any) => cr.status === 'PENDING').length > 0 && (
                            <div className="card border-orange-200 bg-orange-50">
                                <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center">
                                    Pending Requests
                                </h3>
                                <div className="space-y-3">
                                    {caseData.changeRequests.filter((cr: any) => cr.status === 'PENDING').map((cr: any) => (
                                        <div key={cr.id} className="bg-white p-3 rounded border border-orange-100 text-sm">
                                            <div className="mb-2">
                                                <span className="font-semibold">{cr.type.replace('_', ' ')}</span>
                                                {cr.type === 'CASE_TYPE' && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Requested: <span className="font-medium">{cr.data.newType}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReviewChangeRequest(cr.id, 'APPROVE')}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1 rounded text-xs font-medium"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReviewChangeRequest(cr.id, 'REJECT')}
                                                    disabled={actionLoading}
                                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1 rounded text-xs font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Assignment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Created By</span>
                                <div className="flex items-center mt-1">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-2">
                                        {caseData.createdBy?.name?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium">{caseData.createdBy?.name}</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Legal Officer</span>
                                {caseData.assignedLo ? (
                                    <div className="flex items-center mt-1">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold mr-2">
                                            {caseData.assignedLo.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium">{caseData.assignedLo.name}</span>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        {/* LO Self Pickup */}
                                        {user?.role === 'LO' && caseData.requiresLegalOfficer && (
                                            <button
                                                onClick={() => handleAssignCase()}
                                                disabled={actionLoading}
                                                className="w-full btn-secondary text-xs flex justify-center py-2"
                                            >
                                                Pick this Case
                                            </button>
                                        )}

                                        {/* Supervisor Assign */}
                                        {(user?.role === 'SUPERVISOR' || user?.role === 'ADMIN' || user?.role === 'CLO') && (
                                            <div className="flex gap-2">
                                                <select
                                                    className="input-field text-xs py-1"
                                                    value={selectedLo}
                                                    onChange={e => setSelectedLo(e.target.value)}
                                                >
                                                    <option value="">Select Officer...</option>
                                                    {legalOfficers.map(lo => (
                                                        <option key={lo.id} value={lo.id}>{lo.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleAssignCase(selectedLo)}
                                                    disabled={!selectedLo || actionLoading}
                                                    className="btn-primary text-xs px-3 py-1"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        )}

                                        {!caseData.requiresLegalOfficer && user?.role !== 'LO' && (
                                            <span className="text-gray-400 text-sm italic">Not Required</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" /> Upcoming Events
                        </h3>
                        <div className="text-center py-6 text-gray-400 text-sm">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No events scheduled
                        </div>
                    </div>

                    {/* Activity Logs */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2" /> Activity History
                        </h3>
                        {caseData.actionLogs && caseData.actionLogs.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {caseData.actionLogs.map((log: any) => (
                                    <div key={log.id} className="text-sm border-l-2 border-gray-200 pl-3 pb-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                                            <span className="text-xs text-gray-500">{format(new Date(log.timestamp), 'MMM d, p')}</span>
                                        </div>
                                        <div className="text-gray-600 text-xs flex items-center gap-1 mb-1">
                                            <Users className="w-3 h-3" /> {log.user?.name || 'System'}
                                        </div>
                                        {log.details && (
                                            <p className="text-gray-500 text-xs italic mt-1 bg-gray-50 p-2 rounded">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No activity recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;
