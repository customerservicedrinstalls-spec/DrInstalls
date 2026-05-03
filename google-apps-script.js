// ============================================
// DR Installs - Pool Service Request Handler
// Google Apps Script (paste in Extensions → Apps Script)
// ============================================

// ---- CONFIGURATION ----
const NOTIFICATION_EMAILS = 'customerservicedrinstalls@gmail.com';
const SHEET_REQUESTS = 'Requests';
const SHEET_SCHEDULED = 'Scheduled';
const SHEET_COMPLETED = 'Completed';
const STATUS_OPTIONS = ['Pending', 'Scheduled', 'Done', 'Canceled'];
const TIME_WINDOW_OPTIONS = ['Morning (8–11 AM)', 'Afternoon (12–3 PM)', 'Evening (4–6 PM)'];
const HEADERS = [
  'Timestamp', 'Status', 'Service Type', 'Pool Size', 'Add-Ons',
  'Preferred Date', 'Time Window', 'Total Price',
  'Customer Name', 'Address', 'City', 'State', 'Zip',
  'Email', 'Phone', 'Signature Date', 'Notes'
];

// ---- WEB APP ENDPOINT ----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_REQUESTS);

    // Check for time conflicts
    const conflict = checkConflict(sheet, data.serviceDate, data.serviceTime);

    // Append the new row
    sheet.appendRow([
      new Date(),
      'Pending',
      data.serviceType || '',
      data.poolSize || '',
      data.addons || 'None',
      data.serviceDate || '',
      data.serviceTime || '',
      data.totalPrice || '',
      data.customerName || '',
      data.address || '',
      data.city || '',
      data.state || '',
      data.zip || '',
      data.email || '',
      data.phone || '',
      data.signatureDate || '',
      conflict ? '⚠️ CONFLICT: Another booking exists for this date/time' : ''
    ]);

    const lastRow = sheet.getLastRow();

    // Apply status dropdown to the new row
    applyRowValidation(sheet, lastRow);

    // Color-code pending
    sheet.getRange(lastRow, 2).setBackground('#fff3cd');

    if (conflict) {
      sheet.getRange(lastRow, 17).setBackground('#f8d7da');
    }

    // Save PDF to Drive and get link (if provided)
    let pdfUrl = null;
    if (data.pdfBase64) {
      try {
        const pdfBlob = Utilities.newBlob(
          Utilities.base64Decode(data.pdfBase64),
          'application/pdf',
          data.pdfFilename || 'contract.pdf'
        );
        const file = DriveApp.createFile(pdfBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pdfUrl = file.getUrl();
      } catch (pdfErr) {
        console.error('PDF save failed:', pdfErr);
      }
    }

    sendNotificationEmail(data, conflict, pdfUrl);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, conflict: conflict }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- ON EDIT TRIGGER (moves rows based on status, re-checks conflicts on date/time change) ----
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const col = range.getColumn();
  const row = range.getRow();
  if (row <= 1) return; // skip header

  const sheetName = sheet.getName();
  if (sheetName !== SHEET_REQUESTS && sheetName !== SHEET_SCHEDULED) return;

  const ss = e.source;

  // --- Status change (column 2): move rows between sheets ---
  if (col === 2) {
    const newStatus = range.getValue();
    if (newStatus === 'Scheduled' && sheetName === SHEET_REQUESTS) {
      moveRow(ss, sheet, row, SHEET_SCHEDULED);
    } else if ((newStatus === 'Done' || newStatus === 'Canceled') &&
               (sheetName === SHEET_REQUESTS || sheetName === SHEET_SCHEDULED)) {
      moveRow(ss, sheet, row, SHEET_COMPLETED);
    } else if (newStatus === 'Pending' && sheetName === SHEET_SCHEDULED) {
      moveRow(ss, sheet, row, SHEET_REQUESTS);
    }
    return;
  }

  // --- Date or Time change (columns 6 or 7): re-check ALL conflicts ---
  if (col === 6 || col === 7) {
    recheckAllConflicts(ss);
  }
}

