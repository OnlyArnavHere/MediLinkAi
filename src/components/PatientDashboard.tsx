import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, PatientProfile, Appointment, Bill } from '../types';
import { motion } from 'motion/react';
import { User, Phone, Mail, MapPin, Shield, Calendar, CreditCard, BookOpen, Search, Activity, Heart, Info, AlertCircle } from 'lucide-react';
import { getDiseaseAwareness, searchMedicalTerm } from '../services/aiService';

export const PatientDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: user.displayName || '',
    age: 0,
    gender: 'male' as const,
    medicalHistory: '',
    phone: '',
    email: user.email,
    address: '',
    insuranceDetails: ''
  });

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'patients', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as PatientProfile);
      } else {
        setIsRegistering(true);
      }
      setLoading(false);
    });

    const unsubAppointments = onSnapshot(
      query(collection(db, 'appointments'), where('patientId', '==', user.uid)),
      (snapshot) => {
        setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      }
    );

    const unsubBills = onSnapshot(
      query(collection(db, 'bills'), where('patientId', '==', user.uid)),
      (snapshot) => {
        setBills(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bill)));
      }
    );

    return () => {
      unsubProfile();
      unsubAppointments();
      unsubBills();
    };
  }, [user.uid]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'patients', user.uid), {
        ...formData,
        uid: user.uid
      });
      setIsRegistering(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookAppointment = async () => {
    const date = prompt("Enter Date (YYYY-MM-DD):");
    const time = prompt("Enter Time (HH:MM):");
    if (!date || !time) return;

    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: user.uid,
        patientName: profile?.name,
        doctorId: 'doctor_id_placeholder', // In a real app, this would be selected
        doctorName: 'Dr. Smith',
        date,
        time,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert("Appointment request sent to receptionist.");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayBill = async (billId: string) => {
    try {
      await setDoc(doc(db, 'bills', billId), { status: 'paid' }, { merge: true });
      alert("Payment successful.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSearch = async (type: 'awareness' | 'term') => {
    if (!aiQuery) return;
    setAiLoading(true);
    try {
      const result = type === 'awareness' 
        ? await getDiseaseAwareness(aiQuery)
        : await searchMedicalTerm(aiQuery);
      setAiResult(result || "No information found.");
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div>Loading Profile...</div>;

  if (isRegistering) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-[32px] shadow-xl border border-[#5A5A40]/10">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <User className="text-[#5A5A40]" /> Complete Your Registration
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Input label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
            <Input label="Age" type="number" value={formData.age.toString()} onChange={v => setFormData({...formData, age: parseInt(v)})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-widest">Gender</label>
              <select 
                className="w-full p-4 bg-[#f5f5f0] rounded-xl border-none focus:ring-2 focus:ring-[#5A5A40]"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value as any})}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          </div>
          <Input label="Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-widest">Medical History</label>
            <textarea 
              className="w-full p-4 bg-[#f5f5f0] rounded-xl border-none focus:ring-2 focus:ring-[#5A5A40] h-32"
              value={formData.medicalHistory}
              onChange={e => setFormData({...formData, medicalHistory: e.target.value})}
            />
          </div>
          <Input label="Insurance Details" value={formData.insuranceDetails} onChange={v => setFormData({...formData, insuranceDetails: v})} />
          <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold hover:bg-[#4A4A30] transition-colors shadow-lg">
            Register Profile
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome, {profile?.name}</h1>
          <p className="text-[#5A5A40] italic">Your health is our priority.</p>
        </div>
        <button 
          onClick={handleBookAppointment}
          className="bg-[#5A5A40] text-white px-8 py-4 rounded-full font-bold hover:bg-[#4A4A30] transition-all shadow-lg flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" /> Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card title="Patient Profile" icon={<User className="w-5 h-5" />}>
          <div className="space-y-4">
            <InfoItem icon={<Activity className="w-4 h-4" />} label="Age" value={profile?.age} />
            <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={profile?.phone} />
            <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={profile?.email} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={profile?.address} />
            <div className="pt-4 border-t border-[#5A5A40]/10">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Insurance</p>
              <p className="text-sm font-medium">{profile?.insuranceDetails || "No insurance linked"}</p>
            </div>
          </div>
        </Card>

        {/* Appointments */}
        <Card title="Appointments" icon={<Calendar className="w-5 h-5" />}>
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No appointments booked.</p>
            ) : (
              appointments.map(app => (
                <div key={app.id} className="p-4 bg-[#f5f5f0] rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{app.doctorName}</p>
                    <p className="text-xs text-[#5A5A40]">{app.date} • {app.time}</p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                    app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Billing */}
        <Card title="Billing & Payments" icon={<CreditCard className="w-5 h-5" />}>
          <div className="space-y-4">
            {bills.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No bills found.</p>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="p-4 bg-[#f5f5f0] rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">${bill.amount}</p>
                    <p className="text-xs text-[#5A5A40]">ID: {bill.id.slice(0,8)}</p>
                  </div>
                  {bill.status === 'unpaid' ? (
                    <button 
                      onClick={() => handlePayBill(bill.id)}
                      className="bg-[#5A5A40] text-white text-xs px-4 py-2 rounded-full font-bold hover:bg-[#4A4A30]"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      Paid
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-white p-12 rounded-[32px] shadow-xl border border-[#5A5A40]/10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#5A5A40] rounded-full flex items-center justify-center">
            <Heart className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Health Assistant</h2>
            <p className="text-sm text-[#5A5A40] italic">AI-powered health awareness & medical search</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <input 
            type="text"
            placeholder="Search medical terms or diseases..."
            className="flex-1 p-4 bg-[#f5f5f0] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
          />
          <button 
            onClick={() => handleAiSearch('term')}
            disabled={aiLoading}
            className="bg-[#f5f5f0] text-[#5A5A40] px-6 rounded-2xl font-bold hover:bg-[#5A5A40] hover:text-white transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Search Term
          </button>
          <button 
            onClick={() => handleAiSearch('awareness')}
            disabled={aiLoading}
            className="bg-[#5A5A40] text-white px-6 rounded-2xl font-bold hover:bg-[#4A4A30] transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Get Awareness
          </button>
        </div>

        {aiLoading && (
          <div className="flex items-center gap-3 text-[#5A5A40] animate-pulse">
            <Activity className="w-5 h-5 animate-spin" />
            <p className="font-medium italic">Assistant is thinking...</p>
          </div>
        )}

        {aiResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-[#f5f5f0] rounded-3xl border-l-4 border-[#5A5A40] prose prose-stone max-w-none"
          >
            <div dangerouslySetInnerHTML={{ __html: aiResult.replace(/\n/g, '<br/>') }} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, icon, children }: any) => (
  <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10">
    <div className="flex items-center gap-2 mb-6">
      <div className="p-2 bg-[#f5f5f0] rounded-lg text-[#5A5A40]">{icon}</div>
      <h3 className="text-lg font-bold uppercase tracking-widest text-[#5A5A40]">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="text-[#5A5A40] opacity-50">{icon}</div>
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</p>
      <p className="text-sm font-medium">{value || "N/A"}</p>
    </div>
  </div>
);

const Input = ({ label, type = "text", value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-600 uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      className="w-full p-4 bg-[#f5f5f0] rounded-xl border-none focus:ring-2 focus:ring-[#5A5A40]"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);
