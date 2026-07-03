'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Send, Users, User, Calendar, Trophy,
  Music, Bus, Plus, X, Mail, Clock, MapPin,
  Pencil, Trash2, Globe
} from 'lucide-react';


interface Notification {
  id: string;
  title: string;
  message: string;
  role: string;
  date: string;
  status: string;
  is_read: boolean;
}

interface Event {
  id: string;
  title: string;
  type: 'tour' | 'function' | 'activity';
  date: string;
  description: string;
  location?: string;
}

export default function OthersPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([
    { id: 'E1', title: 'Science Museum Visit', type: 'tour', date: '2026-05-10', description: 'Educational tour for class 8 to 10 students.', location: 'Hyderabad Science Museum' },
    { id: 'E2', title: 'Annual Day Celebrations', type: 'function', date: '2026-04-29', description: 'Annual day with cultural activities.' },
    { id: 'E3', title: 'Annual Sports Day', type: 'activity', date: '2026-06-15', description: 'Annual sports competition with various games.' },
  ]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notifications' | 'events'>('notifications');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [validationError, setValidationError] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
  });
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'function' as 'tour' | 'function' | 'activity',
    date: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notices');
      const data = await response.json();
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setLoading(false);
    }
  };

  const validateNotice = () => {
    if (!newNotification.title.trim()) {
      setValidationError('Notice Title is required');
      return false;
    }
    if (!newNotification.message.trim()) {
      setValidationError('Notice Message is required');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSendNotification = async () => {
    if (!validateNotice()) return;
    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNotification.title,
          message: newNotification.message,
          role: selectedRole,
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (response.ok) {
        fetchNotifications();
        setShowNotificationModal(false);
        setNewNotification({ title: '', message: '' });
        setEditingNotification(null);
        setSelectedRole('all');
        setValidationError('');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setValidationError('Failed to send notification');
    }
  };

  const handleModifyNotification = async (notification: Notification) => {
    setEditingNotification(notification);
    setNewNotification({
      title: notification.title,
      message: notification.message
    });
    setSelectedRole(notification.role || 'all');
    setValidationError('');
    setShowNotificationModal(true);
  };

  const handleDeleteNotification = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
        fetchNotifications();
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  const handleAddEvent = () => {
    const event: Event = {
      id: `E${events.length + 1}`,
      ...newEvent
    };
    setEvents([...events, event]);
    setShowEventModal(false);
    setNewEvent({ title: '', type: 'function', date: '', description: '', location: '' });
    setEditingEvent(null);
  };

  const handleModifyEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      type: event.type,
      date: event.date,
      description: event.description,
      location: event.location || ''
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'tour': return <Bus className="w-5 h-5" />;
      case 'function': return <Music className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'tour': return 'from-cyan-500 to-blue-500';
      case 'function': return 'from-purple-500 to-pink-500';
      default: return 'from-orange-500 to-yellow-500';
    }
  };

  const getRoleColor = (role: string) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower.includes('student')) return 'bg-blue-500/20 text-blue-400';
    if (roleLower.includes('teacher') || roleLower.includes('faculty')) return 'bg-purple-500/20 text-purple-400';
    return 'bg-green-500/20 text-green-400';
  };

  

  const filteredNotifications = notifications.filter(n =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" />
            Communication & Events
          </h1>
          <p className="text-white/60">Manage notifications, tours, and school functions</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs text-white">
                {unreadCount} new
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            <Calendar size={18} />
            Events & Tours
          </button>
        </div>

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => {
                  setEditingNotification(null);
                  setNewNotification({ title: '', message: '' });
                  setSelectedRole('all');
                  setValidationError('');
                  setShowNotificationModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 pr-10"
                />
                
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-white/60">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-white/60">No notifications found</div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification, idx) => {
                  const displayTitle = translations[notification.id] || notification.title;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`bg-white/5 backdrop-blur rounded-2xl p-6 border ${
                        !notification.is_read ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(notification.role)}`}>
                              {notification.role || 'Everyone'}
                            </span>
                            {!notification.is_read && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-white/70 mb-3">{notification.message}</p>
                          <div className="flex items-center gap-4 text-white/40 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {new Date(notification.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleModifyNotification(notification)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Modify Notice"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete Notice"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => {
                setEditingEvent(null);
                setNewEvent({ title: '', type: 'function', date: '', description: '', location: '' });
                setShowEventModal(true);
              }}
              className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus size={18} /> Add New Event
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-gradient-to-r ${getEventColor(event.type)} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          {getEventIcon(event.type)}
                        </div>
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                      </div>
                      <p className="text-white/80 text-sm mt-1">{event.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-white/80 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {new Date(event.date).toLocaleDateString()}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {event.location}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium capitalize">
                          {event.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleModifyEvent(event)}
                        className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors"
                        title="Modify Event"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add/Modify Notice Modal with AI Voice Input */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-md border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingNotification ? 'Modify Notice' : 'Add Notice'}
                </h2>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setEditingNotification(null);
                    setValidationError('');
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {validationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
                  {validationError}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Notice Title *"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 pr-10"
                  />
                  
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Notice Message *"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none pr-10"
                  />
                  
                </div>
                
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Send to:</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'students', label: 'Students', icon: Users },
                      { id: 'teachers', label: 'Teachers', icon: User },
                      { id: 'all', label: 'Everyone', icon: Mail },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedRole(option.id)}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          selectedRole === option.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        <option.icon size={14} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSendNotification}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} /> {editingNotification ? 'Update Notice' : 'Add Notice'}
                </button>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setEditingNotification(null);
                    setValidationError('');
                  }}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
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