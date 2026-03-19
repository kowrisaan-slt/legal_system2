import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, PlusCircle, LogOut, Bell, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

interface LayoutProps {
    module?: 'agreements' | 'cases';
}

const Layout: React.FC<LayoutProps> = ({ module = 'agreements' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://backend-service:5000/agreements/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    React.useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkRead = async (id: string) => {
        try {
            await axios.put(`http://backend-service:5000/agreements/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = module === 'cases' ? [
        { name: 'Case Dashboard', path: '/cases', icon: LayoutDashboard },
        { name: 'New Case', path: '/cases/new', icon: PlusCircle, roles: ['USER', 'LO', 'ADMIN'] },
        // { name: 'New User', path: '/users', icon: PlusCircle, roles: ['ADMIN'] }
    ] : [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Agreements', path: '/agreements', icon: FileText },
        { name: 'New Agreement', path: '/create', icon: PlusCircle, roles: ['USER', 'ADMIN', 'CLO'] },
        // { name: 'New User', path: '/users', icon: PlusCircle, roles: ['ADMIN'] }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Sticky Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex">
                            <Link to="/modules" className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
                                {/* Samsung-style Logo */}
                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl tracking-tighter">L</span>
                                </div>
                                <div>
                                    <span className="font-bold text-xl tracking-tight text-gray-900 block leading-tight">Legal</span>
                                    <span className="text-xs text-gray-500 font-medium tracking-widest uppercase block">Management System</span>
                                </div>
                            </Link>

                            {/* Desktop Nav */}
                            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
                                {navItems.map((item) => {
                                    if (item.roles && user && !item.roles.includes(user.role)) return null;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={clsx(
                                                isActive
                                                    ? 'border-black text-gray-900 border-b-2'
                                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:border-b-2',
                                                'inline-flex items-center px-4 pt-1 text-sm font-medium transition-all duration-200 h-full'
                                            )}
                                        >
                                            <item.icon className={clsx("w-4 h-4 mr-2", isActive ? "text-black" : "text-gray-400")} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                            {/* Notifications */}
                            <div
                                className="relative"
                                onMouseEnter={() => setShowNotifications(true)}
                                onMouseLeave={() => setShowNotifications(false)}
                            >
                                <button
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <Bell className="h-6 w-6" aria-hidden="true" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500 animate-pulse" />
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-900">Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                            )}
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No notifications
                                            </div>
                                        ) : (
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.map(notification => (
                                                    <div key={notification.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}>
                                                        <p className="text-sm text-gray-900">{notification.message}</p>
                                                        <div className="mt-1 flex justify-between items-center">
                                                            <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</p>
                                                            {!notification.isRead && (
                                                                <button onClick={() => handleMarkRead(notification.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                                    Mark read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 mr-4">
                                    {user?.name}
                                    <span className="text-xs text-gray-500 block text-right">{user?.role}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            if (item.roles && user && !item.roles.includes(user.role)) return null;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={clsx(
                                        isActive
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                                        'block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center'
                                    )}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-800 flex items-center"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500">&copy; 2026 Legal Management System. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Privacy Policy</a>
                        <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Terms of Service</a>
                        <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
