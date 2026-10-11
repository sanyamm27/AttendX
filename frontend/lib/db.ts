import { supabase } from './supabase';
import { randomUUID } from 'crypto';

export interface Teacher {
  teacher_id: string;
  username: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface Student {
  student_id: string;
  name: string;
  face_embedding: number[];
  created_at: string;
}

export interface Subject {
  subject_id: string;
  subject_code: string;
  name: string;
  section: string;
  teacher_id: string;
  created_at: string;
}

export interface SubjectStudent {
  subject_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface AttendanceLog {
  log_id: string;
  student_id: string;
  subject_id: string;
  timestamp: string;
  is_present: boolean;
  method: 'face' | 'qr';
  created_at: string;
}

class MemoryDB {
  teachers: Teacher[] = [];
  students: Student[] = [];
  subjects: Subject[] = [];
  subject_students: SubjectStudent[] = [];
  attendance_logs: AttendanceLog[] = [];
}

const globalForDb = globalThis as unknown as { __attendx_memory_db__?: MemoryDB };
export const localDb = globalForDb.__attendx_memory_db__ || new MemoryDB();
if (!globalForDb.__attendx_memory_db__) {
  globalForDb.__attendx_memory_db__ = localDb;
}

export const db = {
  // --- Teachers ---
  async getTeacherByUsername(username: string): Promise<Teacher | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('username', username)
          .single();
        if (!error && data) return data as Teacher;
      } catch (e) {
        console.warn('Supabase getTeacherByUsername fallback:', e);
      }
    }
    return localDb.teachers.find((t) => t.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async getTeacherById(teacher_id: string): Promise<Teacher | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('teachers').select('*').eq('teacher_id', teacher_id).single();
        if (!error && data) return data as Teacher;
      } catch (e) {
        console.warn('Supabase getTeacherById fallback:', e);
      }
    }
    return localDb.teachers.find((t) => t.teacher_id === teacher_id) || null;
  },

  async createTeacher(username: string, password_hash: string, name: string): Promise<Teacher> {
    const newTeacher: Teacher = {
      teacher_id: randomUUID(),
      username,
      password_hash,
      name,
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('teachers').insert([newTeacher]).select().single();
        if (!error && data) return data as Teacher;
      } catch (e) {
        console.warn('Supabase createTeacher fallback:', e);
      }
    }
    localDb.teachers.push(newTeacher);
    return newTeacher;
  },

  async updateTeacher(teacher_id: string, updates: { name?: string; password_hash?: string }): Promise<Teacher> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .update(updates)
          .eq('teacher_id', teacher_id)
          .select()
          .single();
        if (!error && data) return data as Teacher;
      } catch (e) {
        console.warn('Supabase updateTeacher fallback:', e);
      }
    }
    const teacher = localDb.teachers.find((t) => t.teacher_id === teacher_id);
    if (!teacher) throw new Error('Teacher not found');
    if (updates.name) teacher.name = updates.name;
    if (updates.password_hash) teacher.password_hash = updates.password_hash;
    return teacher;
  },

  // --- Students ---
  async getAllStudents(): Promise<Student[]> {
    let sbStudents: Student[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('students').select('*');
        if (!error && data) sbStudents = data as Student[];
      } catch (e) {
        console.warn('Supabase getAllStudents fallback:', e);
      }
    }
    const combined = [...sbStudents];
    for (const ls of localDb.students) {
      if (!combined.some((s) => s.student_id === ls.student_id)) {
        combined.push(ls);
      }
    }
    return combined;
  },

  async getStudentById(student_id: string): Promise<Student | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('students').select('*').eq('student_id', student_id).single();
        if (!error && data) return data as Student;
      } catch (e) {
        console.warn('Supabase getStudentById fallback:', e);
      }
    }
    return localDb.students.find((s) => s.student_id === student_id) || null;
  },

  async createStudent(name: string, face_embedding: number[]): Promise<Student> {
    const existing = await this.getAllStudents();
    const match = existing.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (match) {
      return await this.updateStudent(match.student_id, { face_embedding });
    }

    const newStudent: Student = {
      student_id: randomUUID(),
      name,
      face_embedding,
      created_at: new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('students').insert([newStudent]).select().single();
        if (!error && data) {
          localDb.students = localDb.students.filter((s) => s.student_id !== data.student_id);
          localDb.students.push(data as Student);
          return data as Student;
        }
      } catch (e) {
        console.warn('Supabase createStudent fallback:', e);
      }
    }
    localDb.students.push(newStudent);
    return newStudent;
  },

  async updateStudent(student_id: string, updates: { name?: string; face_embedding?: number[] }): Promise<Student> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update(updates)
          .eq('student_id', student_id)
          .select()
          .single();
        if (!error && data) return data as Student;
      } catch (e) {
        console.warn('Supabase updateStudent fallback:', e);
      }
    }
    const student = localDb.students.find((s) => s.student_id === student_id);
    if (!student) throw new Error('Student not found');
    if (updates.name) student.name = updates.name;
    if (updates.face_embedding) student.face_embedding = updates.face_embedding;
    return student;
  },

  async deleteStudent(student_id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from('subject_students').delete().eq('student_id', student_id);
        await supabase.from('attendance_logs').delete().eq('student_id', student_id);
        await supabase.from('students').delete().eq('student_id', student_id);
      } catch (e) {
        console.warn('Supabase deleteStudent fallback:', e);
      }
    }
    localDb.subject_students = localDb.subject_students.filter((ss) => ss.student_id !== student_id);
    localDb.attendance_logs = localDb.attendance_logs.filter((l) => l.student_id !== student_id);
    localDb.students = localDb.students.filter((s) => s.student_id !== student_id);
    return true;
  },

  // --- Subjects ---
  async getSubjects(teacher_id?: string): Promise<Subject[]> {
    if (supabase) {
      try {
        let query = supabase.from('subjects').select('*');
        if (teacher_id) {
          query = query.eq('teacher_id', teacher_id);
        }
        const { data, error } = await query;
        if (!error && data) return data as Subject[];
      } catch (e) {
        console.warn('Supabase getSubjects fallback:', e);
      }
    }
    if (teacher_id) {
      return localDb.subjects.filter((s) => s.teacher_id === teacher_id);
    }
    return localDb.subjects;
  },

  async getSubjectByCode(subject_code: string): Promise<Subject | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('subjects').select('*').eq('subject_code', subject_code).single();
        if (!error && data) return data as Subject;
      } catch (e) {
        console.warn('Supabase getSubjectByCode fallback:', e);
      }
    }
    return localDb.subjects.find((s) => s.subject_code === subject_code) || null;
  },

  async getSubjectById(subject_id: string): Promise<Subject | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('subjects').select('*').eq('subject_id', subject_id).single();
        if (!error && data) return data as Subject;
      } catch (e) {
        console.warn('Supabase getSubjectById fallback:', e);
      }
    }
    return localDb.subjects.find((s) => s.subject_id === subject_id) || null;
  },

  async createSubject(name: string, section: string, teacher_id: string): Promise<Subject> {
    const prefix = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'SUBJ';
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const subject_code = `${prefix}-${randCode}`;

    const newSubject: Subject = {
      subject_id: randomUUID(),
      subject_code,
      name,
      section,
      teacher_id,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('subjects').insert([newSubject]).select().single();
        if (!error && data) return data as Subject;
      } catch (e) {
        console.warn('Supabase createSubject fallback:', e);
      }
    }
    localDb.subjects.push(newSubject);
    return newSubject;
  },

  // --- Enrollment (Subject Students) ---
  async enrollStudent(subject_id: string, student_id: string): Promise<SubjectStudent> {
    const existingLocal = localDb.subject_students.find(
      (ss) => ss.subject_id === subject_id && ss.student_id === student_id
    );

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subject_students')
          .select('*')
          .eq('subject_id', subject_id)
          .eq('student_id', student_id)
          .maybeSingle();

        if (!error && data) {
          const existingRecord: SubjectStudent = {
            subject_id: data.subject_id,
            student_id: data.student_id,
            enrolled_at: data.enrolled_at,
          };
          if (!existingLocal) {
            localDb.subject_students.push(existingRecord);
          }
          return existingRecord;
        }
      } catch (e) {
        console.warn('Supabase enrollStudent check fallback:', e);
      }
    }

    if (existingLocal) {
      return existingLocal;
    }

    const record: SubjectStudent = {
      subject_id,
      student_id,
      enrolled_at: new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('subject_students').insert([record]).select().single();
        if (!error && data) {
          record.enrolled_at = data.enrolled_at || record.enrolled_at;
        }
      } catch (e) {
        console.warn('Supabase enrollStudent insert fallback:', e);
      }
    }
    localDb.subject_students.push(record);
    return record;
  },

  async getEnrolledStudents(subject_id: string): Promise<Student[]> {
    const allSt = await this.getAllStudents();
    const validStudentIds = new Set(allSt.map((s) => s.student_id));

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subject_students')
          .select('student_id, students(*)')
          .eq('subject_id', subject_id);
        if (!error && data && data.length > 0) {
          const list = (data || [])
            .map((item: any) => item.students as Student)
            .filter(Boolean)
            .filter((s) => validStudentIds.has(s.student_id));
          if (list.length > 0) return list;
        }
      } catch (e) {
        console.warn('Supabase getEnrolledStudents fallback:', e);
      }
    }
    const studentIds = localDb.subject_students
      .filter((ss) => ss.subject_id === subject_id)
      .map((ss) => ss.student_id);
    return allSt.filter((s) => studentIds.includes(s.student_id));
  },

  async getEnrolledSubjects(student_id: string): Promise<Subject[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subject_students')
          .select('subject_id, subjects(*)')
          .eq('student_id', student_id);
        if (!error && data) {
          return (data || []).map((item: any) => item.subjects as Subject).filter(Boolean);
        }
      } catch (e) {
        console.warn('Supabase getEnrolledSubjects fallback:', e);
      }
    }
    const subjectIds = localDb.subject_students
      .filter((ss) => ss.student_id === student_id)
      .map((ss) => ss.subject_id);
    return localDb.subjects.filter((s) => subjectIds.includes(s.subject_id));
  },

  // --- Attendance Logs ---
  async createAttendanceLog(
    student_id: string,
    subject_id: string,
    method: 'face' | 'qr',
    is_present: boolean = true
  ): Promise<AttendanceLog> {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);

    const log: AttendanceLog = {
      log_id: randomUUID(),
      student_id,
      subject_id,
      timestamp: nowIso,
      is_present,
      method,
      created_at: nowIso,
    };

    if (supabase) {
      try {
        const startDate = `${todayStr}T00:00:00.000Z`;
        const endDate = `${todayStr}T23:59:59.999Z`;

        const { data: existingLogs } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('student_id', student_id)
          .eq('subject_id', subject_id)
          .gte('timestamp', startDate)
          .lte('timestamp', endDate);

        if (existingLogs && existingLogs.length > 0) {
          const existingId = existingLogs[0].log_id;
          const { data, error } = await supabase
            .from('attendance_logs')
            .update({
              timestamp: nowIso,
              is_present,
              method,
            })
            .eq('log_id', existingId)
            .select()
            .single();
          if (!error && data) return data as AttendanceLog;
        }

        const { data, error } = await supabase.from('attendance_logs').insert([log]).select().single();
        if (!error && data) return data as AttendanceLog;
      } catch (e) {
        console.warn('Supabase createAttendanceLog fallback:', e);
      }
    }

    const existingIndex = localDb.attendance_logs.findIndex((l) => {
      const logDay = new Date(l.timestamp).toISOString().slice(0, 10);
      return (
        l.student_id === student_id &&
        l.subject_id === subject_id &&
        logDay === todayStr
      );
    });

    if (existingIndex !== -1) {
      localDb.attendance_logs[existingIndex].timestamp = nowIso;
      localDb.attendance_logs[existingIndex].is_present = is_present;
      localDb.attendance_logs[existingIndex].method = method;
      return localDb.attendance_logs[existingIndex];
    }

    localDb.attendance_logs.push(log);
    return log;
  },

  async getAttendanceLogs(subject_id?: string, student_id?: string): Promise<AttendanceLog[]> {
    if (supabase) {
      try {
        let query = supabase.from('attendance_logs').select('*');
        if (subject_id) query = query.eq('subject_id', subject_id);
        if (student_id) query = query.eq('student_id', student_id);
        const { data, error } = await query;
        if (!error && data) return data as AttendanceLog[];
      } catch (e) {
        console.warn('Supabase getAttendanceLogs fallback:', e);
      }
    }
    return localDb.attendance_logs.filter((log) => {
      if (subject_id && log.subject_id !== subject_id) return false;
      if (student_id && log.student_id !== student_id) return false;
      return true;
    });
  },
};
