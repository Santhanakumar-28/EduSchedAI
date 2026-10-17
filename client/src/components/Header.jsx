import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { apiFetch } from '../api';

export default function Header({ 
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onGenerateClick, 
  onExportClick,
  metrics,
  isGenerating
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('edusched_token');
      if (!token) return;
      const res = await apiFetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotificationsList(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('edusched_token');
      await apiFetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const role = currentUser?.role || 'HOD';
  const displayName = currentUser?.name || 'Authorized User';
  const displayRole = role === 'Admin' ? 'Dean / Admin' : role === 'HOD' ? 'HOD' : role === 'Faculty' && currentUser?.isClassCoordinator ? 'Coordinator' : role;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-3 select-none">
      <div className="flex items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty, subjects, schedule..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Right Section: Notification & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Notification Center Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 relative transition-colors shadow-2xs"
              title="Notification Center"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notificationsList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      No notifications at this time.
                    </div>
                  ) : (
                    notificationsList.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                          !n.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 line-clamp-1">{n.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown (Strictly no role switching) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-3 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              {/* Profile Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                <span>{displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
              </div>

              {/* Name & Designation */}
              <div className="hidden sm:block leading-tight text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-none">
                  {displayRole}
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'user@college.edu'}</p>
                  <div className="mt-1 flex items-center space-x-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">
                      Role: {displayRole}
                    </span>
                    {currentUser?.role !== 'Admin' && currentUser?.departmentId && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                        {currentUser?.departmentId === 'dept_cse_01' ? 'CSE' : currentUser?.departmentId}
                      </span>
                    )}
                    {currentUser?.role === 'Admin' && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                        Central Administration
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
