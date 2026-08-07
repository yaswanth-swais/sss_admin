'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const StudentFormWizard = ({ isOpen, onClose, onSuccess, editData, theme = 'dark' }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classInput, setClassInput] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [formData, setFormData] = useState({
    admission_no: '',
    full_name: '',
    class_id: '',
    section: '',
    roll_no: '',
    student_phone: '',
    student_email: '',
    parent1_name: '',
    parent1_phone: '',
    parent1_email: '',
    parent2_name: '',
    parent2_phone: '',
    parent2_email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
  });
  const [errors, setErrors] = useState({});

  // Word to number mapping
  const wordToNumber = {
    'first': 1, 'one': 1,
    'second': 2, 'two': 2,
    'third': 3, 'three': 3,
    'fourth': 4, 'four': 4,
    'fifth': 5, 'five': 5,
    'sixth': 6, 'six': 6,
    'seventh': 7, 'seven': 7,
    'eighth': 8, 'eight': 8,
    'ninth': 9, 'nine': 9,
    'tenth': 10, 'ten': 10,
    'eleventh': 11, 'eleven': 11,
    'twelfth': 12, 'twelve': 12
  };

  // Number to word mapping for display
  const numberToWord = {
    1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth',
    5: 'Fifth', 6: 'Sixth', 7: 'Seventh', 8: 'Eighth',
    9: 'Ninth', 10: 'Tenth', 11: 'Eleventh', 12: 'Twelfth'
  };

  // Fetch available classes
  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setAvailableClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !editData) {
      setFormData({
        admission_no: '',
        full_name: '',
        class_id: '',
        section: '',
        roll_no: '',
        student_phone: '',
        student_email: '',
        parent1_name: '',
        parent1_phone: '',
        parent1_email: '',
        parent2_name: '',
        parent2_phone: '',
        parent2_email: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
      });
      setClassInput('');
      setStep(1);
      setErrors({});
    }
  }, [isOpen, editData]);

  useEffect(() => {
    if (editData) {
      const classId = editData.class_id || '';
      setClassInput(classId);
      setFormData({
        admission_no: editData.admission_no || '',
        full_name: editData.full_name || '',
        class_id: editData.class_id || '',
        section: editData.section || '',
        roll_no: editData.roll_no || '',
        student_phone: editData.student_phone || '',
        student_email: editData.student_email || '',
        parent1_name: editData.parent1_name || '',
        parent1_phone: editData.parent1_phone || '',
        parent1_email: editData.parent1_email || '',
        parent2_name: editData.parent2_name || '',
        parent2_phone: editData.parent2_phone || '',
        parent2_email: editData.parent2_email || '',
        guardian_name: editData.guardian_name || '',
        guardian_phone: editData.guardian_phone || '',
        guardian_email: editData.guardian_email || '',
      });
    }
  }, [editData]);

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
        setFormData(prev => ({ ...prev, admission_no: data.id }));
      }
    } catch (error) {
      console.error('Error generating ID:', error);
    }
  };

  // Prevent Enter key from submitting the form
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 1 || step === 2) {
        return;
      }
      if (step === 3) {
        return;
      }
    }
  };

  const handleClassChange = (e) => {
    const value = e.target.value;
    setClassInput(value);
    setShowClassDropdown(true);
    
    const lowerValue = value.toLowerCase().trim();
    let classId = '';
    
    if (wordToNumber[lowerValue]) {
      classId = wordToNumber[lowerValue].toString();
    } else if (!isNaN(value) && value >= 1 && value <= 12) {
      classId = value;
    } else {
      const matchedClass = availableClasses.find(c => 
        c.class_name?.toLowerCase() === lowerValue ||
        numberToWord[c.class_id]?.toLowerCase() === lowerValue
      );
      if (matchedClass) {
        classId = matchedClass.class_id.toString();
      }
    }
    
    setFormData(prev => ({ ...prev, class_id: classId }));
    if (errors.class_id) {
      setErrors(prev => ({ ...prev, class_id: '' }));
    }
  };

  const handleClassSelect = (classId) => {
    const selectedClass = availableClasses.find(c => c.class_id === classId);
    setClassInput(selectedClass?.class_name || classId.toString());
    setFormData(prev => ({ ...prev, class_id: classId.toString() }));
    setShowClassDropdown(false);
    if (errors.class_id) {
      setErrors(prev => ({ ...prev, class_id: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    if (stepNumber === 1) {
      if (!formData.admission_no) newErrors.admission_no = 'Student ID is required';
      if (!formData.full_name) newErrors.full_name = 'Student Name is required';
      
      const classValue = classInput.toLowerCase().trim();
      let isValidClass = false;
      
      if (!isNaN(classValue) && parseInt(classValue) >= 1 && parseInt(classValue) <= 12) {
        isValidClass = true;
      } else if (wordToNumber[classValue]) {
        isValidClass = true;
      } else if (availableClasses.some(c => 
        c.class_name?.toLowerCase() === classValue ||
        numberToWord[c.class_id]?.toLowerCase() === classValue
      )) {
        isValidClass = true;
      }
      
      if (!isValidClass) {
        newErrors.class_id = 'Please enter a valid class (1-12, First-Twelfth)';
      }
      
      if (!formData.section) newErrors.section = 'Section is required';
    } else if (stepNumber === 2) {
      if (!formData.parent1_name) newErrors.parent1_name = 'Parent 1 Name is required';
      if (!formData.parent1_phone) newErrors.parent1_phone = 'Parent 1 Phone is required';
      if (formData.parent1_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent1_email)) {
        newErrors.parent1_email = 'Invalid email format';
      }
      if (formData.parent2_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent2_email)) {
        newErrors.parent2_email = 'Invalid email format';
      }
    } else if (stepNumber === 3) {
      if (formData.guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardian_email)) {
        newErrors.guardian_email = 'Invalid email format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleCancel = () => {
    setFormData({
      admission_no: '',
      full_name: '',
      class_id: '',
      section: '',
      roll_no: '',
      student_phone: '',
      student_email: '',
      parent1_name: '',
      parent1_phone: '',
      parent1_email: '',
      parent2_name: '',
      parent2_phone: '',
      parent2_email: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
    });
    setClassInput('');
    setStep(1);
    setErrors({});
    onClose();
  };

  const handleAddStudent = async () => {
    if (!validateStep(3)) {
      return;
    }
    
    setLoading(true);
    try {
      const url = '/api/students';
      const method = editData ? 'PUT' : 'POST';
      
      let classIdValue = formData.class_id;
      const classValue = classInput.toLowerCase().trim();
      
      if (wordToNumber[classValue]) {
        classIdValue = wordToNumber[classValue].toString();
      } else if (!isNaN(classValue) && parseInt(classValue) >= 1 && parseInt(classValue) <= 12) {
        classIdValue = parseInt(classValue).toString();
      } else {
        const matchedClass = availableClasses.find(c => 
          c.class_name?.toLowerCase() === classValue ||
          numberToWord[c.class_id]?.toLowerCase() === classValue
        );
        if (matchedClass) {
          classIdValue = matchedClass.class_id.toString();
        }
      }
      
      const payload = {
        ...formData,
        class_id: classIdValue ? parseInt(classIdValue) : null
      };
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess();
        setFormData({
          admission_no: '',
          full_name: '',
          class_id: '',
          section: '',
          roll_no: '',
          student_phone: '',
          student_email: '',
          parent1_name: '',
          parent1_phone: '',
          parent1_email: '',
          parent2_name: '',
          parent2_phone: '',
          parent2_email: '',
          guardian_name: '',
          guardian_phone: '',
          guardian_email: '',
        });
        setClassInput('');
        setStep(1);
        setErrors({});
        onClose();
      } else {
        alert(data.error || 'Failed to save student');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const inputBg = isDark ? 'bg-white/10' : 'bg-gray-50';
  const inputBorder = isDark ? 'border-white/20' : 'border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const labelColor = isDark ? 'text-white/80' : 'text-gray-700';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const placeholderColor = isDark ? 'placeholder-white/60' : 'placeholder-gray-400';

  const getClassSuggestions = () => {
    const input = classInput.toLowerCase().trim();
    if (!input) return [];
    
    const suggestions = [];
    
    for (let i = 1; i <= 12; i++) {
      if (i.toString().includes(input) || numberToWord[i].toLowerCase().includes(input)) {
        suggestions.push({ id: i, label: `${numberToWord[i]} (${i})` });
      }
    }
    
    availableClasses.forEach(c => {
      if (c.class_name?.toLowerCase().includes(input) || 
          numberToWord[c.class_id]?.toLowerCase().includes(input)) {
        suggestions.push({ 
          id: c.class_id, 
          label: `${c.class_name || numberToWord[c.class_id] || 'Class'} (ID: ${c.class_id})` 
        });
      }
    });
    
    return suggestions.slice(0, 10);
  };

  const suggestions = getClassSuggestions();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`w-full max-w-3xl ${bgColor} rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
              <div>
                <h3 className={`text-xl font-semibold ${textColor}`}>
                  {editData ? 'Edit Student' : 'Add New Student'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  Step {step} of 3
                </p>
              </div>
              <button
                onClick={handleCancel}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${step >= 1 ? 'text-blue-400' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Student Info
                </span>
                <span className={`text-xs font-medium ${step >= 2 ? 'text-blue-400' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Parents Info
                </span>
                <span className={`text-xs font-medium ${step >= 3 ? 'text-blue-400' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Guardian Info
                </span>
              </div>
              <div className={`w-full h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full`}>
                <div
                  className="h-2 transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-4">
              {/* Step 1: Student Information */}
              {step === 1 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-4"
                >
                  <h4 className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Student Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Admission Number * (S=Student)
                      </label>
                      <input
                        type="text"
                        name="admission_no"
                        value={formData.admission_no}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.admission_no ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., S001"
                        readOnly
                        disabled={!!editData}
                      />
                      {errors.admission_no && <p className="mt-1 text-xs text-red-500">{errors.admission_no}</p>}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Student Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.full_name ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="Enter student name"
                      />
                      {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
                    </div>
                    <div className="relative">
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Class * <span className="text-xs text-white/40">(Enter 1-12 or First-Twelfth)</span>
                      </label>
                      <input
                        type="text"
                        value={classInput}
                        onChange={handleClassChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowClassDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClassDropdown(false), 200)}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.class_id ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 1, 5, First, Tenth"
                      />
                      {errors.class_id && <p className="mt-1 text-xs text-red-500">{errors.class_id}</p>}
                      
                      {showClassDropdown && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => handleClassSelect(sug.id)}
                              className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                            >
                              {sug.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Section *
                      </label>
                      <input
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.section ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., A"
                      />
                      {errors.section && <p className="mt-1 text-xs text-red-500">{errors.section}</p>}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Roll Number
                      </label>
                      <input
                        type="text"
                        name="roll_no"
                        value={formData.roll_no}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 01"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Student Phone
                      </label>
                      <input
                        type="tel"
                        name="student_phone"
                        value={formData.student_phone}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 9876543210"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Student Email
                      </label>
                      <input
                        type="email"
                        name="student_email"
                        value={formData.student_email}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="student@email.com"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Parents Information */}
              {step === 2 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <h4 className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Parents Information
                  </h4>

                  <div className={`p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg border ${borderColor}`}>
                    <h5 className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-600'} mb-3`}>
                      Parent 1
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Name *
                        </label>
                        <input
                          type="text"
                          name="parent1_name"
                          value={formData.parent1_name}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.parent1_name ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="Enter parent 1 name"
                        />
                        {errors.parent1_name && <p className="mt-1 text-xs text-red-500">{errors.parent1_name}</p>}
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Phone *
                        </label>
                        <input
                          type="tel"
                          name="parent1_phone"
                          value={formData.parent1_phone}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.parent1_phone ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="e.g., 9876543210"
                        />
                        {errors.parent1_phone && <p className="mt-1 text-xs text-red-500">{errors.parent1_phone}</p>}
                      </div>
                      <div className="col-span-2">
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="parent1_email"
                          value={formData.parent1_email}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.parent1_email ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="parent1@email.com"
                        />
                        {errors.parent1_email && <p className="mt-1 text-xs text-red-500">{errors.parent1_email}</p>}
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg border ${borderColor}`}>
                    <h5 className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-600'} mb-3`}>
                      Parent 2 <span className="text-xs text-white/40">(Optional)</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Name
                        </label>
                        <input
                          type="text"
                          name="parent2_name"
                          value={formData.parent2_name}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="Enter parent 2 name"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="parent2_phone"
                          value={formData.parent2_phone}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="e.g., 9876543210"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={`block text-sm font-medium ${labelColor}`}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="parent2_email"
                          value={formData.parent2_email}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.parent2_email ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                          placeholder="parent2@email.com"
                        />
                        {errors.parent2_email && <p className="mt-1 text-xs text-red-500">{errors.parent2_email}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Guardian Information */}
              {step === 3 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-4"
                >
                  <h4 className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Guardian Information <span className="text-xs text-white/40">(Optional)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        name="guardian_name"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="Enter guardian name"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        name="guardian_phone"
                        value={formData.guardian_phone}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="e.g., 9876543210"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`block text-sm font-medium ${labelColor}`}>
                        Guardian Email
                      </label>
                      <input
                        type="email"
                        name="guardian_email"
                        value={formData.guardian_email}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className={`w-full px-3 py-2 mt-1 ${inputBg} border ${errors.guardian_email ? 'border-red-500' : inputBorder} rounded-lg ${inputText} ${placeholderColor} focus:outline-none focus:border-blue-500`}
                        placeholder="guardian@email.com"
                      />
                      {errors.guardian_email && <p className="mt-1 text-xs text-red-500">{errors.guardian_email}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
                <div className="flex gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-3">
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
                      onClick={handleAddStudent}
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                      {loading ? (editData ? 'Updating...' : 'Adding...') : (editData ? 'Update Student' : 'Add Student')}
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
