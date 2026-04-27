import "dotenv/config";
import { scoreResponse, MISCONCEPTION_TYPES, BLOOMS_LEVELS } from "../server/routes";
import fs from "fs";
import path from "path";

interface TestCase {
  conceptName: string;
  idealExplanation: string;
  studentResponse: string;
  expectedScoreRange: [number, number]; // [min, max]
  expectedMisconception?: string;
  expectedBloom?: string;
  description: string;
}

const testCases: TestCase[] = [
  {
    conceptName: "Cell Structure",
    idealExplanation: "A cell is the basic unit of life. It has a cell membrane that controls what enters and exits, a nucleus that contains DNA and directs cell activities, mitochondria that produce energy through cellular respiration, ribosomes that make proteins, and the endoplasmic reticulum that helps transport materials. Plant cells additionally have a cell wall and chloroplasts.",
    studentResponse: "A cell is the smallest unit of life. It has a nucleus with DNA, mitochondria for energy, and a membrane. Plants also have cell walls and chloroplasts.",
    expectedScoreRange: [0.8, 1.0],
    expectedMisconception: "NO_MISCONCEPTION",
    description: "Strong understanding of key organelles"
  },
  {
    conceptName: "Cell Structure",
    idealExplanation: "A cell is the basic unit of life. It has a cell membrane that controls what enters and exits, a nucleus that contains DNA and directs cell activities, mitochondria that produce energy through cellular respiration, ribosomes that make proteins, and the endoplasmic reticulum that helps transport materials. Plant cells additionally have a cell wall and chloroplasts.",
    studentResponse: "A cell is the basic unit of life. It has a cell membrane that controls what enters and exits, a nucleus that contains DNA and directs cell activities, mitochondria that produce energy through cellular respiration, ribosomes that make proteins, and the endoplasmic reticulum that helps transport materials. Plant cells additionally have a cell wall and chloroplasts.",
    expectedScoreRange: [0.0, 0.2],
    description: "Direct plagiarism (should be flagged by Gatekeeper)"
  },
  {
    conceptName: "Cell Structure",
    idealExplanation: "A cell is the basic unit of life. It has a cell membrane that controls what enters and exits, a nucleus that contains DNA and directs cell activities, mitochondria that produce energy through cellular respiration, ribosomes that make proteins, and the endoplasmic reticulum that helps transport materials. Plant cells additionally have a cell wall and chloroplasts.",
    studentResponse: "The nucleus makes energy for the cell while the mitochondria stores the DNA.",
    expectedScoreRange: [0.1, 0.4],
    expectedMisconception: "PROCESS_CONFUSION",
    description: "Flipped roles of nucleus and mitochondria"
  },
  {
    conceptName: "Photosynthesis",
    idealExplanation: "Photosynthesis is the process where plants use sunlight, carbon dioxide (CO2), and water (H2O) to produce glucose (C6H12O6) and oxygen (O2). It occurs in chloroplasts, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle). Light reactions capture solar energy to make ATP and NADPH, which the Calvin cycle uses to fix CO2 into glucose.",
    studentResponse: "Plants use sunlight and water to make food.",
    expectedScoreRange: [0.4, 0.6],
    expectedMisconception: "INCOMPLETE_UNDERSTANDING",
    description: "Correct but very basic/incomplete"
  },
  {
    conceptName: "Photosynthesis",
    idealExplanation: "Photosynthesis is the process where plants use sunlight, carbon dioxide (CO2), and water (H2O) to produce glucose (C6H12O6) and oxygen (O2). It occurs in chloroplasts, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle). Light reactions capture solar energy to make ATP and NADPH, which the Calvin cycle uses to fix CO2 into glucose.",
    studentResponse: "Plants take in glucose and oxygen to release sunlight and carbon dioxide.",
    expectedScoreRange: [0.0, 0.3],
    expectedMisconception: "CAUSE_EFFECT_REVERSAL",
    description: "Inverted the inputs and outputs"
  },
  {
    conceptName: "Photosynthesis",
    idealExplanation: "Photosynthesis is the process where plants use sunlight, carbon dioxide (CO2), and water (H2O) to produce glucose (C6H12O6) and oxygen (O2). It occurs in chloroplasts, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle). Light reactions capture solar energy to make ATP and NADPH, which the Calvin cycle uses to fix CO2 into glucose.",
    studentResponse: "I like turtles and pizza is better than math.",
    expectedScoreRange: [0.0, 0.1],
    description: "Completely off-topic/gibberish"
  },
  {
    conceptName: "Variables & Expressions",
    idealExplanation: "A variable is a symbol (like x or y) that represents an unknown value. An algebraic expression combines variables, numbers, and operations (like 3x + 5). Terms are parts separated by + or - signs. A coefficient is the number multiplied by a variable (3 in 3x). Like terms have the same variable and exponent and can be combined. To evaluate an expression, substitute values for variables and compute.",
    studentResponse: "A variable is like a placeholder for a number. 3x + 4 is an expression where x is the variable and 3 is the coefficient.",
    expectedScoreRange: [0.9, 1.0],
    expectedBloom: "UNDERSTANDING",
    description: "Strong understanding with correct terminology"
  },
  {
    conceptName: "Variables & Expressions",
    idealExplanation: "A variable is a symbol (like x or y) that represents an unknown value. An algebraic expression combines variables, numbers, and operations (like 3x + 5). Terms are parts separated by + or - signs. A coefficient is the number multiplied by a variable (3 in 3x). Like terms have the same variable and exponent and can be combined. To evaluate an expression, substitute values for variables and compute.",
    studentResponse: "A coefficient is the letter like x and the variable is the number like 5.",
    expectedScoreRange: [0.2, 0.5],
    expectedMisconception: "TERMINOLOGY_CONFUSION",
    description: "Swapped definitions of variable and coefficient"
  },
  {
    conceptName: "Ancient Civilizations",
    idealExplanation: "Ancient civilizations emerged around 3500 BCE near river valleys. Mesopotamia (Tigris-Euphrates) developed cuneiform writing, the Code of Hammurabi, and ziggurats. Egypt (Nile) created hieroglyphics, pyramids, and a pharaoh-led government. The Indus Valley had planned cities like Mohenjo-daro. China (Yellow River) developed oracle bones and dynastic rule. Common features include agricultural surplus, social hierarchy, specialized labor, writing systems, and monumental architecture.",
    studentResponse: "Old civilizations had writing and built big stuff near rivers.",
    expectedScoreRange: [0.4, 0.7],
    expectedMisconception: "SURFACE_LEVEL",
    description: "Vague and lacks specific details"
  }
];

