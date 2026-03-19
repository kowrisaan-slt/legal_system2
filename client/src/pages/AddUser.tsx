import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';

const AddUser: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        department: '',
        role: '',
    });

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://backend-service:5000/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setFetchingUsers(false);
        }
    };

    // Department → Role mapping for UI display
    // We map these to the actual enum values in the value attribute
    const roleOptions: Record<string, { label: string; value: string }[]> = {
        General: [
            { label: 'General User', value: 'USER' }
        ],
        Legal: [
            { label: 'Agreement Reviewer', value: 'REVIEWER' },
            { label: 'CLO (Chief Legal Officer)', value: 'CLO' },
            { label: 'Case Supervisor', value: 'SUPERVISOR' },
            { label: 'Legal Officer', value: 'LO' }
        ],
        'Management/Executives': [
            { label: 'Agreement Approver', value: 'APPROVER' }
        ],
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If department changes, reset role
        if (name === 'department') {
            setFormData({
                ...formData,
                department: value,
                role: '',
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            await axios.post('http://backend-service:5000/users', {
                name: formData.fullName, // Map fullName to name for backend
                email: formData.email,
                password: formData.password,
                department: formData.department,
                role: formData.role
            });
            // Reset form
            setFormData({ fullName: '', email: '', password: '', department: '', role: '' });
            alert('User created successfully');
            fetchUsers(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://backend-service:5000/users/${id}`);
            fetchUsers();
        } catch (err: any) {
            console.error('Failed to delete user', err);
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    // Only ADMIN can add/manage users
    if (user?.role !== 'ADMIN') {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    You do not have permission to manage users.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-gray-500">Create and manage system users and their roles.</p>
                </div>
                <button
                    onClick={() => navigate('/modules')}
                    className="btn-secondary"
                >
                    Back to Modules
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create User Form Section */}
                <div className="md:col-span-1 card h-fit">
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b">New User</h2>
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department
                            </label>
                            <select
                                name="department"
                                required
                                value={formData.department}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="">Select Department</option>
                                <option value="General">General</option>
                                <option value="Legal">Legal</option>
                                <option value="Management/Executives">
                                    Management/Executives
                                </option>
                            </select>
                        </div>

                        {/* Role - Dynamic */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="input-field"
                                disabled={!formData.department}
                            >
                                <option value="">Select Role</option>
                                {formData.department &&
                                    roleOptions[formData.department]?.map((opt) => (
                                        <option key={opt.label} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full"
                            >
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Users List Section */}
                <div className="md:col-span-2 card overflow-hidden">
                    <h2 className="text-xl font-semibold p-6 pb-2 border-b m-0 bg-white">Existing Users</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role / Dept</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {fetchingUsers ? (
                                    <tr><td colSpan={3} className="p-4 text-center">Loading users...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">No users found.</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                                <span className="text-xs text-gray-500">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{u.role}</span>
                                                <span className="text-xs text-gray-500">{u.department || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(u.id, u.name)}
                                                className="text-red-500 hover:text-red-700 focus:outline-none"
                                                title="Delete User"
                                                disabled={u.id === user?.id} // Prevent self-deletion if desired, or let admin do it
                                            >
                                                {u.id === user?.id ? (
                                                    <span className="text-xs text-gray-400 font-normal mr-2">It's you</span>
                                                ) : (
                                                    <Trash2 className="w-5 h-5 ml-auto" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddUser;