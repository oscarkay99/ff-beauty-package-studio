# Chat backend setup (Google Apps Script + Groq)

This turns the site's chat widget into a real LLM chatbot without needing any server you have to host. It runs on Google's infrastructure, for free, inside your own Google account.

## What you need first

A Groq API key: go to https://console.groq.com, sign up, and create an API key under **API Keys**. Groq's free tier is enough for a site chat widget. Keep this key private, never put it in the website's HTML/JS.

## Steps (about 5 minutes)

1. **Create a Google Sheet.** Go to https://sheets.new. Name it something like "FF Beauty Chat Log".

2. **Open the script editor.** In the Sheet, go to **Extensions > Apps Script**. This opens a new tab with an empty project, already linked to that Sheet.

3. **Paste the code.** Delete whatever is in the default `Code.gs` file and paste in the full contents of [`Code.gs`](./Code.gs) from this folder. Save (Ctrl/Cmd+S).

4. **Add your Groq key as a Script Property** (this keeps it out of the code entirely):
   - Click the gear icon (**Project Settings**) in the left sidebar.
   - Scroll to **Script Properties** > **Add script property**.
   - Property: `GROQ_API_KEY`, Value: your actual Groq key. Save.

5. **Deploy as a Web App:**
   - Click **Deploy > New deployment**.
   - Click the gear next to "Select type" and choose **Web app**.
   - Description: anything, e.g. "chat proxy v1".
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**. The first time, Google will ask you to authorize the script, since it calls an external API (Groq) and writes to the Sheet. Approve it, it's your own script running under your own account.
   - Copy the **Web app URL** it gives you (ends in `/exec`).

6. **Send me that URL.** I'll drop it into `js/main.js` in place of the placeholder and redeploy the site.

## Updating the code later

If you ever want to tweak the chatbot's answers or behavior, edit `SYSTEM_PROMPT` at the top of `Code.gs`, both here and in the actual Apps Script project (Extensions > Apps Script from the Sheet), then **Deploy > Manage deployments > edit (pencil) > New version > Deploy**. The Web app URL stays the same across versions, so nothing on the website needs to change.

## What gets logged

Every chat exchange is appended as a row (timestamp, user message, bot reply) to a "Chat Log" tab in the Sheet, created automatically on first use. This is your only real "backend" data store, useful for seeing what people are actually asking.
