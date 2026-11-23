/**
 * UDI Webinar CTA Tracker — Google Apps Script
 *
 * SETUP
 * 1. Go to https://script.google.com → New project
 * 2. Delete any default code and paste this entire file
 * 3. Save (Ctrl/Cmd+S), name the project e.g. "UDI CTA Tracker"
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL
 * 6. Paste that URL into index.html as CTA_TRACKER_URL
 * 7. (Optional) Run sendTestEmail() once from the editor to verify mail delivery
 *
 * Emails go to damart.seo@gmail.com on every tracked CTA / WhatsApp click.
 */

var NOTIFY_EMAIL = "damart.seo@gmail.com";
var FROM_NAME = "UDI Webinar Tracker";

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: "udi-cta-tracker",
      usage: "POST JSON click payloads from the landing page"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = {};
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      data = { parseError: String(parseErr), raw: raw };
    }

    var subject = buildSubject_(data);
    var html = buildHtmlBody_(data);
    var text = buildTextBody_(data);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      htmlBody: html,
      body: text,
      name: FROM_NAME
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Manual test from the Apps Script editor */
function sendTestEmail() {
  doPost({
    postData: {
      contents: JSON.stringify({
        event: "cta_click",
        ctaType: "test",
        ctaLabel: "Manual Apps Script test",
        href: "https://example.com",
        pageUrl: "https://udiwebinar.vercel.app/",
        timestamp: new Date().toISOString(),
        attribution: {
          gclid: "test-gclid-123",
          utm_source: "google",
          utm_medium: "cpc",
          utm_campaign: "udi-webinar-test"
        },
        firstTouch: {
          gclid: "test-gclid-123",
          utm_source: "google",
          landingPage: "https://udiwebinar.vercel.app/?gclid=test"
        },
        tech: {
          userAgent: "Apps Script test runner",
          language: "en",
          timezone: Session.getScriptTimeZone()
        }
      })
    }
  });
}

function buildSubject_(data) {
  var type = (data.ctaType || "cta").toString().toUpperCase();
  var label = (data.ctaLabel || "Unknown CTA").toString();
  var src = "";
  if (data.attribution && data.attribution.gclid) src = " | gclid";
  else if (data.attribution && data.attribution.utm_source) src = " | " + data.attribution.utm_source;
  return "[UDI CTA] " + type + " — " + label + src;
}

function esc_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row_(label, value) {
  if (value == null || value === "") value = "—";
  return "<tr><td style='padding:8px 12px;border-bottom:1px solid #e6eef0;color:#5a727a;width:38%;vertical-align:top;'>" +
    esc_(label) +
    "</td><td style='padding:8px 12px;border-bottom:1px solid #e6eef0;color:#07161d;font-weight:500;word-break:break-word;'>" +
    esc_(value) +
    "</td></tr>";
}

function objectRows_(obj, prefix) {
  if (!obj || typeof obj !== "object") return row_(prefix || "Data", "");
  var keys = Object.keys(obj);
  if (!keys.length) return row_(prefix || "Data", "—");
  var html = "";
  keys.sort().forEach(function (key) {
    var val = obj[key];
    if (val && typeof val === "object") {
      html += objectRows_(val, (prefix ? prefix + "." : "") + key);
    } else {
      html += row_((prefix ? prefix + "." : "") + key, val);
    }
  });
  return html;
}

function buildHtmlBody_(data) {
  var attr = data.attribution || {};
  var first = data.firstTouch || {};
  var tech = data.tech || {};

  return "" +
    "<div style='font-family:Segoe UI,Arial,sans-serif;max-width:680px;margin:0 auto;background:#f4f8f7;padding:24px;'>" +
    "<div style='background:#07161d;color:#fff;padding:18px 20px;border-radius:4px 4px 0 0;'>" +
    "<div style='font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2ec4b6;'>UDI Webinar Tracker</div>" +
    "<h1 style='margin:8px 0 0;font-size:20px;font-weight:600;'>New CTA click</h1>" +
    "</div>" +
    "<div style='background:#fff;border:1px solid #d7e4e1;border-top:0;border-radius:0 0 4px 4px;overflow:hidden;'>" +
    "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
    row_("CTA type", data.ctaType) +
    row_("CTA label", data.ctaLabel) +
    row_("Link", data.href) +
    row_("Page URL", data.pageUrl) +
    row_("Clicked at (UTC)", data.timestamp) +
    "</table>" +
    "<div style='padding:14px 12px 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#0f6e68;font-weight:700;'>Marketing attribution (current)</div>" +
    "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
    objectRows_(attr) +
    "</table>" +
    "<div style='padding:14px 12px 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#0f6e68;font-weight:700;'>First touch</div>" +
    "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
    objectRows_(first) +
    "</table>" +
    "<div style='padding:14px 12px 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#0f6e68;font-weight:700;'>Device / context</div>" +
    "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
    objectRows_(tech) +
    "</table>" +
    "</div>" +
    "<p style='font-size:12px;color:#6e8790;margin:16px 0 0;'>Automated alert from the Understanding UDI webinar landing page.</p>" +
    "</div>";
}

function buildTextBody_(data) {
  return [
    "New CTA click",
    "CTA type: " + (data.ctaType || ""),
    "CTA label: " + (data.ctaLabel || ""),
    "Link: " + (data.href || ""),
    "Page: " + (data.pageUrl || ""),
    "Time: " + (data.timestamp || ""),
    "",
    "Attribution: " + JSON.stringify(data.attribution || {}, null, 2),
    "",
    "First touch: " + JSON.stringify(data.firstTouch || {}, null, 2),
    "",
    "Tech: " + JSON.stringify(data.tech || {}, null, 2)
  ].join("\n");
}
