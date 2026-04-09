import {
  type Student, type InsertStudent, students,
  type Session, type InsertSession, sessions,
  type Concept, type InsertConcept, concepts,
  type Interaction, type InsertInteraction, interactions,
  type MasteryScore, masteryScores,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  createStudent(student: InsertStudent): Student;
  getStudent(id: number): Student | undefined;
  getStudentByEmail(email: string): Student | undefined;
  createSession(session: InsertSession): Session;
  getSession(id: number): Session | undefined;
  getStudentSessions(studentId: number): Session[];
  endSession(id: number): void;
  getConceptsBySubject(subject: string): Concept[];
  getConcept(id: number): Concept | undefined;
  createConcept(concept: InsertConcept): Concept;
  getConceptCount(): number;
  createInteraction(interaction: InsertInteraction): Interaction;
  updateInteraction(id: number, score: number, feedback: string): Interaction | undefined;
  getSessionInteractions(sessionId: number): Interaction[];
  getStudentInteractions(studentId: number): Interaction[];
  getMastery(studentId: number, conceptId: number): MasteryScore | undefined;
  upsertMastery(studentId: number, conceptId: number, score: number): MasteryScore;
  getStudentMastery(studentId: number): MasteryScore[];
}

export class DatabaseStorage implements IStorage {
  createStudent(student: InsertStudent): Student {
    return db.insert(students).values({ ...student, createdAt: new Date().toISOString() }).returning().get();
  }

  getStudent(id: number): Student | undefined {
    return db.select().from(students).where(eq(students.id, id)).get();
  }

  getStudentByEmail(email: string): Student | undefined {
    return db.select().from(students).where(eq(students.email, email)).get();
  }

  createSession(session: InsertSession): Session {
    return db.insert(sessions).values({ ...session, startedAt: new Date().toISOString() }).returning().get();
  }

  getSession(id: number): Session | undefined {
    return db.select().from(sessions).where(eq(sessions.id, id)).get();
  }

  getStudentSessions(studentId: number): Session[] {
    return db.select().from(sessions).where(eq(sessions.studentId, studentId)).orderBy(desc(sessions.startedAt)).all();
  }

  endSession(id: number): void {
    db.update(sessions).set({ endedAt: new Date().toISOString() }).where(eq(sessions.id, id)).run();
  }

  getConceptsBySubject(subject: string): Concept[] {
    return db.select().from(concepts).where(eq(concepts.subject, subject)).all();
  }

  getConcept(id: number): Concept | undefined {
    return db.select().from(concepts).where(eq(concepts.id, id)).get();
  }

  createConcept(concept: InsertConcept): Concept {
    return db.insert(concepts).values(concept).returning().get();
  }

  getConceptCount(): number {
    return db.select().from(concepts).all().length;
  }

  createInteraction(interaction: InsertInteraction): Interaction {
    return db.insert(interactions).values({ ...interaction, createdAt: new Date().toISOString() }).returning().get();
  }

  updateInteraction(id: number, score: number, feedback: string): Interaction | undefined {
    return db.update(interactions).set({ score, feedback }).where(eq(interactions.id, id)).returning().get();
  }

  getSessionInteractions(sessionId: number): Interaction[] {
    return db.select().from(interactions).where(eq(interactions.sessionId, sessionId)).orderBy(desc(interactions.createdAt)).all();
  }

  getStudentInteractions(studentId: number): Interaction[] {
    const studentSessions = db.select().from(sessions).where(eq(sessions.studentId, studentId)).all();
    if (studentSessions.length === 0) return [];
    const allInteractions: Interaction[] = [];
    for (const s of studentSessions) {
      allInteractions.push(...db.select().from(interactions).where(eq(interactions.sessionId, s.id)).all());
    }
    return allInteractions;
  }

  getMastery(studentId: number, conceptId: number): MasteryScore | undefined {
    return db.select().from(masteryScores)
      .where(and(eq(masteryScores.studentId, studentId), eq(masteryScores.conceptId, conceptId)))
      .get();
  }

  upsertMastery(studentId: number, conceptId: number, score: number): MasteryScore {
    const existing = this.getMastery(studentId, conceptId);
    if (existing) {
      return db.update(masteryScores)
        .set({ score, updatedAt: new Date().toISOString() })
        .where(eq(masteryScores.id, existing.id))
        .returning().get()!;
    }
    return db.insert(masteryScores)
      .values({ studentId, conceptId, score, updatedAt: new Date().toISOString() })
      .returning().get();
  }

  getStudentMastery(studentId: number): MasteryScore[] {
    return db.select().from(masteryScores).where(eq(masteryScores.studentId, studentId)).all();
  }
}

export const storage = new DatabaseStorage();
