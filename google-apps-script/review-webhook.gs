/**
 * Cuehealth product review intake. Stores submissions in a sheet for manual
 * verification. Nothing is published automatically.
 *
 * Deploy as a Web App (Execute as "Me", access "Anyone") and paste the /exec URL
 * into the "Review webhook URL" setting of the Product reviews section.
 */

var REVIEW_SHEET_NAME = 'Product Reviews';

var REVIEW_HEADERS = [
  'Timestamp',
  'Product ID',
  'Product',
  'Name',
  'City',
  'Rating',
  'Review',
  'Page URL',
  'Approved'
];

function doPost(e) {
  try {
    var p = e.parameter;
    var sheet = getOrCreateReviewSheet_();
    sheet.appendRow([
      new Date(),
      p.productId || '',
      p.productTitle || '',
      p.name || '',
      p.city || '',
      p.rating || '',
      p.text || '',
      p.pageUrl || '',
      'No'
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

function getOrCreateReviewSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REVIEW_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(REVIEW_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(REVIEW_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
