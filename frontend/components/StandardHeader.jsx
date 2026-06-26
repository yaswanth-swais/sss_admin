'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logout } from '../store/slices/userSlice';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function StandardHeader() {
  const [time, setTime] = useState('');
  const { user } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dd   = String(now.getDate()).padStart(2, '0');
      const mm   = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      let hours  = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hh   = String(hours).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTime(`${dd}-${mm}-${yyyy} | ${hh}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <header className="w-full bg-white text-[#0f2851] py-4 px-8 flex justify-between items-center shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <Link href="/" className="flex items-center font-bold text-lg tracking-wide hover:opacity-80 transition-opacity group">
        <span className="font-extrabold mr-2 group-hover:text-[#cda653] transition-colors">SWAIS</span>
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-sm font-medium text-gray-500">Saraf Worldsphere AI Services</span>
        <span className="ml-3 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-normal hidden sm:inline">Home</span>
      </Link>

      <div className="flex items-center gap-6">
        <span className="font-semibold tracking-wide text-[#0f2851]">{time}</span>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium hidden sm:block">
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-lg border-2 border-[#0f2851] text-[#0f2851] text-sm font-semibold hover:bg-[#0f2851] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
