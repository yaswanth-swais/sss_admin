'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, Search, X,
  Users as UsersIcon, UserCheck, UserX,
  BookOpen
} from 'lucide-react';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  rollNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  contact: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  status: 'active' | 'inactive';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'id' | 'subject'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'modify'>('add');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    admissionNo: '',
    name: '',
    class: '',
    section: '',
    rollNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    contact: '',
    email: '',
    guardianName: '',
    guardianPhone: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      console.log('Students API Response:', data);
      console.log('First Student:', data.students?.[0]);

      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
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
      alert('Please fill Student Name');
      return;
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      alert('Student Email must end with @gmail.com');
      return;
    }
    
    if (formData.parentEmail && !validateEmail(formData.parentEmail)) {
      alert('Parent Email must end with @gmail.com');
      return;
    }
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'active' })
      });
      const data = await response.json();
      if (data.success) {
        await fetchStudents();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student');
    }
  };

  const handleModify = async () => {
    if (selectedStudent) {
      try {
        const response = await fetch(`/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          await fetchStudents();
          setIsModalOpen(false);
          resetForm();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (error) {
        console.error('Error modifying student:', error);
        alert('Error modifying student');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await fetch(`/api/students/${id}`, { method: 'DELETE' });
        await fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const newStatus = student.status === 'active' ? 'inactive' : 'active';
      try {
        await fetch(`/api/students/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        await fetchStudents();
      } catch (error) {
        console.error('Error toggling status:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNo: '', name: '', class: '', section: '', rollNo: '',
      parentName: '', parentPhone: '', parentEmail: '',
      contact: '', email: '', guardianName: '', guardianPhone: ''
    });
    setSelectedStudent(null);
  };

  const openModal = (type: 'add' | 'modify', student?: Student) => {
    setModalType(type);
    if (type === 'modify' && student) {
      setSelectedStudent(student);
      setFormData({
        admissionNo: student.admissionNo || '',
        name: student.name,
        class: student.class || '',
        section: student.section || '',
        rollNo: student.rollNo || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        parentEmail: student.parentEmail || '',
        contact: student.contact || '',
        email: student.email || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || ''
      });
    }
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    String(s.id).includes(searchTerm) ||
    (s.class?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.section?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.parentName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Students', value: students.length, icon: UsersIcon, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Students', value: students.filter(s => s.status === 'active').length, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
    { label: 'Inactive Students', value: students.filter(s => s.status === 'inactive').length, icon: UserX, color: 'from-orange-500 to-red-500' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="text-white/60">Loading students...</div></div>;
  }

  return (
    <div>
      <motion.div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-400" />
          Student Management
        </h1>
        <p className="text-white/60">Manage all students, track their progress, and update records</p>
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
          <Plus size={20} /> Add Student
        </button>
        <button onClick={() => {
          if (filteredStudents.length === 1) openModal('modify', filteredStudents[0]);
          else if (filteredStudents.length > 0) {
            const id = (prompt('Enter Student ID to modify:'));
            const student = students.find(s => s.id === id);
            if (student) openModal('modify', student);
            else alert('Student not found!');
          } else alert('No students available');
        }} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center gap-2">
          <Pencil size={20} /> Modify Student
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by name, ID, class, or section..."
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
            <option value="class">Search by Class</option>
            <option value="section">Search by Section</option>
          </select>
        </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[1600px]">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-4 text-left text-white">ID</th>
              <th className="px-4 py-4 text-left text-white">Admission No</th>
              <th className="px-4 py-4 text-left text-white">Name</th>
              <th className="px-4 py-4 text-left text-white">Class</th>
              <th className="px-4 py-4 text-left text-white">Section</th>
              <th className="px-4 py-4 text-left text-white">Roll No</th>
              <th className="px-4 py-4 text-left text-white">Parent Name</th>
              <th className="px-4 py-4 text-left text-white">Parent Phone</th>
              <th className="px-4 py-4 text-left text-white">Parent Email</th>
              <th className="px-4 py-4 text-left text-white">Student Contact</th>
              <th className="px-4 py-4 text-left text-white">Student Email</th>
              <th className="px-4 py-4 text-left text-white">Guardian Name</th>
              <th className="px-4 py-4 text-left text-white">Guardian Phone</th>
              <th className="px-4 py-4 text-left text-white">Status</th>
              <th className="px-4 py-4 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-4 text-white/80">{student.id}</td>
                <td className="px-4 py-4 text-white/80">{student.admissionNo || '—'}</td>
                <td className="px-4 py-4 text-white font-medium">{student.name}</td>
                <td className="px-4 py-4 text-white/80">{student.class || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.section || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.rollNo || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.parentName || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.parentPhone || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.parentEmail || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.contact || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.email || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.guardianName || '—'}</td>
                <td className="px-4 py-4 text-white/80">{student.guardianPhone || '—'}</td>
                <td className="px-4 py-4"><button onClick={() => handleToggleStatus(student.id)} className={`px-3 py-1 rounded-full text-sm font-semibold ${student.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{student.status}</button></td>
                <td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => openModal('modify', student)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"><Pencil size={16} /></button><button onClick={() => handleDelete(student.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{modalType === 'add' ? 'Add New Student' : 'Modify Student'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-white/40" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Admission Number" value={formData.admissionNo} onChange={(e) => setFormData({...formData, admissionNo: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Student Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Class" value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Section" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Roll Number" value={formData.rollNo} onChange={(e) => setFormData({...formData, rollNo: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Parent Name" value={formData.parentName} onChange={(e) => setFormData({...formData, parentName: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="tel" placeholder="Parent Phone" value={formData.parentPhone} onChange={(e) => setFormData({...formData, parentPhone: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="email" placeholder="Parent Email (must end with @gmail.com)" value={formData.parentEmail} onChange={(e) => setFormData({...formData, parentEmail: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="tel" placeholder="Student Contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="email" placeholder="Student Email (must end with @gmail.com)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="text" placeholder="Guardian Name" value={formData.guardianName} onChange={(e) => setFormData({...formData, guardianName: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
                <input type="tel" placeholder="Guardian Phone" value={formData.guardianPhone} onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white" />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={modalType === 'add' ? handleAdd : handleModify} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold">
                  {modalType === 'add' ? 'Add Student' : 'Save Changes'}
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
