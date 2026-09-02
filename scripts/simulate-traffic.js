/* ==========================================================================
   Simulates realistic parent traffic against the live site so PostHog has
   real events to show — some visitors bounce, some browse and leave, some
   start a booking and abandon it, some complete one. Each "visitor" gets a
   brand-new browser context (fresh cookies/localStorage), so PostHog sees
   them as distinct anonymous people, the same as real separate visitors.

   All booking data used here is fake/synthetic (example.com emails, the
   reserved-for-fiction 555-01xx phone exchange) — nothing real is sent
   anywhere, since notifications.js ships with sending disabled by default.

   Usage:
     npm install
     npm run simulate                  # 50 visitors against the live site
     NUM_VISITORS=20 npm run simulate  # fewer visitors
     TARGET_URL=http://localhost:8000 npm run simulate   # against a local copy
   ========================================================================== */

const { chromium } = require("playwright");

const TARGET_URL = (process.env.TARGET_URL || "https://abctutor.github.io").replace(/\/$/, "");
const NUM_VISITORS = parseInt(process.env.NUM_VISITORS || "50", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "5", 10);

const TUTOR_WEIGHTS = [
  { name: "Amelia Chen", weight: 3 },
  { name: "Marcus Owusu", weight: 2 },
  { name: "Priya Nair", weight: 2 },
  { name: "Daniel Ruiz", weight: 3 },
  { name: "Grace Kim", weight: 1 },
  { name: "Victor Adeyemi", weight: 1 }
];

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Peyton", "Quinn", "Drew", "Reese"];
const LAST_NAMES = ["Smith", "Johnson", "Lee", "Garcia", "Brown", "Davis", "Martinez", "Wilson", "Clark", "Lewis"];
const CHILD_NAMES = ["Ella", "Noah", "Mia", "Liam", "Ava", "Lucas", "Zoe", "Ethan", "Grace", "Owen", "Nora", "Leo"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

function delay(minMs, maxMs) {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateVisitor(browser, visitorNum) {
  const isMobile = Math.random() < 0.3;
  const context = await browser.newContext({
    viewport: isMobile ? { width: 375, height: 812 } : { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // ~20% of visitors just land on the homepage and bounce.
    if (Math.random() < 0.2) {
      await page.goto(`${TARGET_URL}/index.html`, { waitUntil: "networkidle" });
      await delay(800, 2200);
      return "bounced_on_landing";
    }

    // The rest arrive either via the homepage or straight to the tutors page.
    // (Navigating directly rather than clicking the nav link, since that
    // link lives inside the mobile hamburger menu and isn't clickable
    // there until the menu is opened.)
    if (Math.random() < 0.5) {
      await page.goto(`${TARGET_URL}/index.html`, { waitUntil: "networkidle" });
      await delay(500, 1300);
    }
    await page.goto(`${TARGET_URL}/tutors.html`, { waitUntil: "networkidle" });

    const targetTutor = weightedPick(TUTOR_WEIGHTS);
    const card = page.locator(".tutor-card", { hasText: targetTutor.name }).first();
    if (await card.count()) {
      await card.scrollIntoViewIfNeeded();
      await delay(700, 2000);
    }

    const roll = Math.random();

    // ~40%: browse and leave without opening a booking.
    if (roll < 0.4) {
      await delay(500, 1500);
      return `browsed_only:${targetTutor.name}`;
    }

    const slotBtn = card.locator(".slot-btn").first();
    if (!(await slotBtn.count())) {
      return `no_slots_available:${targetTutor.name}`;
    }
    await slotBtn.click();
    await page.waitForSelector("#bookingModalOverlay.open", { timeout: 3000 }).catch(() => {});
    await delay(800, 2200);

    // ~35%: open the booking modal, then abandon it.
    if (roll < 0.75) {
      await page.click("#modalCloseBtn").catch(() => {});
      return `abandoned_booking:${targetTutor.name}`;
    }

    // ~25%: complete the booking with fake/synthetic contact info.
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    await page.fill("#bookingParentName", `${first} ${last}`);
    await page.fill(
      "#bookingParentEmail",
      `${first}.${last}${Math.floor(Math.random() * 999)}@example.com`.toLowerCase()
    );
    await page.fill(
      "#bookingParentPhone",
      `(${100 + Math.floor(Math.random() * 800)}) 555-01${10 + Math.floor(Math.random() * 89)}`
    );
    await page.fill("#bookingChildName", randomFrom(CHILD_NAMES));
    await page.click("#bookingSubmitBtn");
    await page.waitForSelector("#modalConfirmStep:not([hidden])", { timeout: 5000 }).catch(() => {});
    await delay(600, 1500);
    await page.click("#modalDoneBtn").catch(() => {});
    return `completed_booking:${targetTutor.name}`;
  } catch (err) {
    return `error:${err.message}`;
  } finally {
    await context.close();
  }
}

(async () => {
  console.log(`Simulating ${NUM_VISITORS} visitors against ${TARGET_URL} (concurrency ${CONCURRENCY})...\n`);
  const browser = await chromium.launch();
  const results = {};
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < NUM_VISITORS) {
      const i = nextIndex++;
      const outcome = await simulateVisitor(browser, i);
      const bucket = outcome.split(":")[0];
      results[bucket] = (results[bucket] || 0) + 1;
      console.log(`Visitor ${i + 1}/${NUM_VISITORS}: ${outcome}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  console.log("\nSummary:");
  Object.entries(results).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
})();
