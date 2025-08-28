// src/types/certificate.ts
export interface Student {
  id: string;
  name: string;
  rank: number;
  testsAttempted: number;
  medalType: "gold" | "silver" | "bronze" | "participation";
}

export interface EventDetails {
  name: string;
  date: Date;
}

export interface CertificateData {
  student: Student;
  event: EventDetails;
}

export interface BatchEntry {
  rank: number;
  studentName: string;
  testsAttempted: number;
}
