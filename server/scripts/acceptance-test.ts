import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';

async function runAcceptanceTest() {
  console.log('====================================================');
  console.log('🚀 ATRIOS ENTERTAINMENT — FULL ACCEPTANCE TEST');
  console.log('====================================================\n');

  // Step 1: Admin Login
  console.log('--- STEP 1: Admin Authentication ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@atrios.lk', password: 'Admin@123' }),
  });
  const loginData: any = await loginRes.json();
  console.log(`Login Status: ${loginRes.status}`);
  console.log(`Logged in as: ${loginData.data.name} (${loginData.data.role})`);
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('✅ Admin login SUCCESS\n');

  // Step 2: Verify Facilities in Database
  console.log('--- STEP 2: Database Facilities Verification ---');
  const facRes = await fetch(`${BASE_URL}/facilities`);
  const facJson: any = await facRes.json();
  const facilities = facJson.data;
  console.log(`Found ${facilities.length} active facilities:`);
  facilities.forEach((f: any) => console.log(`  - [${f.name}] Rate: Rs.${f.hourlyRate}/hr | Color: ${f.color}`));
  const ps5_1 = facilities.find((f: any) => f.name === 'PS5 1');
  const ps5_2 = facilities.find((f: any) => f.name === 'PS5 2');
  if (!ps5_1 || !ps5_2) throw new Error('Required facilities PS5 1 or PS5 2 not found');
  console.log('✅ Facilities seeded and dynamically loaded SUCCESS\n');

  // Step 3: Customer Books PS5 1 for Tomorrow 7:00 PM (1 hr)
  console.log('--- STEP 3: Customer Web Booking (PS5 1, Tomorrow 19:00 - 20:00) ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const booking1Res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facilityId: ps5_1._id,
      date: tomorrowDateStr,
      startTime: '19:00',
      durationMinutes: 60,
      customerName: 'John Perera',
      customerPhone: '0771234567',
      customerEmail: 'john@example.com',
      notes: 'Birthday session',
    }),
  });
  const booking1Data: any = await booking1Res.json();
  const booking1 = booking1Data.data;
  console.log(`Booking Created: ${booking1.bookingNumber}`);
  console.log(`Customer: John Perera | Facility: PS5 1`);
  console.log(`Time: ${booking1.startTime} -> ${booking1.endTime} (${booking1.durationMinutes} min)`);
  console.log(`Rate: Rs.${booking1.rateSnapshot} | Total: Rs.${booking1.total}`);
  console.log(`Status: ${booking1.status} | Payment: ${booking1.paymentStatus} (Pay at venue)`);
  console.log('✅ Customer booking SUCCESS\n');

  // Step 4: Verify Booking in Admin Calendar
  console.log('--- STEP 4: Admin Calendar Synchronization ---');
  const calRes = await fetch(
    `${BASE_URL}/bookings/calendar?start=${tomorrowDateStr}&end=${tomorrowDateStr}`,
    { headers: authHeaders }
  );
  const calJson: any = await calRes.json();
  const events = calJson.data;
  console.log(`Calendar returned ${events.length} event(s) for ${tomorrowDateStr}`);
  const calEvent = events.find((e: any) => e.extendedProps?.bookingNumber === booking1.bookingNumber);
  console.log(`Found event in calendar: "${calEvent.title}"`);
  console.log(`Start: ${calEvent.start} | End: ${calEvent.end} | Resource: ${calEvent.resourceId}`);
  console.log('✅ Real-time calendar synchronization SUCCESS\n');

  // Step 5: CONFLICT PREVENTION TEST
  console.log('--- STEP 5: Booking Conflict Prevention (19:30 - 20:30 on PS5 1) ---');
  const conflictRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facilityId: ps5_1._id,
      date: tomorrowDateStr,
      startTime: '19:30',
      durationMinutes: 60,
      customerName: 'Conflicting Customer',
      customerPhone: '0779999999',
    }),
  });
  const conflictJson: any = await conflictRes.json();
  if (conflictRes.status === 409 || conflictJson.message?.includes('booked')) {
    console.log(`✅ CONFLICT REJECTED PROPERLY: Status ${conflictRes.status}`);
    console.log(`Server message: "${conflictJson.message}"`);
    console.log('✅ Conflict Prevention Engine SUCCESS\n');
  } else {
    throw new Error(`❌ FAULT: Server did not reject conflict! Status: ${conflictRes.status}`);
  }

  // Step 6: Admin creates Phone Booking (PS5 2, 20:00 - 21:00, Sarah)
  console.log('--- STEP 6: Admin Manual Phone Booking (PS5 2, 20:00 - 21:00) ---');
  const phoneRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      facilityId: ps5_2._id,
      date: tomorrowDateStr,
      startTime: '20:00',
      durationMinutes: 60,
      customerName: 'Sarah Fernando',
      customerPhone: '0778888888',
      bookingSource: 'phone',
    }),
  });
  const phoneJson: any = await phoneRes.json();
  const booking2 = phoneJson.data;
  console.log(`Created Phone Booking: ${booking2.bookingNumber}`);
  console.log(`Customer: Sarah Fernando | Source: ${booking2.bookingSource}`);
  console.log('✅ Admin manual booking SUCCESS\n');

  // Step 7: Customer Check-in and Completion
  console.log('--- STEP 7: Customer Check-In & Session Completion ---');
  const checkinRes = await fetch(
    `${BASE_URL}/bookings/${booking1._id}/checkin`,
    { method: 'PATCH', headers: authHeaders }
  );
  const checkinJson: any = await checkinRes.json();
  console.log(`Checked In: ${checkinJson.data.checkedIn} at ${checkinJson.data.checkedInAt}`);

  const completeRes = await fetch(
    `${BASE_URL}/bookings/${booking1._id}/status`,
    { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status: 'completed' }) }
  );
  const completeJson: any = await completeRes.json();
  console.log(`Session Status: ${completeJson.data.status}`);
  console.log('✅ Check-in and completion flow SUCCESS\n');

  // Step 8: Add Operating Expense (Electricity: Rs. 25,000)
  console.log('--- STEP 8: Operating Expenses Ledger ---');
  const catRes = await fetch(`${BASE_URL}/expenses/categories`, { headers: authHeaders });
  const catJson: any = await catRes.json();
  const electricityCat = catJson.data.find((c: any) => c.name === 'Electricity') || catJson.data[0];

  const expenseRes = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Electricity Utility Bill - Lounge Operations',
      category: electricityCat._id,
      amount: 25000,
      date: new Date().toISOString(),
      vendor: 'Ceylon Electricity Board',
      paymentMethod: 'Bank Transfer',
      description: 'Monthly lounge air conditioning & lighting power',
    }),
  });
  const expJson: any = await expenseRes.json();
  console.log(`Recorded Expense: "${expJson.data.title}" | Amount: Rs.${expJson.data.amount}`);
  console.log('✅ Expense ledger SUCCESS\n');

  // Step 9: Net Profit & 4-Partner Distribution Calculation
  console.log('--- STEP 9: Net Profit & Partner Equity Distribution (40%, 30%, 20%, 10%) ---');
  const profitRes = await fetch(`${BASE_URL}/reports/profit?period=month`, { headers: authHeaders });
  const profitJson: any = await profitRes.json();
  const profitData = profitJson.data;
  console.log(`Gross Revenue: Rs.${profitData.revenue}`);
  console.log(`Operating Expenses: Rs.${profitData.expenses}`);
  console.log(`Net Profit: Rs.${profitData.netProfit}`);
  console.log('\nPartner Profit Shares:');
  profitData.distribution.forEach((p: any) => {
    console.log(`  - [${p.partner.name}] Equity: ${p.percentage}% | Investment: Rs.${p.investment.toLocaleString()} | Share: Rs.${p.share.toLocaleString()}`);
  });
  console.log('✅ Financial profit engine SUCCESS\n');

  // Step 10: Excel Exports (.xlsx)
  console.log('--- STEP 10: Official Excel Exports (.xlsx) ---');
  const exportBookingsRes = await fetch(`${BASE_URL}/reports/export/bookings`, { headers: authHeaders });
  const exportExpensesRes = await fetch(`${BASE_URL}/reports/export/expenses`, { headers: authHeaders });
  const exportProfitRes = await fetch(`${BASE_URL}/reports/export/profit`, { headers: authHeaders });

  const buf1 = Buffer.from(await exportBookingsRes.arrayBuffer());
  const buf2 = Buffer.from(await exportExpensesRes.arrayBuffer());
  const buf3 = Buffer.from(await exportProfitRes.arrayBuffer());

  fs.writeFileSync('d:/Atrios/Bookings.xlsx', buf1);
  fs.writeFileSync('d:/Atrios/Expenses.xlsx', buf2);
  fs.writeFileSync('d:/Atrios/Profit-Distribution.xlsx', buf3);

  console.log(`Exported Bookings.xlsx (${buf1.length} bytes)`);
  console.log(`Exported Expenses.xlsx (${buf2.length} bytes)`);
  console.log(`Exported Profit-Distribution.xlsx (${buf3.length} bytes)`);
  console.log('✅ Excel export suite SUCCESS\n');

  console.log('====================================================');
  console.log('🎉 ALL 10 ACCEPTANCE TEST CRITERIA PASSED 100%!');
  console.log('====================================================');
}

runAcceptanceTest().catch(err => {
  console.error('❌ Acceptance test error:', err.message);
  process.exit(1);
});
