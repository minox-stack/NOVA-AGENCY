/**
 * NOVA Agency — visitor comments, live status and admin dashboard (Google Sheets + Apps Script)
 *
 * - Visitors post a comment from novadz.space  → a new row appears in the "Comments" tab.
 * - New rows are NOT public: approve them from the dashboard (novadz.space/admin)
 *   or tick the "Approved" checkbox in the sheet.
 * - Your status (Available / Busy) is in the "Status" tab — also switchable from the dashboard.
 * - You get an email for every new comment, with a link to the dashboard.
 * - The dashboard password is NOT in this code: Project Settings → Script properties → ADMIN_KEY.
 *
 * Setup: see SETUP.md next to this file.
 */

const SHEET_NAME = 'Comments';
const HEADERS = ['Date', 'First name', 'Last name', 'Service', 'Comment', 'Language', 'Approved', 'ID'];
const SERVICES = ['web', 'video', 'ads', 'uxui', 'events', 'other'];
const MAX_PUBLIC = 60; // newest approved comments sent to the site
const ADMIN_URL = 'https://novadz.space/admin';
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
    sh.hideColumns(8);
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

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- Live status (Available / Busy), set in the "Status" tab ---------- */
const STATUS_SHEET = 'Status';
const STATUS_CHOICES = ['Available — متاح', 'Busy — مشغول'];

function getStatusSheet_() {
  const ss = book_();
  let sh = ss.getSheetByName(STATUS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(STATUS_SHEET);
    sh.getRange('A1:A3').setValues([['Status — الحالة'], ['Note in English (optional)'], ['ملاحظة بالعربية (اختياري)']]).setFontWeight('bold');
    sh.getRange('B1').setValue(STATUS_CHOICES[0]).setFontWeight('bold')
      .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS_CHOICES, true).setAllowInvalid(false).build());
    sh.getRange('A5').setValue('Pick Available or Busy in B1 — the site updates within 2 minutes. / اختر الحالة في B1، والموقع يتحدّث خلال دقيقتين.').setFontColor('#888888');
    sh.setColumnWidth(1, 220);
    sh.setColumnWidth(2, 280);
    const b1 = sh.getRange('B1');
    sh.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextContains('Available').setBackground('#c9f2d6').setFontColor('#0b6b2e').setRanges([b1]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextContains('Busy').setBackground('#ffd3d3').setFontColor('#9b1111').setRanges([b1]).build(),
    ]);
  }
  return sh;
}

function getStatus_() {
  const v = getStatusSheet_().getRange('B1:B3').getValues();
  const raw = String(v[0][0]).toLowerCase();
  return {
    state: raw.indexOf('busy') >= 0 || raw.indexOf('مشغول') >= 0 ? 'busy' : 'available',
    note: cleanLine_(v[1][0], 80),
    noteAr: cleanLine_(v[2][0], 80),
  };
}

/** The site reads approved comments (newest first) — or only the status with ?status=1. */
function doGet(e) {
  if (e && e.parameter && e.parameter.status) return json_({ ok: true, status: getStatus_() });
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
  return json_({ ok: true, comments: comments, status: getStatus_() });
}

/** A visitor posts a new comment (saved as "not approved") — or the dashboard sends an admin action. */
function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = (e && e.parameter) || {}; }

  if (d.admin) return json_(admin_(d));

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

  withLock_(() => {
    const sh = getSheet_();
    sh.appendRow([new Date(), asText_(first), asText_(last), service, asText_(comment), lang, false, Utilities.getUuid()]);
    sh.getRange(sh.getLastRow(), 7).insertCheckboxes();
  });

  try {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      'New comment on novadz.space — ' + first + ' ' + last,
      first + ' ' + last + ' (' + service + ') wrote:\n\n' + comment +
        '\n\nPublish or delete it from your dashboard:\n' + ADMIN_URL +
        '\n\n(or tick "Approved" in the sheet: ' + book_().getUrl() + ')'
    );
  } catch (err) { /* e-mail is optional */ }

  return json_({ ok: true });
}

/* ---------- Admin dashboard (novadz.space/admin) ---------- */
const SESSION_LONG = 30 * 864e5; // "remember me": 30 days
const SESSION_SHORT = 12 * 36e5; // otherwise: 12 hours
const MAX_FAILS = 10; // wrong passwords allowed per 15 minutes

function sha_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map((b) => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}

function adminKey_() {
  return String(PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || '');
}

// sessions = { sha(token): { e: expiry ms, k: password fingerprint } } — changing ADMIN_KEY logs everyone out
function sessions_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ADMIN_SESSIONS') || '{}') || {}; } catch (err) { return {}; }
}

function saveSessions_(s) {
  PropertiesService.getScriptProperties().setProperty('ADMIN_SESSIONS', JSON.stringify(s));
}

