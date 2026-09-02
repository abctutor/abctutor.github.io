/* ==========================================================================
   Notifications — sends the booking confirmation email + text.

   This site is 100% static (GitHub Pages) with no backend, so real SMS
   can't use something like Twilio here: Twilio needs a secret key, and any
   key placed in this file would be publicly visible to anyone who views
   the page source. Instead this uses two services built for exactly this
   client-side use case:

     - EmailJS  (email)  https://www.emailjs.com  — free tier is plenty for
       a small tutoring business. Uses a public key by design.
     - Textbelt (text)   https://textbelt.com     — pay-per-text, ~$0.01-
       0.05/text, no account/backend needed, just an API key.

   HOW TO TURN ON REAL SENDING
   ----------------------------------------------------------------------
   1. EMAIL: create a free EmailJS account, add an Email Service and a
      Template (with variables like {{to_name}}, {{tutor_name}}, etc.),
      then fill in CONFIG.emailjs below with your IDs.
   2. TEXT: buy a Textbelt key at textbelt.com, then set
      CONFIG.textbelt.apiKey below.
   3. Set the matching "enabled" flag to true.

   Until you do that, both are simulated: the confirmation screen still
   shows "sent", and the details are printed to the browser console
   (F12 → Console) so you can see exactly what would have gone out.
   ========================================================================== */

const NOTIFY_CONFIG = {
  emailjs: {
    enabled: false,
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID"
  },
  textbelt: {
    enabled: false,
    apiKey: "YOUR_TEXTBELT_API_KEY"
  }
};

function buildConfirmationMessage(booking) {
  return (
    `You're booked! ${booking.tutorName} on ${booking.dayLabel} at ${booking.time} ` +
    `(${booking.subject}). Questions? Reply to this message or use the Contact page.`
  );
}

async function sendConfirmationEmail(booking) {
  const message = buildConfirmationMessage(booking);

  if (!NOTIFY_CONFIG.emailjs.enabled) {
    console.log("[Simulated email] To:", booking.parentEmail, "\n", message);
    await wait(500);
    return { ok: true, simulated: true };
  }

  try {
    if (typeof emailjs === "undefined") {
      throw new Error("EmailJS SDK not loaded");
    }
    await emailjs.send(
      NOTIFY_CONFIG.emailjs.serviceId,
      NOTIFY_CONFIG.emailjs.templateId,
      {
        to_email: booking.parentEmail,
        to_name: booking.parentName,
        child_name: booking.childName,
        tutor_name: booking.tutorName,
        session_date: booking.dayLabel,
        session_time: booking.time,
        subject: booking.subject,
        rate: booking.hourlyRate
      },
      NOTIFY_CONFIG.emailjs.publicKey
    );
    return { ok: true, simulated: false };
  } catch (err) {
    console.error("Email send failed:", err);
    return { ok: false, simulated: false, error: err.message };
  }
}

async function sendConfirmationText(booking) {
  const message = buildConfirmationMessage(booking);

  if (!NOTIFY_CONFIG.textbelt.enabled) {
    console.log("[Simulated text] To:", booking.parentPhone, "\n", message);
    await wait(500);
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: booking.parentPhone,
        message,
        key: NOTIFY_CONFIG.textbelt.apiKey
      })
    });
    const data = await res.json();
    return { ok: !!data.success, simulated: false, error: data.error };
  } catch (err) {
    console.error("Text send failed:", err);
    return { ok: false, simulated: false, error: err.message };
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
