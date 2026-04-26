<div align="center">

# 🔍 EduLens AI

### The Adaptive Learning Companion That Reads How You Think

[![Nira Hackathon 2026](https://img.shields.io/badge/Nira_Hackathon-2026-6366f1?style=for-the-badge)](https://nira-hackathon.devpost.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5-000?style=flat-square&logo=express)](https://expressjs.com)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-f55036?style=flat-square)](https://groq.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169e1?style=flat-square&logo=postgresql)](https://www.postgresql.org)

**An AI-powered adaptive learning platform that analyzes free-text student responses — not multiple choice — to understand how a student thinks, identify knowledge gaps, and create personalized learning paths in real time.**

[🚀 Live Demo](#) · [📹 Demo Video](#) · [⚙️ Getting Started](#getting-started)

</div>

---

## 📌 The Problem

Education technology has a fundamental flaw: it measures what students *click*, not what they *understand*.

| Statistic | Source |
|-----------|--------|
| 1-on-1 tutoring improves outcomes by **2 standard deviations** | [Bloom's 2-Sigma Problem](https://en.wikipedia.org/wiki/Bloom%27s_2_sigma_problem) |
| **258 million** children lack access to quality education | [UNESCO 2023](https://www.unesco.org/gem-report/en) |
| Average student-to-teacher ratio is **1:23** across OECD countries | [OECD Education at a Glance](https://www.oecd.org/education/) |
| Only **10%** of students in developing countries have access to personalized learning | World Bank |

When a student picks the wrong answer on a multiple-choice quiz, the platform knows they got it wrong — but has no idea **why** they're confused. Neither does the student.

**EduLens fixes this.**

---

## 💡 Our Solution

EduLens AI closes the gap between mass education and personalized tutoring by replacing multiple-choice quizzes with **free-text explanations** analyzed by a large language model.

Instead of asking:
> *"What is the powerhouse of the cell? (A) Nucleus (B) Mitochondria (C) Ribosome"*

EduLens asks:
> *"In your own words, explain what mitochondria do and why they matter to the cell."*

Then our AI reads the response to understand:

- ✅ **What the student understands** — strengths identified from semantic analysis
- ⚠️ **What they're missing** — specific knowledge gaps detected
- 📊 **How well they understand it** — 0–100% mastery score
- 🎯 **What to do next** — adaptive path that re-teaches gaps or advances to new concepts

> **EduLens reads HOW a student thinks, not just WHAT they click.**

---

## ✨ Key Features

### 🎓 Pedagogical Design
| Feature | Description |
|---------|-------------|
| **Teach-First Flow** | Every concept starts with a Mini-Lesson before assessment — students learn *before* being tested, not after |
| **Scaffolded Retries** | Low scores trigger simpler follow-up questions, not repetition — building understanding step by step |
| **Adaptive Difficulty** | The system tracks mastery and adjusts question difficulty dynamically (easy / medium / hard) |
| **AI Explanations** | Students can request a personalized re-explanation targeting their specific knowledge gaps |

### 🔒 Security & Architecture
| Feature | Description |
|---------|-------------|
| **Session Authentication** | `express-session` with HTTP-only cookies — no tokens stored in `localStorage` |
| **bcrypt Password Hashing** | All passwords hashed with bcrypt (cost factor 12) — plaintext never stored or returned |
| **API Authorization Middleware** | `requireAuth`, `requireStudentOrEducator`, `requireEducator` guards on every sensitive endpoint |
| **Cross-User Data Isolation** | Students can only access their own data; educators only see enrolled students |
| **AI Input Sanitization** | Student responses wrapped in `<student_answer>` tags to prevent prompt injection |

### 🏫 Multi-Tenancy Classroom Model
| Feature | Description |
|---------|-------------|
| **Classroom Creation** | Educators create named classrooms with auto-generated 6-character join codes |
| **Student Enrollment** | Students join via code — immediately appear on the educator's roster |
| **Isolated Rosters** | Teacher dashboards only show students from *their* classrooms, never the entire user base |
| **Real-Time Analytics** | Educators see avg score, interactions, and mastered concepts per enrolled student |

### 🤖 AI Reliability (Hardened)
| Feature | Description |
|---------|-------------|
| **Zod Schema Validation** | All AI JSON responses validated with strict Zod schemas — hallucinated fields are rejected |
| **Relevance Pre-Check** | A lightweight classifier runs *before* scoring to detect off-topic or gibberish answers |
| **Graceful Fallbacks** | Every AI call has a keyword-overlap fallback if Groq is unavailable |
| **Dynamic Concept Generation** | Any topic can be turned into a structured concept with AI-generated lesson + question |

### 📊 Student Experience
| Feature | Description |
|---------|-------------|
| **Knowledge Graph** | Interactive React Flow visualization of concept dependencies and mastery levels |
| **Progress Dashboard** | SVG progress ring, per-subject breakdowns, radar chart, concept bar chart |
| **Gamification** | Trophy case with 6 achievement badges (locked/unlocked states) |
| **Subject Selection** | Biology, Math, History — plus AI-generated custom topics on the fly |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                   │
│  Landing → Auth → Subject Selection → Learning Interface         │
│  Dashboard → Knowledge Graph → Teacher Dashboard                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP + Session Cookie
┌────────────────────▼────────────────────────────────────────────┐
│                      SERVER (Express 5 + TypeScript)            │
│                                                                  │
│  /api/auth/*      Session auth + bcrypt                         │
│  /api/sessions/*  requireAuth middleware                        │
│  /api/students/*  requireStudentOrEducator middleware           │
│  /api/teacher/*   requireEducator middleware                    │
│  /api/classrooms/* requireAuth / requireEducator               │
│  /api/ai/*        Groq → Zod validation → fallback             │
└────────────┬────────────────────┬───────────────────────────────┘
             │                    │
┌────────────▼──────┐  ┌──────────▼─────────────────────────────┐
│  PostgreSQL (Neon)│  │  Groq (Llama 3.1-8b-instant)           │
│  Drizzle ORM      │  │  • scoreResponse (+ relevance pre-check)│
│                   │  │  • generateQuestion (adaptive diff.)    │
│  students         │  │  • generateExplanation (gap-targeted)   │
│  sessions         │  │  • generateDynamicConcept (Zod-parsed)  │
│  concepts         │  └────────────────────────────────────────┘
│  interactions     │
│  mastery_scores   │
│  classrooms       │
│  classroom_students│
└───────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Routing** | Wouter |
| **State / Data Fetching** | TanStack Query v5 |
| **Charts** | Recharts, React Flow (knowledge graph) |
| **Backend** | Express 5, TypeScript, tsx |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Authentication** | express-session, bcryptjs |
| **AI / LLM** | Groq SDK (Llama 3.1-8b-instant) |
| **Validation** | Zod (API + AI output schemas) |
| **Deployment** | Render.com |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Groq API key](https://console.groq.com) (free)

### 1. Clone & Install

```bash
git clone https://github.com/RohanMukka/edulens-ai.git
cd edulens-ai
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://user:password@host/dbname
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=your-long-random-secret-string
NODE_ENV=development
```

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## 👥 Roles & Demo Access

| Role | How to Register | Access |
|------|----------------|--------|
| **Student** | Select "Student" on signup | Learning interface, dashboard, knowledge graph |
| **Educator** | Select "Educator" + enter access code | Teacher dashboard, classroom management, student analytics |

> 📝 Contact the project admin for the educator access code.

---

## 📐 Database Schema

```
students            classrooms           classroom_students
├── id              ├── id               ├── id
├── name            ├── name             ├── classroomId
├── email (unique)  ├── teacherId        ├── studentId
├── password (hash) ├── code (unique)    └── joinedAt
├── role            └── createdAt
└── createdAt

sessions            interactions         mastery_scores      concepts
├── id              ├── id               ├── id              ├── id
├── studentId       ├── sessionId        ├── studentId       ├── subject
├── subject         ├── conceptId        ├── conceptId       ├── name
├── startedAt       ├── studentResponse  ├── score           ├── description
└── endedAt         ├── score            └── updatedAt       ├── idealExplanation
                    ├── feedback                             └── prerequisites
                    └── createdAt
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM inference |
| `SESSION_SECRET` | ✅ | Secret for signing session cookies |
| `NODE_ENV` | Optional | `development` or `production` |
| `PORT` | Optional | Server port (default: 5000) |

---

## 🎯 Hackathon Alignment

**Theme: Transforming the Future of Education**

| Criterion | EduLens Response |
|-----------|-----------------|
| **Improving access to learning** | Democratizes 1-on-1 tutoring at scale — any student, any topic, instant personalized feedback |
| **Enhancing classroom experiences** | Multi-tenant classrooms with real-time educator analytics |
| **Engaging & inclusive** | Free-text over multiple-choice reduces test anxiety; gamified badges encourage persistence |
| **AI-powered** | Groq LLM for scoring, explanation generation, question generation, and dynamic concept creation |
| **Creativity** | Knowledge graph visualization, adaptive difficulty, teach-first pedagogy |

---

## 📁 Project Structure

```
edulens-ai/
├── client/                  # React frontend
│   └── src/
│       ├── pages/
│       │   ├── landing.tsx          # Redesigned hero + auth
│       │   ├── subject-selection.tsx # Subjects + classroom join
│       │   ├── learning-interface.tsx # Adaptive learning loop
│       │   ├── dashboard.tsx        # Student analytics
│       │   ├── knowledge-graph.tsx  # React Flow graph
│       │   └── teacher-dashboard.tsx # Educator view
│       └── lib/
│           ├── auth.tsx             # Session-based auth context
│           └── queryClient.ts       # API client + error handling
├── server/
│   ├── routes.ts            # All API endpoints + middleware
│   ├── storage.ts           # Drizzle ORM queries
│   ├── seed.ts              # Initial concept seeding
│   └── index.ts             # Express app entry
└── shared/
    └── schema.ts            # Drizzle + Zod schemas (shared)
```

---

<div align="center">

Built with ❤️ for the **Nira Hackathon 2026 · Transforming the Future of Education**

*Powered by React · Express · Groq · PostgreSQL · Drizzle ORM*

</div>
