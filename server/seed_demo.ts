import { storage } from "./storage";
import { sm2 } from "./routes";
import bcrypt from "bcryptjs";

export async function seedDemoData() {
  console.log("Checking for demo data...");
  
  const demoEmail = "demo-student@edulens.ai";
  const existing = await storage.getStudentByEmail(demoEmail);
  
  if (existing) {
    console.log("Demo student already exists. Skipping demo seed.");
    return;
  }

  console.log("Creating demo student: Alex (The Power User)...");
  const hashedPassword = await bcrypt.hash("demo1234", 10);
  const student = await storage.createStudent({
    name: "Alex Thompson",
    email: demoEmail,
    password: hashedPassword,
  });

  // Subjects we want to populate
  const subjects = ["Biology", "Math", "Computer Science", "Physics"];
  
  for (const subject of subjects) {
    const concepts = await storage.getConceptsBySubject(subject);
    console.log(`Simulating progress for ${subject} (${concepts.length} concepts)...`);

    // Pick 3-5 concepts per subject to "interact" with
    const targetConcepts = concepts.slice(0, 4);
    
    for (const concept of targetConcepts) {
      // Create a session
      const session = await storage.createSession({
        studentId: student.id,
        subject: subject,
      });

      // Simulate 1-3 interactions per concept
      const numInteractions = Math.floor(Math.random() * 3) + 1;
      let currentMastery = 0;

      for (let i = 0; i < numInteractions; i++) {
        const isLast = i === numInteractions - 1;
        // Progressively better scores, but some misconceptions
        const score = isLast ? 0.85 : 0.4 + Math.random() * 0.3;
        
        const interaction = await storage.createInteraction({
          sessionId: session.id,
          conceptId: concept.id,
          studentResponse: "Simulated response for demo seeding.",
        });

        // Add some "realistic" misconceptions for lower scores
        let mcType = "NO_MISCONCEPTION";
        let mcDetail = null;
        let feedback = "Great job! You've shown progress.";

        if (score < 0.6) {
          const mcs = ["PROCESS_CONFUSION", "TERMINOLOGY_CONFUSION", "SURFACE_LEVEL"];
          mcType = mcs[Math.floor(Math.random() * mcs.length)];
          mcDetail = "The student struggled with the relationship between variables in this simulation.";
          feedback = "You're getting there, but watch out for how these two concepts connect.";
        }

        await storage.updateInteraction(interaction.id, score, feedback, mcType, mcDetail);

        // Update Mastery with SM-2
        const sm2Result = sm2(score, 2.5, 0, 0);
        currentMastery = currentMastery * 0.3 + score * 0.7;
        await storage.upsertMastery(student.id, concept.id, currentMastery, sm2Result);
      }
      
      await storage.endSession(session.id);
    }
  }

  // Create an Educator Demo too
  const teacherEmail = "teacher@edulens.ai";
  const existingTeacher = await storage.getStudentByEmail(teacherEmail);
  if (!existingTeacher) {
    console.log("Creating demo teacher...");
    await storage.createStudent({
      name: "Dr. Aris",
      email: teacherEmail,
      password: hashedPassword,
      isEducator: true,
    });
  }

  console.log("✅ Demo seeding complete!");
  console.log(`Student: ${demoEmail} / Password: demo1234`);
  console.log(`Teacher: ${teacherEmail} / Password: demo1234`);
}
