import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Appointment, Bill, PatientProfile } from '../types';
import { motion } from 'motion/react';
import { Calendar, Check, X, CreditCard, User, Clock, Search } from 'lucide-react';

export const ReceptionistDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    });

    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as any as PatientProfile)));
    });

    return () => {
      unsubAppointments();
      unsubPatients();
    };
  }, []);

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'appointments', id), { 
        status,
        receptionistId: user.uid 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBill = async (patientId: string) => {
    const amount = prompt("Enter Bill Amount ($):");
    if (!amount) return;

    try {
      await addDoc(collection(db, 'bills'), {
        patientId,
        amount: parseFloat(amount),
        status: 'unpaid',
        createdAt: new Date().toISOString()
      });
      alert("Bill created successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Receptionist Panel</h1>
          <p className="text-[#5A5A40] italic">Managing appointments and billing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointment Requests */}
        <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-[#5A5A40]" /> Pending Appointments
          </h3>
          <div className="space-y-4">
            {appointments.filter(a => a.status === 'pending').length === 0 ? (
              <p className="text-sm text-gray-400 italic">No pending requests.</p>
            ) : (
              appointments.filter(a => a.status === 'pending').map(app => (
                <div key={app.id} className="p-6 bg-[#f5f5f0] rounded-3xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{app.patientName}</p>
                    <p className="text-sm text-[#5A5A40]">{app.date} at {app.time}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Doctor: {app.doctorName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatus(app.id, 'approved')}
                      className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleStatus(app.id, 'rejected')}
                      className="p-3 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Patient Billing Management */}
        <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="text-[#5A5A40]" /> Patient Billing
          </h3>
          <div className="space-y-4">
            {patients.map(patient => (
              <div key={patient.uid} className="p-6 bg-[#f5f5f0] rounded-3xl flex justify-between items-center">
                <div>
                  <p className="font-bold">{patient.name}</p>
                  <p className="text-xs text-[#5A5A40]">{patient.phone}</p>
                </div>
                <button 
                  onClick={() => handleCreateBill(patient.uid)}
                  className="bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#4A4A30]"
                >
                  Create Bill
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
