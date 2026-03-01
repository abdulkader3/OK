# Developer Notes

## Environment Configuration

### API URL

The app uses `expo-constants` to read the API URL from `app.json`:

```json
{
  "expo": {
    "extra": {
      "API_URL": "https://ok-backend.onrender.com"
    }
  }
}
```

**Environment Values:**
- Production (default): `https://ok-backend.onrender.com`
- Development: Override with `.env` or local server

### Overriding in Development

For local development, you can create a `.env` file:
```
REACT_APP_API_URL=http://localhost:4000
```

The API client checks in this order:
1. `Constants.expoConfig.extra.API_URL` (from app.json) - default: `https://ok-backend.onrender.com`
2. `process.env.REACT_APP_API_URL` (from .env)
3. Fallback: `http://localhost:4000`

## Authentication

### How Auth Works

1. **Login**: POST `/api/auth/login` with email/password
2. **Cookies**: Backend sets HttpOnly cookies (`accessToken`, `refreshToken`)
3. **Subsequent requests**: Cookies are sent automatically with `credentials: 'include'`

### Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // user has shape:
  // {
  //   _id: string,
  //   name: string,
  //   email: string,
  //   role: 'owner' | 'admin' | 'staff',
  //   permissions: { ... }
  // }
}
```

### Permissions

Use the `usePermissions` hook:

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { canCreateLedger, canRecordPayment, canManageStaff } = usePermissions();
  
  // Owner always has all permissions
  // Staff permissions come from user.permissions
}
```

## Idempotency Keys

### Generation

Idempotency keys are generated using:

```typescript
import { generateIdempotencyKey } from '@/utils/generateIdempotencyKey';

const key = generateIdempotencyKey();
// Output: "idem-1234567890-abc123def"
```

### Usage

The API client has a helper for idempotent requests:

```typescript
import { apiClient } from '@/services/apiClient';

// Automatically adds Idempotency-Key header
const response = await apiClient.postWithIdempotency(
  '/api/ledgers/:id/payments',
  { amount: 500 },
  idempotencyKey
);
```

### For Retries

Store the idempotency key with the operation so retries use the same key:

```typescript
// In syncService, each operation includes idempotencyKey
const operation = {
  clientTempId: generateUUID(),
  idempotencyKey: generateIdempotencyKey(),
  type: 'payment',
  payload: { amount: 500 },
  recordedAtClient: new Date().toISOString(),
  offline: true
};
```

## Offline Sync

### How It Works

1. **Queueing**: When offline, operations are stored in localStorage under key `ok_offline_queue`
2. **Flushing**: When network returns, `flushQueue()` sends batch to `/api/sync/batch`
3. **Mapping**: Server assigns IDs, client temp IDs are mapped to server IDs
4. **Conflicts**: If server state differs, conflict modal allows user to accept or retry

### Using Sync Service

```typescript
import { 
  queueOperation, 
  flushQueue, 
  getQueueLength,
  onNetworkRestore 
} from '@/services/syncService';

// Queue an operation
const clientTempId = queueOperation('payment', {
  ledgerId: '...',
  amount: 500
});

// Check queue length
const pending = getQueueLength();

// Flush queue (e.g., when network returns)
const result = await flushQueue();

// Listen for network restore
const cleanup = onNetworkRestore(() => {
  flushQueue();
});
```

### Conflict Resolution

The app shows a modal when conflicts occur:

- **Accept Server**: Apply server state to local data
- **Retry**: Re-queue operation with new idempotency key

## Testing Offline

### Using Chrome DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Perform actions (payments, etc.)
5. Select "No throttling" to restore
6. Verify sync occurs

### Programmatic Testing

```typescript
// In code or console
import { getQueueLength, flushQueue } from '@/services/syncService';

// Check queue
console.log('Pending:', getQueueLength());

// Force flush
await flushQueue();
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth)
├── hooks/           # Custom hooks (usePermissions)
├── services/        # API services
│   ├── apiClient.ts
│   ├── dashboardService.ts
│   ├── ledgerService.ts
│   ├── paymentService.ts
│   ├── syncService.ts    # Offline queue
│   ├── uploadService.ts
│   └── usersService.ts
└── utils/           # Utilities
    └── generateIdempotencyKey.ts
```

## Common Issues

### "Module not found" errors
- Check tsconfig.json includes `src/` directory
- Ensure imports use `@/` path alias

### Auth issues
- Ensure backend runs with correct CORS settings
- Check cookies are being set (browser DevTools > Application > Cookies)

### Sync not working
- Check localStorage has `ok_offline_queue` key
- Verify backend has `/api/sync/batch` endpoint
- Check network tab for sync requests
