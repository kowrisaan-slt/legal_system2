import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const CreateCase: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuth(); // Removed unused
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        type: 'Money Recovery', // Default
        referenceNumber: '',
        court: '',
        judge: '',
        filingDate: '',
        description: '',
        location: '',
        requiresLegalOfficer: true,
        parties: [{ name: '', role: 'Plaintiff' }], // Initial party
        metadata: {} as any
    });

    const caseTypes = [
        'Money Recovery',
        'Damages Recovery',
        'Appeals',
        'Land Cases',
        'Criminal Cases',
        'Inquiries / Disciplinary',
        'Other Court / Legal Matters'
    ];

    const handleMetadataChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [field]: value
            }
        }));
    };

    // When type changes, reset metadata to avoid leaking fields across types
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, type: e.target.value, metadata: {} });
    };

    const handlePartyChange = (index: number, field: string, value: string) => {
        const newParties = [...formData.parties];
        (newParties[index] as any)[field] = value;
        setFormData({ ...formData, parties: newParties });
    };

    const addParty = () => {
        setFormData({ ...formData, parties: [...formData.parties, { name: '', role: 'Plaintiff' }] });
    };

    const removeParty = (index: number) => {
        const newParties = formData.parties.filter((_, i) => i !== index);
        setFormData({ ...formData, parties: newParties });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://backend-service:5000/cases', formData);
            navigate('/cases');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create case');
        } finally {
            setLoading(false);
        }
    };

    const renderDynamicFields = () => {
        switch (formData.type) {
            case 'Money Recovery':
                return (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Money Recovery Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Claim Amount</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.metadata.claimAmount || ''}
                                onChange={e => handleMetadataChange('claimAmount', e.target.value)}
                                placeholder="Total claim amount in local currency"
                                required
                            />
                        </div>
                    </div>
                );
            case 'Damages Recovery':
                return (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Damages Recovery Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Damage Assessment Value</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.metadata.damageAssessmentValue || ''}
                                onChange={e => handleMetadataChange('damageAssessmentValue', e.target.value)}
                                placeholder="Assessed damage value"
                                required
                            />
                        </div>
                    </div>
                );
            case 'Appeals':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Appeal Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Original Case Reference</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.metadata.originalCaseReference || ''}
                                onChange={e => handleMetadataChange('originalCaseReference', e.target.value)}
                                placeholder="Reference of the original case"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Appeal Deadline Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.metadata.appealDeadlineDate || ''}
                                onChange={e => handleMetadataChange('appealDeadlineDate', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                );
            case 'Land Cases':
                return (
                    <div className="grid grid-cols-1 gap-6 pt-4 border-t">
                        <div className="md:col-span-1">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Land Case Details</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Land Reference / Survey Number</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.metadata.landReferenceNumber || ''}
                                onChange={e => handleMetadataChange('landReferenceNumber', e.target.value)}
                                placeholder="e.g. Plan No. 1234/56"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ownership History Summary</label>
                            <textarea
                                className="input-field"
                                value={formData.metadata.ownershipHistory || ''}
                                onChange={e => handleMetadataChange('ownershipHistory', e.target.value)}
                                placeholder="Brief history of land ownership"
                            />
                        </div>
                    </div>
                );
            case 'Criminal Cases':
                return (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Criminal Case Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Charges and Statutes</label>
                            <textarea
                                className="input-field"
                                value={formData.metadata.chargesAndStatutes || ''}
                                onChange={e => handleMetadataChange('chargesAndStatutes', e.target.value)}
                                placeholder="List of charges and referring statutes"
                                required
                            />
                        </div>
                    </div>
                );
            case 'Inquiries / Disciplinary':
                return (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Inquiry / Disciplinary Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Panel Members</label>
                            <textarea
                                className="input-field"
                                value={formData.metadata.inquiryPanelMembers || ''}
                                onChange={e => handleMetadataChange('inquiryPanelMembers', e.target.value)}
                                placeholder="Names / titles of the panel members"
                                required
                            />
                        </div>
                    </div>
                );
            case 'Other Court / Legal Matters':
                return (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Other Legal Matter Attributes</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Attributes / Details</label>
                            <textarea
                                className="input-field"
                                value={formData.metadata.customAttributes || ''}
                                onChange={e => handleMetadataChange('customAttributes', e.target.value)}
                                placeholder="Any case specific specific details"
                                required
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => navigate('/cases')} className="flex items-center text-sm text-gray-500 hover:text-black">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Legal Case</h1>
                    <a href="/Case_ID_Guide.pdf" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
                        Download Case ID Guide
                    </a>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                            <input
                                required
                                type="text"
                                className="input-field"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Smith vs. Corp Inc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                            <select
                                className="input-field"
                                value={formData.type}
                                onChange={handleTypeChange}
                            >
                                {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Reference Number is now auto-generated */}

                        <div className="md:col-span-2">
                            <div className="flex items-center">
                                <input
                                    id="requires-lo"
                                    type="checkbox"
                                    className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                                    checked={formData.requiresLegalOfficer}
                                    onChange={e => setFormData({ ...formData, requiresLegalOfficer: e.target.checked })}
                                />
                                <label htmlFor="requires-lo" className="ml-2 block text-sm text-gray-900">
                                    Requires Legal Officer Support?
                                    <span className="text-gray-500 text-xs block">If unchecked, case will be handled directly by Supervisor.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Court Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Court / Authority</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.court}
                                onChange={e => setFormData({ ...formData, court: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judge Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.judge}
                                onChange={e => setFormData({ ...formData, judge: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.filingDate}
                                onChange={e => setFormData({ ...formData, filingDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Summary of Facts</label>
                            <textarea
                                className="input-field min-h-[100px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {renderDynamicFields()}

                    {/* Parties */}
                    <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Parties Involved</label>
                        {formData.parties.map((party, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="input-field flex-1"
                                    value={party.name}
                                    onChange={e => handlePartyChange(index, 'name', e.target.value)}
                                />
                                <select
                                    className="input-field w-1/3"
                                    value={party.role}
                                    onChange={e => handlePartyChange(index, 'role', e.target.value)}
                                >
                                    <option value="Plaintiff">Plaintiff</option>
                                    <option value="Defendant">Defendant</option>
                                    <option value="Applicant">Applicant</option>
                                    <option value="Respondent">Respondent</option>
                                    <option value="Other">Other</option>
                                </select>
                                <button type="button" onClick={() => removeParty(index)} className="text-red-500 hover:text-red-700 p-2">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addParty} className="btn-secondary text-sm mt-2 flex items-center">
                            <Plus className="w-4 h-4 mr-1" /> Add Party
                        </button>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                        <button type="submit" disabled={loading} className="btn-primary flex items-center">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCase;
