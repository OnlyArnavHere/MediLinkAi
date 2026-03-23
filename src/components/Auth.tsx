import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import { motion } from 'motion/react';
import { Heart, Shield, User, LogIn } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (role: UserRole) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async (selectedRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: selectedRole,
          displayName: user.displayName
        });
        onAuthSuccess(selectedRole);
      } else {
        const data = userDoc.data();
        onAuthSuccess(data.role as UserRole);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4 font-serif">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-[32px] shadow-2xl max-w-2xl w-full text-center border border-[#5A5A40]/10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center shadow-lg">
            <Heart className="text-white w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-[#1a1a1a] mb-4 tracking-tight">MediLink AI</h1>
        <p className="text-xl text-[#5A5A40] mb-12 italic">Advanced Clinical Decision Support System</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RoleButton 
            icon={<User className="w-6 h-6" />}
            label="Patient"
            onClick={() => handleGoogleSignIn('patient')}
            loading={loading}
          />
          <RoleButton 
            icon={<Shield className="w-6 h-6" />}
            label="Receptionist"
            onClick={() => handleGoogleSignIn('receptionist')}
            loading={loading}
          />
          <RoleButton 
            icon={<LogIn className="w-6 h-6" />}
            label="Doctor"
            onClick={() => handleGoogleSignIn('doctor')}
            loading={loading}
          />
        </div>

        <p className="mt-12 text-sm text-gray-400 uppercase tracking-widest">
          Secure Healthcare Portal • Powered by Gemini AI
        </p>
      </motion.div>
    </div>
  );
};

const RoleButton = ({ icon, label, onClick, loading }: any) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="flex flex-col items-center p-8 border-2 border-[#5A5A40]/10 rounded-3xl hover:border-[#5A5A40] hover:bg-[#5A5A40]/5 transition-all group disabled:opacity-50"
  >
    <div className="mb-4 p-4 bg-[#f5f5f0] rounded-2xl group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="font-semibold text-[#1a1a1a]">{label}</span>
  </button>
);
