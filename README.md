# Harbour Voices — Static Site

This is a clean, simple and modern static site scaffold for the Harbour Voices choir. It's designed for GitHub Pages and to load the majority of editable text/media from a public Google Sheet.

Setup
- Replace `CNAME` with your custom domain (or delete the file if not using one).
- Edit `js/content.js` and set `SHEET_ID` to your published Google Spreadsheet ID.
- For the Members page: set a SHA-256 hash in `members.html` (`MEMBERS_HASH`) of your chosen password, and set the Drive folder URL in the script.

Publishing your Google Sheet
1. Open the sheet in Google Sheets.
2. File → Publish to web → Choose the sheet and publish.
3. Note the spreadsheet ID from the URL and paste into `js/content.js` as `SHEET_ID`.

Security note
- The Members page uses client-side password checking (SHA-256 comparison) which is only an obfuscation and not secure against determined users. For real security, host members content behind authenticated storage.

Deploy
- Push this repository to GitHub and enable GitHub Pages from the repository settings (choose `gh-pages` or `main` branch + `/` root depending on your workflow).
