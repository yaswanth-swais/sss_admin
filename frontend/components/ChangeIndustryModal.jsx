'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIndustry, setUser } from '../store/slices/userSlice';

const industries = [
  'Select User Type', 'LOGISTICS', 'WAREHOUSING', 'ECOMMERCE', 'MANUFACTURING', 'BANKING', 'HEALTHCARE', 'EDUTECH'
];

export default function ChangeIndustryModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    dob: user?.dob || '',
    user_type: user?.user_type || 'Select User Type'
  });
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user?.email) return onClose();
    if (formData.user_type === 'Select User Type') {
      alert("Please select a valid User Type.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const result = await res.json();
        // API returns user directly at root level (not nested under result.user)
        dispatch(setUser(result));
        dispatch(setIndustry(result.user_type));
        onClose();
      } else {
        console.error('Failed to complete registration');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col font-sans">
        
        <div className="bg-[#f8fafc] px-6 py-5 border-b border-gray-200">
          <h3 className="text-xl font-bold text-[#0f2851] text-center">Complete Your Registration</h3>
        </div>

        <div className="p-6 space-y-4 text-[#0f2851] flex-grow overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">First Name:</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f2851]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Last Name:</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f2851]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Gmail:</label>
            <input type="text" disabled value={user?.email || ''} className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded px-3 py-2 text-sm cursor-not-allowed" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Phone Number:</label>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f2851]" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date of Birth:</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f2851]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">User Type:</label>
            <select 
              name="user_type"
              value={formData.user_type} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0f2851] bg-white text-[#0f2851]"
            >
              {industries.map(ind => <option key={ind} value={ind} disabled={ind === 'Select User Type'}>{ind}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-[#f8fafc] px-6 py-4 border-t border-gray-200 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#0f2851] hover:bg-[#1a355f] text-white rounded text-sm font-semibold transition-colors shadow-md"
            disabled={loading}
          >
            Back to Login
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-b from-[#dfb967] to-[#cda653] hover:from-[#ebd08b] hover:to-[#dfb967] text-white rounded text-sm font-bold shadow-md transition-all flex items-center justify-center min-w-[170px]"
            disabled={loading}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Complete Registration'}
          </button>
        </div>
      </div>
    </div>
  );
}
