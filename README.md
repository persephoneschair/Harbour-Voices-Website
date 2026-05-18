# Harbour Voices — Static Site

This is a clean, simple and modern static site scaffold for the Harbour Voices choir. It's designed for GitHub Pages and to load the majority of editable text/media from a public Google Sheet.

Setup
- Replace `CNAME` with your custom domain (or delete the file if not using one).
- Edit `js/content.js` and set `SHEET_CSV_MAP` to map sheet names to their published CSV URLs (preferred).
- For the Members page: set a SHA-256 hash in `members.html` (`MEMBERS_HASH`) of your chosen password, and set the Drive folder URL in the script.

Publishing your Google Sheet
1. Open the sheet in Google Sheets.
2. File → Publish to web → Choose the sheet and publish.
3. Publish each sheet to the web as CSV (File → Publish to web → choose sheet → publish), then copy the published CSV URL into `js/content.js` under `SHEET_CSV_MAP` (use the sheet name as the key).

Security note
- The Members page uses client-side password checking (SHA-256 comparison) which is only an obfuscation and not secure against determined users. For real security, host members content behind authenticated storage.

Deploy
- Push this repository to GitHub and enable GitHub Pages from the repository settings (choose `gh-pages` or `main` branch + `/` root depending on your workflow).
