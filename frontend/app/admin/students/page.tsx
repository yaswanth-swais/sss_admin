'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, Search, X,
  Users, UserCheck, UserX, BookOpen
} from 'lucide-react';
import StudentFormWizard from '../../components/StudentFormWizard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    admission_no: '',
    name: '',
    class: '',
    section: '',
    roll_no: '',
    parent1_name: '',
    parent1_phone: '',
    parent1_email: '',
    parent2_name: '',
    parent2_phone: '',
    parent2_email: '',
    student_contact: '',
    student_email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    status: 'Active'
  });

  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students`);
      const data = await response.json();
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        const mappedStudents = data.map(s => ({
          id: s.admission_no || s.id,
          student_id: s.admission_no || s.student_id,
          admission_no: s.admission_no,
          name: s.full_name || s.name,
          full_name: s.full_name || s.name,
          class: s.class || s.class_id || '',
          class_id: s.class_id,
          section: s.section || '',
          roll_no: s.roll_no || '',
          parent1_name: s.parent1_name || '',
          parent1_phone: s.parent1_phone || '',
          parent1_email: s.parent1_email || '',
          parent2_name: s.parent2_name || '',
          parent2_phone: s.parent2_phone || '',
          parent2_email: s.parent2_email || '',
          student_contact: s.student_phone || s.student_contact || '',
          student_phone: s.student_phone || '',
          student_email: s.student_email || '',
          guardian_name: s.guardian_name || '',
          guardian_phone: s.guardian_phone || '',
          guardian_email: s.guardian_email || '',
          status: s.record_status === 'Active' ? 'Active' : (s.status || 'Active'),
          record_status: s.record_status || 'Active'
        }));
        setStudents(mappedStudents);
      } else {
        console.error('Expected array but got:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      admission_no: '',
      name: '',
      class: '',
      section: '',
      roll_no: '',
      parent1_name: '',
      parent1_phone: '',
      parent1_email: '',
      parent2_name: '',
      parent2_phone: '',
      parent2_email: '',
      student_contact: '',
      student_email: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      status: 'Active'
    });
    setSelectedStudent(null);
    setValidationError('');
  };

  const openModal = (type, student = null) => {
    setModalType(type);
    setValidationError('');
    if (type === 'add') {
      resetForm();
      setEditingStudent(null);
    } else if (type === 'modify' && student) {
      setSelectedStudent(student);
      setEditingStudent(student);
      setFormData({
        admission_no: student.admission_no || student.student_id || '',
        name: student.name || student.full_name || '',
        class: student.class || student.class_id || '',
        section: student.section || '',
        roll_no: student.roll_no || '',
        parent1_name: student.parent1_name || '',
        parent1_phone: student.parent1_phone || '',
        parent1_email: student.parent1_email || '',
        parent2_name: student.parent2_name || '',
        parent2_phone: student.parent2_phone || '',
        parent2_email: student.parent2_email || '',
        student_contact: student.student_phone || student.student_contact || '',
        student_email: student.student_email || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        status: student.status || 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleWizardSuccess = () => {
    fetchStudents();
  };

  const handleWizardClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    resetForm();
  };

  const filteredStudents = Array.isArray(students) ? students.filter(s => {
    const term = searchTerm.toLowerCase();
    if (searchType === 'name') return s.name?.toLowerCase().includes(term);
    if (searchType === 'id') return s.admission_no?.toLowerCase().includes(term) || s.student_id?.toLowerCase().includes(term);
    if (searchType === 'class') return String(s.class).toLowerCase().includes(term);
    if (searchType === 'section') return s.section?.toLowerCase().includes(term);
    return true;
  }) : [];

  const stats = {
    total: Array.isArray(students) ? students.length : 0,
    active: Array.isArray(students) ? students.filter(s => s.status === 'Active').length : 0,
    inactive: Array.isArray(students) ? students.filter(s => s.status === 'Inactive').length : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            Student Management
          </h1>
          <p className="text-white/60">Manage all students, track their progress, and update records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Total Students</p>
            <p className="text-white text-4xl font-bold">{stats.total}</p>
            <p className="text-white/60 text-sm mt-2">Enrolled this year</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Active Students</p>
            <p className="text-white text-4xl font-bold">{stats.active}</p>
            <p className="text-white/60 text-sm mt-2">Currently attending</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">Inactive Students</p>
            <p className="text-white text-4xl font-bold">{stats.inactive}</p>
            <p className="text-white/60 text-sm mt-2">Not currently enrolled</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={() => openModal('add')} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition">
            <Plus size={18} /> Add Student
          </button>
          <button onClick={() => {
            const id = prompt('Enter Admission Number or Student ID to modify:');
            const student = students.find(s => s.admission_no === id || s.student_id === id || s.id === id);
            if (student) openModal('modify', student);
            else alert('Student not found!');
          }} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition">
            <Pencil size={18} /> Modify Student
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by name, ID, class, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
          >
            <option value="name">Search by Name</option>
            <option value="id">Search by ID</option>
            <option value="class">Search by Class</option>
            <option value="section">Search by Section</option>
          </select>
        </div>

        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Class</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Section</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Roll No</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 1 Name</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 1 Phone</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 1 Email</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 2 Name</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 2 Phone</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Parent 2 Email</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Guardian Name</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Guardian Phone</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Guardian Email</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={16} className="text-center py-8 text-white/60">Loading...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-8 text-white/60">
                      {searchTerm ? 'No students match your search' : 'No students found'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id || idx} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/80 text-sm">{student.admission_no || student.student_id || student.id}</td>
                      <td className="px-4 py-3 text-white text-sm font-medium">{student.name || student.full_name}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.class || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.section || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.roll_no || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent1_name || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent1_phone || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent1_email || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent2_name || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent2_phone || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.parent2_email || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.guardian_name || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.guardian_phone || '-'}</td>
                      <td className="px-4 py-3 text-white/80 text-sm">{student.guardian_email || '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
                            fetch(`${API_BASE_URL}/students`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...student, status: newStatus })
                            }).then(() => fetchStudents());
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            student.status === 'Active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {student.status === 'Active' ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('modify', student)}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this student?')) {
                                fetch(`${API_BASE_URL}/students?id=${student.admission_no}`, { method: 'DELETE' })
                                  .then(() => fetchStudents());
                              }
                            }}
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

      <StudentFormWizard
        isOpen={isModalOpen}
        onClose={handleWizardClose}
        onSuccess={handleWizardSuccess}
        editData={editingStudent}
        theme="dark"
      />
    </div>
  );
}
