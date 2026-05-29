# Response Contract Quick Reference

## Base Response Fields

All SDK operations return responses with these common fields:

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the operation succeeded |
| `value` | `T` | The decoded return value (type varies by operation) |
| `error` | `string?` | Error message if operation failed |
| `txHash` | `string?` | Transaction hash (64-char hex) |
| `ledger` | `number?` | Ledger sequence number |
| `status` | `'SUCCESS' \| 'FAILED' \| 'NOT_FOUND'?` | Transaction status |
| `feeCharged` | `string?` | Total fee in stroops |
| `resultXdr` | `string?` | Base64-encoded result XDR (debugging) |
| `warnings` | `string[]?` | Non-critical warnings |

## Response Types by Operation

### Raffle Operations

#### Create Raffle → `RaffleCreateResponse`
```typescript
{
  success: true,
  value: 1,                    // Raffle ID
  txHash: "abc123...",
  ledger: 12345,
  status: "SUCCESS",
  feeCharged: "100000",
  raffleEndTime: 1234567890,   // Unix timestamp
  maxTickets: 100
}
```

#### Cancel Raffle → `RaffleCancelResponse`
```typescript
{
  success: true,
  value: undefined,
  txHash: "def456...",
  ledger: 12346,
  status: "SUCCESS",
  raffleId: 1,
  ticketsRefunded: 25
}
```

### Ticket Operations

#### Buy Tickets → `TicketBuyResponse`
```typescript
{
  success: true,
  value: [101, 102, 103],      // Ticket IDs
  txHash: "ghi789...",
  ledger: 12347,
  status: "SUCCESS",
  ticketsPurchased: 3,
  totalCost: "3000000",        // In stroops
  raffleId: 1
}
```

#### Refund Ticket → `TicketRefundResponse`
```typescript
{
  success: true,
  value: undefined,
  txHash: "jkl012...",
  ledger: 12348,
  status: "SUCCESS",
  refundAmount: "1000000",
  ticketId: 101,
  raffleId: 1
}
```

#### Batch Buy → `BatchPurchaseResponse`
```typescript
{
  success: true,
  value: [
    { raffleId: 1, ticketIds: [1, 2], success: true },
    { raffleId: 2, ticketIds: [], success: false, error: "Raffle closed" }
  ],
  txHash: "mno345...",
  ledger: 12349,
  totalTicketsPurchased: 2,
  successfulPurchases: 1,
  failedPurchases: 1
}
```

### Admin Operations → `AdminOperationResponse`

#### Pause
```typescript
{
  success: true,
  value: undefined,
  txHash: "pqr678...",
  ledger: 12350,
  status: "SUCCESS",
  operation: "pause",
  adminAddress: "GADMIN..."
}
```

#### Transfer Admin
```typescript
{
  success: true,
  value: undefined,
  txHash: "stu901...",
  ledger: 12351,
  status: "SUCCESS",
  operation: "transfer_admin",
  adminAddress: "GOLDER...",
  newAdminAddress: "GNEWER..."
}
```

## Error Responses

All operations return error responses with this shape:

```typescript
{
  success: false,
  error: "Simulation failed: insufficient balance"
}
```

## Type Guards

Use type guards for cleaner code:

```typescript
import { isSuccessResponse, isErrorResponse } from '@tikka/sdk';

const response = await raffleService.create(params);

if (isSuccessResponse(response)) {
  // TypeScript knows response.value is defined
  console.log('Raffle ID:', response.value);
} else if (isErrorResponse(response)) {
  // TypeScript knows response.error is defined
  console.error('Error:', response.error);
}
```

## Common Patterns

### Check Success and Extract Value
```typescript
const response = await ticketService.buy({ raffleId: 1, quantity: 5 });

if (response.success && response.value) {
  const ticketIds = response.value;
  console.log(`Purchased ${ticketIds.length} tickets`);
}
```

### Handle Warnings
```typescript
const response = await raffleService.create(params);

if (response.success) {
  if (response.warnings && response.warnings.length > 0) {
    console.warn('Warnings:', response.warnings);
  }
  console.log('Created raffle:', response.value);
}
```

### Track Costs
```typescript
const response = await ticketService.buy({ raffleId: 1, quantity: 5 });

if (response.success) {
  console.log('Ticket cost:', response.totalCost);
  console.log('Transaction fee:', response.feeCharged);
  const total = BigInt(response.totalCost || '0') + BigInt(response.feeCharged || '0');
  console.log('Total spent:', total.toString(), 'stroops');
}
```

### Batch Operations
```typescript
const response = await ticketService.buyBatch({
  purchases: [
    { raffleId: 1, quantity: 5 },
    { raffleId: 2, quantity: 3 }
  ]
});

if (response.success && response.value) {
  const successful = response.value.filter(r => r.success);
  const failed = response.value.filter(r => !r.success);
  
  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
  
  failed.forEach(f => {
    console.error(`Raffle ${f.raffleId} failed: ${f.error}`);
  });
}
```

## Backward Compatibility

The deprecated `transactionHash` field is still available:

```typescript
const response = await raffleService.create(params);

// Both work:
console.log(response.txHash);           // New (recommended)
console.log(response.transactionHash);  // Deprecated but still works
```

## TypeScript Tips

### Narrow Types with Type Guards
```typescript
function handleResponse(response: TxResponse<number>) {
  if (isSuccessResponse(response)) {
    // response.value is guaranteed to be number here
    const id: number = response.value;
  }
}
```

### Use Domain-Specific Types
```typescript
// Good: Specific type
const response: RaffleCreateResponse = await raffleService.create(params);

// Also works: Generic type
const response: TxResponse<number> = await raffleService.create(params);
```

### Extract Common Response Handling
```typescript
function logTransaction(response: TxResponse<any>) {
  if (response.success) {
    console.log('✓ Transaction:', response.txHash);
    console.log('  Ledger:', response.ledger);
    console.log('  Fee:', response.feeCharged);
  } else {
    console.error('✗ Error:', response.error);
  }
}

const response = await raffleService.create(params);
logTransaction(response);
```

## Migration Guide

If you're updating from the old `ContractResponse` type:

### Before
```typescript
const response: ContractResponse<number> = await raffleService.create(params);
if (response.success) {
  console.log('TX:', response.transactionHash);
}
```

### After (Recommended)
```typescript
const response: RaffleCreateResponse = await raffleService.create(params);
if (response.success) {
  console.log('TX:', response.txHash);
  console.log('End time:', response.raffleEndTime);
  console.log('Fee:', response.feeCharged);
}
```

### After (Backward Compatible)
```typescript
// Still works! No changes needed
const response: ContractResponse<number> = await raffleService.create(params);
if (response.success) {
  console.log('TX:', response.transactionHash); // Still works
}
```