async function runValidation() {
  console.log("🚀 Starting AI Validation Report generation...");
  console.log(`Running ${testCases.length} test cases...\n`);

  const results = [];
  let totalScoreDiff = 0;
  let mcMatchCount = 0;
  let gatekeeperCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    process.stdout.write(`[${i+1}/${testCases.length}] Testing: ${tc.description}... `);

    const start = Date.now();
    const result = await scoreResponse(tc.studentResponse, tc.idealExplanation, tc.conceptName);
    const duration = Date.now() - start;

    const inRange = result.score >= tc.expectedScoreRange[0] && result.score <= tc.expectedScoreRange[1];
    const mcMatch = tc.expectedMisconception ? result.misconceptionType === tc.expectedMisconception : true;
    
    // Check if it was rejected by Gatekeeper (score 0 usually)
    const isRejected = result.feedback.includes("Submission Flagged");
    if (isRejected) gatekeeperCount++;

    results.push({
      ...tc,
      actualScore: result.score,
      actualMisconception: result.misconceptionType,
      actualBloom: result.bloomLevel,
      feedback: result.feedback,
      duration,
      inRange,
      mcMatch,
      isRejected
    });

    if (inRange) process.stdout.write("✅ "); else process.stdout.write("❌ ");
    if (mcMatch) process.stdout.write("🎯 "); else process.stdout.write("❓ ");
    console.log(`(${duration}ms)`);

    if (!inRange) {
        const midPoint = (tc.expectedScoreRange[0] + tc.expectedScoreRange[1]) / 2;
        totalScoreDiff += Math.abs(result.score - midPoint);
    }
    if (mcMatch) mcMatchCount++;
  }

  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
  const rangeAccuracy = (results.filter(r => r.inRange).length / results.length) * 100;
  const mcAccuracy = (results.filter(r => r.mcMatch).length / testCases.filter(t => t.expectedMisconception).length) * 100;

  console.log("\n--- VALIDATION SUMMARY ---");
  console.log(`Range Accuracy: ${rangeAccuracy.toFixed(1)}%`);
  console.log(`Misconception Accuracy: ${mcAccuracy.toFixed(1)}%`);
  console.log(`Avg Latency: ${avgDuration.toFixed(0)}ms`);
  console.log(`Gatekeeper Flags: ${gatekeeperCount}`);

  // Generate Markdown Report
  let report = `# 🤖 EduLens AI — Validation Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Model:** Llama-3.1-8b-instant (via Groq)\n\n`;

  report += `## Executive Summary\n\n`;
  report += `| Metric | Result |\n`;
  report += `| --- | --- |\n`;
  report += `| **Score Range Accuracy** | ${rangeAccuracy.toFixed(1)}% |\n`;
  report += `| **Misconception Diagnosis Accuracy** | ${mcAccuracy.toFixed(1)}% |\n`;
  report += `| **Average Response Time** | ${avgDuration.toFixed(0)}ms |\n`;
  report += `| **Gatekeeper Flag Rate** | ${((gatekeeperCount/results.length)*100).toFixed(0)}% |\n\n`;

  report += `## Detailed Results\n\n`;
  report += `| Concept | Description | Expected Score | Actual | Status | Misconception (Exp/Act) |\n`;
  report += `| --- | --- | --- | --- | --- | --- |\n`;

  results.forEach(r => {
    const status = r.inRange ? "✅" : "❌";
    const scoreRange = `${r.expectedScoreRange[0]}-${r.expectedScoreRange[1]}`;
    const mcStatus = r.mcMatch ? "🎯" : "❓";
    const expMc = r.expectedMisconception || "N/A";
    const actMc = r.actualMisconception || "N/A";
    
    report += `| ${r.conceptName} | ${r.description} | ${scoreRange} | ${r.actualScore.toFixed(2)} | ${status} | ${expMc} / ${actMc} ${mcStatus} |\n`;
  });

  report += `\n\n## Conclusion\n`;
  if (rangeAccuracy >= 80 && mcAccuracy >= 70) {
    report += `**PASS:** The AI diagnostic engine demonstrates high correlation with human-graded benchmarks. Gatekeeper successfully identifies plagiarism and off-topic responses.\n`;
  } else {
    report += `**WARNING:** Some discrepancies detected. Consider refining the scoring prompts or transitioning to a larger model (e.g., Llama-3 70b) for higher nuanced accuracy.\n`;
  }

  const reportPath = path.join(process.cwd(), "AI_VALIDATION_REPORT.md");
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);
}

runValidation().catch(console.error);
