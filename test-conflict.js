#!/usr/bin/env node
// Test conflict detection across Requests and Scheduled sheets
// Step 1: Run this script → it submits 4 entries
// Step 2: Move "Bruce Wayne" to Scheduled in the sheet
// Step 3: Run with: node test-conflict.js --phase2  (submits a conflict against Scheduled)

const URL = 'https://script.google.com/macros/s/AKfycbyUVYu9Xt_-Uh0tifYkNm80nTFUcvC5IQQ563YD7GMvDK_BsDX2VlNqLFAFBmbz9REn4g/exec';
const phase2 = process.argv.includes('--phase2');

async function post(payload) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text.substring(0, 100) }; }
}

function makePayload(name, date, time, service) {
  return {
    serviceType: service,
    poolSize: "24' \u2013 27'",
    addons: 'None',
    serviceDate: date,
    serviceTime: time,
    totalPrice: '$315',
    customerName: name,
    address: '100 Hero Ave',
    city: 'Palos Park',
    state: 'IL',
    zip: '60462',
    email: name.toLowerCase().replace(/ /g, '.') + '@test.com',
    phone: '(815) 555-' + String(Math.floor(Math.random() * 9000 + 1000)),
    signatureDate: '2026-03-26',
  };
}

async function phase1() {
  console.log('=== PHASE 1: Submitting 4 entries ===\n');

  const entries = [
    { name: 'Tony Stark',   date: '2026-04-15', time: 'Morning (8\u201311 AM)',   svc: 'Pool Opening', expect: 'NO conflict' },
    { name: 'Bruce Wayne',  date: '2026-04-20', time: 'Afternoon (12\u20133 PM)', svc: 'Pool Opening', expect: 'NO conflict \u2014 MOVE THIS TO SCHEDULED' },
    { name: 'Clark Kent',   date: '2026-04-15', time: 'Morning (8\u201311 AM)',   svc: 'Pool Closing', expect: 'CONFLICT with Tony (Requests)' },
    { name: 'Diana Prince', date: '2026-04-22', time: 'Evening (4\u20136 PM)',    svc: 'Pool Opening', expect: 'NO conflict' },
  ];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const result = await post(makePayload(e.name, e.date, e.time, e.svc));
    console.log(`[${i + 1}/4] ${e.name} \u2014 ${e.date} ${e.time}`);
    console.log(`  \u2192 conflict: ${result.conflict}  (expected: ${e.expect})`);
    if (i < entries.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n\u2705 Phase 1 done!');
  console.log('\nNow go to the sheet and change Bruce Wayne\'s status to "Scheduled".');
  console.log('Then run:  node test-conflict.js --phase2');
}

async function runPhase2() {
  console.log('=== PHASE 2: Testing conflict against SCHEDULED sheet ===\n');

  const entries = [
    { name: 'Peter Parker', date: '2026-04-20', time: 'Afternoon (12\u20133 PM)', svc: 'Pool Closing', expect: 'CONFLICT with Bruce Wayne (Scheduled)' },
    { name: 'Natasha Romanov', date: '2026-04-22', time: 'Evening (4\u20136 PM)', svc: 'Pool Closing', expect: 'CONFLICT with Diana Prince (Requests)' },
    { name: 'Steve Rogers', date: '2026-04-25', time: 'Morning (8\u201311 AM)',   svc: 'Pool Opening', expect: 'NO conflict (unique date/time)' },
  ];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const result = await post(makePayload(e.name, e.date, e.time, e.svc));
    console.log(`[${i + 1}/3] ${e.name} \u2014 ${e.date} ${e.time}`);
    console.log(`  \u2192 conflict: ${result.conflict}  (expected: ${e.expect})`);
    if (i < entries.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n\u2705 Phase 2 done! Check the sheet for conflict notes.');
}

if (phase2) {
  runPhase2().catch(console.error);
} else {
  phase1().catch(console.error);
}
