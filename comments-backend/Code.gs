/**
 * NOVA Agency — visitor comments (Google Sheets + Apps Script)
 *
 * - Visitors post a comment from novadz.space  → a new row appears in the "Comments" tab.
 * - New rows are NOT public: tick the "Approved" checkbox to show a comment on the site.
 * - Untick it (or delete the row) to hide it again.
 * - You get an email for every new comment, with a link to this sheet.
 *
 * Setup: see SETUP.md next to this file.
 */

const SHEET_NAME = 'Comments';
const HEADERS = ['Date', 'First name', 'Last name', 'Service', 'Comment', 'Language', 'Approved'];
const SERVICES = ['web', 'video', 'ads', 'uxui', 'events', 'other'];
const MAX_PUBLIC = 60; // newest approved comments sent to the site
// The spreadsheet's ID (from its address: /spreadsheets/d/<ID>/edit). Leave empty if this
// script was opened from the sheet itself (Extensions → Apps Script).
const SHEET_ID = '';

function book_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_() {
  const ss = book_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setColumnWidth(5, 420);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// one line, no control characters, limited length
function cleanLine_(v, max) {
  return String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// stop "=", "+", "-", "@" at the start from being read as a spreadsheet formula
function asText_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** The site reads approved comments (newest first). */
function doGet() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  const comments = rows
    .filter((r) => r[6] === true)
    .map((r) => ({
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      first: String(r[1]),
      last: String(r[2]),
      service: String(r[3]),
      comment: String(r[4]),
    }))
    .reverse()
    .slice(0, MAX_PUBLIC);
  return json_({ ok: true, comments: comments });
}

/** A visitor posts a new comment (saved as "not approved"). */
function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = e.parameter || {}; }

  if (d.website) return json_({ ok: true }); // hidden field filled → a bot, silently ignored

  const first = cleanLine_(d.first, 40);
  const last = cleanLine_(d.last, 40);
  const service = SERVICES.indexOf(d.service) >= 0 ? d.service : 'other';
  const comment = String(d.comment || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, 800);
  const lang = d.lang === 'ar' ? 'ar' : 'en';
  if (!first || !last || comment.length < 3) return json_({ ok: false, error: 'missing' });

  // simple flood guard: at most 30 new comments per minute in total
  const cache = CacheService.getScriptCache();
  const recent = Number(cache.get('recent') || 0);
  if (recent >= 30) return json_({ ok: false, error: 'busy' });
  cache.put('recent', String(recent + 1), 60);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_();
    sh.appendRow([new Date(), asText_(first), asText_(last), service, asText_(comment), lang, false]);
    sh.getRange(sh.getLastRow(), 7).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }

  try {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      'New comment on novadz.space — ' + first + ' ' + last,
      first + ' ' + last + ' (' + service + ') wrote:\n\n' + comment +
        '\n\nTick "Approved" to show it on the site:\n' + book_().getUrl()
    );
  } catch (err) { /* e-mail is optional */ }

  return json_({ ok: true });
}

/** Run once from the editor (▶ Run) to create the "Comments" tab and grant permissions. */
function setup() {
  getSheet_();
}
