import { CONTACT_EMAIL, FORM_ENDPOINT } from "./config";

export function initContactForm() {
  const slot = document.getElementById("contact-form-slot");
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const note = document.getElementById("form-note");
  const staticNote = document.getElementById("contact-static-note");
  if (!slot || !form || !note) return;

  if (!CONTACT_EMAIL && !FORM_ENDPOINT) {
    form.remove(); // static note remains
    return;
  }
  staticNote?.remove();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const name = String(d.get("name") || "");
    const email = String(d.get("email") || "");
    const org = String(d.get("organisation") || "");
    const audience = String(d.get("audience") || "");
    const message = String(d.get("message") || "");

    if (FORM_ENDPOINT) {
      note.textContent = "Sending…";
      try {
        const r = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json",
                     Accept: "application/json" },
          body: JSON.stringify({ name, email, organisation: org,
                                 audience, message }),
        });
        note.textContent = r.ok
          ? "Message sent — thank you."
          : "Something went wrong sending the message. Please try again.";
        if (r.ok) form.reset();
      } catch {
        note.textContent = "Something went wrong sending the message. Please try again.";
      }
      return;
    }

    const subject = encodeURIComponent(
      `Walkthrough request — ${name}${org ? ` (${org})` : ""}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nOrganisation: ${org}\n` +
      `Audience: ${audience}\n\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    note.textContent = "Opening your email client…";
  });
}