// ---- RE-CHECK CONFLICT FOR A SPECIFIC ROW ----
function recheckConflict(ss, sheet, row) {
  const date = sheet.getRange(row, 6).getValue();
  const time = sheet.getRange(row, 7).getValue();
  const notesCell = sheet.getRange(row, 17);

  if (!date && !time) {
    notesCell.setValue('').setBackground(null);
    return;
  }

  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);

  // Check all sheets for conflicts (excluding this exact row)
  const currentSheetName = sheet.getName();
  const sheetsToCheck = [
    { name: SHEET_REQUESTS, sheet: ss.getSheetByName(SHEET_REQUESTS) },
    { name: SHEET_SCHEDULED, sheet: ss.getSheetByName(SHEET_SCHEDULED) },
  ];

  let hasConflict = false;

  for (const s of sheetsToCheck) {
    if (!s.sheet) continue;
    const data = s.sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      // Skip this exact row in the same sheet
      if (s.name === currentSheetName && (i + 1) === row) continue;

      const rowStatus = data[i][1];
      if (rowStatus === 'Canceled' || rowStatus === 'Done') continue;

      const rowDate = normalizeDate(data[i][5]);
      const rowTime = normalizeTime(data[i][6]);

      if (rowDate === normalizedDate && rowTime === normalizedTime) {
        hasConflict = true;
        break;
      }
    }
    if (hasConflict) break;
  }

  if (hasConflict) {
    notesCell.setValue('⚠️ CONFLICT: Another booking exists for this date/time');
    notesCell.setBackground('#f8d7da');
  } else {
    notesCell.setValue('');
    notesCell.setBackground(null);
  }
}

// ---- MOVE ROW BETWEEN SHEETS ----
function moveRow(ss, sourceSheet, row, targetSheetName) {
  const targetSheet = getOrCreateSheet(ss, targetSheetName);
  const numCols = sourceSheet.getLastColumn();
  const rowData = sourceSheet.getRange(row, 1, 1, numCols).getValues()[0];

  // Append to target
  targetSheet.appendRow(rowData);
  const targetRow = targetSheet.getLastRow();

  // Apply dropdown and color to the new row
  applyRowValidation(targetSheet, targetRow);
  colorStatus(targetSheet, targetRow, rowData[1]);

  // Delete from source
  sourceSheet.deleteRow(row);

  // Re-check conflicts on ALL remaining rows in Requests and Scheduled
  recheckAllConflicts(ss);
}

// ---- RE-CHECK CONFLICTS FOR ALL ROWS IN REQUESTS + SCHEDULED ----
function recheckAllConflicts(ss) {
  const sheetsToCheck = [
    ss.getSheetByName(SHEET_REQUESTS),
    ss.getSheetByName(SHEET_SCHEDULED),
  ];

  for (const sheet of sheetsToCheck) {
    if (!sheet) continue;
    const lastRow = sheet.getLastRow();
    for (let row = 2; row <= lastRow; row++) {
      // Re-apply validations (dropdowns + date picker) since deleteRow can strip them
      applyRowValidation(sheet, row);
      recheckConflict(ss, sheet, row);
    }
  }
}

// ---- APPLY DROPDOWNS & DATE PICKER TO A ROW ----
function applyRowValidation(sheet, row) {
  // Status dropdown (column 2)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(row, 2).setDataValidation(statusRule);

  // Preferred Date as date picker (column 6)
  const dateRange = sheet.getRange(row, 6);
  dateRange.setNumberFormat('yyyy-MM-dd');
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(true)  // allow existing text dates
    .build();
  dateRange.setDataValidation(dateRule);

  // Time Window dropdown (column 7)
  const timeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TIME_WINDOW_OPTIONS, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(row, 7).setDataValidation(timeRule);
}

// ---- COLOR STATUS CELL ----
function colorStatus(sheet, row, status) {
  const colors = {
    'Pending':   '#fff3cd', // yellow
    'Scheduled': '#cce5ff', // blue
    'Done':      '#d4edda', // green
    'Canceled':  '#f8d7da', // red
  };
  sheet.getRange(row, 2).setBackground(colors[status] || '#ffffff');
}

