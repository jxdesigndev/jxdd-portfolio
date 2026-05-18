/* =========================================
   JX Design & Dev — Contact Page Script
   contact.js

   n8n INTEGRATION
   ===============
   This form POSTs to an n8n webhook AND saves to Supabase simultaneously.

   n8n Webhook receives this JSON payload:
   {
     "name":      "John Doe",           // string, required
     "email":     "john@example.com",    // string, required
     "subject":   "UI/UX Design",        // string (select value)
     "budget":    "$500 - $1,000",       // string (select value)
     "message":   "Tell me about...",    // string, required
     "timestamp": "2026-05-01T15:00:00.000Z",  // ISO 8601 UTC
     "source":    "jx-portfolio"         // constant identifier
   }

   n8n WORKFLOW #1 — New Contact Notification:
   ────────────────────────────────────────────
   Step 1: Webhook Trigger (POST)
   Step 2: Format WhatsApp message:
           "🔔 New Portfolio Inquiry
            Name: [name]
            Email: [email]
            Subject: [subject]
            Budget: [budget]
            Message: [message]
            Time: [timestamp]"
   Step 3: Send WhatsApp to +2349028821109
           (via WhatsApp Business API or Twilio WhatsApp node)
   Step 4: Send confirmation email to {{ $json.email }}
           From: justxaviers@icloud.com
           Subject: "Got your message — Okezie Ferdinand"
           Body: "Hey {{ $json.name }}, Thanks for reaching out!
                  I've received your message and will get back
                  to you within 24 hours on WhatsApp.
                  — Okezie Ferdinand | JX Design & Dev"
   Step 5: Update Supabase contact_submissions
           SET status = 'New', read_at = NULL
           WHERE email = {{ $json.email }}
           ORDER BY created_at DESC LIMIT 1

   n8n WORKFLOW #2 — Follow-up Reminder:
   ──────────────────────────────────────
   Trigger: Cron every hour (or Supabase webhook on update)
   Step 1: Query Supabase contact_submissions
           WHERE status = 'New'
           AND created_at < NOW() - INTERVAL '24 hours'
   Step 2: For each unread submission → send WhatsApp reminder:
           "⏰ Unread inquiry from [name] ([email])
            Submitted [timestamp] — still unread!"
   Step 3: Update status to 'Reminded'
   ========================================= */

// ──────────────────────────────────────────
// n8n Webhook URL — REPLACE WITH YOUR REAL URL
// ──────────────────────────────────────────
const N8N_WEBHOOK = 'https://arguable-exile-onset.ngrok-free.dev/webhook-test/jx-contact';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    // GSAP entrance staggers
    const tl = gsap.timeline();
    tl.fromTo('.cp-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      .fromTo('.cp-heading span', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, "-=0.2")
      .fromTo('.cp-content > div', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power2.out' }, "-=0.2");
  }

  // Form handle
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const msgBox = document.getElementById('form-msg');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic Rate Limit Check (local storage)
      const lastSubmit = localStorage.getItem('jxLastContactSubmit');
      const now = Date.now();
      if (lastSubmit && (now - parseInt(lastSubmit)) < 30000) { // 30s block
        showMessage('error', 'Please wait 30 seconds before sending another message.');
        return;
      }

      // Honeypot check for bots
      const honeypot = document.getElementById('bot-field').value;
      if (honeypot !== "") {
        // Silent error to fool bots
        return;
      }

      // Get fields
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value;
      const budget = document.getElementById('budget').value;
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        showMessage('error', 'Please fill in all required fields.');
        return;
      }

      // UX Loading state
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      btnText.textContent = 'Sending...';
      msgBox.className = 'cp-message-box'; // reset class

      // Simple Sanitization
      const sanitized = {
        name: name.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        email: email.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        subject: subject,
        budget: budget,
        message: message.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      };

      // Full payload with timestamp & source for n8n
      const timestamp = new Date().toISOString();
      const webhookPayload = {
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        budget: sanitized.budget,
        message: sanitized.message,
        timestamp: timestamp,
        source: 'jx-portfolio'
      };

      // Supabase payload (matches contact_submissions table schema)
      const supabasePayload = {
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        budget: sanitized.budget,
        message: sanitized.message,
        status: 'New'
      };

      try {
        // Fire both requests simultaneously
        const [supabaseResult, webhookResult] = await Promise.allSettled([
          // 1. Save to Supabase contact_submissions table
          window.supabaseClient
            .from('contact_submissions')
            .insert([supabasePayload]),

          // 2. POST to n8n webhook (triggers WhatsApp + email workflow)
          fetch(N8N_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          })
        ]);

        // Check Supabase result (primary — must succeed)
        if (supabaseResult.status === 'rejected' || supabaseResult.value?.error) {
          const err = supabaseResult.value?.error || supabaseResult.reason;
          throw new Error(err?.message || 'Failed to save submission');
        }

        // Log webhook result (non-blocking — don't fail the form if webhook is down)
        if (webhookResult.status === 'rejected') {
          console.warn('n8n webhook failed (form still saved to Supabase):', webhookResult.reason);
        } else if (webhookResult.value && !webhookResult.value.ok) {
          console.warn('n8n webhook returned non-OK status:', webhookResult.value.status);
        }

        // Success
        localStorage.setItem('jxLastContactSubmit', now.toString());
        showMessage('success', 'Message sent! I\'ll reply on WhatsApp within 24hrs.');
        contactForm.reset();

      } catch (err) {
        console.error("Contact form error:", err);
        // Error handling fallback
        showMessage('error', 'Something went wrong. Try WhatsApp directly.');
      } finally {
        // Reset UX loading states
        submitBtn.classList.remove('is-loading');

        // Custom rate limit UX block for the button (30s)
        let countdown = 30;
        btnText.textContent = `Wait ${countdown}s`;
        const intr = setInterval(() => {
          countdown--;
          btnText.textContent = `Wait ${countdown}s`;
          if (countdown <= 0) {
            clearInterval(intr);
            submitBtn.disabled = false;
            btnText.textContent = 'Send Message →';
          }
        }, 1000);
      }
    });

    function showMessage(type, text) {
      msgBox.className = `cp-message-box ${type}`;
      msgBox.textContent = text;
    }
  }

  // Custom cursor logic for a tags inside the new page
  const interactables = document.querySelectorAll('a, button, input, select, textarea');
  interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      const cursor = document.getElementById('cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor) cursor.classList.add('hover');
      if (follower) follower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      const cursor = document.getElementById('cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor) cursor.classList.remove('hover');
      if (follower) follower.classList.remove('hover');
    });
  });
});
