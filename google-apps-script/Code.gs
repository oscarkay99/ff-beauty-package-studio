/**
 * FF Beauty Package Studio - chat proxy
 *
 * Deploy this as a Web App (see README.md in this folder for steps).
 * It holds the Groq API key server-side, forwards chat messages to
 * Groq's llama-3.3-70b-versatile model, and logs each exchange to the
 * "Chat Log" sheet in whichever Google Sheet this script is bound to.
 */

const GROQ_MODEL = 'openai/gpt-oss-120b';
const SHEET_NAME = 'Chat Log';

const SYSTEM_PROMPT = `You are the FF Beauty Assistant, a friendly, concise chat assistant for FF Beauty Package Studio, a beauty and hair salon in Columbus, Ohio.

Facts about the studio:
- Services: makeup, lashes, brows, hair extensions, color, braids, and locs & natural hair specialties (Sisterlocks, starter locs, retwists, silk press).
- Traditional wedding/ceremony package: hair, makeup, and traditional dress styling in one appointment. On-location and out-of-town appointments available.
- Hours: open every day, by appointment only.
- Location: Columbus, Ohio. Give the exact address only if asked, otherwise direct them to call.
- Phone/WhatsApp: 614-432-6449.
- Appointments are booked by phone or WhatsApp, not through the website. There is no online booking or payment on the site.
- Pricing is not listed publicly. It depends on hair length, texture, and the specific service, and is quoted at consultation.

Rules:
- Keep answers short, 2 to 4 sentences, warm, and specific to FF Beauty Package Studio.
- Never invent services, prices, or availability you do not know. If unsure, say so and point them to call or WhatsApp 614-432-6449.
- Do not mention that you are an AI language model, Groq, or any technical detail about how you work.
- Do not use em dashes.`;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const userMessage = (body.message || '').toString().trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userMessage) {
      return jsonResponse({ error: 'Empty message' });
    }

    const apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Server not configured' });
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    history.slice(-8).forEach((turn) => {
      if (turn && turn.role && turn.content) {
        messages.push({ role: turn.role, content: String(turn.content).slice(0, 1000) });
      }
    });
    messages.push({ role: 'user', content: userMessage.slice(0, 1000) });

    const response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.4,
        max_tokens: 300,
      }),
      muteHttpExceptions: true,
    });

    const status = response.getResponseCode();
    if (status !== 200) {
      Logger.log('Groq error ' + status + ': ' + response.getContentText());
      return jsonResponse({ error: 'Upstream error' });
    }

    const data = JSON.parse(response.getContentText());
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content.trim()
      : "Sorry, I couldn't get an answer. Call or WhatsApp us at 614-432-6449.";

    logToSheet(userMessage, reply);

    return jsonResponse({ reply: reply });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ error: 'Server error' });
  }
}

function doGet() {
  return jsonResponse({ status: 'ok' });
}

function logToSheet(userMessage, reply) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Timestamp', 'User Message', 'Bot Reply']);
    }
    sheet.appendRow([new Date(), userMessage, reply]);
  } catch (err) {
    Logger.log('Sheet log error: ' + err);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
