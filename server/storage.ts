import {
  type Student, type InsertStudent, students,
  type Session, type InsertSession, sessions,
  type Concept, type InsertConcept, concepts,
  type Interaction, type InsertInteraction, interactions,
  type MasteryScore, masteryScores,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import { eq, and, desc } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/edulens",
});

export const db = drizzle(pool);

export interface IStorage {
  createStudent(student: InsertStudent): Promise<Student>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  getStudentSessions(studentId: number): Promise<Session[]>;
  endSession(id: number): Promise<void>;
  getConceptsBySubject(subject: string): Promise<Concept[]>;
  getConcept(id: number): Promise<Concept | undefined>;
  createConcept(concept: InsertConcept): Promise<Concept>;
  getConceptCount(): Promise<number>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: number, score: number, feedback: string): Promise<Interaction | undefined>;
  getSessionInteractions(sessionId: number): Promise<Interaction[]>;
  getStudentInteractions(studentId: number): Promise<Interaction[]>;
  getMastery(studentId: number, conceptId: number): Promise<MasteryScore | undefined>;
  upsertMastery(studentId: number, conceptId: number, score: number): Promise<MasteryScore>;
  getStudentMastery(studentId: number): Promise<MasteryScore[]>;
  getAllStudents(): Promise<Student[]>;
}

export class DatabaseStorage implements IStorage {
  async createStudent(student: InsertStudent): Promise<Student> {
    const [res] = await db.insert(students).values({ ...student, createdAt: new Date().toISOString() }).returning();
    return res;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [res] = await db.select().from(students).where(eq(students.id, id));
    return res;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [res] = await db.select().from(students).where(eq(students.email, email));
    return res;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [res] = await db.insert(sessions).values({ ...session, startedAt: new Date().toISOString() }).returning();
    return res;
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [res] = await db.select().from(sessions).where(eq(sessions.id, id));
    return res;
  }

  async getStudentSessions(studentId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.studentId, studentId)).orderBy(desc(sessions.startedAt));
  }

  async endSession(id: number): Promise<void> {
    await db.update(sessions).set({ endedAt: new Date().toISOString() }).where(eq(sessions.id, id));
  }

  async getConceptsBySubject(subject: string): Promise<Concept[]> {
    return await db.select().from(concepts).where(eq(concepts.subject, subject));
  }

  async getConcept(id: number): Promise<Concept | undefined> {
    const [res] = await db.select().from(concepts).where(eq(concepts.id, id));
    return res;
  }

  async createConcept(concept: InsertConcept): Promise<Concept> {
    const [res] = await db.insert(concepts).values(concept).returning();
    return res;
  }

  async getConceptCount(): Promise<number> {
    const res = await db.select().from(concepts);
    return res.length;
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [res] = await db.insert(interactions).values({ ...interaction, createdAt: new Date().toISOString() }).returning();
    return res;
  }

  async updateInteraction(id: number, score: number, feedback: string): Promise<Interaction | undefined> {
    const [res] = await db.update(interactions).set({ score, feedback }).where(eq(interactions.id, id)).returning();
    return res;
  }

  async getSessionInteractions(sessionId: number): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.sessionId, sessionId)).orderBy(desc(interactions.createdAt));
  }

  async getStudentInteractions(studentId: number): Promise<Interaction[]> {
    const studentSessions = await db.select().from(sessions).where(eq(sessions.studentId, studentId));
    if (studentSessions.length === 0) return [];
    const allInteractions: Interaction[] = [];
    for (const s of studentSessions) {
      const ints = await db.select().from(interactions).where(eq(interactions.sessionId, s.id));
      allInteractions.push(...ints);
    }
    return allInteractions;
  }

  async getMastery(studentId: number, conceptId: number): Promise<MasteryScore | undefined> {
    const [res] = await db.select().from(masteryScores)
      .where(and(eq(masteryScores.studentId, studentId), eq(masteryScores.conceptId, conceptId)));
    return res;
  }

  async upsertMastery(studentId: number, conceptId: number, score: number): Promise<MasteryScore> {
    const existing = await this.getMastery(studentId, conceptId);
    if (existing) {
      const [updated] = await db.update(masteryScores)
        .set({ score, updatedAt: new Date().toISOString() })
        .where(eq(masteryScores.id, existing.id))
        .returning();
      return updated;
    }
    const [inserted] = await db.insert(masteryScores)
      .values({ studentId, conceptId, score, updatedAt: new Date().toISOString() })
      .returning();
    return inserted;
  }

  async getStudentMastery(studentId: number): Promise<MasteryScore[]> {
    return await db.select().from(masteryScores).where(eq(masteryScores.studentId, studentId));
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }
}

export const storage = new DatabaseStorage();
