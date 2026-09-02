# abctutor.github.io

ABC Tutor — a clean, mobile-friendly tutoring website for parents. Browse tutors, see their real availability, and book a session in a couple of minutes. No account required.

**Live site:** https://abctutor.github.io

## Pages

- `index.html` — landing page
- `tutors.html` — browse tutors, filter by subject/grade, book an open time slot
- `contact.html` — contact form + FAQ

This is a plain HTML/CSS/JS site with no build step, so it deploys to GitHub Pages as-is.

## How booking works

- Each tutor has a recurring weekly availability pattern (see `data/tutors.js`). The site turns that into real dated time slots for the next 14 days.
- When a parent books a slot, it's saved in the browser's `localStorage` and immediately removed from that tutor's list of open times — it can't be booked again from that same browser.
- Right before a booking is saved, the site double-checks the slot is still free (in case it was just booked in another tab), so two bookings can't land on the same slot from the same browser.

### Important limitation to know about

This site has **no backend and no shared database** — all booking data lives only in `localStorage`, in each visitor's own browser. That means:

- ✅ The same parent can't double-book a slot, and a slot disappears the instant it's booked, for anyone using that browser afterward.
- ⚠️ It does **not** prevent two different parents on two different computers/phones from booking the same open slot within moments of each other, since there's nothing shared between their browsers to check against.

For a small tutoring business with slots that don't fill up in seconds, this risk is low but not zero. If double-booking across everyone needs to be airtight, the fix is a small shared backend (e.g., Firebase or Supabase's free tier) that all visitors check against — that's a follow-up project, not something a static GitHub Pages site can do on its own.

## Notifications (email + text)

Booking confirmations use two services built specifically for sending from browser-side code with no backend:

- **Email:** [EmailJS](https://www.emailjs.com) (free tier)
- **Text:** [Textbelt](https://textbelt.com) (pay-per-text, no subscription)

Out of the box, both are **simulated** — the confirmation screen still shows "sent," and the details print to the browser console (F12 → Console) — so the site works immediately with zero setup. To send real emails/texts:

1. Create a free EmailJS account, set up an Email Service + Template, and fill in your IDs in `js/notifications.js` under `NOTIFY_CONFIG.emailjs`, then set `enabled: true`.
2. Buy a Textbelt API key and fill it in under `NOTIFY_CONFIG.textbelt`, then set `enabled: true`.

Real SMS providers like Twilio need a secret key that can't safely live in public front-end code — anyone could view the page source and use it. EmailJS and Textbelt are designed to be called directly from the browser with public/rate-limited keys instead.

## Editing tutors

Add, remove, or edit tutors in `data/tutors.js` — no build step, just edit and refresh. Each tutor has a `weeklyPattern` (recurring day-of-week + time openings); the site generates the actual upcoming dates from that automatically.

## Analytics (PostHog)

Every page loads PostHog (see the snippet in each `<head>`), which gives pageviews and click autocapture for free. `js/analytics.js` adds a `trackEvent()` helper that `js/booking.js` uses for four custom events — none of them include the parent's name, email, phone, or the child's name, only anonymous behavior:

- `tutor_card_viewed` — a tutor's card scrolled into view (fires once per tutor per visit)
- `tutor_slot_selected` — a time slot was clicked, opening the booking modal
- `booking_abandoned` — the modal was closed without completing a booking
- `booking_completed` — a booking was confirmed

In PostHog, build an **Insight** (Trends, event `tutor_card_viewed` or `tutor_slot_selected`, breakdown by `tutor_name`) to see which tutors get the most interest, and a **Funnel** from `tutor_slot_selected` → `booking_completed` to see how many visitors actually book vs. leave.

## Local preview

No build tools needed — just serve the folder:

```
python -m http.server 8000
```

Then open http://localhost:8000/index.html.

## Deployment

This repo is a GitHub Pages user site (`abctutor.github.io`), so anything pushed to `main` publishes automatically to https://abctutor.github.io within a minute or two.
