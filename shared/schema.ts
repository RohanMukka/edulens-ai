import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull().default("now"),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  startedAt: text("started_at").notNull().default("now"),
  endedAt: text("ended_at"),
});

export const concepts = sqliteTable("concepts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subject: text("subject").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  prerequisites: text("prerequisites").notNull().default("[]"),
  idealExplanation: text("ideal_explanation").notNull(),
});

export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  studentResponse: text("student_response").notNull(),
  score: real("score"),
  feedback: text("feedback"),
  createdAt: text("created_at").notNull().default("now"),
});

export const masteryScores = sqliteTable("mastery_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  score: real("score").notNull().default(0),
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
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Concept = typeof concepts.$inferSelect;
export type InsertConcept = z.infer<typeof insertConceptSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type MasteryScore = typeof masteryScores.$inferSelect;
export type InsertMasteryScore = z.infer<typeof insertMasteryScoreSchema>;
