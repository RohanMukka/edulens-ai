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
  // Computer Science
  {
    subject: "Computer Science",
    name: "Variables & Data Types",
    description: "The fundamental building blocks of programming — how computers store and categorize different kinds of information.",
    prerequisites: "[]",
    idealExplanation: "A variable is a named container that stores data in memory. Data types define what kind of data a variable holds: integers (whole numbers), floats (decimals), strings (text), booleans (true/false). Strongly typed languages (Java, TypeScript) require declaring types; dynamically typed languages (Python, JavaScript) infer them. Type matters because it determines what operations are valid — you can add numbers but not divide strings."
  },
  {
    subject: "Computer Science",
    name: "Control Flow",
    description: "How programs make decisions and repeat actions using conditionals and loops.",
    prerequisites: JSON.stringify(["Variables & Data Types"]),
    idealExplanation: "Control flow determines the order statements execute. Conditionals (if/else, switch) let programs make decisions based on boolean expressions. Loops (for, while, do-while) repeat code blocks. A for loop runs a set number of times; a while loop runs until a condition is false. Break exits a loop early; continue skips to the next iteration. Nested loops create O(n²) behavior. Without control flow, programs would only execute linearly."
  },
  {
    subject: "Computer Science",
    name: "Functions & Scope",
    description: "Reusable blocks of code that accept inputs, perform operations, and return outputs.",
    prerequisites: JSON.stringify(["Control Flow"]),
    idealExplanation: "A function is a reusable code block that takes parameters (inputs), executes logic, and returns a value. Functions enable DRY (Don't Repeat Yourself) principle and modularity. Scope determines variable visibility: local variables exist only inside their function; global variables are accessible everywhere. Closures capture variables from their surrounding scope. Recursion is when a function calls itself, requiring a base case to prevent infinite loops."
  },
  {
    subject: "Computer Science",
    name: "Arrays & Data Structures",
    description: "Organized ways to store and access collections of data efficiently.",
    prerequisites: JSON.stringify(["Variables & Data Types"]),
    idealExplanation: "An array is an ordered, indexed collection of elements (0-indexed). Arrays offer O(1) access by index but O(n) insertion/deletion. Linked lists use nodes with pointers, offering O(1) insertion but O(n) access. Stacks are LIFO (Last In, First Out) — like a stack of plates. Queues are FIFO (First In, First Out) — like a line. Hash maps store key-value pairs with O(1) average lookup. Choosing the right data structure depends on the access pattern needed."
  },
  {
    subject: "Computer Science",
    name: "Algorithms & Big O",
    description: "Step-by-step procedures for solving problems, and how to measure their efficiency.",
    prerequisites: JSON.stringify(["Functions & Scope", "Arrays & Data Structures"]),
    idealExplanation: "An algorithm is a step-by-step procedure to solve a problem. Big O notation measures worst-case time complexity: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic. Binary search is O(log n) on sorted data. Bubble sort is O(n²); merge sort is O(n log n). Space complexity measures memory usage. The best algorithm balances time and space efficiency for the given constraints."
  },
  // Physics
  {
    subject: "Physics",
    name: "Motion & Kinematics",
    description: "The study of how objects move — displacement, velocity, and acceleration without considering forces.",
    prerequisites: "[]",
    idealExplanation: "Kinematics describes motion using displacement (change in position, a vector), velocity (rate of displacement change), and acceleration (rate of velocity change). Key equations: v = v₀ + at, x = x₀ + v₀t + ½at², v² = v₀² + 2a(x-x₀). Velocity has direction (vector); speed does not (scalar). Free-fall acceleration near Earth is g ≈ 9.8 m/s² downward. Projectile motion combines horizontal (constant velocity) and vertical (accelerated) components independently."
  },
  {
    subject: "Physics",
    name: "Newton's Laws",
    description: "The three fundamental laws governing how forces cause motion.",
    prerequisites: JSON.stringify(["Motion & Kinematics"]),
    idealExplanation: "Newton's First Law (inertia): an object at rest stays at rest, and an object in motion stays in motion unless acted upon by a net force. Second Law: F = ma — net force equals mass times acceleration. Third Law: every action has an equal and opposite reaction. Weight is the gravitational force (W = mg). Normal force is perpendicular to a surface. Friction opposes motion (f = μN). Free-body diagrams show all forces acting on an object to solve for net force."
  },
  {
    subject: "Physics",
    name: "Energy & Work",
    description: "The capacity to do work, and how energy transforms between kinetic, potential, and thermal forms.",
    prerequisites: JSON.stringify(["Newton's Laws"]),
    idealExplanation: "Work is force times displacement in the direction of force: W = Fd·cos(θ). Kinetic energy is energy of motion: KE = ½mv². Gravitational potential energy: PE = mgh. The Work-Energy Theorem states net work equals change in kinetic energy. Conservation of energy: total energy in a closed system remains constant — it transforms between forms (kinetic ↔ potential ↔ thermal). Power is the rate of doing work: P = W/t, measured in watts."
  },
  {
    subject: "Physics",
    name: "Waves & Sound",
    description: "How energy travels through matter via oscillations — mechanical and electromagnetic waves.",
    prerequisites: JSON.stringify(["Energy & Work"]),
    idealExplanation: "A wave transfers energy without transferring matter. Transverse waves oscillate perpendicular to propagation (light); longitudinal waves oscillate parallel (sound). Key properties: wavelength (λ), frequency (f), amplitude, and speed (v = λf). Sound waves are longitudinal pressure waves requiring a medium. The Doppler effect shifts frequency when source/observer move relative to each other. Interference occurs when waves overlap: constructive (amplitudes add) or destructive (amplitudes cancel)."
  },
  {
    subject: "Physics",
    name: "Electricity & Circuits",
    description: "The flow of electric charge through conductors and the components that control it.",
    prerequisites: JSON.stringify(["Energy & Work"]),
    idealExplanation: "Electric current (I) is the flow of charge, measured in amperes. Voltage (V) is electrical potential difference — the 'push' driving current. Resistance (R) opposes current flow, measured in ohms. Ohm's Law: V = IR. Power: P = IV. Series circuits have one path (currents equal, voltages add); parallel circuits have multiple paths (voltages equal, currents add). Kirchhoff's laws: junction rule (currents in = currents out) and loop rule (voltages around a loop sum to zero)."
  },
  // Chemistry
  {
    subject: "Chemistry",
    name: "Atomic Structure",
    description: "The composition of atoms — protons, neutrons, electrons — and how they determine element properties.",
    prerequisites: "[]",
    idealExplanation: "Atoms consist of a nucleus (protons + neutrons) surrounded by electron clouds. Protons determine atomic number and element identity. Neutrons add mass; isotopes have different neutron counts. Electrons occupy energy levels (shells) and subshells (s, p, d, f). The electron configuration determines chemical behavior. Valence electrons (outermost shell) control bonding. The periodic table organizes elements by atomic number, with periods (rows) and groups (columns) reflecting electron structure."
  },
  {
    subject: "Chemistry",
    name: "Chemical Bonding",
    description: "How atoms connect to form molecules through ionic, covalent, and metallic bonds.",
    prerequisites: JSON.stringify(["Atomic Structure"]),
    idealExplanation: "Chemical bonds form when atoms seek stable electron configurations (octet rule). Ionic bonds transfer electrons between metals and nonmetals, creating charged ions held by electrostatic attraction. Covalent bonds share electrons between nonmetals — single, double, or triple bonds. Polar covalent bonds have unequal sharing due to electronegativity differences. Metallic bonds involve a sea of delocalized electrons. Bond type determines properties: ionic compounds have high melting points; covalent compounds may be gases or liquids."
  },
  {
    subject: "Chemistry",
    name: "Chemical Reactions",
    description: "Processes that rearrange atoms to form new substances, governed by conservation of mass.",
    prerequisites: JSON.stringify(["Chemical Bonding"]),
    idealExplanation: "Chemical reactions rearrange atoms — bonds break and form. The law of conservation of mass requires balanced equations (equal atoms on both sides). Reaction types: synthesis (A+B→AB), decomposition (AB→A+B), single replacement, double replacement, and combustion. Exothermic reactions release energy (negative ΔH); endothermic absorb energy (positive ΔH). Activation energy is the minimum energy needed to start a reaction. Catalysts lower activation energy without being consumed."
  },
  {
    subject: "Chemistry",
    name: "The Mole & Stoichiometry",
    description: "Counting atoms by weighing them — using Avogadro's number to connect microscopic and macroscopic scales.",
    prerequisites: JSON.stringify(["Chemical Reactions"]),
    idealExplanation: "A mole is 6.022 × 10²³ particles (Avogadro's number). Molar mass connects grams to moles (e.g., carbon = 12 g/mol). Stoichiometry uses mole ratios from balanced equations to calculate reactant/product quantities. Steps: convert grams to moles, use mole ratio, convert back. The limiting reagent is consumed first and determines maximum product. Percent yield = (actual/theoretical) × 100%. Molarity (M) = moles of solute per liter of solution."
  },
  {
    subject: "Chemistry",
    name: "Acids, Bases & pH",
    description: "Substances that donate or accept protons, and the scale that measures their strength.",
    prerequisites: JSON.stringify(["Chemical Reactions"]),
    idealExplanation: "Acids donate H⁺ ions (protons); bases accept H⁺ or donate OH⁻. The pH scale measures acidity: pH = -log[H⁺]. pH 7 is neutral, below 7 is acidic, above 7 is basic. Strong acids/bases dissociate completely; weak ones partially. Neutralization: acid + base → salt + water. Buffers resist pH changes by absorbing excess H⁺ or OH⁻. The Brønsted-Lowry definition focuses on proton transfer; Lewis definition focuses on electron pair donation/acceptance."
  },
  // Economics
  {
    subject: "Economics",
    name: "Supply & Demand",
    description: "The fundamental market forces that determine prices and quantities of goods.",
    prerequisites: "[]",
    idealExplanation: "Demand is the quantity consumers want at various prices — it slopes downward (higher price = less demanded). Supply is the quantity producers offer — it slopes upward (higher price = more supplied). Equilibrium is where supply meets demand, setting market price and quantity. Shifts occur when non-price factors change: income, tastes, technology, input costs. Price ceilings (below equilibrium) create shortages; price floors (above equilibrium) create surpluses."
  },
  {
    subject: "Economics",
    name: "Elasticity",
    description: "How sensitive quantity demanded or supplied is to changes in price or income.",
    prerequisites: JSON.stringify(["Supply & Demand"]),
    idealExplanation: "Price elasticity of demand measures responsiveness: %ΔQuantity / %ΔPrice. Elastic (>1): quantity changes more than price (luxury goods). Inelastic (<1): quantity changes less than price (necessities like insulin). Unit elastic (=1). Determinants: availability of substitutes, necessity vs. luxury, time horizon, proportion of budget. Cross-price elasticity measures how one good's demand responds to another's price change. Income elasticity distinguishes normal goods (positive) from inferior goods (negative)."
  },
  {
    subject: "Economics",
    name: "GDP & Economic Growth",
    description: "Measuring a nation's total economic output and the factors that drive long-term prosperity.",
    prerequisites: JSON.stringify(["Supply & Demand"]),
    idealExplanation: "GDP (Gross Domestic Product) is the total market value of all final goods and services produced within a country in a year. Calculated three ways: expenditure (C+I+G+NX), income, or production. Nominal GDP uses current prices; Real GDP adjusts for inflation using a base year. GDP per capita indicates living standards. Economic growth comes from increases in labor, capital, technology, and human capital. Limitations: GDP ignores inequality, unpaid work, environmental costs, and quality of life."
  },
  {
    subject: "Economics",
    name: "Inflation & Monetary Policy",
    description: "The general rise in prices and how central banks use interest rates to stabilize the economy.",
    prerequisites: JSON.stringify(["GDP & Economic Growth"]),
    idealExplanation: "Inflation is a sustained increase in the general price level, measured by CPI (Consumer Price Index). Demand-pull inflation: too much money chasing too few goods. Cost-push inflation: rising production costs. Central banks (like the Federal Reserve) use monetary policy: raising interest rates reduces borrowing and spending (contractionary), lowering rates stimulates the economy (expansionary). The Phillips Curve suggests a short-run trade-off between inflation and unemployment. Hyperinflation destroys purchasing power."
  },
  {
    subject: "Economics",
    name: "Trade & Comparative Advantage",
    description: "Why nations specialize and trade, and how it creates mutual benefit.",
    prerequisites: JSON.stringify(["Supply & Demand"]),
    idealExplanation: "Absolute advantage means producing more output with the same resources. Comparative advantage means producing at a lower opportunity cost — this drives trade. Even if one country is better at everything, both benefit by specializing in their comparative advantage and trading. Free trade increases total surplus. Tariffs (taxes on imports) protect domestic industries but raise consumer prices. Trade deficits occur when imports exceed exports. Globalization increases efficiency but can displace workers in certain industries."
  },
];

export async function seedConcepts() {
  const count = await storage.getConceptCount();
  if (count === 0) {
    console.log("Seeding concept data...");
    for (const concept of conceptData) {
      await storage.createConcept(concept);
    }
    console.log(`Seeded ${conceptData.length} concepts.`);
  } else if (count < conceptData.length) {
    // Seed only new concepts that don't exist yet
    console.log(`Found ${count} concepts, expected ${conceptData.length}. Seeding new concepts...`);
    let added = 0;
    for (const concept of conceptData) {
      const existing = await storage.getConceptByName(concept.name, concept.subject);
      if (!existing) {
        await storage.createConcept(concept);
        added++;
      }
    }
    console.log(`Added ${added} new concepts.`);
  }
}
