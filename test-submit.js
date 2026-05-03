#!/usr/bin/env node
// DR Installs - Test submissions to Google Sheets
// Usage: node test-submit.js [count]
// Last submission always reuses first one's date/time to force a conflict.

const URL = 'https://script.google.com/macros/s/AKfycbyUVYu9Xt_-Uh0tifYkNm80nTFUcvC5IQQ563YD7GMvDK_BsDX2VlNqLFAFBmbz9REn4g/exec';
const COUNT = parseInt(process.argv[2]) || 3;

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST = ['John','Jane','Mike','Sarah','David','Emily','Chris','Lisa','Ahmed','Maria','Omar','Nadia'];
const LAST = ['Smith','Johnson','Williams','Brown','Davis','Miller','Wilson','Moore','Taylor','Ali','Hassan','Nasser'];
const STREETS = ['123 Oak St','456 Elm Ave','789 Maple Dr','321 Pine Ln','654 Cedar Ct','987 Birch Rd','111 Walnut Way'];
const CITIES = ['Palos Park','Orland Park','Tinley Park','Homer Glen','Mokena','Frankfort','New Lenox'];
const SERVICES = ['Pool Opening','Pool Closing'];
const SIZES = ['15\' – 21\'','24\' – 27\'','30\' – 33\'','12\'x17\' – 15\'x26\'','15\'x30\' – 21\'x43\'','21\'x43\' +'];
const TIMES = ['Morning (8\u201311 AM)','Afternoon (12\u20133 PM)','Evening (4\u20136 PM)'];
const ADDONS = ['None','Filter Clean','Chemical Kit','Filter Clean, Chemical Kit','Cover Removal'];
const PRICES = ['$295','$315','$330','$345','$360','$385'];

let conflictDate, conflictTime;

async function postToSheet(payload) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text.substring(0, 200) }; }
}

async function run() {
  for (let i = 1; i <= COUNT; i++) {
    const fname = pick(FIRST);
    const lname = pick(LAST);
    let date, time;

    if (i === 1) {
      date = `2026-04-${String(randInt(1, 28)).padStart(2, '0')}`;
      time = pick(TIMES);
      conflictDate = date;
      conflictTime = time;
    } else if (i === COUNT && COUNT > 1) {
      // Force conflict on last submission
      date = conflictDate;
      time = conflictTime;
    } else {
      date = `2026-04-${String(randInt(1, 28)).padStart(2, '0')}`;
      time = pick(TIMES);
    }

    const payload = {
      serviceType: pick(SERVICES),
      poolSize: pick(SIZES),
      addons: pick(ADDONS),
      serviceDate: date,
      serviceTime: time,
      totalPrice: pick(PRICES),
      customerName: `${fname} ${lname}`,
      address: pick(STREETS),
      city: pick(CITIES),
      state: 'IL',
      zip: '60462',
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}@example.com`,
      phone: `(815) ${randInt(100, 999)}-${randInt(1000, 9999)}`,
      signatureDate: new Date().toISOString().split('T')[0],
    };

    const tag = (i === COUNT && COUNT > 1) ? ' ⚡ CONFLICT' : '';
    console.log(`[${i}/${COUNT}] ${payload.customerName} — ${payload.serviceType} — ${date} ${time}${tag}`);

    const result = await postToSheet(payload);
    console.log(`  → ${JSON.stringify(result)}`);

    if (i < COUNT) await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone! Check your Google Sheet.');
}

run().catch(console.error);
