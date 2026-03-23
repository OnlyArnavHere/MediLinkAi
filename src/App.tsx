import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserRole, UserProfile } from './types';
import { Auth } from './components/Auth';
import { PatientDashboard } from './components/PatientDashboard';
import { ReceptionistDashboard } from './components/ReceptionistDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { LogOut, User as UserIcon, Activity, Calendar, FileText, CreditCard, Search, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 bg-[#5A5A40] rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(role) => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-serif text-[#1a1a1a]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#5A5A40]/10 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">MediLink AI</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold">{user.displayName || user.email}</p>
            <p className="text-xs text-[#5A5A40] uppercase tracking-widest">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={user.role}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {user.role === 'patient' && <PatientDashboard user={user} />}
            {user.role === 'receptionist' && <ReceptionistDashboard user={user} />}
            {user.role === 'doctor' && <DoctorDashboard user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
