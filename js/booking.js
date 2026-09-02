/* ==========================================================================
   Booking engine — turns each tutor's recurring weekly pattern into real
   upcoming dated slots, hides any slot that's already booked, and handles
   the whole "pick a time → fill a short form → get confirmed" flow.

   Storage: everything lives in this browser's localStorage under
   ABCTUTOR_BOOKINGS_KEY. There is no server, so this prevents double-
   booking within this browser/device, but NOT across two different
   parents on two different devices — see README for why, and what it
   would take to close that gap.
   ========================================================================== */

const ABCTUTOR_BOOKINGS_KEY = "abctutor_bookings_v1";
const NUM_DAYS_AHEAD = 14;
const MAX_SLOTS_SHOWN = 8;

let selectedSlot = null; // { tutor, dateStr, dayLabel, time, subject }

/* ---------------- storage ---------------- */

function getBookings() {
  try {
    const raw = localStorage.getItem(ABCTUTOR_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not read bookings from localStorage:", err);
    return [];
  }
}

function saveBooking(record) {
  const bookings = getBookings();
  bookings.push(record);
  localStorage.setItem(ABCTUTOR_BOOKINGS_KEY, JSON.stringify(bookings));
}

function slotKey(tutorId, dateStr, time) {
  return `${tutorId}__${dateStr}__${time}`;
}

function isSlotBooked(tutorId, dateStr, time) {
  const bookings = getBookings();
  const key = slotKey(tutorId, dateStr, time);
  return bookings.some((b) => slotKey(b.tutorId, b.date, b.time) === key);
}

/* ---------------- slot generation ---------------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateStr(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dayLabelFor(date) {
  const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
  const monthName = date.toLocaleDateString(undefined, { month: "short" });
  return `${dayName}, ${monthName} ${date.getDate()}`;
}

function parseTimeLabelToMinutes(timeLabel) {
  const match = timeLabel.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let [, h, m, ampm] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
  if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function generateSlotsForTutor(tutor) {
  const slots = [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 0; d < NUM_DAYS_AHEAD; d++) {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() + d);
    const dow = date.getDay();
    const dateStr = toDateStr(date);
    const isToday = d === 0;

    tutor.weeklyPattern
      .filter((p) => p.dayOfWeek === dow)
      .forEach((p) => {
        if (isToday) {
          const slotMinutes = parseTimeLabelToMinutes(p.time);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          if (slotMinutes <= nowMinutes) return; // skip times already past today
        }
        slots.push({
          tutorId: tutor.id,
          date: dateStr,
          dayLabel: dayLabelFor(date),
          time: p.time,
          sortKey: d * 10000 + parseTimeLabelToMinutes(p.time)
        });
      });
  }

  slots.sort((a, b) => a.sortKey - b.sortKey);
  return slots;
}

function getAvailableSlotsForTutor(tutor) {
  return generateSlotsForTutor(tutor).filter(
    (s) => !isSlotBooked(tutor.id, s.date, s.time)
  );
}

/* ---------------- rendering: tutor grid ---------------- */

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function populateFilterOptions() {
  const subjectSel = document.getElementById("filterSubject");
  const gradeSel = document.getElementById("filterGrade");
  if (!subjectSel || !gradeSel) return;

  const subjects = new Set();
  const grades = new Set();
  TUTORS.forEach((t) => {
    t.subjects.forEach((s) => subjects.add(s));
    t.gradeLevels.forEach((g) => grades.add(g));
  });

  [...subjects].sort().forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subjectSel.appendChild(opt);
  });
  [...grades].forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    gradeSel.appendChild(opt);
  });
}

function renderTutorGrid() {
  const grid = document.getElementById("tutorGrid");
  const empty = document.getElementById("noResults");
  if (!grid) return;

  const subjectFilter = document.getElementById("filterSubject")?.value || "";
  const gradeFilter = document.getElementById("filterGrade")?.value || "";

  const filtered = TUTORS.filter((t) => {
    const subjectOk = !subjectFilter || t.subjects.includes(subjectFilter);
    const gradeOk = !gradeFilter || t.gradeLevels.includes(gradeFilter);
    return subjectOk && gradeOk;
  });

  grid.innerHTML = "";
  if (empty) empty.hidden = filtered.length !== 0;

  filtered.forEach((tutor) => {
    grid.appendChild(buildTutorCard(tutor));
  });
}

