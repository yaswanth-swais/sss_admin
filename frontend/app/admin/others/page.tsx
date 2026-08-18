'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, Calendar, Plus, Search, Edit2, Trash2, 
  X, CheckCircle, Clock, AlertCircle, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OthersPage() {
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    date: '',
    applicable_class: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch notices
      let noticesData = [];
      try {
        const noticesRes = await fetch('/api/notices');
        if (noticesRes.ok) {
          noticesData = await noticesRes.json();
        } else {
          console.error('Notices API returned:', noticesRes.status);
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
      }
      
      // Fetch events - if it fails, just use empty array
      let eventsData = [];
      try {
        const eventsRes = await fetch('/api/events');
        if (eventsRes.ok) {
          eventsData = await eventsRes.json();
        } else {
          console.error('Events API returned:', eventsRes.status);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Events API might not exist yet, that's fine
      }
      
      // Ensure data is always an array
      setNotifications(Array.isArray(noticesData) ? noticesData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotifications([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setValidationError('Title is required');
      return false;
    }
    if (!formData.message.trim()) {
      setValidationError('Message is required');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          date: formData.date || new Date().toISOString().split('T')[0],
          applicable_class: formData.applicable_class
        })
      });
      if (response.ok) {
        fetchData();
        setIsModalOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        setValidationError(error.error || 'Failed to add notice');
      }
    } catch (error) {
      console.error('Error adding notice:', error);
      setValidationError('Failed to add notice');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this?')) {
      try {
        await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      date: new Date().toISOString().split('T')[0],
      applicable_class: 'all'
    });
    setSelectedItem(null);
    setValidationError('');
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setValidationError('');
    if (type === 'add') {
      resetForm();
    } else if (type === 'modify' && item) {
      setSelectedItem(item);
      setFormData({
        title: item.title || '',
        message: item.message || '',
        date: item.date || new Date().toISOString().split('T')[0],
        applicable_class: item.applicable_class || 'all'
      });
    }
    setIsModalOpen(true);
  };

  const filteredNotifications = Array.isArray(notifications) ? notifications.filter(n => {
    const term = searchTerm.toLowerCase();
    return (n.title || '').toLowerCase().includes(term) ||
           (n.message || '').toLowerCase().includes(term);
  }) : [];

  const filteredEvents = Array.isArray(events) ? events.filter(e => {
    const term = searchTerm.toLowerCase();
    return (e.title || '').toLowerCase().includes(term) ||
           (e.message || '').toLowerCase().includes(term);
  }) : [];

  const currentData = activeTab === 'notifications' ? filteredNotifications : filteredEvents;
  const isDataEmpty = activeTab === 'notifications' ? filteredNotifications.length === 0 : filteredEvents.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-400" />
            Communication & Events
          </h1>
          <p className="text-white/60">Manage notifications, tours, and school functions</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            <Bell className="inline w-4 h-4 mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            <Calendar className="inline w-4 h-4 mr-2" />
            Events & Tours
          </button>
          <button
            onClick={() => openModal('add')}
            className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={18} /> Add Notice
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Message</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Class</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white/60">Loading...</td>
                  </tr>
                ) : isDataEmpty ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white/60">
                      {searchTerm ? 'No items match your search' : `No ${activeTab} found`}
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, idx) => (
                    <tr key={item.id || idx} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-white text-sm font-medium">{item.title || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{item.message || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{item.date || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{item.applicable_class || 'all'}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                          ● Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('modify', item)}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {modalType === 'add' ? 'Add New Notice' : 'Modify Notice'}
                </h2>
                <button 
                  onClick={() => { setIsModalOpen(false); resetForm(); }} 
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
                  {validationError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Title *</label>
                  <input
                    type="text"
                    placeholder="Enter title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Message *</label>
                  <textarea
                    placeholder="Enter message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Applicable Class</label>
                  <select
                    value={formData.applicable_class}
                    onChange={(e) => setFormData({...formData, applicable_class: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="all">All Classes</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                      <option key={num} value={num}>Class {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  {modalType === 'add' ? 'Add Notice' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
