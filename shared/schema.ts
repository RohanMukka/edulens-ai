import { pgTable, text, integer, real, serial, boolean } from "drizzle-orm/pg-core";
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

export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  conceptId: integer("concept_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default("now"),
});

export const earnedBadges = pgTable("earned_badges", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  badgeType: text("badge_type").notNull(),
  conceptId: integer("concept_id"),
  earnedAt: text("earned_at").notNull().default("now"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  aiStrictness: text("ai_strictness").notNull().default("standard"),
  adaptiveDeadlines: boolean("adaptive_deadlines").notNull().default(false),
  createdAt: text("created_at").notNull().default("now"),
});

export const assignmentQuestions = pgTable("assignment_questions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  question: text("question").notNull(),
  idealAnswer: text("ideal_answer").notNull(),
});

export const studentAssignments = pgTable("student_assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  assignmentId: integer("assignment_id").notNull(),
  status: text("status").notNull().default("pending"),
  score: real("score"),
  feedback: text("feedback"),
  submittedAt: text("submitted_at"),
});

export const studentAssignmentAnswers = pgTable("student_assignment_answers", {
  id: serial("id").primaryKey(),
  studentAssignmentId: integer("student_assignment_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull(),
  aiScore: real("ai_score"),
  aiFeedback: text("ai_feedback"),
});


// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, startedAt: true, endedAt: true });
export const insertConceptSchema = createInsertSchema(concepts).omit({ id: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true, score: true, feedback: true });
export const insertMasteryScoreSchema = createInsertSchema(masteryScores).omit({ id: true, updatedAt: true });
export const insertReflectionSchema = createInsertSchema(reflections).omit({ id: true, createdAt: true });
export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({ id: true, earnedAt: true });

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertAssignmentQuestionSchema = createInsertSchema(assignmentQuestions).omit({ id: true });
export const insertStudentAssignmentSchema = createInsertSchema(studentAssignments).omit({ id: true, submittedAt: true });
export const insertStudentAssignmentAnswerSchema = createInsertSchema(studentAssignmentAnswers).omit({ id: true });


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
export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type EarnedBadge = typeof earnedBadges.$inferSelect;
export type InsertEarnedBadge = z.infer<typeof insertEarnedBadgeSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentQuestion = typeof assignmentQuestions.$inferSelect;
export type InsertAssignmentQuestion = z.infer<typeof insertAssignmentQuestionSchema>;
export type StudentAssignment = typeof studentAssignments.$inferSelect;
export type InsertStudentAssignment = z.infer<typeof insertStudentAssignmentSchema>;
export type StudentAssignmentAnswer = typeof studentAssignmentAnswers.$inferSelect;
export type InsertStudentAssignmentAnswer = z.infer<typeof insertStudentAssignmentAnswerSchema>;

