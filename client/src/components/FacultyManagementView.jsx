import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  X, 
  Search,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button } from './ui/button';

export default function FacultyManagementView({ dataset, onFacultyAdded }) {
  const [facultyList, setFacultyList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [cadre, setCadre] = useState('AssistantProf');
  const [targetHours, setTargetHours] = useState(18);
  const [specializations, setSpecializations] = useState('');
  const [isClassCoordinator, setIsClassCoordinator] = useState(false);
  const [coordinatedBatchId, setCoordinatedBatchId] = useState(
    dataset?.batches?.[0]?._id || 'batch_1'
  );
  const [password, setPassword] = useState('EduSched@123');

  // Edit State
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmployeeCode, setEditEmployeeCode] = useState('');
  const [editCadre, setEditCadre] = useState('AssistantProf');
  const [editTargetHours, setEditTargetHours] = useState(18);
  const [editSpecializations, setEditSpecializations] = useState('');
  const [editIsCoordinator, setEditIsCoordinator] = useState(false);
  const [editCoordinatedBatchId, setEditCoordinatedBatchId] = useState('batch_1');
  const [editPassword, setEditPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Search and Filter State
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyCadreFilter, setFacultyCadreFilter] = useState('all');
  const [facultyRoleFilter, setFacultyRoleFilter] = useState('all');

  const isFacultyFilterActive = facultySearch.trim() !== '' || facultyCadreFilter !== 'all' || facultyRoleFilter !== 'all';

  const filteredFaculty = facultyList.filter((f) => {
    if (facultyCadreFilter !== 'all' && f.cadre !== facultyCadreFilter) {
      return false;
    }
    if (facultyRoleFilter === 'coordinator' && !f.isClassCoordinator) {
      return false;
    }
    if (facultyRoleFilter === 'regular' && f.isClassCoordinator) {
      return false;
    }
    if (facultySearch.trim()) {
      const q = facultySearch.toLowerCase().trim();
      const matchName = f.name?.toLowerCase().includes(q);
      const matchEmail = f.email?.toLowerCase().includes(q);
      const matchCode = f.employeeCode?.toLowerCase().includes(q);
      const matchUser = f.username?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCode && !matchUser) {
        return false;
      }
    }
    return true;
  });

  const batches = dataset?.batches || [];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFaculty = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch('/api/faculty/list', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setFacultyList(data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty list:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleCadreChange = (newCadre) => {
    setCadre(newCadre);
    if (newCadre === 'Professor') setTargetHours(14);
    else if (newCadre === 'AssociateProf') setTargetHours(16);
    else if (newCadre === 'AssistantProf') setTargetHours(18);
  };

  const handleEditCadreChange = (newCadre) => {
    setEditCadre(newCadre);
    if (newCadre === 'Professor') setEditTargetHours(14);
    else if (newCadre === 'AssociateProf') setEditTargetHours(16);
    else if (newCadre === 'AssistantProf') setEditTargetHours(18);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/faculty/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name,
          email,
          employeeCode,
          cadre,
          targetHours: Number(targetHours),
          specializations,
          isClassCoordinator,
          coordinatedBatchId: isClassCoordinator ? coordinatedBatchId : null,
          password
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          `Faculty ${name} registered! Login Username: "${data.credentials.username}", Password: "${data.credentials.password}"`
        );
        setName('');
        setEmail('');
        setEmployeeCode('');
        setSpecializations('');
        setIsClassCoordinator(false);
        setPassword('EduSched@123');
        fetchFaculty();
        if (onFacultyAdded) onFacultyAdded();
      } else {
        setErrorMessage(data.message || 'Error adding faculty member.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setEditName(f.name);
    setEditEmail(f.email);
    setEditEmployeeCode(f.employeeCode);
    setEditCadre(f.cadre);
    setEditTargetHours(f.targetHours);
    setEditSpecializations(f.specializations || '');
    setEditIsCoordinator(!!f.isClassCoordinator);
    setEditCoordinatedBatchId(f.coordinatedBatchId || batches[0]?._id || 'batch_1');
    setEditPassword('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/faculty/${editingFaculty._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          employeeCode: editEmployeeCode,
          cadre: editCadre,
          targetHours: Number(editTargetHours),
          specializations: editSpecializations,
          isClassCoordinator: editIsCoordinator,
          coordinatedBatchId: editIsCoordinator ? editCoordinatedBatchId : null,
          password: editPassword || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Faculty ${editName} updated successfully.`);
        setEditingFaculty(null);
        fetchFaculty();
        if (onFacultyAdded) onFacultyAdded();
      } else {
        setErrorMessage(data.message || 'Failed to update faculty details.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (facultyId, facultyName) => {
    if (!confirm(`Are you sure you want to delete ${facultyName}? This will remove their user credentials and class assignments.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/faculty/${facultyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Faculty member removed.`);
        fetchFaculty();
        if (onFacultyAdded) onFacultyAdded();
      } else {
        setErrorMessage(data.message || 'Failed to delete faculty member.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    }
  };

  const togglePasswordVisibility = (facId) => {
    setShowPasswordMap((prev) => ({ ...prev, [facId]: !prev[facId] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied "${text}" to clipboard!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span>Faculty Management (Add, Edit, Delete)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            As HOD, register new faculty members, update details/credentials, and manage Class Coordinator designations.
          </p>
        </div>

        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          {facultyList.length} Faculty Members Enrolled
        </span>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-start space-x-2.5 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center space-x-2.5 text-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Add Faculty Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
            Add New Faculty Member
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Issues Direct Login Credentials</span>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Anjali Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. anjali.sharma@eduschedai.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Employee Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FAC-CSE-013"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cadre Level</label>
              <select
                value={cadre}
                onChange={(e) => handleCadreChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Professor">Professor (Target: 14h)</option>
                <option value="AssociateProf">Associate Professor (Target: 16h)</option>
                <option value="AssistantProf">Assistant Professor (Target: 18h)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Weekly Target Hours</label>
              <input
                type="number"
                min="6"
                max="24"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Assign Login Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Default: EduSched@123"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1">Specializations (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Cloud Computing, Artificial Intelligence, Compiler Design"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

          </div>

          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="coordCheck"
                checked={isClassCoordinator}
                onChange={(e) => setIsClassCoordinator(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="coordCheck" className="cursor-pointer font-bold text-slate-800">
                Designate as Class Coordinator (Section In-Charge)
              </label>
            </div>

            {isClassCoordinator && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-600 whitespace-nowrap">Assigned Section:</span>
                <select
                  value={coordinatedBatchId}
                  onChange={(e) => setCoordinatedBatchId(e.target.value)}
                  className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>{isSubmitting ? 'Registering...' : 'Add Faculty Member'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Faculty Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-xs shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Faculty Directory & Permissions</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Edit faculty details, reset passwords, or remove faculty members
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 font-bold text-slate-700">
            {facultyList.length} Faculty Members
          </span>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search faculty name, email, code, username..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
            {facultySearch && (
              <button
                onClick={() => setFacultySearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={facultyCadreFilter}
              onChange={(e) => setFacultyCadreFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Cadres</option>
              <option value="Professor">Professors</option>
              <option value="AssociateProf">Associate Professors</option>
              <option value="AssistantProf">Assistant Professors</option>
            </select>

            <select
              value={facultyRoleFilter}
              onChange={(e) => setFacultyRoleFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="coordinator">🌟 Class Coordinators Only</option>
              <option value="regular">Regular Faculty</option>
            </select>

            {isFacultyFilterActive && (
              <button
                onClick={() => {
                  setFacultySearch('');
                  setFacultyCadreFilter('all');
                  setFacultyRoleFilter('all');
                }}
                className="h-8 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center transition-colors"
              >
                <X className="w-3 h-3 mr-1" /> Reset
              </button>
            )}

            <span className="text-[11px] font-bold text-slate-400 ml-1">
              Showing {filteredFaculty.length} of {facultyList.length}
            </span>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 font-semibold text-slate-500">
                <th className="p-3.5 pl-5">Instructor Name</th>
                <th className="p-3.5">Employee Code</th>
                <th className="p-3.5">Cadre</th>
                <th className="p-3.5">Class Coordinator Role</th>
                <th className="p-3.5">Login Username</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5 text-center">Target</th>
                <th className="p-3.5 text-center pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No faculty members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : filteredFaculty.map((f) => {
                const isProf = f.cadre === 'Professor';
                const isAssoc = f.cadre === 'AssociateProf';
                const isPassVisible = showPasswordMap[f._id];

                return (
                  <tr key={f._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">
                      {f.name}
                      <span className="block text-[11px] font-normal text-slate-400">{f.email}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {f.employeeCode}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isProf 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : isAssoc 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {f.cadre}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {f.isClassCoordinator ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          🌟 Coordinator: {f.coordinatedBatchName || 'Section A'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Regular Faculty</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-blue-600 font-semibold">
                      {f.username}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded text-[11px] font-medium text-slate-800 border border-slate-200">
                          {isPassVisible ? f.password : '••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(f._id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Toggle show password"
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(f.password)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Copy Password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                      {f.targetHours}h
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Faculty"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f._id, f.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Edit Faculty: {editingFaculty.name}</h3>
              </div>
              <button
                onClick={() => setEditingFaculty(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeCode}
                    onChange={(e) => setEditEmployeeCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cadre</label>
                  <select
                    value={editCadre}
                    onChange={(e) => handleEditCadreChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Professor">Professor (14h)</option>
                    <option value="AssociateProf">Associate Professor (16h)</option>
                    <option value="AssistantProf">Assistant Professor (18h)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weekly Target Hours</label>
                  <input
                    type="number"
                    value={editTargetHours}
                    onChange={(e) => setEditTargetHours(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reset Password</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editCoordCheck"
                    checked={editIsCoordinator}
                    onChange={(e) => setEditIsCoordinator(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="editCoordCheck" className="cursor-pointer font-bold text-slate-800">
                    Class Coordinator for Section
                  </label>
                </div>

                {editIsCoordinator && (
                  <select
                    value={editCoordinatedBatchId}
                    onChange={(e) => setEditCoordinatedBatchId(e.target.value)}
                    className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-900"
                  >
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
