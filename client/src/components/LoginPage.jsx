import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveDateTime from './LiveDateTime';
import { 
  GraduationCap, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Building2,
  KeyRound,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { apiFetch } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('HOD'); // 'Admin', 'HOD', 'Faculty', 'Student'
  const [usernameOrEmail, setUsernameOrEmail] = useState('hod.cse@hod.college.edu');
  const [password, setPassword] = useState('EduSched@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // HOD Self-Registration Modal State
  const [showHodModal, setShowHodModal] = useState(false);
  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodDepartment, setHodDepartment] = useState('dept_cse_01');
  const [hodPassword, setHodPassword] = useState('');
  const [hodAuthCode, setHodAuthCode] = useState('');
  const [hodLoading, setHodLoading] = useState(false);
  const [hodError, setHodError] = useState(null);
  const [hodSuccess, setHodSuccess] = useState(null);

  const DEFAULT_PASSWORD = 'EduSched@123';

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'Admin') {
      setUsernameOrEmail('admin@admin.college.edu');
    } else if (role === 'HOD') {
      setUsernameOrEmail('hod.cse@hod.college.edu');
    } else if (role === 'Faculty') {
      setUsernameOrEmail('sunita.rao@faculty.college.edu');
    } else if (role === 'Student') {
      setUsernameOrEmail('2026cse001@student.college.edu');
    }
    setPassword(DEFAULT_PASSWORD);
  };

  const submitLogin = async (ident, pwd, roleToVerify) => {
    setIsLoading(true);
    setError(null);

    const emailToSubmit = (ident || usernameOrEmail).trim();
    const passwordToSubmit = (pwd || password).trim();
    const roleForBackend = roleToVerify || selectedRole;

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: emailToSubmit,
          password: passwordToSubmit,
          selectedRole: roleForBackend
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('edusched_user', JSON.stringify(data.user));
        localStorage.setItem('edusched_token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection error with server: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitLogin();
  };

  const handleHodRegisterSubmit = async (e) => {
    e.preventDefault();
    setHodLoading(true);
    setHodError(null);
    setHodSuccess(null);

    try {
      const response = await apiFetch('/api/auth/register-hod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hodName,
          email: hodEmail,
          department: hodDepartment,
          password: hodPassword,
          authorizationCode: hodAuthCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHodSuccess(data.message || 'HOD registered successfully!');
        setUsernameOrEmail(hodEmail);
        setPassword(hodPassword);
        setSelectedRole('HOD');
        setTimeout(() => {
          setShowHodModal(false);
          setHodSuccess(null);
        }, 1500);
      } else {
        setHodError(data.message || 'Registration rejected.');
      }
    } catch (err) {
      setHodError('Connection error: ' + err.message);
    } finally {
      setHodLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7FC] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Soft Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/60 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-50/50 rounded-full filter blur-[120px]"></div>
      </div>

      {/* Top Right Live Date & Time Display */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LiveDateTime className="bg-white border-slate-200/80 shadow-xs" />
      </div>

      {/* Brand & Hero Section */}
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-600/25 ring-4 ring-blue-50 mb-1">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          EduSched<span className="text-blue-600">AI</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Autonomous Academic Scheduling & Institutional Governance Platform
        </p>
      </motion.div>

      {/* Main Login Card */}
      <motion.div 
        className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl relative z-10"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Institutional Role Guidance Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Institutional Role Type
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Auto-detected on backend</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs border border-slate-200/50">
              <button
                type="button"
                onClick={() => handleRoleTabChange('Admin')}
                className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'Admin'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛡️</span>
                <span>Admin/HR</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('HOD')}
                className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'HOD'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🏫</span>
                <span>HOD</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('Faculty')}
                className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'Faculty'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👩‍💼</span>
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('Student')}
                className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  selectedRole === 'Student'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎓</span>
                <span>Student</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 block">
                  Institutional Email / Username
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedRole === 'Admin' && 'e.g. admin@admin.college.edu'}
                  {selectedRole === 'HOD' && 'e.g. hod.cse@hod.college.edu'}
                  {selectedRole === 'Faculty' && 'e.g. sunita.rao@faculty.college.edu'}
                  {selectedRole === 'Student' && 'e.g. 2026cse001@student.college.edu'}
                </span>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your institutional email address"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 block">Password</label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Default: <code className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 font-mono border border-blue-100 font-bold">{DEFAULT_PASSWORD}</code>
                </span>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 h-11 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating Credentials...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      </motion.div>

      {/* HOD Self-Registration Modal */}
      <AnimatePresence>
        {showHodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 space-y-5 relative"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>HOD Self-Registration Portal</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Register Department Head Account
                  </h2>
                  <p className="text-xs text-slate-500">
                    Self-registration is strictly authorized for Department Heads with verified institutional authorization credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHodModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {hodError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{hodError}</span>
                </div>
              )}

              {hodSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{hodSuccess}</span>
                </div>
              )}

              <form onSubmit={handleHodRegisterSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Full Name & Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={hodName}
                    onChange={(e) => setHodName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      Institutional HOD Email <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      Must match convention: *@hod.srm.in
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={hodEmail}
                    onChange={(e) => setHodEmail(e.target.value)}
                    placeholder="e.g. sk@hod.srm.in or hod.cse@eduschedai.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={hodDepartment}
                      onChange={(e) => setHodDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                    >
                      <option value="dept_cse_01">Computer Science & Engineering</option>
                      <option value="dept_ece_02">Electronics & Communication</option>
                      <option value="dept_it_03">Information Technology</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Account Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={hodPassword}
                      onChange={(e) => setHodPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      Institutional Authorization Security Key <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Institutional key: SRM_HOD_2026
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={hodAuthCode}
                      onChange={(e) => setHodAuthCode(e.target.value)}
                      placeholder="Enter University HOD authorization key"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Prevents unauthorized registration without Dean/University registrar validation.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowHodModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hodLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <span>{hodLoading ? 'Verifying...' : 'Authorize & Register HOD'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
