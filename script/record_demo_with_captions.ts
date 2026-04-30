import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIDEO_DIR = path.join(process.cwd(), 'videos');
async function ensureVideoDir() {
  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

async function showCaption(page: any, text: string) {
  await page.evaluate((t) => {
    let el = document.getElementById('edulens-caption-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'edulens-caption-overlay';
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '18px',
        zIndex: '999999',
        maxWidth: '80%',
        textAlign: 'center',
        lineHeight: '1.2',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function clearCaption(page: any) {
  await page.evaluate(() => {
    const el = document.getElementById('edulens-caption-overlay');
    if (el) el.textContent = '';
  });
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  await ensureVideoDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  const captions: Array<{ text: string; ms: number }> = [];

  // Scripted captions mapped to actions
  captions.push({ text: '🎙️ EduLens AI — Refined Demo', ms: 2500 });
  captions.push({ text: 'Part 1: Landing — Hero & value prop', ms: 2500 });

  // Start at landing
  await page.goto('http://localhost:5000/#/');
  await showCaption(page, captions[0].text);
  await delay(captions[0].ms);
  await showCaption(page, captions[1].text);
  await delay(captions[1].ms);
  await clearCaption(page);

  // Part 2: Student flow
  await showCaption(page, 'Part 2: Logging in as student...');
  await page.goto('http://localhost:5000/#/login');
  await delay(800);
  try {
    await page.fill('input[type="email"]', 'demo-student@edulens.ai');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
  } catch (e) {
    // fallback: try inputs by name
    try {
      await page.fill('input[name="email"]', 'demo-student@edulens.ai');
      await page.fill('input[name="password"]', 'demo1234');
      await page.click('button[type="submit"]');
    } catch {}
  }
  await showCaption(page, 'Student: opening a lesson on Photosynthesis');
  await page.goto('http://localhost:5000/#/learning-interface');
  await delay(1500);

  // Simulate typing an explanation
  await showCaption(page, 'Student: typing an explanation (incorrect)');
  try {
    // try generic textarea
    await page.fill('textarea', 'Plants use sunlight to make oxygen so that humans and animals can breathe.');
    await delay(500);
    await page.click('button:has-text("Submit")');
  } catch {
    // best-effort: press Enter to simulate
    await page.keyboard.type('Plants use sunlight to make oxygen so that humans and animals can breathe.');
    await delay(500);
  }
  await showCaption(page, 'AI feedback: Identifies incomplete understanding');
  await delay(2500);
  await clearCaption(page);

  // Part 3: Knowledge Graph & Chatbot
  await showCaption(page, 'Part 3: Knowledge Graph & EduLens Assistant');
  await page.goto('http://localhost:5000/#/knowledge-graph');
  await delay(1500);
  try {
    await page.click('[data-testid="chatbot-toggle"]');
  } catch {}
  await delay(1200);
  await clearCaption(page);

  // Part 4: Teacher Live View
  await showCaption(page, 'Part 4: Logging in as Educator');
  await page.goto('http://localhost:5000/#/logout');
  await page.goto('http://localhost:5000/#/login');
  await delay(800);
  try {
    await page.fill('input[type="email"]', 'teacher@edulens.ai');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
  } catch {}
  await delay(1200);

  await showCaption(page, 'Teacher: opening the Educator Dashboard');
  await page.goto('http://localhost:5000/#/teacher-dashboard');
  await delay(1500);

  // Try to click Go Live on a classroom card
  try {
    await page.click('button:has-text("Go Live")');
    await showCaption(page, 'Live View: real-time student feed (WebSockets)');
    await delay(2500);
  } catch {}

  await showCaption(page, 'Intervention Queue & Misconception Heatmap');
  await delay(2200);
  await clearCaption(page);

  // Part 5: Conclusion
  await page.goto('http://localhost:5000/#/');
  await showCaption(page, 'Conclusion: EduLens AI — Understands students, not just scores');
  await delay(3000);

  // Close and save video
  await context.close();
  const videos = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  console.log('Saved videos:', videos);
  if (videos.length) console.log('Primary video path:', path.join(VIDEO_DIR, videos[0]));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
