import { storage } from "./storage";
import type { InsertConcept } from "@shared/schema";

const conceptData: InsertConcept[] = [
  // Biology
  {
    subject: "Biology",
    name: "Cell Structure",
    description: "The fundamental building blocks of all living organisms. Cells contain organelles like the nucleus, mitochondria, and cell membrane that work together to sustain life.",
    prerequisites: "[]",
    idealExplanation: "A cell is the basic unit of life. It has a cell membrane that controls what enters and exits, a nucleus that contains DNA and directs cell activities, mitochondria that produce energy through cellular respiration, ribosomes that make proteins, and the endoplasmic reticulum that helps transport materials. Plant cells additionally have a cell wall and chloroplasts."
  },
  {
    subject: "Biology",
    name: "Photosynthesis",
    description: "The process by which plants convert light energy into chemical energy (glucose), using carbon dioxide and water.",
    prerequisites: JSON.stringify(["Cell Structure"]),
    idealExplanation: "Photosynthesis is the process where plants use sunlight, carbon dioxide (CO2), and water (H2O) to produce glucose (C6H12O6) and oxygen (O2). It occurs in chloroplasts, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle). Light reactions capture solar energy to make ATP and NADPH, which the Calvin cycle uses to fix CO2 into glucose."
  },
  {
    subject: "Biology",
    name: "Cellular Respiration",
    description: "The metabolic process by which cells break down glucose to produce ATP energy.",
    prerequisites: JSON.stringify(["Cell Structure"]),
    idealExplanation: "Cellular respiration breaks down glucose to produce ATP energy. It has three stages: glycolysis (in cytoplasm, splits glucose into pyruvate, produces 2 ATP), the Krebs cycle (in mitochondrial matrix, produces CO2 and electron carriers), and the electron transport chain (on inner mitochondrial membrane, produces most ATP ~34). The overall equation is C6H12O6 + 6O2 → 6CO2 + 6H2O + ~36-38 ATP."
  },
  {
    subject: "Biology",
    name: "DNA & Genetics",
    description: "The molecular basis of heredity — how DNA stores genetic information and how traits are passed from parents to offspring.",
    prerequisites: JSON.stringify(["Cell Structure"]),
    idealExplanation: "DNA is a double helix made of nucleotides (adenine-thymine, guanine-cytosine base pairs). Genes are segments of DNA that code for proteins. DNA replication copies DNA before cell division. Transcription converts DNA to mRNA, and translation converts mRNA to proteins at ribosomes. Mendel's laws describe how alleles (dominant/recessive) are inherited, with genotype determining phenotype."
  },
  {
    subject: "Biology",
    name: "Evolution",
    description: "The process by which populations of organisms change over generations through natural selection and genetic variation.",
    prerequisites: JSON.stringify(["DNA & Genetics"]),
    idealExplanation: "Evolution is the change in allele frequencies in a population over time. Natural selection is the main mechanism: organisms with traits better suited to their environment survive and reproduce more (survival of the fittest). Genetic variation arises from mutations, sexual reproduction, and gene flow. Evidence includes fossils, comparative anatomy, embryology, and molecular biology. Speciation occurs when populations become reproductively isolated."
  },
  // Math
  {
    subject: "Math",
    name: "Variables & Expressions",
    description: "The foundation of algebra — using symbols to represent unknown values and combining them into mathematical expressions.",
    prerequisites: "[]",
    idealExplanation: "A variable is a symbol (like x or y) that represents an unknown value. An algebraic expression combines variables, numbers, and operations (like 3x + 5). Terms are parts separated by + or - signs. A coefficient is the number multiplied by a variable (3 in 3x). Like terms have the same variable and exponent and can be combined. To evaluate an expression, substitute values for variables and compute."
  },
  {
    subject: "Math",
    name: "Linear Equations",
    description: "Equations that form straight lines when graphed, involving variables with an exponent of 1.",
    prerequisites: JSON.stringify(["Variables & Expressions"]),
    idealExplanation: "A linear equation has variables with exponent 1, forming y = mx + b (slope-intercept form). To solve, isolate the variable using inverse operations on both sides. The slope (m) is rise/run and represents rate of change. The y-intercept (b) is where the line crosses the y-axis. Two lines can be parallel (same slope), perpendicular (negative reciprocal slopes), or intersecting. Systems of linear equations can be solved by substitution, elimination, or graphing."
  },
  {
    subject: "Math",
    name: "Quadratic Equations",
    description: "Equations involving x² that form parabolas when graphed, solved by factoring, completing the square, or the quadratic formula.",
    prerequisites: JSON.stringify(["Linear Equations"]),
    idealExplanation: "A quadratic equation has the form ax² + bx + c = 0. The graph is a parabola opening up (a>0) or down (a<0). Solutions (roots) can be found by: factoring (finding two numbers that multiply to ac and add to b), the quadratic formula x = (-b ± √(b²-4ac)) / 2a, or completing the square. The discriminant (b²-4ac) determines the number of real solutions: positive = 2, zero = 1, negative = 0 real roots."
  },
  {
    subject: "Math",
    name: "Functions",
    description: "A relationship where each input has exactly one output — the foundation for understanding mathematical relationships.",
    prerequisites: JSON.stringify(["Variables & Expressions"]),
    idealExplanation: "A function maps each input (domain) to exactly one output (range). Written as f(x), where x is input and f(x) is output. The vertical line test checks if a graph represents a function. Types include linear (f(x)=mx+b), quadratic (f(x)=ax²+bx+c), exponential (f(x)=aˣ), and more. Functions can be composed f(g(x)), and inverse functions f⁻¹(x) reverse the mapping. Domain restrictions occur when division by zero or negative square roots would result."
  },
  {
    subject: "Math",
    name: "Graphing",
    description: "Visualizing mathematical relationships on the coordinate plane, including transformations and key features of graphs.",
    prerequisites: JSON.stringify(["Functions", "Linear Equations"]),
    idealExplanation: "Graphing plots mathematical relationships on the coordinate plane (x-axis, y-axis). Key features include intercepts (where graph crosses axes), domain/range, increasing/decreasing intervals, maxima/minima, and asymptotes. Transformations modify graphs: vertical/horizontal shifts (adding/subtracting), reflections (negating), and stretches/compressions (multiplying). The parent function is the simplest form, and transformations create a family of functions."
  },
  // History
  {
    subject: "History",
    name: "Ancient Civilizations",
    description: "The earliest complex societies that developed writing, agriculture, government, and cultural achievements.",
    prerequisites: "[]",
    idealExplanation: "Ancient civilizations emerged around 3500 BCE near river valleys. Mesopotamia (Tigris-Euphrates) developed cuneiform writing, the Code of Hammurabi, and ziggurats. Egypt (Nile) created hieroglyphics, pyramids, and a pharaoh-led government. The Indus Valley had planned cities like Mohenjo-daro. China (Yellow River) developed oracle bones and dynastic rule. Common features include agricultural surplus, social hierarchy, specialized labor, writing systems, and monumental architecture."
  },
  {
    subject: "History",
    name: "Classical Greece & Rome",
    description: "The civilizations that established democracy, philosophy, law, and engineering foundations of Western culture.",
    prerequisites: JSON.stringify(["Ancient Civilizations"]),
    idealExplanation: "Classical Greece (500-323 BCE) gave us democracy (Athens), philosophy (Socrates, Plato, Aristotle), theater, the Olympics, and scientific inquiry. The Hellenistic period spread Greek culture under Alexander the Great. Rome (509 BCE-476 CE) contributed republican government, codified law (Twelve Tables), engineering (aqueducts, roads, Colosseum), and the Pax Romana. Rome adopted Greek culture, creating Greco-Roman civilization. Rome's fall led to the fragmentation of Europe."
  },
  {
    subject: "History",
    name: "Medieval Period",
    description: "The era from Rome's fall to the Renaissance, characterized by feudalism, the Church's power, and cultural exchange.",
    prerequisites: JSON.stringify(["Classical Greece & Rome"]),
    idealExplanation: "The Medieval Period (476-1450 CE) was shaped by feudalism (lords, vassals, serfs), the Catholic Church's dominance, and the manorial economy. The Byzantine Empire preserved Roman culture in the East. Islam's Golden Age advanced science, mathematics, and medicine. The Crusades (1096-1291) increased East-West contact. The Magna Carta (1215) limited royal power. The Black Death (1347-1351) killed a third of Europe, disrupting feudalism and enabling social change."
  },
  {
    subject: "History",
    name: "Renaissance",
    description: "The cultural rebirth of classical learning and arts that transformed Europe from the 14th to 17th centuries.",
    prerequisites: JSON.stringify(["Medieval Period"]),
    idealExplanation: "The Renaissance (14th-17th century) was a cultural rebirth starting in Italian city-states (Florence, Venice). Humanism shifted focus from purely religious to human potential and classical learning. Key figures: Leonardo da Vinci (art/science), Michelangelo (sculpture/painting), Machiavelli (political philosophy). The printing press (Gutenberg, 1440) democratized knowledge. The Protestant Reformation (Luther, 1517) challenged Church authority. Scientific Revolution began with Copernicus, Galileo, and Newton."
  },
  {
    subject: "History",
    name: "Industrial Revolution",
    description: "The transformation from agrarian economies to industrial manufacturing that reshaped society, economics, and technology.",
    prerequisites: JSON.stringify(["Renaissance"]),
    idealExplanation: "The Industrial Revolution (1760-1840) began in Britain due to coal/iron resources, colonial markets, stable government, and agricultural improvements. Key inventions: steam engine (Watt), spinning jenny (Hargreaves), power loom. Factory system replaced cottage industry, causing urbanization. Impacts included child labor, poor working conditions, rise of the middle class, and labor movements. It spread to Europe and America, creating capitalism and eventually prompting socialism as a response to inequality."
  },
];

export function seedConcepts() {
  const count = storage.getConceptCount();
  if (count === 0) {
    console.log("Seeding concept data...");
    for (const concept of conceptData) {
      storage.createConcept(concept);
    }
    console.log(`Seeded ${conceptData.length} concepts.`);
  }
}