function buildTutorCard(tutor) {
  const available = getAvailableSlotsForTutor(tutor);
  const shown = available.slice(0, MAX_SLOTS_SHOWN);
  const remaining = available.length - shown.length;

  const card = document.createElement("article");
  card.className = "tutor-card";

  const head = document.createElement("div");
  head.className = "tutor-head";
  head.innerHTML = `
    <div class="avatar" style="background:${tutor.avatarColor}">${initials(tutor.name)}</div>
    <div>
      <h3>${tutor.name}</h3>
      <div class="tutor-rate">$${tutor.hourlyRate}/hr</div>
    </div>
  `;

  const subjectTags = document.createElement("div");
  subjectTags.className = "tag-list";
  subjectTags.innerHTML = tutor.subjects.map((s) => `<span class="tag">${s}</span>`).join("");

  const gradeTags = document.createElement("div");
  gradeTags.className = "tag-list";
  gradeTags.innerHTML = tutor.gradeLevels.map((g) => `<span class="tag grade">${g}</span>`).join("");

  const bio = document.createElement("p");
  bio.className = "tutor-bio";
  bio.textContent = tutor.bio;

  const availSummary = document.createElement("div");
  if (available.length === 0) {
    availSummary.className = "availability-summary none";
    availSummary.textContent = "No upcoming openings right now";
  } else {
    availSummary.className = "availability-summary";
    availSummary.textContent = `${available.length} time${available.length === 1 ? "" : "s"} available in the next ${NUM_DAYS_AHEAD} days`;
  }

  const slotWrap = document.createElement("div");
  slotWrap.className = "slot-grid";
  if (shown.length === 0) {
    slotWrap.innerHTML = `<div class="no-slots">Check back soon — this tutor's calendar refills often.</div>`;
  } else {
    shown.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.innerHTML = `${slot.dayLabel}<br>${slot.time}`;
      btn.addEventListener("click", () => openBookingModal(tutor, slot));
      slotWrap.appendChild(btn);
    });
    if (remaining > 0) {
      const more = document.createElement("div");
      more.className = "no-slots";
      more.style.gridColumn = "1 / -1";
      more.textContent = `+ ${remaining} more time${remaining === 1 ? "" : "s"} available`;
      slotWrap.appendChild(more);
    }
  }

  card.append(head, subjectTags, gradeTags, bio, availSummary, slotWrap);
  return card;
}

/* ---------------- modal / booking flow ---------------- */

function openBookingModal(tutor, slot) {
  selectedSlot = { tutor, ...slot };

  document.getElementById("modalFormStep").hidden = false;
  document.getElementById("modalConfirmStep").hidden = true;

  document.getElementById("modalTutorName").textContent = tutor.name;
  document.getElementById("modalSlotInfo").textContent = `${slot.dayLabel} at ${slot.time}`;
  document.getElementById("modalRate").textContent = `$${tutor.hourlyRate}/hr`;

  const subjectSel = document.getElementById("bookingSubject");
  subjectSel.innerHTML = tutor.subjects.map((s) => `<option value="${s}">${s}</option>`).join("");

  const gradeSel = document.getElementById("bookingGrade");
  gradeSel.innerHTML = tutor.gradeLevels.map((g) => `<option value="${g}">${g}</option>`).join("");

  document.getElementById("bookingForm").reset();
  subjectSel.selectedIndex = 0;
  gradeSel.selectedIndex = 0;
  clearFormErrors();
  document.getElementById("slotTakenError").classList.remove("show");

  document.getElementById("bookingModalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeBookingModal() {
  document.getElementById("bookingModalOverlay").classList.remove("open");
  document.body.style.overflow = "";
  selectedSlot = null;
}

function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((el) => el.classList.remove("show"));
}

