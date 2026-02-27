# Frontend Smoke Tests

## Overview

This document outlines smoke tests for verifying core functionality of the OK frontend app.

## Prerequisites

- Backend running at http://localhost:4000 (or configured API_URL)
- Frontend running with `npm start`
- Test user credentials (owner or staff with appropriate permissions)

## Test 1: Authentication Flow

### Steps
1. Launch the app
2. Login with valid credentials
3. Verify user name appears in dashboard
4. Logout and verify redirect to login

### Expected Result
- Dashboard shows "Welcome back, {username}"
- After logout, user is redirected to login screen

## Test 2: Create Ledger

### Steps
1. Login as owner (full permissions)
2. Navigate to Ledger tab
3. Tap FAB (+) button
4. Select "New Ledger"
5. Fill in:
   - Type: "They Owe Me"
   - Name: "Test Company"
   - Initial Amount: 1000
6. Tap "Create Ledger"

### Expected Result
- Success alert appears
- New ledger appears in list
- Outstanding balance shows $1,000.00

## Test 3: Record Payment with Idempotency

### Steps
1. Login as owner
2. Navigate to a ledger with outstanding balance
3. Tap "Record Payment"
4. Enter amount: 500
5. Optionally attach receipt
6. Tap "Confirm Payment"

### Expected Result
- Success alert shows:
  - Payment amount
  - Recorded by: {username}
  - New balance
- Ledger outstanding updates to reflect payment

### Idempotency Test
1. Record a payment
2. Immediately record another payment with same amount (same idempotency key)
3. Verify "idempotent response" message appears
4. Verify only one payment was created

## Test 4: Offline Queue & Sync

### Steps (Manual Simulation)
1. Enable airplane mode or disconnect network
2. Attempt to record a payment
3. Payment should be queued locally
4. Re-enable network
5. Sync should trigger automatically

### Code Verification
```javascript
// Check queue length
import { getQueueLength, flushQueue } from '@/services/syncService';

// Verify operations are queued
const queueLength = getQueueLength();
console.log('Queued operations:', queueLength);

// Manually trigger sync
const result = await flushQueue();
console.log('Sync result:', result);
```

### Expected Result
- Queue stores operations in localStorage
- flushQueue() sends batch to /api/sync/batch
- Server IDs are mapped to client temp IDs
- UI updates with server state after sync

## Test 5: Conflict Resolution

### Steps
1. Make a payment on device A
2. Make a different payment on device B for same ledger
3. Sync device A
4. When syncing device B, conflict should occur

### Expected Result
- Conflict modal appears showing:
  - Server state
  - Option to accept server state
  - Option to retry

## Test 6: Permissions Enforcement

### Steps (as Owner)
1. Login as owner
2. Verify all buttons visible:
   - Create ledger
   - Record payment
   - Manage staff
3. Navigate to Staff tab

### Steps (as Staff with Limited Permissions)
1. Login as staff with only "Record Payment" permission
2. Verify:
   - Cannot create new ledger (button disabled or hidden)
   - Can record payments
   - Cannot access Staff management

### Expected Result
- UI correctly hides/disables based on permissions
- Alert shown when attempting restricted action

## Test 7: Dashboard Data

### Steps
1. Login as owner
2. Observe dashboard summary cards:
   - Owed to Me (total)
   - I Owe (total)
   - Overdue count
   - High Priority count

### Expected Result
- All values match actual ledger data
- Recent activity shows latest transactions

## Running Automated Tests

### Unit Tests
```bash
npm run test
```

### Integration Tests (if configured)
```bash
npm run test:integration
```

## Troubleshooting

### "Network request failed" during sync
- Check backend is running
- Verify REACT_APP_API_URL or app.json extra.API_URL is correct

### Payments not syncing
- Check localStorage has items under key: `ok_offline_queue`
- Verify sync endpoint accessible: POST /api/sync/batch

### Permission errors
- Ensure user has correct role/permissions in database
- Refresh page after permission changes
