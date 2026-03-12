// ============================================
// DR Installs - Pool Service Request Handler
// Google Apps Script (paste in Extensions → Apps Script)
// ============================================

// ---- CONFIGURATION ----
const NOTIFICATION_EMAILS = 'customerservicedrinstalls@gmail.com'; // comma-separated for multiple
const SHEET_NAME = 'Requests'; // name of the sheet tab

// ---- WEB APP ENDPOINT ----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'Status', 'Service Type', 'Pool Size', 'Add-Ons',
        'Preferred Date', 'Time Window', 'Total Price',
        'Customer Name', 'Address', 'City', 'State', 'Zip',
        'Email', 'Phone', 'Signature Date', 'Notes'
      ]);
      // Bold headers
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold');
      // Freeze header row
      sheet.setFrozenRows(1);
    }

    // Check for time conflicts (same date + same time window)
    const conflict = checkConflict(sheet, data.serviceDate, data.serviceTime);

    // Append the new row
    sheet.appendRow([
      new Date(),                          // Timestamp
      'Pending',                           // Status
      data.serviceType || '',              // Service Type
      data.poolSize || '',                 // Pool Size
      data.addons || 'None',              // Add-Ons
      data.serviceDate || '',              // Preferred Date
      data.serviceTime || '',              // Time Window
      data.totalPrice || '',               // Total Price
      data.customerName || '',             // Customer Name
      data.address || '',                  // Address
      data.city || '',                     // City
      data.state || '',                    // State
      data.zip || '',                      // Zip
      data.email || '',                    // Email
      data.phone || '',                    // Phone
      data.signatureDate || '',            // Signature Date
      conflict ? '⚠️ CONFLICT: Another booking exists for this date/time' : ''
    ]);

    // Color-code the status cell
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 2).setBackground('#fff3cd'); // yellow for pending

    // Highlight conflict rows
    if (conflict) {
      sheet.getRange(lastRow, 17).setBackground('#f8d7da'); // red-ish for conflict note
    }

    // Send email notification
    sendNotificationEmail(data, conflict);

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, conflict: conflict }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- CONFLICT CHECK ----
function checkConflict(sheet, date, timeWindow) {
  if (!date || !timeWindow) return false;

  const data = sheet.getDataRange().getValues();
  // Skip header row, check each existing request
  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][5];   // Preferred Date column (index 5)
    const rowTime = data[i][6];   // Time Window column (index 6)
    const rowStatus = data[i][1]; // Status column (index 1)

    // Skip rejected/cancelled requests
    if (rowStatus === 'Rejected' || rowStatus === 'Cancelled') continue;

    // Check if same date and time
    if (rowDate === date && rowTime === timeWindow) {
      return true;
    }
  }
  return false;
}

// ---- EMAIL NOTIFICATION ----
function sendNotificationEmail(data, conflict) {
  const subject = `🏊 New Pool ${data.serviceType} Request` +
    (conflict ? ' ⚠️ TIME CONFLICT' : '');

  const body = `
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

${conflict ? '⚠️ WARNING: Another booking already exists for this date and time window. Please review and resolve the conflict.' : ''}

---
View all requests in the spreadsheet.
  `.trim();

  MailApp.sendEmail({
    to: NOTIFICATION_EMAILS,
    subject: subject,
    body: body,
  });
}

// ---- HANDLE GET (for testing) ----
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'DR Installs scheduling endpoint is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
