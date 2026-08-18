'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const StudentFormWizard = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  theme = 'dark'
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [availableClasses, setAvailableClasses] = useState([]);
  const [classInput, setClassInput] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Student photo
  const [photoPreview, setPhotoPreview] = useState(null);

  // Parent 1 photo
const [parent1PhotoPreview, setParent1PhotoPreview] = useState(null);


  // Parent 2 photo
const [parent2PhotoPreview, setParent2PhotoPreview] = useState(null);

  // Guardian  photo
const [guardianPhotoPreview, setGuardianPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    admission_no: '',
    full_name: '',
    class_id: '',
    section: '',
    roll_no: '',
    student_phone: '',
    student_email: '',

    // Photo
    student_photo: null,

    parent1_name: '',
    parent1_phone: '',
    parent1_email: '',
    parent1_photo: null,

    parent2_name: '',
    parent2_phone: '',
    parent2_email: '',
    parent2_photo: null,

    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_photo: null,
  });

  const [errors, setErrors] = useState({});

  // =========================================================
  // CLASS MAPPINGS
  // =========================================================

  const wordToNumber = {
    first: 1,
    one: 1,
    second: 2,
    two: 2,
    third: 3,
    three: 3,
    fourth: 4,
    four: 4,
    fifth: 5,
    five: 5,
    sixth: 6,
    six: 6,
    seventh: 7,
    seven: 7,
    eighth: 8,
    eight: 8,
    ninth: 9,
    nine: 9,
    tenth: 10,
    ten: 10,
    eleventh: 11,
    eleven: 11,
    twelfth: 12,
    twelve: 12
  };

  const numberToWord = {
    1: 'First',
    2: 'Second',
    3: 'Third',
    4: 'Fourth',
    5: 'Fifth',
    6: 'Sixth',
    7: 'Seventh',
    8: 'Eighth',
    9: 'Ninth',
    10: 'Tenth',
    11: 'Eleventh',
    12: 'Twelfth'
  };

  // =========================================================
  // INITIAL LOAD - FETCH CLASSES
  // =========================================================

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch('/api/classes');

      if (response.ok) {
        const data = await response.json();
        setAvailableClasses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const getEmptyFormData = () => ({
    admission_no: '',
    full_name: '',
    class_id: '',
    section: '',
    roll_no: '',
    student_phone: '',
    student_email: '',

    student_photo: null,

    parent1_name: '',
    parent1_phone: '',
    parent1_email: '',
    parent1_photo: null,

    parent2_name: '',
    parent2_phone: '',
    parent2_email: '',
    parent2_photo: null,

    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_photo: null,

  });

  // =========================================================
  // WHEN MODAL OPENS FOR ADD
  // =========================================================

  useEffect(() => {
    if (isOpen && !editData) {
      setFormData(getEmptyFormData());
      setPhotoPreview(null);
      setParent1PhotoPreview(null);
      setParent2PhotoPreview(null);
      setGuardianPhotoPreview(null);
      setClassInput('');
      setStep(1);
      setErrors({});
    }
  }, [isOpen, editData]);

  // =========================================================
  // WHEN EDITING STUDENT
  // =========================================================

  useEffect(() => {
    if (editData) {
      const classId = editData.class_id || '';

      setClassInput(
        editData.class_name ||
        editData.class ||
        classId.toString()
      );

      setFormData({
        admission_no: editData.admission_no || '',
        full_name: editData.full_name || editData.name || '',
        class_id: editData.class_id || '',
        section: editData.section || '',
        roll_no: editData.roll_no || '',
        student_phone:
          editData.student_phone ||
          editData.student_contact ||
          '',
        student_email: editData.student_email || '',

        student_photo: null,

        parent1_name: editData.parent1_name || '',
        parent1_phone: editData.parent1_phone || '',
        parent1_email: editData.parent1_email || '',
        parent1_photo: null,

        parent2_name: editData.parent2_name || '',
        parent2_phone: editData.parent2_phone || '',
        parent2_email: editData.parent2_email || '',
        parent2_photo: null,

        guardian_name: editData.guardian_name || '',
        guardian_phone: editData.guardian_phone || '',
        guardian_email: editData.guardian_email || '',
        guardian_photo: null,
      });

      // Existing photo URL, if backend already provides one
      setPhotoPreview(
        editData.student_photo_url ||
        editData.photo_url ||
        editData.student_photo ||
        null
      );


      setParent1PhotoPreview(
  editData.parent1_photo_url ||
  editData.parent1_photo ||
  null
);

     setParent2PhotoPreview(
  editData.parent2_photo_url ||
  editData.parent2_photo ||
  null
);

setGuardianPhotoPreview(
  editData.guardian_photo_url ||
  editData.guardian_photo ||
  null
);

      setStep(1);
      setErrors({});
    }
  }, [editData]);

  // =========================================================
  // GENERATE STUDENT ID
  // =========================================================

  useEffect(() => {
    if (isOpen && !editData) {
      generateStudentId();
    }
  }, [isOpen, editData]);

  const generateStudentId = async () => {
    try {
      const response = await fetch('/api/generate-id?type=student');

      const data = await response.json();

      if (data.id) {
        setFormData(prev => ({
          ...prev,
          admission_no: data.id
        }));
      }
    } catch (error) {
      console.error('Error generating ID:', error);
    }
  };

  // =========================================================
  // PHOTO HANDLING
  // =========================================================

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Check image type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      e.target.value = '';
      return;
    }

    // Allow JPG, JPEG and PNG only
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, JPEG and PNG images are allowed.');
      e.target.value = '';
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be less than 5 MB.');
      e.target.value = '';
      return;
    }

    // Save file
    setFormData(prev => ({
      ...prev,
      student_photo: file
    }));

    // Create preview
    const previewUrl = URL.createObjectURL(file);

    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      student_photo: null
    }));

    setPhotoPreview(null);

    const input = document.getElementById('student-photo');

    if (input) {
      input.value = '';
    }
  };


  // =========================================================
