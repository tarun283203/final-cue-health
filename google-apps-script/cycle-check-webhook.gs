/**
 * Cuehealth Cycle Check — lead capture webhook.
 *
 * Deploy as a Web App (Extensions > Apps Script in a Google Sheet, paste this
 * file as Code.gs, then Deploy > New deployment > Web app, execute as "Me",
 * access "Anyone"). Paste the resulting /exec URL into
 * templates/page.cycle-check.liquid as CYCLE_CHECK_WEBHOOK_URL.
 *
 * Receives the same x-www-form-urlencoded POST shape the partner page's
 * webhook uses (mode: 'no-cors', body: URLSearchParams), so no CORS
 * preflight is needed.
 */

var SHEET_NAME = 'Cycle Check Leads';

var HEADERS = [
  'Timestamp',
  'Name',
  'Phone',
  'Preferred Call Time',
  'WhatsApp Only',
  'Period Type',
  'Q1 Age',
  'Q2 Cycle Pattern',
  'Q3 Cramps',
  'Q4 Mood/PMS',
  'Q5 Flow',
  'Q6 Tried Before',
  'Q7 Duration',
  'Q8 Priority',
  'Page URL'
];

function doPost(e) {
  try {
    var sheet = getOrCreateSheet_();
    var p = e.parameter;

    var answers = {};
    try {
      answers = JSON.parse(p.quizAnswers || '{}');
    } catch (err) {
      answers = {};
    }

    sheet.appendRow([
      new Date(),
      p.name || '',
      p.phone || '',
      p.time || '',
      p.whatsappOnly === 'true' ? 'Yes' : 'No',
      p.periodType || '',
      answers.q1 || '',
      answers.q2 !== undefined ? answers.q2 : '',
      answers.q3 !== undefined ? answers.q3 : '',
      answers.q4 !== undefined ? answers.q4 : '',
      answers.q5 !== undefined ? answers.q5 : '',
      answers.q6 || '',
      answers.q7 !== undefined ? answers.q7 : '',
      answers.q8 || '',
      p.pageUrl || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
