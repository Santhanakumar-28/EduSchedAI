import React, { useState } from 'react';
import LiveDateTime from './LiveDateTime';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  KeyRound,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('HOD'); // 'HOD', 'Faculty', 'Student'
  const [usernameOrEmail, setUsernameOrEmail] = useState('hod@eduschedai.edu');
  const [password, setPassword] = useState('EduSched@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const DEFAULT_PASSWORD = 'EduSched@123';

  // Preset demo accounts for quick one-click login
  const quickLogins = [
    {
      role: 'HOD',
      label: 'HOD / Coordinator',
      name: 'Dr. Rajesh Kumar',
      identifier: 'hod@eduschedai.edu',
      desc: 'Can add faculty, assign class coordinators & run AI generation',
      badge: 'Admin Authority'
    },
    {
      role: 'Faculty',
      label: 'Class Coordinator (CSE-A)',
      name: 'Dr. Sunita Rao',
      identifier: 'dr.sunita@eduschedai.edu',
      desc: 'Can view teaching load and add/manage students for Section A',
      badge: 'Section Coordinator'
    },
    {
      role: 'Student',
      label: 'Student (CSE-A)',
      name: 'Aarav Patel',
      identifier: 'student.csea@eduschedai.edu',
      desc: 'Can view batch timetable, room venues and class coordinator',
      badge: 'Roll: 2026CSE001'
    }
  ];

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'HOD') {
      setUsernameOrEmail('hod@eduschedai.edu');
    } else if (role === 'Faculty') {
      setUsernameOrEmail('dr.sunita@eduschedai.edu');
    } else if (role === 'Student') {
      setUsernameOrEmail('student.csea@eduschedai.edu');
    }
    setPassword(DEFAULT_PASSWORD);
  };

  const handleQuickLogin = (item) => {
    setSelectedRole(item.role);
    setUsernameOrEmail(item.identifier);
    setPassword(DEFAULT_PASSWORD);
    submitLogin(item.identifier, DEFAULT_PASSWORD, item.role);
  };

  const submitLogin = async (ident, pwd, role) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: ident || usernameOrEmail,
          password: pwd || password,
          role: role || selectedRole
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('edusched_user', JSON.stringify(data.user));
        localStorage.setItem('edusched_token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Invalid username or password.');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      
      {/* Soft Ambient Background Gradient Glows */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-violet-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Right Live Date & Time Display */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LiveDateTime />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative z-10">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 items-center justify-center text-white shadow-lg shadow-indigo-200/60 ring-4 ring-indigo-500/10 mb-1 transition-transform hover:scale-105">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          EduSched<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI</span> Portal
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
          Intelligent Timetable & Faculty Workload Management System
        </p>
      </div>

      {/* Main Login Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-6">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => handleRoleTabChange('HOD')}
                className={`py-2 px-3 rounded-xl font-bold transition-all flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-1.5 ${
                  selectedRole === 'HOD'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🏫</span>
                <span>HOD</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('Faculty')}
                className={`py-2 px-3 rounded-xl font-bold transition-all flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-1.5 ${
                  selectedRole === 'Faculty'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👩‍💼</span>
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('Student')}
                className={`py-2 px-3 rounded-xl font-bold transition-all flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-1.5 ${
                  selectedRole === 'Student'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎓</span>
                <span>Student</span>
              </button>
            </div>
          </div>

          {/* Role Description Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              {selectedRole === 'HOD' && (
                <p>
                  <strong>HOD / Coordinator:</strong> Master admin access. Can add new faculty members, set their passwords, assign class coordinators, and trigger AI timetable synthesis.
                </p>
              )}
              {selectedRole === 'Faculty' && (
                <p>
                  <strong>Faculty / Section Coordinator:</strong> View your personalized schedule, workload, and apply for leaves. <em>Class Coordinator mam/sir</em> can add students for their assigned section.
                </p>
              )}
              {selectedRole === 'Student' && (
                <p>
                  <strong>Student Portal:</strong> View your section's weekly timetable, lecture venues, instructor contacts, and reach out to your designated class coordinator.
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {selectedRole === 'Student' ? 'Roll Number / Email / Username' : 'Email Address / Username'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={selectedRole === 'Student' ? 'e.g. 2026CSE001 or student.csea@eduschedai.edu' : 'e.g. name@eduschedai.edu or username'}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">Password</label>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Default: <code className="bg-indigo-50 px-1 py-0.5 rounded text-indigo-700 font-mono">{DEFAULT_PASSWORD}</code>
                </span>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
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
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : `Sign in as ${selectedRole}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                1-Click Quick Demo Accounts
              </span>
              <span className="text-[10px] text-slate-400">Click to instantly test</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {quickLogins.map((item) => (
                <button
                  key={item.identifier}
                  type="button"
                  onClick={() => handleQuickLogin(item)}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-left transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-950">{item.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-slate-200 text-slate-600 group-hover:border-indigo-200 group-hover:text-indigo-700">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 group-hover:text-slate-600">{item.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-3">
                    Login &rarr;
                  </span>
                </button>
              ))}
            </div>

            {/* Hierarchical Workflow Callout */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Workflow Hierarchy:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                <li><strong>HOD</strong> adds Faculty members & can assign them as Class Coordinators.</li>
                <li><strong>Class Coordinator</strong> (e.g. Dr. Sunita Rao) enrolls students for their section with username & password.</li>
                <li><strong>Students</strong> log in with the credentials provided by their coordinator.</li>
              </ul>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
