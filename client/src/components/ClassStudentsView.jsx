import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  GraduationCap, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Edit, 
  Trash2, 
  X, 
  Search 
} from 'lucide-react';
import { Button } from './ui/button';

export default function ClassStudentsView({ currentUser, dataset }) {
  const [students, setStudents] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Add Form State
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('EduSched@123');

  // Edit State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Search & Filter State
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSortBy, setStudentSortBy] = useState('rollNo');

  const filteredStudents = students
    .filter((std) => {
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchName = std.name?.toLowerCase().includes(q);
        const matchRoll = std.rollNo?.toLowerCase().includes(q);
        const matchUser = std.username?.toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchUser) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (studentSortBy === 'rollNo') {
        return (a.rollNo || '').localeCompare(b.rollNo || '');
      } else {
        return (a.name || '').localeCompare(b.name || '');
      }
    });

  const coordinatedBatchId = currentUser?.coordinatedBatchId || 'batch_1';
  const coordinatedBatch = dataset?.batches?.find((b) => String(b._id) === String(coordinatedBatchId));
  const isCoordinator = !!currentUser?.isClassCoordinator || currentUser?.role === 'HOD';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStudents = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch(`/api/students?batchId=${coordinatedBatchId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (coordinatedBatchId) {
      fetchStudents();
    }
  }, [coordinatedBatchId]);

  const handleRollNoChange = (val) => {
    setRollNo(val);
    if (!username || username === rollNo.toLowerCase().replace(/[^a-z0-9_]/g, '_')) {
      const autoUser = val.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      setUsername(autoUser);
      setEmail(`${autoUser}@student.srm.in`);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/students/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name,
          rollNo,
          email,
          username,
          password,
          batchId: coordinatedBatchId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          `Student "${name}" (${rollNo}) enrolled! Username: "${data.credentials.username}", Password: "${data.credentials.password}"`
        );
        setName('');
        setRollNo('');
        setEmail('');
        setUsername('');
        setPassword('EduSched@123');
        fetchStudents();
      } else {
        setErrorMessage(data.message || 'Error enrolling student.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (std) => {
    setEditingStudent(std);
    setEditName(std.name);
    setEditRollNo(std.rollNo);
    setEditEmail(std.email || '');
    setEditUsername(std.username);
    setEditPassword('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: editName,
          rollNo: editRollNo,
          email: editEmail,
          username: editUsername,
          password: editPassword || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Student ${editName} updated successfully.`);
        setEditingStudent(null);
        fetchStudents();
      } else {
        setErrorMessage(data.message || 'Failed to update student.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId, studentName, rollNo) => {
    if (!confirm(`Are you sure you want to remove ${studentName} (${rollNo}) from this section?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Student ${studentName} removed from roster.`);
        fetchStudents();
      } else {
        setErrorMessage(data.message || 'Failed to delete student.');
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    }
  };

  const togglePasswordVisibility = (stdId) => {
    setShowPasswordMap((prev) => ({ ...prev, [stdId]: !prev[stdId] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied "${text}" to clipboard!`);
  };

  if (!isCoordinator) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3 max-w-lg mx-auto mt-10 shadow-xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Class Coordinator Portal Restricted</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You are currently logged in as a regular faculty member. Only designated <strong>Class Coordinators (Section In-Charges)</strong> assigned by the HOD have authorization to add students to a section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Class Students Management (Add, Edit, Delete)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            As the Class Coordinator for <strong>{coordinatedBatch?.name || 'Your Section'}</strong>, enroll students, update records, reset passwords, or remove students.
          </p>
        </div>

        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 self-start sm:self-auto shadow-2xs">
          🌟 Section In-Charge: {coordinatedBatch?.name}
        </span>
      </div>

      {/* Alerts */}
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
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 text-xs shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
            Enroll Student to {coordinatedBatch?.name || 'Section'}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Class Coordinator Authority</span>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Neha Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Roll / Register Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026CSE003"
                value={rollNo}
                onChange={(e) => handleRollNoChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Username</label>
              <input
                type="text"
                required
                placeholder="e.g. 2026cse003"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium lowercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Default: EduSched@123"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>{isSubmitting ? 'Enrolling...' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-xs shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Students Enrolled in {coordinatedBatch?.name || 'This Section'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Update credentials or remove students from class roster
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
            {students.length} Enrolled Students
          </span>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by student name, roll number, or username..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
            {studentSearch && (
              <button
                onClick={() => setStudentSearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStudentSortBy('rollNo')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  studentSortBy === 'rollNo'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Roll No
              </button>
              <button
                type="button"
                onClick={() => setStudentSortBy('name')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  studentSortBy === 'name'
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Name
              </button>
            </div>

            {studentSearch && (
              <button
                type="button"
                onClick={() => setStudentSearch('')}
                className="h-8 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center transition-colors"
              >
                <X className="w-3 h-3 mr-1" /> Reset
              </button>
            )}

            <span className="text-[11px] font-bold text-slate-400 ml-1">
              Showing {filteredStudents.length} of {students.length}
            </span>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 font-semibold text-slate-500">
                <th className="p-3.5 pl-5">Roll Number</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Login Username</th>
                <th className="p-3.5">Student Password</th>
                <th className="p-3.5">Section</th>
                <th className="p-3.5 text-center pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No students found matching "{studentSearch}".
                  </td>
                </tr>
              ) : filteredStudents.map((std) => {
                const isPassVisible = showPasswordMap[std.id];
                return (
                  <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                      {std.rollNo}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {std.name}
                      <span className="block text-[11px] font-normal text-slate-400">{std.email}</span>
                    </td>
                    <td className="p-3.5 font-mono text-blue-600 font-semibold">
                      {std.username}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded text-[11px] font-medium text-slate-800 border border-slate-200">
                          {isPassVisible ? std.password : '••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(std.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Show Password"
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(std.password)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Copy Password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {std.batchName}
                      </span>
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(std)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(std.id, std.name, std.rollNo)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student"
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

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Edit Student Record</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
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
                <label className="font-semibold text-slate-700 block mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={editRollNo}
                  onChange={(e) => setEditRollNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium lowercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reset Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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
