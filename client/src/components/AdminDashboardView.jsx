import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  ClipboardList, 
  Settings, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Sparkles, 
  Lock, 
  RefreshCw,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '../api';

export default function AdminDashboardView({ initialTab = 'overview', onNavigateTab }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [overviewData, setOverviewData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [settingsData, setSettingsData] = useState(null);
  const [hodLeavesList, setHodLeavesList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  // Department creation state
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptBuilding, setDeptBuilding] = useState('');
  const [deptHodName, setDeptHodName] = useState('');
  const [deptHodEmail, setDeptHodEmail] = useState('');

  // HOD Provisioning state
  const [provName, setProvName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provDept, setProvDept] = useState('dept_cse_01');
  const [provCadre, setProvCadre] = useState('Professor');
  const [provPassword, setProvPassword] = useState('EduSched@123');

  // Acting HOD selection state for leaves
  const [actingHodMap, setActingHodMap] = useState({});

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadAllAdminData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      const [overviewRes, usersRes, auditRes, settingsRes, leavesRes, facRes] = await Promise.all([
        apiFetch('/api/admin/overview', { headers }),
        apiFetch('/api/admin/users', { headers }),
        apiFetch('/api/admin/audit-logs', { headers }),
        apiFetch('/api/admin/settings', { headers }),
        apiFetch('/api/leaves/requests', { headers }),
        apiFetch('/api/faculty/list', { headers })
      ]);

      const [ovJson, uJson, aJson, sJson, lJson, fJson] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        auditRes.json(),
        settingsRes.json(),
        leavesRes.json(),
        facRes.json()
      ]);

      if (ovJson.success) setOverviewData(ovJson.data);
      if (uJson.success) setUsersList(uJson.data || []);
      if (aJson.success) setAuditLogsList(aJson.data || []);
      if (sJson.success) setSettingsData(sJson.data);
      if (lJson.success) {
        // Filter specifically for HOD leaves
        setHodLeavesList((lJson.data || []).filter(l => l.applicantType === 'HOD'));
      }
      if (fJson.success) setFacultyList(fJson.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  useEffect(() => {
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialTab]);

  // Handle Create Department
  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          code: deptCode,
          name: deptName,
          building: deptBuilding,
          hodName: deptHodName,
          hodEmail: deptHodEmail
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setDeptCode('');
        setDeptName('');
        setDeptBuilding('');
        setDeptHodName('');
        setDeptHodEmail('');
        loadAllAdminData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Provision HOD
  const handleProvisionHod = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/admin/hod/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: provName,
          email: provEmail,
          departmentId: provDept,
          cadre: provCadre,
          password: provPassword
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setProvName('');
        setProvEmail('');
        setProvPassword('EduSched@123');
        loadAllAdminData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Status Toggle
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`User status updated to ${newStatus}`);
        loadAllAdminData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  // Handle HOD Leave Approval
  const handleHodLeaveDecide = async (leaveId, decision) => {
    const actingHod = actingHodMap[leaveId];
    if (decision === 'Approved' && !actingHod) {
      alert('Please select an Acting Department Head from the senior faculty roster before approving.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/hod-decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          leaveId,
          decision,
          actingHodFacultyId: actingHod,
          reviewComment: decision === 'Approved' ? `Approved by Dean. Acting HOD assigned.` : 'Leave rejected by Admin.'
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        loadAllAdminData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(json.message);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(settingsData)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg('College settings updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchRoll = u.rollNo?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRoll) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span>Administrator & HR Central Command</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Institutional Governance Center</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            College-wide administration: create departments, provision HOD accounts, oversee users, review HOD leave, and audit system logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={loadAllAdminData}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Cloud Data</span>
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Subtab Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 text-xs font-bold">
        {[
          { id: 'overview', label: 'College Overview', icon: Building2 },
          { id: 'departments', label: 'Departments & HODs', icon: Layers },
          { id: 'users', label: 'All Users Directory', icon: Users },
          { id: 'hod_leaves', label: `HOD Leave Queue (${hodLeavesList.filter(l => l.status === 'Pending').length})`, icon: ClipboardList },
          { id: 'audit', label: 'Security Audit Logs', icon: ShieldCheck },
          { id: 'settings', label: 'College Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COLLEGE OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Departments</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overviewData?.totalDepartments || 5}</p>
              <span className="text-[11px] font-semibold text-blue-600 mt-2 block">Engineering & Sciences</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Faculty Strength</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overviewData?.totalFaculty || 8}</p>
              <span className="text-[11px] font-semibold text-emerald-600 mt-2 block">100% Workload Balanced</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Students</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overviewData?.totalStudents || 120}</p>
              <span className="text-[11px] font-semibold text-indigo-600 mt-2 block">Sections A & B</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cloud Server Status</span>
              <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>MongoDB Atlas Live</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Active CSP Hybrid Engine</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div 
              onClick={() => setActiveSubTab('departments')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Provision HOD & Departments</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add new academic departments and issue institutional credentials to department heads.
              </p>
            </div>

            <div 
              onClick={() => setActiveSubTab('hod_leaves')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Review HOD Leaves</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Examine leave requests submitted by Department Heads and assign Acting HODs.
              </p>
            </div>

            <div 
              onClick={() => setActiveSubTab('audit')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">System Security Audit Logs</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect immutable audit logs for logins, role assignments, and timetable alterations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & HOD PROVISIONING */}
      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form 1: Create Department */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Create New Academic Department</h3>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. AI-DS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Building Block</label>
                  <input
                    type="text"
                    value={deptBuilding}
                    onChange={(e) => setDeptBuilding(e.target.value)}
                    placeholder="e.g. Ramanujan Block"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Full Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated HOD Name</label>
                  <input
                    type="text"
                    value={deptHodName}
                    onChange={(e) => setDeptHodName(e.target.value)}
                    placeholder="e.g. Dr. K. Meenakshi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">HOD Institutional Email</label>
                  <input
                    type="email"
                    value={deptHodEmail}
                    onChange={(e) => setDeptHodEmail(e.target.value)}
                    placeholder="e.g. hod.aids@hod.college.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create Department</span>
              </Button>
            </form>
          </div>

          {/* Form 2: Provision HOD Account */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Provision Department HOD Account</h3>
            </div>

            <form onSubmit={handleProvisionHod} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">HOD Full Name *</label>
                <input
                  type="text"
                  required
                  value={provName}
                  onChange={(e) => setProvName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Institutional Email (@hod.college.edu) *</label>
                  <input
                    type="email"
                    required
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    placeholder="e.g. hod.cse@hod.college.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Department</label>
                  <select
                    value={provDept}
                    onChange={(e) => setProvDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  >
                    <option value="dept_cse_01">Computer Science (CSE)</option>
                    <option value="dept_ece_01">Electronics (ECE)</option>
                    <option value="dept_mech_01">Mechanical (MECH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cadre Designation</label>
                  <select
                    value={provCadre}
                    onChange={(e) => setProvCadre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  >
                    <option value="Professor">Senior Professor</option>
                    <option value="AssociateProf">Associate Professor</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={provPassword}
                    onChange={(e) => setProvPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-blue-600 font-bold"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Provision HOD Credentials</span>
              </Button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: USER DIRECTORY & STATUS OVERSIGHT */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">College Users Directory ({filteredUsers.length})</h3>
              <p className="text-xs text-slate-500">Oversee all registered accounts, roles, and authorization status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, roll..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="HOD">HOD</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Cadre / Roll No</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'HOD' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        u.role === 'Faculty' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role} {u.isClassCoordinator ? '(Coordinator)' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{u.cadre || u.rollNo || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.role !== 'Admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            u.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HOD LEAVE QUEUE WITH ACTING HOD ASSIGNMENT */}
      {activeSubTab === 'hod_leaves' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">HOD Leave Applications Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Department Heads submit leave applications to College Admin/HR. An Acting HOD must be assigned during the period of absence.
            </p>
          </div>

          {hodLeavesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No HOD leave applications pending review.
            </div>
          ) : (
            <div className="space-y-4">
              {hodLeavesList.map((leave) => (
                <div key={leave.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{leave.facultyName} (HOD)</span>
                      <span className="text-[11px] text-slate-500 ml-2">CSE Department</span>
                      <span className="block text-[11px] text-slate-600 mt-0.5 font-medium">
                        Period: <span className="font-bold">{leave.startDate} to {leave.endDate}</span> ({leave.leaveType})
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {leave.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    <span className="font-bold text-slate-900">Reason:</span> {leave.reason}
                  </p>

                  {leave.status === 'Pending' ? (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <label className="font-bold text-slate-700 shrink-0">Designate Acting HOD:</label>
                        <select
                          value={actingHodMap[leave.id] || ''}
                          onChange={(e) => setActingHodMap({ ...actingHodMap, [leave.id]: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
                        >
                          <option value="">-- Choose Senior Faculty --</option>
                          {facultyList.filter(f => f.cadre === 'Professor' || f.cadre === 'AssociateProf').map(f => (
                            <option key={f._id} value={f._id}>{f.name} ({f.cadre})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleHodLeaveDecide(leave.id, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
                        >
                          Approve & Assign Acting HOD
                        </Button>
                        <Button
                          onClick={() => handleHodLeaveDecide(leave.id, 'Rejected')}
                          variant="outline"
                          className="text-rose-600 hover:bg-rose-50 border-rose-200 font-bold text-xs h-9"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 pt-1">
                      {leave.actingHodName && (
                        <span>Acting HOD Assigned: <strong className="text-blue-700">{leave.actingHodName}</strong> • </span>
                      )}
                      <span>Reviewed by {leave.decisionBy}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SECURITY AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Security Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable trace of institutional actions, role verifications, and state modifications.</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{auditLogsList.length} Entries Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">User & Role</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogsList.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{log.userEmail}</span>
                      <span className="text-[10px] text-slate-400">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{log.entity}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: COLLEGE SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-2xl space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Institutional Settings & Policies</h3>
            <p className="text-xs text-slate-500">Configure college-wide parameters, attendance thresholds, and timetable schedules.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Institution Name</label>
              <input
                type="text"
                value={settingsData?.institutionName || ''}
                onChange={(e) => setSettingsData({ ...settingsData, institutionName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={settingsData?.academicYear || '2026-2027'}
                  onChange={(e) => setSettingsData({ ...settingsData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Attendance Threshold (%)</label>
                <input
                  type="number"
                  value={settingsData?.minAttendanceThreshold || 75}
                  onChange={(e) => setSettingsData({ ...settingsData, minAttendanceThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Periods Per Day</label>
                <input
                  type="number"
                  value={settingsData?.periodsPerDay || 7}
                  onChange={(e) => setSettingsData({ ...settingsData, periodsPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lunch Break Period</label>
                <input
                  type="number"
                  value={settingsData?.lunchPeriod || 4}
                  onChange={(e) => setSettingsData({ ...settingsData, lunchPeriod: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 mt-2">
              <span>Save Institutional Settings</span>
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}
