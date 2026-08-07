'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Search, 
  Users, BookOpen, UserCheck, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    teacher_id: '',
    full_name: '',
    subject_name: '',
    qualification: '',
    class_id: '',
    section_1: '',
    section_2: '',
    role: 'Teacher',
    is_class_teacher: false,
    subjects: '',
    phone: '',
    email_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teachers');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeachers(data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.teacher_id.trim()) {
      setValidationError('Teacher ID is required');
      return false;
    }
    if (!formData.teacher_id.match(/^[TH]/)) {
      setValidationError('Teacher ID must start with "T" (Teacher) or "H" (Headmaster)');
      return false;
    }
    if (!formData.full_name.trim()) {
      setValidationError('Teacher Name is required');
      return false;
    }
    if (!formData.email_id.trim()) {
      setValidationError('Email is required');
      return false;
    }
    if (formData.email_id && !formData.email_id.includes('@')) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: formData.teacher_id,
          name: formData.full_name,
          subject: formData.subject_name,
          qualification: formData.qualification,
          class_id: formData.class_id,
          section_1: formData.section_1,
          section_2: formData.section_2,
          role: formData.role,
          is_class_teacher: formData.is_class_teacher,
          subjects: formData.subjects,
          contact: formData.phone,
          email: formData.email_id,
          status: formData.is_active ? 'Active' : 'Inactive'
        })
      });
      if (response.ok) {
        fetchTeachers();
        setIsModalOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        setValidationError(error.error || 'Failed to add teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      setValidationError('Failed to add teacher');
    }
  };

  const handleModify = async () => {
    if (!validateForm()) return;
    if (selectedTeacher) {
      try {
        const response = await fetch('/api/teachers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: formData.teacher_id,
            name: formData.full_name,
            subject: formData.subject_name,
            qualification: formData.qualification,
            class_id: formData.class_id,
            section_1: formData.section_1,
            section_2: formData.section_2,
            role: formData.role,
            is_class_teacher: formData.is_class_teacher,
            subjects: formData.subjects,
            contact: formData.phone,
            email: formData.email_id,
            status: formData.is_active ? 'Active' : 'Inactive'
          })
        });
        if (response.ok) {
          fetchTeachers();
          setIsModalOpen(false);
          resetForm();
        } else {
          const error = await response.json();
          setValidationError(error.error || 'Failed to update teacher');
        }
      } catch (error) {
        console.error('Error updating teacher:', error);
        setValidationError('Failed to update teacher');
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      try {
        await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      full_name: '',
      subject_name: '',
      qualification: '',
      class_id: '',
      section_1: '',
      section_2: '',
      role: 'Teacher',
      is_class_teacher: false,
      subjects: '',
      phone: '',
      email_id: '',
      is_active: true
    });
    setSelectedTeacher(null);
    setValidationError('');
  };

  const openModal = (type, teacher = null) => {
    setModalType(type);
    setValidationError('');
    if (type === 'add') {
      resetForm();
      // Auto-generate Teacher ID
      const nextId = teachers.length + 1;
      setFormData(prev => ({ ...prev, teacher_id: `T${String(nextId).padStart(3, '0')}` }));
    } else if (type === 'modify' && teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        teacher_id: teacher.id || teacher.teacher_id || '',
        full_name: teacher.name || teacher.full_name || '',
        subject_name: teacher.subject || teacher.subject_name || '',
        qualification: teacher.qualification || '',
        class_id: teacher.class_id || '',
        section_1: teacher.section_1 || '',
        section_2: teacher.section_2 || '',
        role: teacher.role || 'Teacher',
        is_class_teacher: teacher.is_class_teacher || false,
        subjects: teacher.subjects || '',
        phone: teacher.contact || teacher.phone || '',
        email_id: teacher.email || teacher.email_id || '',
        is_active: teacher.status === 'Active' || teacher.is_active === true
      });
    }
    setIsModalOpen(true);
  };

  const filteredTeachers = Array.isArray(teachers) ? teachers.filter(t => {
    const term = searchTerm.toLowerCase();
    return t.name?.toLowerCase().includes(term) || 
           t.id?.toLowerCase().includes(term) ||
           t.subject?.toLowerCase().includes(term);
  }) : [];

  const stats = {
    total: Array.isArray(teachers) ? teachers.length : 0,
    active: Array.isArray(teachers) ? teachers.filter(t => t.status === 'Active' || t.is_active === true).length : 0,
    inactive: Array.isArray(teachers) ? teachers.filter(t => t.status === 'Inactive' || t.is_active === false).length : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            Teacher Management
          </h1>
          <p className="text-white/60">Manage all teachers, track their progress, and update records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Total Teachers</p>
            <p className="text-white text-4xl font-bold">{stats.total}</p>
            <p className="text-white/60 text-sm mt-2">Enrolled this year</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Active Teachers</p>
            <p className="text-white text-4xl font-bold">{stats.active}</p>
            <p className="text-white/60 text-sm mt-2">Currently teaching</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Inactive Teachers</p>
            <p className="text-white text-4xl font-bold">{stats.inactive}</p>
            <p className="text-white/60 text-sm mt-2">Not currently teaching</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={() => openModal('add')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition">
            <Plus size={18} /> Add Teacher
          </button>
          <button onClick={() => {
            const id = prompt('Enter Teacher ID to modify:');
            const teacher = teachers.find(t => t.id === id || t.teacher_id === id);
            if (teacher) openModal('modify', teacher);
            else alert('Teacher not found!');
          }} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition">
            <Pencil size={18} /> Modify Teacher
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by name, ID, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Subject</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Qualification</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Class</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Section 1</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Section 2</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Phone</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-white/60">Loading...</td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-white/60">
                      {searchTerm ? 'No teachers match your search' : 'No teachers found'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher.id || idx} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.id || teacher.teacher_id}</td>
                      <td className="px-4 py-3 text-white text-sm font-medium">{teacher.name || teacher.full_name}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.subject || teacher.subject_name || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.qualification || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.class_id || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.section_1 || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.section_2 || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.role || 'Teacher'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.contact || teacher.phone || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{teacher.email || teacher.email_id || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          teacher.status === 'Active' || teacher.is_active === true 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {teacher.status === 'Active' || teacher.is_active === true ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('modify', teacher)}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id || teacher.teacher_id)}
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

      {/* Add/Modify Teacher Modal */}
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
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {modalType === 'add' ? 'Add New Teacher' : 'Modify Teacher'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">
                    Teacher ID * <span className="text-xs text-white/40">(T=Teacher, H=Headmaster)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., T001"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Teacher Name *</label>
                  <input
                    type="text"
                    placeholder="Enter teacher name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g., M.Sc, B.Ed"
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Class ID</label>
                  <input
                    type="text"
                    placeholder="e.g., 13"
                    value={formData.class_id}
                    onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Section 1</label>
                  <input
                    type="text"
                    placeholder="e.g., A"
                    value={formData.section_1}
                    onChange={(e) => setFormData({...formData, section_1: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Section 2</label>
                  <input
                    type="text"
                    placeholder="e.g., B"
                    value={formData.section_2}
                    onChange={(e) => setFormData({...formData, section_2: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Subjects (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Math, Science"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Contact Number</label>
                  <input
                    type="tel"
                    placeholder="e.g., 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="teacher@email.com"
                    value={formData.email_id}
                    onChange={(e) => setFormData({...formData, email_id: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Headmaster">Headmaster</option>
                    <option value="Class Teacher">Class Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">Status</label>
                  <select
                    value={formData.is_active ? 'Active' : 'Inactive'}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'Active'})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-white/70 text-sm">Class Teacher:</label>
                  <input
                    type="checkbox"
                    checked={formData.is_class_teacher}
                    onChange={(e) => setFormData({...formData, is_class_teacher: e.target.checked})}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={modalType === 'add' ? handleAdd : handleModify}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  {modalType === 'add' ? 'Add Teacher' : 'Save Changes'}
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
