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
  Search
} from 'lucide-react';

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

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notices');
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
      const res = await fetch('/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          priority,
          targetAudience,
          content,
          pinned,
          postedBy: `${currentUser.name} (${currentUser.role})`
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
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-indigo-600" />
              Department Notice Board & Circulars
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              Live Broadcast Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Official announcements, schedule change broadcasts, faculty circulars, and student examination advisories.
          </p>
        </div>

        {canPostNotice && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 flex items-center space-x-1.5 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Search & Dynamic Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={noticeSearch}
            onChange={(e) => setNoticeSearch(e.target.value)}
            placeholder="Search circulars, keywords, or sender..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {noticeSearch && (
            <button
              onClick={() => setNoticeSearch('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories & Priority Filter */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500"
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
              className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-[11px] font-bold text-slate-500 ml-1">
            {filteredNotices.length} Notices
          </span>
        </div>

      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
          Loading announcements...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No announcements found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => (
            <div 
              key={n.id}
              className={`p-5 rounded-3xl border transition-all ${
                n.pinned 
                  ? 'bg-gradient-to-r from-indigo-50/40 via-white to-white border-indigo-200 shadow-xs' 
                  : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.pinned && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <Pin className="w-3 h-3 mr-1 text-amber-700" /> PINNED
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {n.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      n.priority === 'High' 
                        ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {n.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Audience: <strong>{n.targetAudience}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                    {n.content}
                  </p>
                </div>

                {canPostNotice && (
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-start"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {n.postedBy}
                </span>
                <span className="flex items-center font-mono">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {n.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-indigo-600" />
                Publish Department Announcement
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
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
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
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
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
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
                  className="w-full text-xs font-normal rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="font-semibold text-slate-700 text-xs cursor-pointer">
                  📌 Pin this announcement to top of notice board
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm"
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
