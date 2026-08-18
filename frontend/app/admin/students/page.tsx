'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import StudentFormWizard from '../../../components/StudentFormWizard';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // ============================================================
  // FETCH STUDENTS + ALL 4 PHOTOS
  // ============================================================
  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/students');

      if (!response.ok) {
        throw new Error(`Students API failed: ${response.status}`);
      }

      const data = await response.json();

      console.log('API Response:', data);

      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        setStudents([]);
        return;
      }

      // ========================================================
      // MAP STUDENT DATA
      // ========================================================
      const mappedStudents = data.map((s) => ({
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

        student_contact:
          s.student_phone || s.student_contact || '',

        student_phone: s.student_phone || '',
        student_email: s.student_email || '',

        guardian_name: s.guardian_name || '',
        guardian_phone: s.guardian_phone || '',
        guardian_email: s.guardian_email || '',

        status:
          s.record_status === 'Active'
            ? 'Active'
            : s.status || 'Active',

        record_status: s.record_status || 'Active',
      }));

      console.log('Mapped Students:', mappedStudents);

      // Show students immediately
      setStudents(mappedStudents);

      // ========================================================
      // FETCH ALL 4 PHOTOS FOR EACH STUDENT
      // ========================================================
      const studentsWithPhotos = await Promise.all(
        mappedStudents.map(async (student) => {
          try {
            const admissionNo = student.admission_no;

            if (!admissionNo) {
              return {
                ...student,
                photoUrl: null,
                parent1PhotoUrl: null,
                parent2PhotoUrl: null,
                guardianPhotoUrl: null,
              };
            }

            const [
              studentRes,
              parent1Res,
              parent2Res,
              guardianRes,
            ] = await Promise.all([
              fetch(
                `/api/students/${admissionNo}/photo?photoType=student`
              ),
              fetch(
                `/api/students/${admissionNo}/photo?photoType=parent1`
              ),
              fetch(
                `/api/students/${admissionNo}/photo?photoType=parent2`
              ),
              fetch(
                `/api/students/${admissionNo}/photo?photoType=guardian`
              ),
            ]);

            const [
              studentData,
              parent1Data,
              parent2Data,
              guardianData,
            ] = await Promise.all([
              studentRes.ok ? studentRes.json() : null,
              parent1Res.ok ? parent1Res.json() : null,
              parent2Res.ok ? parent2Res.json() : null,
              guardianRes.ok ? guardianRes.json() : null,
            ]);

            return {
              ...student,

              photoUrl: studentData?.success
                ? studentData.photoUrl
                : null,

              parent1PhotoUrl: parent1Data?.success
                ? parent1Data.photoUrl
                : null,

              parent2PhotoUrl: parent2Data?.success
                ? parent2Data.photoUrl
                : null,

              guardianPhotoUrl: guardianData?.success
                ? guardianData.photoUrl
                : null,
            };
          } catch (error) {
            console.error(
              `Photo fetch failed for ${student.admission_no}:`,
              error
            );

            return {
              ...student,
              photoUrl: null,
              parent1PhotoUrl: null,
              parent2PhotoUrl: null,
              guardianPhotoUrl: null,
            };
          }
        })
      );

      setStudents(studentsWithPhotos);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE STUDENT
  // ============================================================
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/students?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        alert(
          errorData.error || 'Failed to delete student'
        );

        return;
      }

      await fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  // ============================================================
  // TOGGLE ACTIVE / INACTIVE
  // ============================================================
  const handleToggleStatus = async (student) => {
    const newStatus =
      student.status === 'Active'
        ? 'Inactive'
        : 'Active';

    try {
      const response = await fetch('/api/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admission_no: student.admission_no,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        alert(
          errorData.error ||
            'Failed to update student status'
        );

        return;
      }

      await fetchStudents();
    } catch (error) {
      console.error(
        'Error updating status:',
        error
      );

      alert('Failed to update student status');
    }
  };

  // ============================================================
  // OPEN ADD / MODIFY WIZARD
  // ============================================================
  const openModal = (type, student = null) => {
    if (type === 'add') {
      setEditingStudent(null);
      setIsModalOpen(true);
      return;
    }

    if (type === 'modify' && student) {
      setEditingStudent(student);
      setIsModalOpen(true);
    }
  };

  // ============================================================
  // MODIFY BUTTON - SEARCH BY ADMISSION NUMBER
  // ============================================================
  const handleModifyByPrompt = () => {
    const id = prompt(
      'Enter Admission Number or Student ID to modify:'
    );

    if (!id) {
      return;
    }

    const searchId = id.trim().toLowerCase();

    const student = students.find(
      (s) =>
        String(s.admission_no || '').toLowerCase() ===
          searchId ||
        String(s.student_id || '').toLowerCase() ===
          searchId ||
        String(s.id || '').toLowerCase() === searchId
    );

    if (student) {
      openModal('modify', student);
    } else {
      alert('Student not found!');
    }
  };

  // ============================================================
  // WIZARD SUCCESS
  // ============================================================
  const handleWizardSuccess = async () => {
    await fetchStudents();
  };

  // ============================================================
  // WIZARD CLOSE
  // ============================================================
  const handleWizardClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  // ============================================================
  // SEARCH
  // ============================================================
  const filteredStudents = Array.isArray(students)
    ? students.filter((student) => {
        const term = searchTerm
          .toLowerCase()
          .trim();

        const nameStr = String(
          student.name ||
            student.full_name ||
            ''
        ).toLowerCase();

        const idStr = String(
          student.admission_no || ''
        ).toLowerCase();

        const classStr = String(
          student.class || ''
        ).toLowerCase();

        const sectionStr = String(
          student.section || ''
        ).toLowerCase();

        if (!term) {
          return true;
        }

        if (searchType === 'name') {
          return nameStr.includes(term);
        }

        if (searchType === 'id') {
          return idStr.includes(term);
        }

        if (searchType === 'class') {
          return classStr.includes(term);
        }

        if (searchType === 'section') {
          return sectionStr.includes(term);
        }

        return true;
      })
    : [];

  // ============================================================
  // STATISTICS
  // ============================================================
  const stats = {
    total: Array.isArray(students)
      ? students.length
      : 0,

    active: Array.isArray(students)
      ? students.filter(
          (s) => s.status === 'Active'
        ).length
      : 0,

    inactive: Array.isArray(students)
      ? students.filter(
          (s) => s.status === 'Inactive'
        ).length
      : 0,
  };

  // ============================================================
  // PHOTO CELL
  // ============================================================
  const PhotoCell = ({
    photoUrl,
    alt,
  }) => {
    return (
      <td className="px-4 py-3">
        {photoUrl ? (
          <button
            type="button"
            onClick={() =>
              setSelectedPhoto(photoUrl)
            }
            className="focus:outline-none"
            title={`View ${alt}`}
          >
            <img
              src={photoUrl}
              alt={alt}
              className="w-12 h-12 rounded-full object-cover border border-white/20 hover:scale-110 transition cursor-pointer"
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/40">
            -
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ======================================================
            HEADER
        ====================================================== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            Student Management
          </h1>

          <p className="text-white/60">
            Manage all students, track their progress,
            and update records
          </p>
        </div>

        {/* ======================================================
            STATISTICS
        ====================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">
              Total Students
            </p>

            <p className="text-white text-4xl font-bold">
              {stats.total}
            </p>

            <p className="text-white/60 text-sm mt-2">
              Enrolled this year
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">
              Active Students
            </p>

            <p className="text-white text-4xl font-bold">
              {stats.active}
            </p>

            <p className="text-white/60 text-sm mt-2">
              Currently attending
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6">
            <p className="text-white/80 text-sm">
              Inactive Students
            </p>

            <p className="text-white text-4xl font-bold">
              {stats.inactive}
            </p>

            <p className="text-white/60 text-sm mt-2">
              Not currently enrolled
            </p>
          </div>

        </div>

        {/* ======================================================
            BUTTONS
        ====================================================== */}
        <div className="flex flex-wrap gap-4 mb-6">

          <button
            onClick={() => openModal('add')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={18} />
            Add Student
          </button>

          <button
            onClick={handleModifyByPrompt}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Pencil size={18} />
            Modify Student
          </button>

        </div>

        {/* ======================================================
            SEARCH
        ====================================================== */}
        <div className="flex flex-wrap gap-4 mb-6">

          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by name, ID, class, or section..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
          </div>

          <select
            value={searchType}
            onChange={(e) =>
              setSearchType(e.target.value)
            }
            className="px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
          >
            <option value="name">
              Search by Name
            </option>

            <option value="id">
              Search by ID
            </option>

            <option value="class">
              Search by Class
            </option>

            <option value="section">
              Search by Section
            </option>
          </select>

        </div>

        {/* ======================================================
            STUDENT TABLE
        ====================================================== */}
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">

          <div className="overflow-x-auto">

            <table className="w-full">

              {/* TABLE HEADER */}
              <thead className="bg-white/10">
                <tr>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    ID
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Student Name
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Student Photo
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 1 Name
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 1 Photo
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 2 Name
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 2 Photo
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Guardian Name
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Guardian Photo
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Class
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Section
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Roll No
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 1 Phone
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 1 Email
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 2 Phone
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Parent 2 Email
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Guardian Phone
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Guardian Email
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-white text-sm font-medium">
                    Actions
                  </th>

                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-white/5">

                {/* LOADING */}
                {loading ? (
                  <tr>
                    <td
                      colSpan={20}
                      className="text-center py-8 text-white/60"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (

                  /* NO DATA */
                  <tr>
                    <td
                      colSpan={20}
                      className="text-center py-8 text-white/60"
                    >
                      {searchTerm
                        ? 'No students match your search'
                        : 'No students found'}
                    </td>
                  </tr>

                ) : (

                  /* STUDENT ROWS */
                  filteredStudents.map(
                    (student, idx) => (
                      <tr
                        key={
                          student.id || idx
                        }
                        className="border-t border-white/10 hover:bg-white/5"
                      >

                        {/* ID */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.admission_no ||
                            student.student_id ||
                            student.id}
                        </td>

                        {/* STUDENT NAME */}
                        <td className="px-4 py-3 text-white text-sm font-medium">
                          {student.name ||
                            student.full_name ||
                            '-'}
                        </td>

                        {/* STUDENT PHOTO */}
                        <PhotoCell
                          photoUrl={
                            student.photoUrl
                          }
                          alt="Student Photo"
                        />

                        {/* PARENT 1 NAME */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent1_name ||
                            '-'}
                        </td>

                        {/* PARENT 1 PHOTO */}
                        <PhotoCell
                          photoUrl={
                            student.parent1PhotoUrl
                          }
                          alt="Parent 1 Photo"
                        />

                        {/* PARENT 2 NAME */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent2_name ||
                            '-'}
                        </td>

                        {/* PARENT 2 PHOTO */}
                        <PhotoCell
                          photoUrl={
                            student.parent2PhotoUrl
                          }
                          alt="Parent 2 Photo"
                        />

                        {/* GUARDIAN NAME */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.guardian_name ||
                            '-'}
                        </td>

                        {/* GUARDIAN PHOTO */}
                        <PhotoCell
                          photoUrl={
                            student.guardianPhotoUrl
                          }
                          alt="Guardian Photo"
                        />

                        {/* CLASS */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.class || '-'}
                        </td>

                        {/* SECTION */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.section || '-'}
                        </td>

                        {/* ROLL NO */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.roll_no || '-'}
                        </td>

                        {/* PARENT 1 PHONE */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent1_phone ||
                            '-'}
                        </td>

                        {/* PARENT 1 EMAIL */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent1_email ||
                            '-'}
                        </td>

                        {/* PARENT 2 PHONE */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent2_phone ||
                            '-'}
                        </td>

                        {/* PARENT 2 EMAIL */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.parent2_email ||
                            '-'}
                        </td>

                        {/* GUARDIAN PHONE */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.guardian_phone ||
                            '-'}
                        </td>

                        {/* GUARDIAN EMAIL */}
                        <td className="px-4 py-3 text-white/80 text-sm">
                          {student.guardian_email ||
                            '-'}
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                student
                              )
                            }
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              student.status ===
                              'Active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {student.status ===
                            'Active'
                              ? '● Active'
                              : '○ Inactive'}
                          </button>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3">
                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                openModal(
                                  'modify',
                                  student
                                )
                              }
                              className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                              title="Modify Student"
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  student.admission_no ||
                                    student.id
                                )
                              }
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                              title="Delete Student"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>
      </div>

      {/* ========================================================
          STUDENT FORM WIZARD
      ======================================================== */}
      <StudentFormWizard
        isOpen={isModalOpen}
        onClose={handleWizardClose}
        onSuccess={handleWizardSuccess}
        editData={editingStudent}
        theme="dark"
      />

      {/* ========================================================
          PHOTO PREVIEW MODAL
      ======================================================== */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() =>
              setSelectedPhoto(null)
            }
          >

            <motion.div
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
              className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl p-4"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={() =>
                  setSelectedPhoto(null)
                }
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
              >
                <X size={20} />
              </button>

              {/* LARGE PHOTO */}
              <img
                src={selectedPhoto}
                alt="Student / Parent / Guardian"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}