function newToken_(key, remember) {
  const now = Date.now();
  const s = sessions_();
  const keep = Object.keys(s)
    .filter((h) => s[h] && s[h].e > now)
    .sort((a, b) => s[b].e - s[a].e)
    .slice(0, 19);
  const next = {};
  keep.forEach((h) => { next[h] = s[h]; });
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  next[sha_(token)] = { e: now + (remember ? SESSION_LONG : SESSION_SHORT), k: sha_(key).slice(0, 16) };
  saveSessions_(next);
  return token;
}

function tokenOk_(token, key) {
  if (!token) return false;
  const v = sessions_()[sha_(token)];
  return !!v && v.e > Date.now() && v.k === sha_(key).slice(0, 16);
}

function dropToken_(token) {
  const s = sessions_();
  delete s[sha_(token)];
  saveSessions_(s);
}

function admin_(d) {
  const key = adminKey_();
  if (key.length < 8) return { ok: false, error: 'nokey' };

  if (d.admin === 'login') {
    const cache = CacheService.getScriptCache();
    const fails = Number(cache.get('adminFails') || 0);
    if (fails >= MAX_FAILS) return { ok: false, error: 'locked' };
    if (sha_(d.password || '') !== sha_(key)) {
      cache.put('adminFails', String(fails + 1), 900);
      return { ok: false, error: 'wrong' };
    }
    cache.remove('adminFails');
    return withLock_(() => ({ ok: true, token: newToken_(key, d.remember === true) }));
  }

  if (!tokenOk_(d.token, key)) return { ok: false, error: 'auth' };

  switch (d.admin) {
    case 'data': return withLock_(() => ({ ok: true, comments: allComments_(), status: getStatus_() }));
    case 'approve': return withLock_(() => setApproved_(String(d.id || ''), d.value === true));
    case 'delete': return withLock_(() => deleteComment_(String(d.id || '')));
    case 'status': return withLock_(() => setStatus_(d));
    case 'logout': return withLock_(() => { dropToken_(d.token); return { ok: true }; });
    default: return { ok: false, error: 'unknown' };
  }
}

// every comment row gets a hidden ID (column H) so the dashboard can point at it safely
function ensureIds_(sh) {
  if (sh.getRange(1, 8).getValue() !== 'ID') {
    sh.getRange(1, 8).setValue('ID').setFontWeight('bold');
    sh.hideColumns(8);
  }
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const range = sh.getRange(2, 8, n, 1);
  const ids = range.getValues();
  let changed = false;
  ids.forEach((row) => { if (!row[0]) { row[0] = Utilities.getUuid(); changed = true; } });
  if (changed) range.setValues(ids);
}

function allComments_() {
  const sh = getSheet_();
  ensureIds_(sh);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 8).getValues()
    .filter((r) => String(r[1]).trim() || String(r[4]).trim())
    .map((r) => ({
      id: String(r[7]),
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      first: String(r[1]),
      last: String(r[2]),
      service: String(r[3]),
      comment: String(r[4]),
      lang: String(r[5]),
      approved: r[6] === true,
    }))
    .reverse()
    .slice(0, 300);
}

function findRow_(sh, id) {
  if (!id) return -1;
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const ids = sh.getRange(2, 8, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return -1;
}

function setApproved_(id, value) {
  const sh = getSheet_();
  const row = findRow_(sh, id);
  if (row < 0) return { ok: false, error: 'gone' };
  const cell = sh.getRange(row, 7);
  if (!cell.getDataValidation()) cell.insertCheckboxes();
  cell.setValue(value);
  return { ok: true };
}

function deleteComment_(id) {
  const sh = getSheet_();
  const row = findRow_(sh, id);
  if (row < 0) return { ok: false, error: 'gone' };
  sh.deleteRow(row);
  return { ok: true };
}

function setStatus_(d) {
  const busy = d.state === 'busy';
  getStatusSheet_().getRange('B1:B3').setValues([
    [STATUS_CHOICES[busy ? 1 : 0]],
    [asText_(cleanLine_(d.note, 80))],
    [asText_(cleanLine_(d.noteAr, 80))],
  ]);
  return { ok: true, status: getStatus_() };
}

/** Run once from the editor (▶ Run) to create the tabs, add comment IDs and grant permissions. */
function setup() {
  const sh = getSheet_();
  ensureIds_(sh);
  getStatusSheet_();
  PropertiesService.getScriptProperties().getProperty('ADMIN_KEY'); // asks for the storage permission now
}

/** One-time tidy: Comments tab first, columns fit on screen, Approved highlighted. */
function tidy() {
  const ss = book_();
  const sh = getSheet_();
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
  sh.setColumnWidth(1, 120);
  sh.setColumnWidths(2, 2, 105);
  sh.setColumnWidth(4, 80);
  sh.setColumnWidth(5, 240);
  sh.setColumnWidth(6, 70);
  sh.setColumnWidth(7, 150);
  sh.getRange('E:E').setWrap(true);
  sh.getRange(1, 1, 1, 7).setFontWeight('bold');
  sh.getRange(1, 7).setValue('✓ Approved (tick to publish)').setBackground('#25d366').setFontColor('#ffffff');
  sh.getRange('G2:G').setBackground('#e8f8ee').setHorizontalAlignment('center');
}