// ---- GET OR CREATE SHEET WITH HEADERS ----
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Apply validations to entire columns (future rows)
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS_OPTIONS, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 2, 998).setDataValidation(statusRule);

    // Date picker on Preferred Date column (6)
    const dateRule = SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, 6, 998).setNumberFormat('yyyy-MM-dd');
    sheet.getRange(2, 6, 998).setDataValidation(dateRule);

    // Time Window dropdown (column 7)
    const timeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(TIME_WINDOW_OPTIONS, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, 7, 998).setDataValidation(timeRule);
  }
  return sheet;
}

// ---- NORMALIZE DATE FOR COMPARISON ----
function normalizeDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).trim();
}

// ---- NORMALIZE TIME (fix hyphen vs en-dash mismatches) ----
function normalizeTime(val) {
  if (!val) return '';
  // Replace regular hyphens with en-dashes to match dropdown values
  return String(val).trim().replace(/-/g, '\u2013');
}

// ---- CONFLICT CHECK ----
function checkConflict(sheet, date, timeWindow) {
  if (!date || !timeWindow) return false;

  const incomingDate = normalizeDate(date);
  const incomingTime = normalizeTime(timeWindow);

  function checkSheet(s) {
    if (!s) return false;
    const data = s.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowDate = normalizeDate(data[i][5]);
      const rowTime = normalizeTime(data[i][6]);
      const rowStatus = data[i][1];
      if (rowStatus === 'Canceled' || rowStatus === 'Done') continue;
      if (rowDate === incomingDate && rowTime === incomingTime) return true;
    }
    return false;
  }

  if (checkSheet(sheet)) return true;

  // Also check Scheduled sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scheduled = ss.getSheetByName(SHEET_SCHEDULED);
  if (checkSheet(scheduled)) return true;

  return false;
}

// ---- EMAIL NOTIFICATION ----
function sendNotificationEmail(data, conflict, pdfUrl) {
  const subject = `🏊 New ${data.serviceType} Request` +
    (conflict ? ' ⚠️ TIME CONFLICT' : '');

  let body = `
New Pool Service Request

Service: ${data.serviceType}
Pool Size: ${data.poolSize}
Add-Ons: ${data.addons || 'None'}
Preferred Date: ${data.serviceDate}
Time Window: ${data.serviceTime}
Total Price: ${data.totalPrice}

Customer Information:
Name: ${data.customerName}
Address: ${data.address}, ${data.city}, ${data.state} ${data.zip}
Email: ${data.email}
Phone: ${data.phone}

${conflict ? '⚠️ WARNING: Another booking already exists for this date and time window. Please review and resolve the conflict.\n' : ''}`;

  if (pdfUrl) {
    body += `Signed Contract: ${pdfUrl}\n`;
  }

  body += `
---
View all requests: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
  `.trim();

  const emailOptions = {
    to: NOTIFICATION_EMAILS,
    subject: subject,
    body: body,
  };

  // Also attach the PDF directly if available
  if (data.pdfBase64) {
    try {
      const pdfBlob = Utilities.newBlob(
        Utilities.base64Decode(data.pdfBase64),
        'application/pdf',
        data.pdfFilename || 'contract.pdf'
      );
      emailOptions.attachments = [pdfBlob];
    } catch (e) {
      console.error('PDF attachment failed:', e);
    }
  }

  MailApp.sendEmail(emailOptions);
}

// ---- HANDLE GET (for testing) ----
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'DR Installs scheduling endpoint is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- ONE-TIME SETUP: Run this manually to fix existing rows ----
function setupExistingRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_REQUESTS);
  getOrCreateSheet(ss, SHEET_SCHEDULED);
  getOrCreateSheet(ss, SHEET_COMPLETED);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Apply validation, color, and normalize time values for all existing rows
  const allSheets = [sheet, getOrCreateSheet(ss, SHEET_SCHEDULED), getOrCreateSheet(ss, SHEET_COMPLETED)];
  for (const s of allSheets) {
    const lr = s.getLastRow();
    if (lr < 2) continue;
    for (let row = 2; row <= lr; row++) {
      applyRowValidation(s, row);
      const status = s.getRange(row, 2).getValue();
      colorStatus(s, row, status);

      // Normalize hyphens → en-dashes in Time Window column
      const timeVal = s.getRange(row, 7).getValue();
      if (timeVal) {
        s.getRange(row, 7).setValue(normalizeTime(timeVal));
      }
    }
  }
}
