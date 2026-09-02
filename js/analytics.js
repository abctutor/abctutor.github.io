/* ==========================================================================
   PostHog analytics — loaded on every page via the <head> snippet.

   trackEvent() is a thin, safe wrapper other scripts call to record custom
   events. No personal info (parent name/email/phone, child's name) is ever
   sent — only anonymous behavior like which tutor was viewed/booked.
   ========================================================================== */

function trackEvent(name, properties) {
  if (typeof posthog !== "undefined" && posthog.capture) {
    posthog.capture(name, properties || {});
  }
}
