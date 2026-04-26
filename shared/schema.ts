import { pgTable, text, integer, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  createdAt: text("created_at").notNull().default("now"),
});

export const classrooms = pgTable("classrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").notNull(),
  code: text("code").notNull().unique(),
  createdAt: text("created_at").notNull().default("now"),
});

export const classroomStudents = pgTable("classroom_students", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id").notNull(),
  studentId: integer("student_id").notNull(),
  joinedAt: text("joined_at").notNull().default("now"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  startedAt: text("started_at").notNull().default("now"),
  endedAt: text("ended_at"),
});

export const concepts = pgTable("concepts", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  prerequisites: text("prerequisites").notNull().default("[]"),
  idealExplanation: text("ideal_explanation").notNull(),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  studentResponse: text("student_response").notNull(),
  score: real("score"),
  feedback: text("feedback"),
  misconceptionType: text("misconception_type"),
  misconceptionDetail: text("misconception_detail"),
  bloomsLevel: text("blooms_level"),
  createdAt: text("created_at").notNull().default("now"),
});

export const masteryScores = pgTable("mastery_scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  score: real("score").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: text("next_review_at"),
  updatedAt: text("updated_at").notNull().default("now"),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, startedAt: true, endedAt: true });
export const insertConceptSchema = createInsertSchema(concepts).omit({ id: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true, score: true, feedback: true });
export const insertMasteryScoreSchema = createInsertSchema(masteryScores).omit({ id: true, updatedAt: true });

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export const insertClassroomSchema = createInsertSchema(classrooms).omit({ id: true, createdAt: true });
export const insertClassroomStudentSchema = createInsertSchema(classroomStudents).omit({ id: true, joinedAt: true });
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type ClassroomStudent = typeof classroomStudents.$inferSelect;
export type InsertClassroomStudent = z.infer<typeof insertClassroomStudentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Concept = typeof concepts.$inferSelect;
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type MasteryScore = typeof masteryScores.$inferSelect;
export type InsertMasteryScore = z.infer<typeof insertMasteryScoreSchema>;
