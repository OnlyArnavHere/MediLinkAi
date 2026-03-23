import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { UserProfile, PatientProfile, Appointment, MedicalRecord, Prescription, AIPredictionLog } from '../types';
import { motion } from 'motion/react';
import { Activity, Clipboard, FileText, Brain, Send, User, Search, AlertCircle } from 'lucide-react';
import { getClinicalPrediction } from '../services/aiService';

export const DoctorDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [aiLogs, setAiLogs] = useState<AIPredictionLog[]>([]);
  
  const [diagnosis, setDiagnosis] = useState('');
  const [meds, setMeds] = useState('');
  const [clinicalData, setClinicalData] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // In a real app, we'd only fetch patients assigned to this doctor via appointments
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as any as PatientProfile)));
    });

    return () => unsubPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;

    const unsubRecords = onSnapshot(
      query(collection(db, 'medicalRecords'), where('patientId', '==', selectedPatient.uid)),
      (snapshot) => setRecords(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord)))
    );

    const unsubPrescriptions = onSnapshot(
      query(collection(db, 'prescriptions'), where('patientId', '==', selectedPatient.uid)),
      (snapshot) => setPrescriptions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)))
    );

    const unsubAi = onSnapshot(
      query(collection(db, 'aiPredictions'), where('patientId', '==', selectedPatient.uid)),
      (snapshot) => setAiLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AIPredictionLog)))
    );

    return () => {
      unsubRecords();
      unsubPrescriptions();
      unsubAi();
    };
  }, [selectedPatient]);

  const handleAddDiagnosis = async () => {
    if (!selectedPatient || !diagnosis) return;
    try {
      await addDoc(collection(db, 'medicalRecords'), {
        patientId: selectedPatient.uid,
        doctorId: user.uid,
        diagnosis,
        createdAt: new Date().toISOString()
      });
      setDiagnosis('');
      alert("Diagnosis added.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrescription = async () => {
    if (!selectedPatient || !meds) return;
    try {
      await addDoc(collection(db, 'prescriptions'), {
        patientId: selectedPatient.uid,
        doctorId: user.uid,
        medications: meds,
        createdAt: new Date().toISOString()
      });
      setMeds('');
      alert("Prescription issued.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiPrediction = async () => {
    if (!selectedPatient || !clinicalData) return;
    setAiLoading(true);
    try {
      const result = await getClinicalPrediction(clinicalData);
      await addDoc(collection(db, 'aiPredictions'), {
        patientId: selectedPatient.uid,
        doctorId: user.uid,
        clinicalData,
        prediction: result.prediction,
        confidence: result.confidence,
        recommendations: result.recommendations,
        createdAt: new Date().toISOString()
      });
      setClinicalData('');
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Patient List */}
      <div className="lg:col-span-1 bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10 h-fit sticky top-24">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User className="text-[#5A5A40]" /> My Patients
        </h3>
        <div className="space-y-3">
          {patients.map(p => (
            <button
              key={p.uid}
              onClick={() => setSelectedPatient(p)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                selectedPatient?.uid === p.uid 
                ? 'bg-[#5A5A40] text-white shadow-md' 
                : 'bg-[#f5f5f0] hover:bg-[#5A5A40]/10'
              }`}
            >
              <p className="font-bold">{p.name}</p>
              <p className={`text-xs ${selectedPatient?.uid === p.uid ? 'text-white/70' : 'text-[#5A5A40]'}`}>Age: {p.age}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Detail & AI CDSS */}
      <div className="lg:col-span-3 space-y-8">
        {!selectedPatient ? (
          <div className="bg-white p-20 rounded-[32px] shadow-lg border border-[#5A5A40]/10 text-center">
            <Activity className="w-16 h-16 text-[#5A5A40]/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-400">Select a patient to view records</h2>
          </div>
        ) : (
          <>
            {/* Patient Info Header */}
            <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">{selectedPatient.name}</h2>
                <p className="text-[#5A5A40] italic">Medical History: {selectedPatient.medicalHistory || "None"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Gender</p>
                <p className="font-medium">{selectedPatient.gender}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Records & Prescriptions */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Clipboard className="text-[#5A5A40]" /> Diagnosis
                  </h3>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {records.map(r => (
                      <div key={r.id} className="p-4 bg-[#f5f5f0] rounded-2xl">
                        <p className="text-sm">{r.diagnosis}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New diagnosis..."
                      className="flex-1 p-3 bg-[#f5f5f0] rounded-xl border-none text-sm"
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                    />
                    <button onClick={handleAddDiagnosis} className="p-3 bg-[#5A5A40] text-white rounded-xl">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-lg border border-[#5A5A40]/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <FileText className="text-[#5A5A40]" /> Prescriptions
                  </h3>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {prescriptions.map(p => (
                      <div key={p.id} className="p-4 bg-[#f5f5f0] rounded-2xl">
                        <p className="text-sm font-bold">{p.medications}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Medications..."
                      className="flex-1 p-3 bg-[#f5f5f0] rounded-xl border-none text-sm"
                      value={meds}
                      onChange={e => setMeds(e.target.value)}
                    />
                    <button onClick={handleAddPrescription} className="p-3 bg-[#5A5A40] text-white rounded-xl">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI CDSS Section */}
              <div className="bg-[#1a1a1a] p-8 rounded-[32px] shadow-2xl text-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Brain className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI-CDSS Module</h3>
                    <p className="text-xs text-white/50 italic">Clinical Decision Support System</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Clinical Data Input</label>
                    <textarea 
                      placeholder="Enter symptoms, vitals, lab results..."
                      className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-white/20 h-32 text-sm"
                      value={clinicalData}
                      onChange={e => setClinicalData(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAiPrediction}
                    disabled={aiLoading || !clinicalData}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                    Run AI Prediction
                  </button>

                  <div className="pt-8 border-t border-white/10">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Latest AI Insights</h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {aiLogs.map(log => (
                        <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-emerald-400">{(log.confidence * 100).toFixed(0)}% Confidence</span>
                            <span className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-bold mb-2">{log.prediction}</p>
                          <p className="text-xs text-white/60 italic">{log.recommendations}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
