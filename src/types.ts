export type UserRole = 'patient' | 'doctor' | 'receptionist';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface PatientProfile {
  uid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory: string;
  phone: string;
  email: string;
  address: string;
  insuranceDetails: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  receptionistId?: string;
  patientName?: string;
  doctorName?: string;
}

export interface Bill {
  id: string;
  patientId: string;
  amount: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: string;
  createdAt: string;
}

export interface AIPredictionLog {
  id: string;
  patientId: string;
  doctorId: string;
  clinicalData: string;
  prediction: string;
  confidence: number;
  recommendations: string;
  createdAt: string;
}