function validateBookingForm(data) {
  const errors = {};
  if (!data.parentName.trim()) errors.parentName = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail.trim())) {
    errors.parentEmail = "Please enter a valid email address.";
  }
  const digits = data.parentPhone.replace(/\D/g, "");
  if (digits.length < 10) errors.parentPhone = "Please enter a valid phone number.";
  if (!data.childName.trim()) errors.childName = "Please enter your child's name.";
  return errors;
}

function showFieldError(field, message) {
  const el = document.querySelector(`.form-error[data-for="${field}"]`);
  if (el) {
    el.textContent = message;
    el.classList.add("show");
  }
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  if (!selectedSlot) return;

  clearFormErrors();
  document.getElementById("slotTakenError").classList.remove("show");

  const formData = {
    parentName: document.getElementById("bookingParentName").value,
    parentEmail: document.getElementById("bookingParentEmail").value,
    parentPhone: document.getElementById("bookingParentPhone").value,
    childName: document.getElementById("bookingChildName").value,
    grade: document.getElementById("bookingGrade").value,
    subject: document.getElementById("bookingSubject").value
  };

  const errors = validateBookingForm(formData);
  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => showFieldError(field, message));
    return;
  }

  // Re-check right before saving in case this slot was booked in another
  // tab of this same browser while the form was open.
  if (isSlotBooked(selectedSlot.tutorId, selectedSlot.date, selectedSlot.time)) {
    document.getElementById("slotTakenError").classList.add("show");
    renderTutorGrid();
    return;
  }

  const submitBtn = document.getElementById("bookingSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Booking...";

  const booking = {
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tutorId: selectedSlot.tutorId,
    tutorName: selectedSlot.tutor.name,
    hourlyRate: selectedSlot.tutor.hourlyRate,
    date: selectedSlot.date,
    dayLabel: selectedSlot.dayLabel,
    time: selectedSlot.time,
    subject: formData.subject,
    grade: formData.grade,
    parentName: formData.parentName.trim(),
    parentEmail: formData.parentEmail.trim(),
    parentPhone: formData.parentPhone.trim(),
    childName: formData.childName.trim(),
    createdAt: new Date().toISOString()
  };

  saveBooking(booking);
  renderTutorGrid();
  showConfirmationStep(booking);

  submitBtn.disabled = false;
  submitBtn.textContent = "Confirm Booking";
}

async function showConfirmationStep(booking) {
  document.getElementById("modalFormStep").hidden = true;
  document.getElementById("modalConfirmStep").hidden = false;

  document.getElementById("confirmSummary").innerHTML = `
    <strong>${booking.tutorName}</strong> — ${booking.subject}<br>
    ${booking.dayLabel} at ${booking.time}<br>
    For ${booking.childName} (${booking.grade})
  `;

  const emailRow = document.getElementById("notifyEmailRow");
  const textRow = document.getElementById("notifyTextRow");
  emailRow.textContent = `📧 Sending confirmation email to ${booking.parentEmail}...`;
  textRow.textContent = `📱 Sending confirmation text to ${booking.parentPhone}...`;

  const [emailResult, textResult] = await Promise.all([
    sendConfirmationEmail(booking),
    sendConfirmationText(booking)
  ]);

  emailRow.textContent = emailResult.ok
    ? `📧 Confirmation email sent to ${booking.parentEmail}`
    : `📧 Couldn't send email confirmation — we still have your booking.`;

  textRow.textContent = textResult.ok
    ? `📱 Confirmation text sent to ${booking.parentPhone}`
    : `📱 Couldn't send text confirmation — we still have your booking.`;
}

/* ---------------- init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("tutorGrid");
  if (!grid) return; // not the tutors page

  populateFilterOptions();
  renderTutorGrid();

  document.getElementById("filterSubject")?.addEventListener("change", renderTutorGrid);
  document.getElementById("filterGrade")?.addEventListener("change", renderTutorGrid);

  document.getElementById("modalCloseBtn")?.addEventListener("click", closeBookingModal);
  document.getElementById("bookingModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "bookingModalOverlay") closeBookingModal();
  });
  document.getElementById("bookingForm")?.addEventListener("submit", handleBookingSubmit);
  document.getElementById("modalDoneBtn")?.addEventListener("click", closeBookingModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBookingModal();
  });
});