// PARENT 1 PHOTO HANDLING
// =========================================================

const handleParent1PhotoChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG, JPEG and PNG images are allowed.');
    e.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Photo size must be less than 5 MB.');
    e.target.value = '';
    return;
  }

  setFormData(prev => ({
    ...prev,
    parent1_photo: file
  }));

  const previewUrl = URL.createObjectURL(file);

  setParent1PhotoPreview(previewUrl);
};


// =========================================================
// PARENT 2 PHOTO HANDLING
// =========================================================

const handleParent2PhotoChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG, JPEG and PNG images are allowed.');
    e.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Photo size must be less than 5 MB.');
    e.target.value = '';
    return;
  }

  setFormData(prev => ({
    ...prev,
    parent2_photo: file
  }));

  setParent2PhotoPreview(
    URL.createObjectURL(file)
  );
};


const handleRemoveParent2Photo = () => {
  setFormData(prev => ({
    ...prev,
    parent2_photo: null
  }));

  setParent2PhotoPreview(null);

  const input = document.getElementById(
    'parent2-photo'
  );

  if (input) {
    input.value = '';
  }
};


// =========================================================
// GUARDIAN PHOTO HANDLING
// =========================================================

const handleGuardianPhotoChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG, JPEG and PNG images are allowed.');
    e.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Photo size must be less than 5 MB.');
    e.target.value = '';
    return;
  }

  setFormData(prev => ({
    ...prev,
    guardian_photo: file
  }));

  setGuardianPhotoPreview(
    URL.createObjectURL(file)
  );
};


const handleRemoveGuardianPhoto = () => {
  setFormData(prev => ({
    ...prev,
    guardian_photo: null
  }));

  setGuardianPhotoPreview(null);

  const input = document.getElementById(
    'guardian-photo'
  );

  if (input) {
    input.value = '';
  }
};

// =========================================================
// PARENT 1 PHOTO REMOVE
// =========================================================

