import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Pin, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle2, 
  Filter,
  Megaphone,
  X,
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '../api';

export default function NoticesView({ currentUser }) {
  const isHOD = currentUser?.role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;
  const canPostNotice = isHOD || isCoordinator;

  const [notices, setNotices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [priority, setPriority] = useState('Medium');
  const [targetAudience, setTargetAudience] = useState('All');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/notices', {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setNotices(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both the title and content.');
      return;
    }

    try {
      const res = await apiFetch('/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
          targetAudience: isHOD ? targetAudience : 'ClassStudents',
          content: content.trim(),
          pinned,
          postedBy: `${currentUser?.name} (${isHOD ? 'HOD' : 'Coordinator'})`
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setTitle('');
        setContent('');
        setPinned(false);
        loadNotices();
      } else {
        alert(json.message || 'Error publishing notice');
      }
    } catch (err) {
      console.error(err);
      alert('Network error publishing notice');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      const res = await apiFetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        loadNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [noticeSearch, setNoticeSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const categories = ['All', 'Academic', 'Schedule Alert', 'Exam', 'General'];

  const isNoticeFilterActive = noticeSearch.trim() !== '' || selectedCategory !== 'All' || priorityFilter !== 'All';

  const filteredNotices = notices.filter(n => {
    if (selectedCategory !== 'All' && n.category !== selectedCategory) {
      return false;
    }
    if (priorityFilter !== 'All' && (n.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }
    if (noticeSearch.trim()) {
      const q = noticeSearch.toLowerCase().trim();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchAuthor = n.postedBy?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <span>Department Notice Board & Circulars</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official announcements, schedule advisories, faculty circulars, and student examination alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live Broadcast Active
          </span>

          {canPostNotice && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Dynamic Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={noticeSearch}
              onChange={(e) => setNoticeSearch(e.target.value)}
              placeholder="Search circulars, keywords, or author..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
            />
            {noticeSearch && (
              <button
                onClick={() => setNoticeSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories & Priority Filter */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal</option>
            </select>

            {isNoticeFilterActive && (
              <button
                onClick={() => {
                  setNoticeSearch('');
                  setSelectedCategory('All');
                  setPriorityFilter('All');
                }}
                className="h-8 px-2.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold flex items-center transition-colors"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reset
              </button>
            )}

            <span className="text-[11px] font-bold text-slate-400 ml-1">
              {filteredNotices.length} Notices
            </span>
          </div>

        </div>
      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs shadow-xs">
          Loading announcements...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs space-y-2 shadow-xs">
          <Bell className="w-8 h-8 mx-auto text-slate-300" />
          <p>No announcements found matching the active criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => (
            <div 
              key={n.id}
              className={`bg-white rounded-2xl border transition-all p-5 space-y-3 ${
                n.pinned 
                  ? 'border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-white shadow-xs' 
                  : 'border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.pinned && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pin className="w-3 h-3 mr-1 text-amber-600" /> PINNED
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {n.category}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      n.priority === 'High' || n.priority === 'Urgent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {n.priority} Priority
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Audience: <strong className="text-slate-800">{n.targetAudience}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight pt-0.5">
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal pt-0.5">
                    {n.content}
                  </p>
                </div>

                {canPostNotice && (
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center text-slate-600 font-semibold">
                  <User className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  {n.postedBy}
                </span>
                <span className="flex items-center font-mono">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {n.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-blue-600" />
                Publish Department Announcement
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Change: CS402 Moving to LH-102"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Schedule Alert">Schedule Alert</option>
                    <option value="Exam">Exam Notice</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="All">All Department (Students + Faculty)</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed announcement content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs font-normal rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pinCheck" className="font-semibold text-slate-700 text-xs cursor-pointer">
                  📌 Pin this announcement to top of notice board
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
