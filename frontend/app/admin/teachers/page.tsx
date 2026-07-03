'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, Search, X,
  Users as UsersIcon, UserCheck, UserX,
  BookOpen
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  classId: string;
  section1: string;
  section2: string;
  role: string;
  contact: string;
  email: string;
  isClassTeacher: string;
  subjects: string;
  status: 'active' | 'inactive';
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'id' | 'subject'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'modify'>('add');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    qualification: '',
    classId: '',
    section1: '',
    section2: '',
    role: 'TEACHER',
    contact: '',
    email: '',
    isClassTeacher: '',
    subjects: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    return email.toLowerCase().endsWith('@gmail.com');
  };

  const handleAdd = async () => {
    if (!formData.name) {
      alert('Please fill Teacher Name');
      return;
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      alert('Email must end with @gmail.com');
      return;
    }
    
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'active' })
      });
      const data = await response.json();
      if (data.success) {
        await fetchTeachers();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
    }
  };

  const handleModify = async () => {
    if (selectedTeacher) {
      try {
        const response = await fetch(`/api/teachers/${selectedTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          await fetchTeachers();
          setIsModalOpen(false);
          resetForm();
        }
      } catch (error) {
        console.error('Error modifying teacher:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      try {
        await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
        await fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const teacher = teachers.find(t => t.id   === (id));
    if (teacher) {
      const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
      try {
        await fetch(`/api/teachers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        await fetchTeachers();
      } catch (error) {
        console.error('Error toggling status:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', subject: '', qualification: '', classId: '', section1: '', section2: '',
      role: 'TEACHER', contact: '', email: '', isClassTeacher: '', subjects: ''
    });
    setSelectedTeacher(null);
  };

  const openModal = (type: 'add' | 'modify', teacher?: Teacher) => {
    setModalType(type);
    if (type === 'modify' && teacher) {
      setSelectedTeacher(teacher);
      setFormData({
        name: teacher.name,
        subject: teacher.subject || '',
        qualification: teacher.qualification || '',
        classId: teacher.classId || '',
        section1: teacher.section1 || '',
        section2: teacher.section2 || '',
        role: teacher.role || 'TEACHER',
        contact: teacher.contact || '',
        email: teacher.email || '',
        isClassTeacher: teacher.isClassTeacher || '',
        subjects: teacher.subjects || ''
      });
    }
    setIsModalOpen(true);
  };

  const filteredTeachers = teachers.filter(t => 
    (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    String(t.id).includes(searchTerm) ||
    (t.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Teachers', value: teachers.length, icon: UsersIcon, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Teachers', value: teachers.filter(t => t.status === 'active').length, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
    { label: 'Inactive Teachers', value: teachers.filter(t => t.status === 'inactive').length, icon: UserX, color: 'from-orange-500 to-red-500' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="text-white/60">Loading teachers...</div></div>;
  }

  return (
    <div>
      <motion.div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-400" />
          Teacher Management
        </h1>
        <p className="text-white/60">Manage faculty members, assign subjects, and track performance</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between">
              <div><p className="text-white/80 text-sm">{stat.label}</p><p className="text-white text-4xl font-bold mt-2">{stat.value}</p></div>
              <stat.icon className="w-12 h-12 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => openModal('add')} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2">
          <Plus size={20} /> Add Teacher
        </button>
        <button onClick={() => {
          if (filteredTeachers.length === 1) openModal('modify', filteredTeachers[0]);
          else if (filteredTeachers.length > 0) {
            const id = (prompt('Enter Teacher ID to modify:'));
            const teacher = teachers.find(t => t.id === id);
            if (teacher) openModal('modify', teacher);
            else alert('Teacher not found!');
          } else alert('No teachers available');
        }} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center gap-2">
          <Pencil size={20} /> Modify Teacher
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 pr-10"
            />  
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
          >
            <option value="name">Search by Name</option>
            <option value="id">Search by ID</option>
            <option value="subject">Search by Subject</option>
          </select>
        </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-4 text-left text-white">ID</th>
                <th className="px-4 py-4 text-left text-white">Name</th>
                <th className="px-4 py-4 text-left text-white">Subject</th>
                <th className="px-4 py-4 text-left text-white">Qualification</th>
                <th className="px-4 py-4 text-left text-white">Class ID</th>
                <th className="px-4 py-4 text-left text-white">Section</th>
                <th className="px-4 py-4 text-left text-white">Class Teacher</th>
                <th className="px-4 py-4 text-left text-white">Contact</th>
                <th className="px-4 py-4 text-left text-white">Status</th>
                <th className="px-4 py-4 text-left text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-4 text-white/80">{teacher.id}</td>
                  <td className="px-4 py-4 text-white">{teacher.name}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.subject || '—'}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.qualification || '—'}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.classId || '—'}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.section1 || teacher.section2 || '—'}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.isClassTeacher === 'Y' ? 'Yes' : '—'}</td>
                  <td className="px-4 py-4 text-white/80">{teacher.contact || '—'}</td>
                  <td className="px-4 py-4"><button onClick={() => handleToggleStatus(teacher.id)} className={`px-3 py-1 rounded-full text-sm font-semibold ${teacher.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{teacher.status}</button></td>
                  <td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => openModal('modify', teacher)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"><Pencil size={16} /></button><button onClick={() => handleDelete(teacher.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{modalType === 'add' ? 'Add New Teacher' : 'Modify Teacher'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-white/40" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Teacher Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Subject" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Qualification" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Class ID" value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Section 1" value={formData.section1} onChange={(e) => setFormData({...formData, section1: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Section 2" value={formData.section2} onChange={(e) => setFormData({...formData, section2: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                  <option value="TEACHER">Teacher</option>
                  <option value="HEAD_TEACHER">Head Teacher</option>
                  <option value="PRINCIPAL">Principal</option>
                </select>
                <select value={formData.isClassTeacher} onChange={(e) => setFormData({...formData, isClassTeacher: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                  <option value="">Is Class Teacher?</option>
                  <option value="Y">Yes</option>
                  <option value="">No</option>
                </select>
                <input type="text" placeholder="Subjects (comma separated for multiple)" value={formData.subjects} onChange={(e) => setFormData({...formData, subjects: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="tel" placeholder="Contact Number" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="email" placeholder="Email (must end with @gmail.com)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={modalType === 'add' ? handleAdd : handleModify} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold">
                  {modalType === 'add' ? 'Add Teacher' : 'Save Changes'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
