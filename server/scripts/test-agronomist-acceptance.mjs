import crypto from 'crypto';
import db from '../db.js';
import { signToken, tokenTtlFor } from '../security.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function main() {
  console.log('================================================================');
  console.log('SATHYAM AGRO MART — AGRONOMIST ACCEPTANCE TEST SUITE (TESTS A-H)');
  console.log('================================================================');

  // Step 0: Generate Super Admin auth token
  const sa = await db.getUserById('USR-0001', { includePassword: true });
  if (!sa) {
    throw new Error('Super Admin USR-0001 not found in database');
  }
  const sessionId = crypto.randomUUID();
  await db.setUserSessionId('USR-0001', sessionId);
  const saToken = signToken('USR-0001', sa.password, sessionId, tokenTtlFor(sa.role));
  const saHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${saToken}`
  };
  console.log('✓ Super Admin authenticated successfully (USR-0001)');

  // Step 1: Check if test employee already exists, clean up if leftover from previous test run
  const allUsers = await db.getUsers();
  const existingTestEmp = allUsers.find(u =>
    u.phone === '9876543299' ||
    u.email === 'qa.agronomist@sathyamagromart.com' ||
    u.name === 'QA Agronomist Integration Test'
  );

  let testEmployeeId = existingTestEmp?.id;
  if (existingTestEmp) {
    console.log(`ℹ Found existing test employee ${existingTestEmp.id}, resetting to active Agronomist in Cuddalore...`);
    await fetch(`${BASE_URL}/api/superadmin/users/${existingTestEmp.id}`, {
      method: 'PUT',
      headers: saHeaders,
      body: JSON.stringify({
        name: 'QA Agronomist Integration Test',
        phone: '9876543299',
        email: 'qa.agronomist@sathyamagromart.com',
        role: 'employee',
        storeId: 'STR-MUV771BW0VE9',
        storeName: 'Cuddalore',
        storeLocation: 'cuddalore',
        department: 'Agronomy & Soil Services',
        status: 'active',
        isAgronomyExpert: true,
        specialization: 'Integrated Pest Management & Soil Diagnostics'
      })
    });
  } else {
    console.log('Creating QA Agronomist Integration Test via POST /api/superadmin/users...');
    const createRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
      method: 'POST',
      headers: saHeaders,
      body: JSON.stringify({
        name: 'QA Agronomist Integration Test',
        phone: '9876543299',
        email: 'qa.agronomist@sathyamagromart.com',
        password: 'Password@12345',
        role: 'employee',
        storeId: 'STR-MUV771BW0VE9',
        storeName: 'Cuddalore',
        storeLocation: 'cuddalore',
        department: 'Agronomy & Soil Services',
        status: 'active',
        isAgronomyExpert: true,
        specialization: 'Integrated Pest Management & Soil Diagnostics'
      })
    });
    const createData = await createRes.json();
    if (!createData.success || !createData.user) {
      throw new Error(`Failed to create test employee: ${JSON.stringify(createData)}`);
    }
    testEmployeeId = createData.user.id;
    console.log(`✓ Test employee created with ID: ${testEmployeeId}`);
  }

  // Retrieve saved employee from database to verify persistence
  const persistedUser = await db.getUserById(testEmployeeId);
  const persistedStaff = await db.getStaffProfile(testEmployeeId);
  console.log(`✓ Database verification: ID=${persistedUser.id}, Name="${persistedUser.name}", Role=${persistedUser.role}, Status=${persistedUser.status}, StoreId=${persistedUser.storeId}, isAgronomyExpert=${persistedUser.isAgronomyExpert}`);
  if (!persistedUser.isAgronomyExpert || !persistedStaff.isAgronomyExpert) {
    throw new Error('isAgronomyExpert flag was not persisted to User or StaffProfile!');
  }

  const results = {};

  // -------------------------------------------------------------
  // TEST A: Valid Agronomist
  // -------------------------------------------------------------
  console.log('\n--- TEST A: Valid Agronomist in Public API ---');
  const resA = await fetch(`${BASE_URL}/api/agronomy-experts`);
  const dataA = await resA.json();
  const foundA = dataA.data?.find(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);
  if (foundA && (foundA.active === true || foundA.status === 'active') && foundA.storeId === 'STR-MUV771BW0VE9') {
    results.TestA = { pass: true, detail: `Employee ${testEmployeeId} found in active agronomist list with store Cuddalore` };
    console.log(`[PASS] Test A: ${results.TestA.detail}`);
  } else {
    results.TestA = { pass: false, detail: `Employee not found or invalid: ${JSON.stringify(dataA)}` };
    console.error(`[FAIL] Test A: ${results.TestA.detail}`);
  }

  // -------------------------------------------------------------
  // TEST B: Normal Employee Exclusion
  // -------------------------------------------------------------
  console.log('\n--- TEST B: Normal Employee Exclusion ---');
  const normalStaffIds = ['USR-MUBBSHLSP96F', 'USR-MUBBSJP5QZ0F', 'USR-MUBBSLVSPD4O', 'USR-MVJI2LOWCRFS', 'USR-MUBBSB9Y9IIA'];
  const leakedNormalStaff = (dataA.data || []).filter(e => normalStaffIds.includes(e.id) || normalStaffIds.includes(e.employeeId));
  if (leakedNormalStaff.length === 0) {
    results.TestB = { pass: true, detail: 'Zero normal employees or admins leaked into agronomist list' };
    console.log(`[PASS] Test B: ${results.TestB.detail}`);
  } else {
    results.TestB = { pass: false, detail: `Normal staff leaked: ${JSON.stringify(leakedNormalStaff)}` };
    console.error(`[FAIL] Test B: ${results.TestB.detail}`);
  }

  // -------------------------------------------------------------
  // TEST C: Store Scoping (Wrong Store Filtering)
  // -------------------------------------------------------------
  console.log('\n--- TEST C: Store Scoping & Wrong Store Filtering ---');
  // Cuddalore store query -> MUST match
  const resC_Cuddalore = await fetch(`${BASE_URL}/api/agronomy-experts?storeId=STR-MUV771BW0VE9`);
  const dataC_Cuddalore = await resC_Cuddalore.json();
  const hasCuddalore = (dataC_Cuddalore.data || []).some(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);

  // Madurai store query -> MUST NOT match
  const resC_Madurai = await fetch(`${BASE_URL}/api/agronomy-experts?storeId=STR-MVLZV9RLJTDD`);
  const dataC_Madurai = await resC_Madurai.json();
  const hasMadurai = (dataC_Madurai.data || []).some(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);

  // Alanganallur store query -> MUST NOT match
  const resC_Alang = await fetch(`${BASE_URL}/api/agronomy-experts?storeId=STR-MVM0S869J4Q2`);
  const dataC_Alang = await resC_Alang.json();
  const hasAlang = (dataC_Alang.data || []).some(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);

  if (hasCuddalore && !hasMadurai && !hasAlang) {
    results.TestC = { pass: true, detail: 'Employee properly scoped to Cuddalore (STR-MUV771BW0VE9) and excluded from Madurai and Alanganallur' };
    console.log(`[PASS] Test C: ${results.TestC.detail}`);
  } else {
    results.TestC = { pass: false, detail: `Store filtering failed. Cuddalore=${hasCuddalore}, Madurai=${hasMadurai}, Alanganallur=${hasAlang}` };
    console.error(`[FAIL] Test C: ${results.TestC.detail}`);
  }

  // -------------------------------------------------------------
  // TEST D: Inactive Employee Exclusion
  // -------------------------------------------------------------
  console.log('\n--- TEST D: Inactive Employee Exclusion ---');
  // Deactivate employee
  const deactRes = await fetch(`${BASE_URL}/api/superadmin/users/${testEmployeeId}`, {
    method: 'PUT',
    headers: saHeaders,
    body: JSON.stringify({ status: 'disabled' })
  });
  const deactData = await deactRes.json();
  if (!deactData.success) throw new Error('Failed to disable test user');

  const resD_Disabled = await fetch(`${BASE_URL}/api/agronomy-experts`);
  const dataD_Disabled = await resD_Disabled.json();
  const disabledFound = (dataD_Disabled.data || []).some(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);

  // Reactivate employee
  const reactRes = await fetch(`${BASE_URL}/api/superadmin/users/${testEmployeeId}`, {
    method: 'PUT',
    headers: saHeaders,
    body: JSON.stringify({ status: 'active' })
  });
  const reactData = await reactRes.json();
  if (!reactData.success) throw new Error('Failed to reactivate test user');

  const resD_Active = await fetch(`${BASE_URL}/api/agronomy-experts`);
  const dataD_Active = await resD_Active.json();
  const reactivatedFound = (dataD_Active.data || []).some(e => e.id === testEmployeeId || e.employeeId === testEmployeeId);

  if (!disabledFound && reactivatedFound) {
    results.TestD = { pass: true, detail: 'Disabled employee was excluded; reactivated employee was immediately included' };
    console.log(`[PASS] Test D: ${results.TestD.detail}`);
  } else {
    results.TestD = { pass: false, detail: `Disabled exclusion failed: disabledFound=${disabledFound}, reactivatedFound=${reactivatedFound}` };
    console.error(`[FAIL] Test D: ${results.TestD.detail}`);
  }

  // -------------------------------------------------------------
  // TEST E: Mock Data Elimination Check
  // -------------------------------------------------------------
  console.log('\n--- TEST E: Mock Data Elimination ---');
  const dummyIds = ['USR-EXPERT-01', 'USR-EXPERT-02', 'USR-EXPERT-03', 'USR-EXPERT-04'];
  const resE = await fetch(`${BASE_URL}/api/agronomy-experts`);
  const dataE = await resE.json();
  const foundDummy = (dataE.data || []).filter(e => dummyIds.includes(e.id) || dummyIds.includes(e.employeeId));
  if (foundDummy.length === 0) {
    results.TestE = { pass: true, detail: 'Zero dummy mock experts (USR-EXPERT-01..04) found in live public response' };
    console.log(`[PASS] Test E: ${results.TestE.detail}`);
  } else {
    results.TestE = { pass: false, detail: `Dummy experts detected in response: ${JSON.stringify(foundDummy)}` };
    console.error(`[FAIL] Test E: ${results.TestE.detail}`);
  }

  // -------------------------------------------------------------
  // TEST F: Assignment Persistence & Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- TEST F: Assignment Persistence & Lifecycle ---');
  // Find or create a test booking
  const bookingsRes = await fetch(`${BASE_URL}/api/agronomy-bookings`, { headers: saHeaders });
  const bookingsData = await bookingsRes.json();
  let testBooking = (bookingsData.data || [])[0];

  if (!testBooking) {
    testBooking = await db.createAgronomyBooking({
      farmerName: 'Automated QA Farmer',
      phone: '9876543210',
      crop: 'Paddy',
      acreage: '5 Acres',
      storeId: 'STR-MUV771BW0VE9',
      storeName: 'Cuddalore',
      preferredDate: '2026-10-31',
      preferredSlot: '10:00 AM - 12:00 PM',
      topic: 'Pest Identification and Soil Nutrition',
      status: 'Pending'
    });
  }

  // Assign test agronomist
  const assignRes = await fetch(`${BASE_URL}/api/agronomy-bookings/${testBooking.id}/assign`, {
    method: 'PUT',
    headers: saHeaders,
    body: JSON.stringify({
      expertId: testEmployeeId,
      expertName: 'QA Agronomist Integration Test',
      scheduledDate: '2026-10-31',
      scheduledSlot: '10:00 AM - 12:00 PM',
      adminNotes: 'Assigned during QA Agronomist Integration Verification'
    })
  });
  const assignData = await assignRes.json();

  // Reload booking directly from backend database
  const reloadedBooking = await db.getAgronomyBookingById(testBooking.id);
  const reloadedFromApi = await (await fetch(`${BASE_URL}/api/agronomy-bookings`, { headers: saHeaders })).json();
  const apiBooking = (reloadedFromApi.data || []).find(b => b.id === testBooking.id);

  const statusValid = ['Assigned', 'Scheduled'].includes(reloadedBooking?.status);
  if (
    assignData.success &&
    reloadedBooking &&
    reloadedBooking.expertId === testEmployeeId &&
    statusValid &&
    apiBooking &&
    apiBooking.expertId === testEmployeeId
  ) {
    results.TestF = { pass: true, detail: `Booking ${testBooking.id} assigned to ${testEmployeeId}, status transitioned to '${reloadedBooking.status}', persisted across DB and API` };
    console.log(`[PASS] Test F: ${results.TestF.detail}`);
  } else {
    results.TestF = { pass: false, detail: `Assignment persistence failed: DB expertId=${reloadedBooking?.expertId}, status=${reloadedBooking?.status}` };
    console.error(`[FAIL] Test F: ${results.TestF.detail}`);
  }

  // -------------------------------------------------------------
  // TEST G: Liveness, Readiness & Failure Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST G: Liveness, Readiness & Failure Handling ---');
  const livenessRes = await fetch(`${BASE_URL}/api/health/liveness`);
  const livenessData = await livenessRes.json();

  const readinessRes = await fetch(`${BASE_URL}/api/health/readiness`);
  const readinessData = await readinessRes.json();

  const agronomyHealthRes = await fetch(`${BASE_URL}/api/agronomy/health`);
  const agronomyHealthData = await agronomyHealthRes.json();

  const invalidStoreRes = await fetch(`${BASE_URL}/api/agronomy-experts?storeId=STR-NON-EXISTENT-XYZ`);
  const invalidStoreData = await invalidStoreRes.json();

  const unauthorizedRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
    headers: { 'Content-Type': 'application/json' }
  });

  const gPass =
    livenessRes.status === 200 && livenessData.liveness === true &&
    readinessRes.status === 200 && readinessData.database === 'connected' &&
    agronomyHealthRes.status === 200 && agronomyHealthData.agronomistIntegration === true &&
    invalidStoreRes.status === 200 && Array.isArray(invalidStoreData.data) && invalidStoreData.data.length === 0 &&
    unauthorizedRes.status === 401;

  if (gPass) {
    results.TestG = {
      pass: true,
      detail: `Liveness (200), Readiness (200, db connected), AgronomyHealth (200, ${agronomyHealthData.activeAgronomistsCount} active agronomists, ${agronomyHealthData.storesCount} stores), invalid store returns safe [], unauthorized requests rejected with 401`
    };
    console.log(`[PASS] Test G: ${results.TestG.detail}`);
  } else {
    results.TestG = { pass: false, detail: `Health/failure test mismatch: Liveness=${livenessRes.status}, Readiness=${readinessRes.status}, Auth=${unauthorizedRes.status}` };
    console.error(`[FAIL] Test G: ${results.TestG.detail}`);
  }

  // -------------------------------------------------------------
  // TEST H: Regression Testing Across Core Workflows
  // -------------------------------------------------------------
  console.log('\n--- TEST H: Regression Testing Across Core Workflows ---');
  const storesCheck = await (await fetch(`${BASE_URL}/api/superadmin/stores`, { headers: saHeaders })).json();
  const productsCheck = await (await fetch(`${BASE_URL}/api/products?limit=5`)).json();
  const generalHealthCheck = await (await fetch(`${BASE_URL}/api/health`)).json();

  const hPass =
    storesCheck.success === true && (storesCheck.data || []).length >= 3 &&
    productsCheck.success === true && Array.isArray(productsCheck.data) &&
    generalHealthCheck.status === 'ok';

  if (hPass) {
    results.TestH = {
      pass: true,
      detail: `All regression checks passed: Stores (${storesCheck.data.length}), Products API (${productsCheck.data.length} items), General Health Check (status: ok)`
    };
    console.log(`[PASS] Test H: ${results.TestH.detail}`);
  } else {
    results.TestH = { pass: false, detail: 'Regression failure on core endpoints' };
    console.error(`[FAIL] Test H: ${results.TestH.detail}`);
  }

  // Summary
  console.log('\n================================================================');
  console.log('ACCEPTANCE TESTS SUMMARY (A-H)');
  console.log('================================================================');
  let allPassed = true;
  for (const [k, v] of Object.entries(results)) {
    console.log(`${k}: ${v.pass ? '✓ PASSED' : '✗ FAILED'} — ${v.detail}`);
    if (!v.pass) allPassed = false;
  }
  console.log('================================================================');
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED (8/8)' : 'SOME TESTS FAILED'}`);
  console.log('Test Employee ID:', testEmployeeId);
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
