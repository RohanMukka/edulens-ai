import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedConcepts } from "./seed";
import { insertStudentSchema, insertSessionSchema } from "@shared/schema";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed concepts on startup
  await seedConcepts();

  // === Auth ===
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      const existing = await storage.getStudentByEmail(email);
      if (existing) {
        return res.json(existing);
      }
      const student = await storage.createStudent({ name, email });
      res.json(student);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const student = await storage.getStudentByEmail(email);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // === Sessions ===
  app.post("/api/sessions", async (req, res) => {
    try {
      const { studentId, subject } = req.body;
      if (!studentId || !subject) {
        return res.status(400).json({ message: "studentId and subject are required" });
      }
      const session = await storage.createSession({ studentId, subject });
      res.json(session);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(Number(req.params.id));
      if (!session) return res.status(404).json({ message: "Session not found" });
      const interactions = await storage.getSessionInteractions(session.id);
      res.json({ ...session, interactions });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/sessions/:id/end", async (req, res) => {
    try {
      await storage.endSession(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/sessions/:id/respond", async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      const { conceptId, studentResponse, question } = req.body;
      if (!conceptId || !studentResponse) {
        return res.status(400).json({ message: "conceptId and studentResponse are required" });
      }

      const concept = await storage.getConcept(conceptId);
      if (!concept) return res.status(404).json({ message: "Concept not found" });

      const session = await storage.getSession(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });

      // Create the interaction first
      const interaction = await storage.createInteraction({ sessionId, conceptId, studentResponse });

      // Score with AI
      const scoreResult = await scoreResponse(studentResponse, concept.idealExplanation, concept.name, question);

      // Update interaction with score & feedback
      const updated = await storage.updateInteraction(interaction.id, scoreResult.score, scoreResult.feedback);

      // Update mastery score (weighted average with existing)
      const existingMastery = await storage.getMastery(session.studentId, conceptId);
      const newScore = existingMastery
        ? existingMastery.score * 0.4 + scoreResult.score * 0.6
        : scoreResult.score;
      await storage.upsertMastery(session.studentId, conceptId, newScore);

      res.json({
        interaction: updated,
        score: scoreResult.score,
        gaps: scoreResult.gaps,
        strengths: scoreResult.strengths,
        feedback: scoreResult.feedback,
        mastery: newScore,
      });
    } catch (e: any) {
      console.error("Respond error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // === Concepts ===
  app.get("/api/concepts/:subject", async (req, res) => {
    try {
      const concepts = await storage.getConceptsBySubject(req.params.subject);
      res.json(concepts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/concepts/detail/:id", async (req, res) => {
    try {
      const concept = await storage.getConcept(Number(req.params.id));
      if (!concept) return res.status(404).json({ message: "Concept not found" });
      res.json(concept);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // === Student ===
  app.get("/api/students/:id/mastery", async (req, res) => {
    try {
      const mastery = await storage.getStudentMastery(Number(req.params.id));
      res.json(mastery);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/students/:id/history", async (req, res) => {
    try {
      const sessions = await storage.getStudentSessions(Number(req.params.id));
      res.json(sessions);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/students/:id/stats", async (req, res) => {
    try {
      const studentId = Number(req.params.id);
      const sessions = await storage.getStudentSessions(studentId);
      const mastery = await storage.getStudentMastery(studentId);
      const interactions = await storage.getStudentInteractions(studentId);

      const totalSessions = sessions.length;
      const totalInteractions = interactions.length;
      const avgScore = interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.score || 0), 0) / interactions.length
        : 0;
      const conceptsMastered = mastery.filter(m => m.score >= 0.7).length;
      const totalConcepts = mastery.length;
      const weakAreas = await Promise.all(mastery
        .filter(m => m.score < 0.5)
        .map(async m => {
          const concept = await storage.getConcept(m.conceptId);
          return { conceptId: m.conceptId, name: concept?.name || "Unknown", score: m.score };
        }));

      res.json({
        totalSessions,
        totalInteractions,
        avgScore,
        conceptsMastered,
        totalConcepts,
        weakAreas,
        recentSessions: sessions.slice(0, 5),
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // === AI endpoints ===
  app.post("/api/ai/score", async (req, res) => {
    try {
      const { studentResponse, idealExplanation, conceptName, question } = req.body;
      if (!studentResponse || !idealExplanation) {
        return res.status(400).json({ message: "studentResponse and idealExplanation are required" });
      }
      const result = await scoreResponse(studentResponse, idealExplanation, conceptName || "concept", question);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { conceptName, subject, studentLevel, gaps } = req.body;
      if (!conceptName) {
        return res.status(400).json({ message: "conceptName is required" });
      }
      const explanation = await generateExplanation(conceptName, subject, studentLevel, gaps);
      res.json({ explanation });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ai/question", async (req, res) => {
    try {
      const { conceptName, subject, difficulty } = req.body;
      if (!conceptName) {
        return res.status(400).json({ message: "conceptName is required" });
      }
      const question = await generateQuestion(conceptName, subject, difficulty);
      res.json({ question });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}

// AI helper functions
async function scoreResponse(studentResponse: string, idealExplanation: string, conceptName: string, question?: string) {
  // Fallback if no API key
  if (!process.env.GROQ_API_KEY) {
    return fallbackScore(studentResponse, idealExplanation);
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an educational assessment AI. Compare a student's response to the ideal explanation and score their understanding. Return ONLY valid JSON with no other text.`
        },
        {
          role: "user",
          content: `Concept: ${conceptName}\n\nIdeal explanation of concept: ${idealExplanation}\n\nQuestion asked to student: ${question || "Explain the concept."}\n\nStudent's response: ${studentResponse}\n\nScore the student's understanding from 0 to 1. Determine if they answered the specific question asked, using the ideal explanation as the source of truth. Identify knowledge gaps and strengths. Provide brief constructive feedback.\n\nReturn JSON in this exact format:\n{"score": 0.0, "gaps": ["gap1", "gap2"], "strengths": ["strength1"], "feedback": "Brief constructive feedback"}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(1, Math.max(0, parsed.score || 0)),
        gaps: parsed.gaps || [],
        strengths: parsed.strengths || [],
        feedback: parsed.feedback || "Keep practicing!",
      };
    }
    return fallbackScore(studentResponse, idealExplanation);
  } catch (err) {
    console.error("Groq scoring error:", err);
    return fallbackScore(studentResponse, idealExplanation);
  }
}

function fallbackScore(studentResponse: string, idealExplanation: string) {
  const studentWords = new Set(studentResponse.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const idealWords = new Set(idealExplanation.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  let matches = 0;
  for (const w of studentWords) {
    if (idealWords.has(w)) matches++;
  }
  const score = Math.min(1, (matches / Math.max(idealWords.size, 1)) * 1.5);
  const gaps = score < 0.5 ? ["Consider reviewing the key terms and relationships"] : [];
  const strengths = score > 0.3 ? ["Shows some understanding of the topic"] : [];
  return {
    score: Math.round(score * 100) / 100,
    gaps,
    strengths,
    feedback: score >= 0.7
      ? "Great understanding! You've captured the key concepts well."
      : score >= 0.4
        ? "Good start! Try to include more specific details and relationships between concepts."
        : "Keep studying! Focus on the core definitions and how they connect to each other.",
  };
}

async function generateExplanation(conceptName: string, subject?: string, studentLevel?: string, gaps?: string[]) {
  if (!process.env.GROQ_API_KEY) {
    return `Let me explain ${conceptName}. This is a key concept in ${subject || "this subject"} that you should understand thoroughly. Focus on the core principles and how they connect to what you already know.`;
  }

  try {
    const gapInfo = gaps?.length ? `The student has these knowledge gaps: ${gaps.join(", ")}.` : "";
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a patient, encouraging tutor. Explain concepts clearly at the appropriate level. Use analogies and examples."
        },
        {
          role: "user",
          content: `Explain "${conceptName}" (${subject || "general"}) to a ${studentLevel || "high school"} student. ${gapInfo} Keep it concise (2-3 paragraphs) and engaging.`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 400,
    });
    return completion.choices[0]?.message?.content || `${conceptName} is an important concept to understand.`;
  } catch {
    return `${conceptName} is a fundamental concept in ${subject || "this subject"}. Review the materials and try to identify the key principles.`;
  }
}

async function generateQuestion(conceptName: string, subject?: string, difficulty?: string) {
  if (!process.env.GROQ_API_KEY) {
    return `In your own words, explain the key principles of ${conceptName} and how they relate to ${subject || "this subject"}.`;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an educational question generator. Create open-ended questions that test understanding, not memorization."
        },
        {
          role: "user",
          content: `Generate one ${difficulty || "medium"} difficulty open-ended question about "${conceptName}" (${subject || "general"}). The question should require the student to explain their understanding. Return only the question, nothing else.`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 150,
    });
    return completion.choices[0]?.message?.content || `Explain the key concepts of ${conceptName}.`;
  } catch {
    return `Explain the key concepts and relationships involved in ${conceptName}.`;
  }
}