const handleRemoveParent1Photo = () => {
  setFormData(prev => ({
    ...prev,
    parent1_photo: null
  }));

  setParent1PhotoPreview(null);

  const input = document.getElementById(
    'parent1-photo'
  );

  if (input) {
    input.value = '';
  }
};




  // =========================================================
  // KEYBOARD HANDLER
  // =========================================================

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // =========================================================
  // CLASS CHANGE
  // =========================================================

  const handleClassChange = (e) => {
    const value = e.target.value;

    setClassInput(value);
    setShowClassDropdown(true);

    const lowerValue = value.toLowerCase().trim();

    let classId = '';

    if (wordToNumber[lowerValue]) {
      classId = wordToNumber[lowerValue].toString();
    } else if (
      !isNaN(value) &&
      value >= 1 &&
      value <= 12
    ) {
      classId = value;
    } else {
      const matchedClass = availableClasses.find(
        c =>
          c.class_name?.toLowerCase() === lowerValue ||
          numberToWord[c.class_id]?.toLowerCase() === lowerValue
      );

      if (matchedClass) {
        classId = matchedClass.class_id.toString();
      }
    }

    setFormData(prev => ({
      ...prev,
      class_id: classId
    }));

    if (errors.class_id) {
      setErrors(prev => ({
        ...prev,
        class_id: ''
      }));
    }
  };

  // =========================================================
  // CLASS SELECT
  // =========================================================

  const handleClassSelect = (classId) => {
    const selectedClass = availableClasses.find(
      c => c.class_id === classId
    );

    setClassInput(
      selectedClass?.class_name ||
      numberToWord[classId] ||
      classId.toString()
    );

    setFormData(prev => ({
      ...prev,
      class_id: classId.toString()
    }));

    setShowClassDropdown(false);

    if (errors.class_id) {
      setErrors(prev => ({
        ...prev,
        class_id: ''
      }));
    }
  };

  // =========================================================
  // NORMAL INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateStep = (stepNumber) => {
    const newErrors = {};

    // STEP 1
    if (stepNumber === 1) {
      if (!formData.admission_no) {
        newErrors.admission_no =
          'Student ID is required';
      }

      if (!formData.full_name.trim()) {
        newErrors.full_name =
          'Student Name is required';
      }

      const classValue =
        classInput.toLowerCase().trim();

      let isValidClass = false;

      if (
        !isNaN(classValue) &&
        parseInt(classValue) >= 1 &&
        parseInt(classValue) <= 12
      ) {
        isValidClass = true;
      } else if (wordToNumber[classValue]) {
        isValidClass = true;
      } else if (
        availableClasses.some(
          c =>
            c.class_name?.toLowerCase() ===
              classValue ||
            numberToWord[c.class_id]?.toLowerCase() ===
              classValue
        )
      ) {
        isValidClass = true;
      }

      if (!isValidClass) {
        newErrors.class_id =
          'Please enter a valid class (1-12, First-Twelfth)';
      }

      if (!formData.section.trim()) {
        newErrors.section =
          'Section is required';
      }

      if (
        formData.student_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.student_email
        )
      ) {
        newErrors.student_email =
          'Invalid email format';
      }
    }

    // STEP 2
    else if (stepNumber === 2) {
      if (!formData.parent1_name.trim()) {
        newErrors.parent1_name =
          'Parent 1 Name is required';
      }

      if (!formData.parent1_phone.trim()) {
        newErrors.parent1_phone =
          'Parent 1 Phone is required';
      }

      if (
        formData.parent1_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.parent1_email
        )
      ) {
        newErrors.parent1_email =
          'Invalid email format';
      }

      if (
        formData.parent2_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.parent2_email
        )
      ) {
        newErrors.parent2_email =
          'Invalid email format';
      }
    }

    // STEP 3
    else if (stepNumber === 3) {
      if (
        formData.guardian_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData.guardian_email
        )
      ) {
        newErrors.guardian_email =
          'Invalid email format';
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // NEXT STEP
  // =========================================================

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // =========================================================
  // PREVIOUS STEP
  // =========================================================

  const prevStep = () => {
    setStep(step - 1);
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    setFormData(getEmptyFormData());

    setPhotoPreview(null);
    setClassInput('');
    setStep(1);
    setErrors({});

    onClose();
  };

  // =========================================================
  // ADD / UPDATE STUDENT
  // =========================================================

  const handleAddStudent = async () => {
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);

    try {
      const url = '/api/students';

      const method = editData
        ? 'PUT'
        : 'POST';

      let classIdValue = formData.class_id;

      const classValue =
        classInput.toLowerCase().trim();

      if (wordToNumber[classValue]) {
        classIdValue =
          wordToNumber[classValue].toString();
      } else if (
        !isNaN(classValue) &&
        parseInt(classValue) >= 1 &&
        parseInt(classValue) <= 12
      ) {
        classIdValue =
          parseInt(classValue).toString();
      } else {
        const matchedClass =
          availableClasses.find(
            c =>
              c.class_name?.toLowerCase() ===
                classValue ||
              numberToWord[c.class_id]?.toLowerCase() ===
                classValue
          );

        if (matchedClass) {
          classIdValue =
            matchedClass.class_id.toString();
        }
      }

      /*
       * IMPORTANT:
       * For now we are NOT sending the photo
       * through JSON.
       *
       * Photo will be connected to S3 in the
       * next backend step.
       */

      const payload = {
        admission_no: formData.admission_no,
        full_name: formData.full_name,
        class_id: classIdValue
          ? parseInt(classIdValue)
          : null,

        section: formData.section,
        roll_no: formData.roll_no,

        student_phone:
          formData.student_phone,

        student_email:
          formData.student_email,

        parent1_name:
          formData.parent1_name,

        parent1_phone:
          formData.parent1_phone,

        parent1_email:
          formData.parent1_email,

        parent2_name:
          formData.parent2_name,

        parent2_phone:
          formData.parent2_phone,

        parent2_email:
          formData.parent2_email,

        guardian_name:
          formData.guardian_name,

        guardian_phone:
          formData.guardian_phone,

        guardian_email:
          formData.guardian_email
      };

      if (editData) {
        payload.id =
          editData.id ||
          editData.admission_no;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type':
            'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data =
        await response.json();
if (response.ok) {

const studentId =
  data.student?.student_id ||
  data.student?.id ||
  data.id ||
  editData?.student_id ||
  editData?.id;

  console.log('✅ Student saved');
  console.log('Student ID:', studentId);

 // =====================================================
// UPLOAD PHOTOS TO S3
// =====================================================

const uploadPhoto = async (file, photoType) => {
  if (!file || !studentId) {
    return;
  }

  const photoFormData = new FormData();

  photoFormData.append('file', file);

  photoFormData.append(
    'admission_no',
    formData.admission_no
  );

  photoFormData.append(
    'photoType',
    photoType
  );

  console.log(
    `📸 Uploading ${photoType} photo to S3...`
  );

  const photoResponse = await fetch(
    `/api/students/${studentId}/photo`,
    {
      method: 'POST',
      body: photoFormData
    }
  );

  const photoData = await photoResponse.json();

  console.log(
    `📸 ${photoType} photo API response:`,
    photoData
  );

  if (!photoResponse.ok) {
    throw new Error(
      photoData.error ||
      `${photoType} photo upload failed`
    );
  }

  console.log(
    `✅ ${photoType} photo uploaded and DB key saved`
  );
};


// Student photo
if (formData.student_photo) {
  await uploadPhoto(
    formData.student_photo,
    'student'
  );
}

// Parent 1 photo
if (formData.parent1_photo) {
  await uploadPhoto(
    formData.parent1_photo,
    'parent1'
  );
}

// Parent 2 photo
if (formData.parent2_photo) {
  await uploadPhoto(
    formData.parent2_photo,
    'parent2'
  );
}

// Guardian photo
if (formData.guardian_photo) {
  await uploadPhoto(
    formData.guardian_photo,
    'guardian'
  );
}
  onSuccess();

  setFormData(getEmptyFormData());

  setPhotoPreview(null);
  setClassInput('');
  setStep(1);
  setErrors({});

  onClose();
} else {
        alert(
          data.error ||
          'Failed to save student'
        );
      }
    } catch (error) {
      console.error(
        'Error:',
        error
      );

      alert(
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORM SUBMIT
  // =========================================================

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  // =========================================================
  // CLOSE
  // =========================================================

  if (!isOpen) {
    return null;
  }

  // =========================================================
  // THEME
  // =========================================================

  const isDark = theme === 'dark';

  const bgColor = isDark
    ? 'bg-gray-900'
    : 'bg-white';

  const textColor = isDark
    ? 'text-white'
    : 'text-gray-900';

  const inputBg = isDark
    ? 'bg-white/10'
    : 'bg-gray-50';

  const inputBorder = isDark
    ? 'border-white/20'
    : 'border-gray-300';

  const inputText = isDark
    ? 'text-white'
    : 'text-gray-900';

  const labelColor = isDark
    ? 'text-white/80'
    : 'text-gray-700';

  const borderColor = isDark
    ? 'border-white/10'
    : 'border-gray-200';

  const placeholderColor = isDark
    ? 'placeholder-white/60'
    : 'placeholder-gray-400';

  // =========================================================
  // CLASS SUGGESTIONS
  // =========================================================

  const getClassSuggestions = () => {
    const input =
      classInput.toLowerCase().trim();

    if (!input) {
      return [];
    }

    const suggestions = [];

    for (let i = 1; i <= 12; i++) {
      if (
        i.toString().includes(input) ||
        numberToWord[i]
          .toLowerCase()
          .includes(input)
      ) {
        suggestions.push({
          id: i,
          label: `${numberToWord[i]} (${i})`
        });
      }
    }

    availableClasses.forEach(c => {
      if (
        c.class_name
          ?.toLowerCase()
          .includes(input) ||
        numberToWord[c.class_id]
          ?.toLowerCase()
          .includes(input)
      ) {
        suggestions.push({
          id: c.class_id,
          label: `${
            c.class_name ||
            numberToWord[c.class_id] ||
            'Class'
          } (ID: ${c.class_id})`
        });
      }
    });

    // Remove duplicate IDs
    const uniqueSuggestions =
      suggestions.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            x => x.id === item.id
          )
      );

    return uniqueSuggestions.slice(
      0,
      10
    );
  };

  const suggestions =
    getClassSuggestions();

  // =========================================================
  // UI
  // =========================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{
              scale: 0.95,
              y: 20
            }}
            animate={{
              scale: 1,
              y: 0
            }}
            exit={{
              scale: 0.95,
              y: 20
            }}
            transition={{
              duration: 0.2
            }}
            className={`w-full max-w-5xl ${bgColor} rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden`}
            onClick={e =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className={`flex items-center justify-between px-7 py-5 border-b ${borderColor}`}
            >
              <div>
                <h3
                  className={`text-2xl font-bold ${textColor}`}
                >
                  {editData
                    ? 'Edit Student'
                    : 'Add New Student'}
                </h3>

                <p
                  className={`text-sm mt-1 ${
                    isDark
                      ? 'text-white/50'
                      : 'text-gray-500'
                  }`}
                >
                  Step {step} of 3
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className={`p-2.5 rounded-xl ${
                  isDark
                    ? 'hover:bg-white/10'
                    : 'hover:bg-gray-100'
                } transition`}
              >
                <X
                  className={`w-6 h-6 ${
                    isDark
                      ? 'text-white/60'
                      : 'text-gray-500'
                  }`}
                />
              </button>
            </div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="px-7 pt-5">
              <div className="flex items-center justify-between mb-3">

                <span
                  className={`text-sm font-semibold ${
                    step >= 1
                      ? 'text-blue-400'
                      : isDark
                      ? 'text-white/40'
                      : 'text-gray-400'
                  }`}
                >
                  Student Info
                </span>

                <span
                  className={`text-sm font-semibold ${
                    step >= 2
                      ? 'text-blue-400'
                      : isDark
                      ? 'text-white/40'
                      : 'text-gray-400'
                  }`}
                >
                  Parents Info
                </span>

                <span
                  className={`text-sm font-semibold ${
                    step >= 3
                      ? 'text-blue-400'
                      : isDark
                      ? 'text-white/40'
                      : 'text-gray-400'
                  }`}
                >
                  Guardian Info
                </span>

              </div>

              <div
                className={`w-full h-2 ${
                  isDark
                    ? 'bg-white/10'
                    : 'bg-gray-200'
                } rounded-full overflow-hidden`}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${((step - 1) / 2) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
  onSubmit={handleFormSubmit}
  className="flex-1 overflow-y-auto px-8 py-5"
>

              {/* =================================================
                  STEP 1
              ================================================= */}

              {step === 1 && (
                <motion.div
                  initial={{
                    x: 20,
                    opacity: 0
                  }}
                  animate={{
                    x: 0,
                    opacity: 1
                  }}
                  className="space-y-5"
                >

                  <h4
                    className={`text-base font-semibold ${textColor}`}
                  >
                    Student Information
                  </h4>

                  <div className="grid grid-cols-2 gap-5">

                    {/* ADMISSION NUMBER */}

                    <div>
                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Admission Number *
                        <span className="ml-1 text-xs opacity-60">
                          (S=Student)
                        </span>
                      </label>

                      <input
                        type="text"
                        name="admission_no"
                        value={
                          formData.admission_no
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        readOnly
                        disabled={!!editData}
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.admission_no
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., S001"
                      />

                      {errors.admission_no && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.admission_no
                          }
                        </p>
                      )}
                    </div>

                    

                    {/* =================================================
                        STUDENT PHOTO
                    ================================================= */}

                    <div>
                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Student Photo
                      </label>

                      <div
                        className={`mt-2 min-h-[124px] border-2 border-dashed ${
                          isDark
                            ? 'border-white/20 bg-white/5'
                            : 'border-gray-300 bg-gray-50'
                        } rounded-xl p-4`}
                      >

                        {photoPreview ? (

                          /* PHOTO SELECTED */

                          <div className="flex items-center gap-4">

                            <img
                              src={
                                photoPreview
                              }
                              alt="Student Preview"
                              className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-md"
                            />

                            <div className="flex-1 min-w-0">

                              <p
                                className={`text-sm font-semibold ${textColor}`}
                              >
                                Student photo selected
                              </p>

                              <p
                                className={`text-xs mt-1 truncate ${
                                  isDark
                                    ? 'text-white/50'
                                    : 'text-gray-500'
                                }`}
                              >
                                {formData
                                  .student_photo
                                  ?.name ||
                                  'Existing student photo'}
                              </p>

                              <p
                                className={`text-xs mt-1 ${
                                  isDark
                                    ? 'text-white/40'
                                    : 'text-gray-400'
                                }`}
                              >
                                JPG, PNG or JPEG
                                {' • '}
                                Maximum 5 MB
                              </p>

                            </div>

                            <div className="flex flex-col gap-2">

                              <label
                                htmlFor="student-photo"
                                className="cursor-pointer px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold text-center transition"
                              >
                                Change
                              </label>

                              <button
                                type="button"
                                onClick={
                                  handleRemovePhoto
                                }
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition"
                              >
                                Remove
                              </button>

                            </div>

                          </div>

                        ) : (

                          /* NO PHOTO */

                          <div className="flex items-center justify-between gap-4">

                            <div className="flex items-center gap-4">

                              <div
                                className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                                  isDark
                                    ? 'bg-white/10'
                                    : 'bg-gray-200'
                                }`}
                              >
                                <span className="text-2xl">
                                  📷
                                </span>
                              </div>

                              <div>

                                <p
                                  className={`text-sm font-semibold ${textColor}`}
                                >
                                  Upload Student Photo
                                </p>

                                <p
                                  className={`text-xs mt-1 ${
                                    isDark
                                      ? 'text-white/50'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  JPG, PNG or JPEG
                                </p>

                                <p
                                  className={`text-xs mt-0.5 ${
                                    isDark
                                      ? 'text-white/40'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  Maximum 5 MB
                                </p>

                              </div>

                            </div>

                            <label
                              htmlFor="student-photo"
                              className="cursor-pointer px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap"
                            >
                              Choose Photo
                            </label>

                          </div>

                        )}

                        {/* HIDDEN FILE INPUT */}

                        <input
                          id="student-photo"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={
                            handlePhotoChange
                          }
                          className="hidden"
                        />

                      </div>
                    </div>

                    {/* STUDENT NAME */}

                    <div>
                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Student Name *
                      </label>

                      <input
                        type="text"
                        name="full_name"
                        value={
                          formData.full_name
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.full_name
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="Enter student name"
                      />

                      {errors.full_name && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.full_name
                          }
                        </p>
                      )}
                    </div>

                    {/* CLASS */}

                    <div className="relative">

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Class *
                        <span className="ml-1 text-xs opacity-60">
                          (Enter 1-12 or
                          First-Twelfth)
                        </span>
                      </label>

                      <input
                        type="text"
                        value={
                          classInput
                        }
                        onChange={
                          handleClassChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        onFocus={() =>
                          setShowClassDropdown(
                            true
                          )
                        }
                        onBlur={() =>
                          setTimeout(
                            () =>
                              setShowClassDropdown(
                                false
                              ),
                            200
                          )
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.class_id
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 1, 5, First, Tenth"
                      />

                      {errors.class_id && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.class_id
                          }
                        </p>
                      )}

                      {showClassDropdown &&
                        suggestions.length >
                          0 && (
                          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-white/20 rounded-xl shadow-xl max-h-48 overflow-y-auto">

                            {suggestions.map(
                              sug => (
                                <button
                                  key={
                                    sug.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleClassSelect(
                                      sug.id
                                    )
                                  }
                                  className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition"
                                >
                                  {
                                    sug.label
                                  }
                                </button>
                              )
                            )}

                          </div>
                        )}

                    </div>

                    {/* SECTION */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Section *
                      </label>

                      <input
                        type="text"
                        name="section"
                        value={
                          formData.section
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.section
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., A"
                      />

                      {errors.section && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.section
                          }
                        </p>
                      )}

                    </div>

                    {/* ROLL NUMBER */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Roll Number
                      </label>

                      <input
                        type="text"
                        name="roll_no"
                        value={
                          formData.roll_no
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 01"
                      />

                    </div>

                    {/* STUDENT PHONE */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Student Phone
                      </label>

                      <input
                        type="tel"
                        name="student_phone"
                        value={
                          formData.student_phone
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 9876543210"
                      />

                    </div>

                    {/* STUDENT EMAIL */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Student Email
                      </label>

                      <input
                        type="email"
                        name="student_email"
                        value={
                          formData.student_email
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.student_email
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="student@email.com"
                      />

                      {errors.student_email && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.student_email
                          }
                        </p>
                      )}

                    </div>

                  </div>
                </motion.div>
              )}

              {/* =================================================
                  STEP 2 - PARENTS
              ================================================= */}

              {step === 2 && (
                <motion.div
                  initial={{
                    x: 20,
                    opacity: 0
                  }}
                  animate={{
                    x: 0,
                    opacity: 1
                  }}
                  className="space-y-6"
                >

                  <h4
                    className={`text-base font-semibold ${textColor}`}
                  >
                    Parents Information
                  </h4>

                  {/* PARENT 1 */}

                  <div
                    className={`p-5 ${
                      isDark
                        ? 'bg-white/5'
                        : 'bg-gray-50'
                    } rounded-xl border ${borderColor}`}
                  >

                    <h5
                      className={`text-sm font-semibold ${
                        isDark
                          ? 'text-white/70'
                          : 'text-gray-600'
                      } mb-4`}
                    >
                      Parent 1
                    </h5>

                    <div className="grid grid-cols-2 gap-5">

                      <div>

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Name *
                        </label>

                        <input
                          type="text"
                          name="parent1_name"
                          value={
                            formData.parent1_name
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                            errors.parent1_name
                              ? 'border-red-500'
                              : inputBorder
                          } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="Enter parent 1 name"
                        />

                        {errors.parent1_name && (
                          <p className="mt-1.5 text-xs text-red-500">
                            {
                              errors.parent1_name
                            }
                          </p>
                        )}

                      </div>

                      <div>

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Phone *
                        </label>

                        <input
                          type="tel"
                          name="parent1_phone"
                          value={
                            formData.parent1_phone
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                            errors.parent1_phone
                              ? 'border-red-500'
                              : inputBorder
                          } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="e.g., 9876543210"
                        />

                        {errors.parent1_phone && (
                          <p className="mt-1.5 text-xs text-red-500">
                            {
                              errors.parent1_phone
                            }
                          </p>
                        )}

                      </div>

                      <div className="col-span-2">

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Email
                        </label>

                        <input
                          type="email"
                          name="parent1_email"
                          value={
                            formData.parent1_email
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                            errors.parent1_email
                              ? 'border-red-500'
                              : inputBorder
                          } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="parent1@email.com"
                        />

                        {errors.parent1_email && (
                          <p className="mt-1.5 text-xs text-red-500">
                            {
                              errors.parent1_email
                            }
                          </p>
                        )}

                      </div>
 {/* =================================================
    PARENT 1 PHOTO
================================================= */}

<div className="col-span-2">

  <label
    className={`block text-sm font-semibold ${labelColor}`}
  >
    Parent 1 Photo
  </label>

  <div
    className={`mt-2 min-h-[124px] border-2 border-dashed ${
      isDark
        ? 'border-white/20 bg-white/5'
        : 'border-gray-300 bg-gray-50'
    } rounded-xl p-4`}
  >

    {parent1PhotoPreview ? (

      /* PHOTO SELECTED */

      <div className="flex items-center gap-4">

        {/* PREVIEW */}

        <img
          src={parent1PhotoPreview}
          alt="Parent 1 Preview"
          className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-md"
        />

        {/* PHOTO INFO */}

        <div className="flex-1 min-w-0">

          <p
            className={`text-sm font-semibold ${textColor}`}
          >
            Parent 1 photo selected
          </p>

          <p
            className={`text-xs mt-1 truncate ${
              isDark
                ? 'text-white/50'
                : 'text-gray-500'
            }`}
          >
            {formData.parent1_photo?.name ||
              'Existing Parent 1 photo'}
          </p>

          <p
            className={`text-xs mt-1 ${
              isDark
                ? 'text-white/40'
                : 'text-gray-400'
            }`}
          >
            JPG, PNG or JPEG
            {' • '}
            Maximum 5 MB
          </p>

        </div>

        {/* BUTTONS */}

        <div className="flex flex-col gap-2">

          {/* CHANGE */}

          <label
            htmlFor="parent1-photo"
            className="cursor-pointer px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold text-center transition"
          >
            Change
          </label>

          {/* REMOVE */}

          <button
            type="button"
            onClick={handleRemoveParent1Photo}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition"
          >
            Remove
          </button>

        </div>

      </div>

    ) : (

      /* NO PHOTO */

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          {/* CAMERA ICON */}

          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isDark
                ? 'bg-white/10'
                : 'bg-gray-200'
            }`}
          >
            <span className="text-2xl">
              📷
            </span>
          </div>

          {/* TEXT */}

          <div>

            <p
              className={`text-sm font-semibold ${textColor}`}
            >
              Upload Parent 1 Photo
            </p>

            <p
              className={`text-xs mt-1 ${
                isDark
                  ? 'text-white/50'
                  : 'text-gray-500'
              }`}
            >
              JPG, PNG or JPEG
            </p>

            <p
              className={`text-xs mt-0.5 ${
                isDark
                  ? 'text-white/40'
                  : 'text-gray-400'
              }`}
            >
              Maximum 5 MB
            </p>

          </div>

        </div>

        {/* CHOOSE PHOTO */}

        <label
          htmlFor="parent1-photo"
          className="cursor-pointer px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap"
        >
          Choose Photo
        </label>

      </div>

    )}

    {/* HIDDEN FILE INPUT */}

    <input
      id="parent1-photo"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      onChange={handleParent1PhotoChange}
      className="hidden"
    />

  </div>

</div>

                    </div>
                  </div>

                  {/* PARENT 2 */}

                  <div
                    className={`p-5 ${
                      isDark
                        ? 'bg-white/5'
                        : 'bg-gray-50'
                    } rounded-xl border ${borderColor}`}
                  >

                    <h5
                      className={`text-sm font-semibold ${
                        isDark
                          ? 'text-white/70'
                          : 'text-gray-600'
                      } mb-4`}
                    >
                      Parent 2
                      <span className="ml-1 text-xs opacity-50">
                        (Optional)
                      </span>
                    </h5>

                    <div className="grid grid-cols-2 gap-5">

                      <div>

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Name
                        </label>

                        <input
                          type="text"
                          name="parent2_name"
                          value={
                            formData.parent2_name
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="Enter parent 2 name"
                        />

                      </div>

                      <div>

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Phone
                        </label>

                        <input
                          type="tel"
                          name="parent2_phone"
                          value={
                            formData.parent2_phone
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="e.g., 9876543210"
                        />

                      </div>

                      <div className="col-span-2">

                        <label
                          className={`block text-sm font-semibold ${labelColor}`}
                        >
                          Email
                        </label>

                        <input
                          type="email"
                          name="parent2_email"
                          value={
                            formData.parent2_email
                          }
                          onChange={
                            handleChange
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                            errors.parent2_email
                              ? 'border-red-500'
                              : inputBorder
                          } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="parent2@email.com"
                        />

                        {errors.parent2_email && (
                          <p className="mt-1.5 text-xs text-red-500">
                            {
                              errors.parent2_email
                            }
                          </p>
                        )}

                      </div>
                      {/* =================================================
    PARENT 2 PHOTO
================================================= */}

<div className="col-span-2">

  <label
    className={`block text-sm font-semibold ${labelColor}`}
  >
    Parent 2 Photo
  </label>

  <div
    className={`mt-2 min-h-[124px] border-2 border-dashed ${
      isDark
        ? 'border-white/20 bg-white/5'
        : 'border-gray-300 bg-gray-50'
    } rounded-xl p-4`}
  >

    {parent2PhotoPreview ? (

      <div className="flex items-center gap-4">

        <img
          src={parent2PhotoPreview}
          alt="Parent 2 Preview"
          className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-md"
        />

        <div className="flex-1 min-w-0">

          <p
            className={`text-sm font-semibold ${textColor}`}
          >
            Parent 2 photo selected
          </p>

          <p
            className={`text-xs mt-1 truncate ${
              isDark
                ? 'text-white/50'
                : 'text-gray-500'
            }`}
          >
            {formData.parent2_photo?.name ||
              'Existing Parent 2 photo'}
          </p>

          <p
            className={`text-xs mt-1 ${
              isDark
                ? 'text-white/40'
                : 'text-gray-400'
            }`}
          >
            JPG, PNG or JPEG • Maximum 5 MB
          </p>

        </div>

        <div className="flex flex-col gap-2">

          <label
            htmlFor="parent2-photo"
            className="cursor-pointer px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold text-center transition"
          >
            Change
          </label>

          <button
            type="button"
            onClick={handleRemoveParent2Photo}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition"
          >
            Remove
          </button>

        </div>

      </div>

    ) : (

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isDark
                ? 'bg-white/10'
                : 'bg-gray-200'
            }`}
          >
            <span className="text-2xl">📷</span>
          </div>

          <div>

            <p
              className={`text-sm font-semibold ${textColor}`}
            >
              Upload Parent 2 Photo
            </p>

            <p
              className={`text-xs mt-1 ${
                isDark
                  ? 'text-white/50'
                  : 'text-gray-500'
              }`}
            >
              JPG, PNG or JPEG
            </p>

            <p
              className={`text-xs mt-0.5 ${
                isDark
                  ? 'text-white/40'
                  : 'text-gray-400'
              }`}
            >
              Maximum 5 MB
            </p>

          </div>

        </div>

        <label
          htmlFor="parent2-photo"
          className="cursor-pointer px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap"
        >
          Choose Photo
        </label>

      </div>

    )}

    <input
      id="parent2-photo"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      onChange={handleParent2PhotoChange}
      className="hidden"
    />

  </div>

</div>

                    </div>
                  </div>

                </motion.div>
              )}

              {/* =================================================
                  STEP 3 - GUARDIAN
              ================================================= */}

              {step === 3 && (
                <motion.div
                  initial={{
                    x: 20,
                    opacity: 0
                  }}
                  animate={{
                    x: 0,
                    opacity: 1
                  }}
                  className="space-y-5"
                >

                  <h4
                    className={`text-base font-semibold ${textColor}`}
                  >
                    Guardian Information
                    <span className="ml-1 text-xs opacity-50">
                      (Optional)
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-5">

                    {/* GUARDIAN NAME */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Guardian Name
                      </label>

                      <input
                        type="text"
                        name="guardian_name"
                        value={
                          formData.guardian_name
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="Enter guardian name"
                      />

                    </div>

                    {/* GUARDIAN PHONE */}

                    <div>

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Guardian Phone
                      </label>

                      <input
                        type="tel"
                        name="guardian_phone"
                        value={
                          formData.guardian_phone
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 9876543210"
                      />

                    </div>

                    {/* GUARDIAN EMAIL */}

                    <div className="col-span-2">

                      <label
                        className={`block text-sm font-semibold ${labelColor}`}
                      >
                        Guardian Email
                      </label>

                      <input
                        type="email"
                        name="guardian_email"
                        value={
                          formData.guardian_email
                        }
                        onChange={
                          handleChange
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        className={`w-full px-4 py-3 mt-2 ${inputBg} border ${
                          errors.guardian_email
                            ? 'border-red-500'
                            : inputBorder
                        } rounded-xl ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="guardian@email.com"
                      />

                      {errors.guardian_email && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {
                            errors.guardian_email
                          }
                        </p>
                      )}

                    </div>
                    {/* =================================================
    GUARDIAN PHOTO
================================================= */}

<div className="col-span-2">

  <label
    className={`block text-sm font-semibold ${labelColor}`}
  >
    Guardian Photo
  </label>

  <div
    className={`mt-2 min-h-[124px] border-2 border-dashed ${
      isDark
        ? 'border-white/20 bg-white/5'
        : 'border-gray-300 bg-gray-50'
    } rounded-xl p-4`}
  >

    {guardianPhotoPreview ? (

      <div className="flex items-center gap-4">

        <img
          src={guardianPhotoPreview}
          alt="Guardian Preview"
          className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-md"
        />

        <div className="flex-1 min-w-0">

          <p
            className={`text-sm font-semibold ${textColor}`}
          >
            Guardian photo selected
          </p>

          <p
            className={`text-xs mt-1 truncate ${
              isDark
                ? 'text-white/50'
                : 'text-gray-500'
            }`}
          >
            {formData.guardian_photo?.name ||
              'Existing Guardian photo'}
          </p>

          <p
            className={`text-xs mt-1 ${
              isDark
                ? 'text-white/40'
                : 'text-gray-400'
            }`}
          >
            JPG, PNG or JPEG • Maximum 5 MB
          </p>

        </div>

        <div className="flex flex-col gap-2">

          <label
            htmlFor="guardian-photo"
            className="cursor-pointer px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold text-center transition"
          >
            Change
          </label>

          <button
            type="button"
            onClick={handleRemoveGuardianPhoto}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition"
          >
            Remove
          </button>

        </div>

      </div>

    ) : (

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isDark
                ? 'bg-white/10'
                : 'bg-gray-200'
            }`}
          >
            <span className="text-2xl">📷</span>
          </div>

          <div>

            <p
              className={`text-sm font-semibold ${textColor}`}
            >
              Upload Guardian Photo
            </p>

            <p
              className={`text-xs mt-1 ${
                isDark
                  ? 'text-white/50'
                  : 'text-gray-500'
              }`}
            >
              JPG, PNG or JPEG
            </p>

            <p
              className={`text-xs mt-0.5 ${
                isDark
                  ? 'text-white/40'
                  : 'text-gray-400'
              }`}
            >
              Maximum 5 MB
            </p>

          </div>

        </div>

        <label
          htmlFor="guardian-photo"
          className="cursor-pointer px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap"
        >
          Choose Photo
        </label>

      </div>

    )}

    <input
      id="guardian-photo"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      onChange={handleGuardianPhotoChange}
      className="hidden"
    />

  </div>

</div>

                  </div>
                </motion.div>
              )}

              {/* =================================================
                  NAVIGATION BUTTONS
              ================================================= */}

              <div
                className={`flex justify-between mt-8 pt-5 border-t ${borderColor}`}
              >

                <div className="flex gap-3">

                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition"
                  >
                    Cancel
                  </button>

                </div>

                <div>

                  {step < 3 ? (

                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={
                        handleAddStudent
                      }
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? editData
                          ? 'Updating...'
                          : 'Adding...'
                        : editData
                        ? 'Update Student'
                        : 'Add Student'}
                    </button>

                  )}

                </div>

              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudentFormWizard;