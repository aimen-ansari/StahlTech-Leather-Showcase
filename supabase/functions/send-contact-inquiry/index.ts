// Supabase Edge Function: send-contact-inquiry
//
// Receives a contact-form submission from the public site, stores it in
// `public.contact_inquiries`, then notifies the workshop inbox through Resend.
//
// Required secrets:
//   RESEND_API_KEY       - API key from https://resend.com/api-keys
// Optional secrets:
//   CONTACT_NOTIFY_EMAIL - recipient(s), comma separated
//                          (default: stahltechbiz@gmail.com)
//   CONTACT_FROM_EMAIL   - verified Resend sender
//                          (default: StahlTech Website <onboarding@resend.dev>)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_NOTIFY_EMAIL = "stahltechbiz@gmail.com";
const DEFAULT_FROM_EMAIL = "StahlTech Website <onboarding@resend.dev>";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  // Honeypot: bots fill hidden fields, humans do not. Pretend success so the
  // bot moves on without storing or emailing anything.
  if (cleanText(payload.website, 200)) {
    return jsonResponse({ success: true, emailSent: false });
  }

  const name = cleanText(payload.name, 120);
  const email = cleanText(payload.email, 254);
  const subject = cleanText(payload.subject, 160) || "General Support";
  const message = cleanText(payload.message, 5000);

  if (!name || !email || !message) {
    return jsonResponse({ error: "Name, email and message are required." }, 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    return jsonResponse({ error: "Please provide a valid email address." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return jsonResponse({ error: "Messaging is not configured correctly." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertError } = await admin
    .from("contact_inquiries")
    .insert({ name, email, subject, message })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to store contact inquiry:", insertError);
    return jsonResponse({ error: "Could not save your message. Please try again." }, 500);
  }

  const inquiryId = inserted?.id ?? null;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // The inquiry is safely stored even if email delivery is not configured or
  // fails. Never lose the customer's message because of an email outage.
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set; inquiry saved without email notification.");
    return jsonResponse({ success: true, emailSent: false, inquiryId });
  }

  const recipients = (Deno.env.get("CONTACT_NOTIFY_EMAIL") || DEFAULT_NOTIFY_EMAIL)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const from = Deno.env.get("CONTACT_FROM_EMAIL") || DEFAULT_FROM_EMAIL;
  const receivedAt = new Date().toISOString();
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    subject: escapeHtml(subject),
    message: escapeHtml(message),
  };

  const textBody = [
    "New inquiry from the StahlTech website",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    `Received: ${receivedAt}`,
    "",
    "Message:",
    message,
    "",
    `Inquiry ID: ${inquiryId ?? "(not returned)"}`,
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New inquiry from the StahlTech website</h2>
      <table style="border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 2px 12px 2px 0; color: #666;">Name</td><td>${safe.name}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #666;">Email</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #666;">Subject</td><td>${safe.subject}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #666;">Received</td><td>${receivedAt}</td></tr>
      </table>
      <div style="padding: 16px; border-left: 3px solid #c9a227; background: #faf8f2;">
        ${safe.message}
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #888;">Inquiry ID: ${inquiryId ?? "(not returned)"}</p>
    </div>
  `;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: email,
        subject: `New inquiry: ${subject} — ${name}`,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend rejected the email:", resendResponse.status, await resendResponse.text());
      return jsonResponse({ success: true, emailSent: false, inquiryId });
    }
  } catch (error) {
    console.error("Resend request failed:", error);
    return jsonResponse({ success: true, emailSent: false, inquiryId });
  }

  return jsonResponse({ success: true, emailSent: true, inquiryId });
});
