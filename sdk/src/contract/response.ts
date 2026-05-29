/**
 * @file response.ts
 * 
 * Shared transaction response types for the Tikka SDK.
 * 
 * All SDK methods (create, buy, refund, cancel, admin operations) return
 * consistent response objects that extend from `TxResponse`.
 * 
 * @module contract/response
 */

/**
 * Base transaction response returned by all SDK write operations.
 * 
 * Provides a consistent interface for transaction results across
 * raffle, ticket, and admin operations.
 * 
 * @template T - The decoded return value type from the contract call
 * 
 * @example
 * ```typescript
 * const response: TxResponse<number> = await raffleService.create({
 *   ticketPrice: '10',
 *   maxTickets: 100,
 *   endTime: Date.now() + 86400000,
 *   allowMultiple: true,
 *   asset: 'XLM'
 * });
 * 
 * if (response.success) {
 *   console.log('Raffle ID:', response.value);
 *   console.log('Transaction:', response.txHash);
 *   console.log('Ledger:', response.ledger);
 * } else {
 *   console.error('Error:', response.error);
 * }
 * ```
 */
export interface TxResponse<T = unknown> {
  /**
   * Indicates whether the operation completed successfully.
   * 
   * - `true`: Transaction was submitted and confirmed on-chain
   * - `false`: Operation failed (see `error` field for details)
   */
  success: boolean;

  /**
   * The decoded return value from the contract call.
   * 
   * Only present when `success` is `true`. The type depends on the
   * specific contract method invoked.
   * 
   * @example
   * - `create()` returns the raffle ID as `number`
   * - `buy()` returns ticket IDs as `number[]`
   * - `cancel()` returns `void`
   */
  value?: T;

  /**
   * Human-readable error message when `success` is `false`.
   * 
   * Includes details about what went wrong during simulation,
   * signing, submission, or polling.
   */
  error?: string;

  /**
   * Transaction hash (64-character hex string).
   * 
   * Present when the transaction was successfully submitted to the network.
   * Use this to track the transaction on block explorers or query its status.
   * 
   * @example "a1b2c3d4e5f6..."
   */
  txHash?: string;

  /**
   * Transaction hash (64-character hex string).
   * 
   * @deprecated Use `txHash` instead. This field is kept for backward compatibility.
   */
  transactionHash?: string;

  /**
   * Ledger sequence number where the transaction was included.
   * 
   * Present when the transaction was confirmed on-chain.
   * Useful for ordering operations or querying historical state.
   */
  ledger?: number;

  /**
   * Transaction status from the network.
   * 
   * - `'SUCCESS'`: Transaction executed successfully
   * - `'FAILED'`: Transaction was included but failed execution
   * - `'NOT_FOUND'`: Transaction not yet confirmed (polling in progress)
   * 
   * This field provides more granular status information than `success` alone.
   */
  status?: 'SUCCESS' | 'FAILED' | 'NOT_FOUND';

  /**
   * Total fee charged for the transaction in stroops (1 XLM = 10^7 stroops).
   * 
   * Includes both the base fee and resource fees for Soroban operations.
   * Useful for displaying costs to users or tracking expenses.
   * 
   * @example "100000" (0.01 XLM)
   */
  feeCharged?: string;

  /**
   * Base64-encoded transaction result XDR.
   * 
   * Contains the raw transaction result from the Stellar network.
   * Useful for debugging or advanced integrations that need low-level details.
   * 
   * ⚠️ **Warning**: This field may contain sensitive information. Only expose
   * it in development/debugging contexts, not in production UIs.
   */
  resultXdr?: string;

  /**
   * Non-critical warnings or informational messages.
   * 
   * Examples:
   * - Fee was higher than estimated
   * - Transaction took longer than expected to confirm
   * - Deprecated parameter usage
   * 
   * Operations can succeed even when warnings are present.
   */
  warnings?: string[];
}

/**
 * Response for raffle creation operations.
 * 
 * Extends `TxResponse` with raffle-specific metadata.
 * 
 * @example
 * ```typescript
 * const response: RaffleCreateResponse = await raffleService.create({
 *   ticketPrice: '10',
 *   maxTickets: 100,
 *   endTime: Date.now() + 86400000,
 *   allowMultiple: true,
 *   asset: 'XLM'
 * });
 * 
 * if (response.success && response.value) {
 *   console.log(`Created raffle ${response.value}`);
 *   console.log(`Ends at: ${response.raffleEndTime}`);
 * }
 * ```
 */
export interface RaffleCreateResponse extends TxResponse<number> {
  /**
   * The end time of the created raffle (Unix timestamp in milliseconds).
   * 
   * Useful for displaying countdown timers without making an additional
   * read call to fetch raffle data.
   */
  raffleEndTime?: number;

  /**
   * The maximum number of tickets for this raffle.
   * 
   * Echoed back from the creation parameters for convenience.
   */
  maxTickets?: number;
}

/**
 * Response for ticket purchase operations.
 * 
 * Extends `TxResponse` with ticket-specific metadata.
 * 
 * @example
 * ```typescript
 * const response: TicketBuyResponse = await ticketService.buy({
 *   raffleId: 1,
 *   quantity: 5
 * });
 * 
 * if (response.success && response.value) {
 *   console.log(`Purchased ${response.ticketsPurchased} tickets`);
 *   console.log(`Ticket IDs: ${response.value.join(', ')}`);
 *   console.log(`Total cost: ${response.totalCost} stroops`);
 * }
 * ```
 */
export interface TicketBuyResponse extends TxResponse<number[]> {
  /**
   * Number of tickets successfully purchased.
   * 
   * Should match `value.length` when the operation succeeds.
   */
  ticketsPurchased?: number;

  /**
   * Total cost of the purchase in stroops.
   * 
   * Includes the ticket price multiplied by quantity, but excludes
   * transaction fees (see `feeCharged` for fees).
   */
  totalCost?: string;

  /**
   * The raffle ID for which tickets were purchased.
   * 
   * Echoed back from the request parameters for convenience.
   */
  raffleId?: number;
}

/**
 * Response for ticket refund operations.
 * 
 * Extends `TxResponse` with refund-specific metadata.
 * 
 * @example
 * ```typescript
 * const response: TicketRefundResponse = await ticketService.refund({
 *   raffleId: 1,
 *   ticketId: 42
 * });
 * 
 * if (response.success) {
 *   console.log(`Refunded ${response.refundAmount} stroops`);
 * }
 * ```
 */
export interface TicketRefundResponse extends TxResponse<void> {
  /**
   * Amount refunded to the user in stroops.
   * 
   * Typically matches the original ticket price.
   */
  refundAmount?: string;

  /**
   * The ticket ID that was refunded.
   */
  ticketId?: number;

  /**
   * The raffle ID from which the ticket was refunded.
   */
  raffleId?: number;
}

/**
 * Response for raffle cancellation operations.
 * 
 * Extends `TxResponse` with cancellation-specific metadata.
 * 
 * @example
 * ```typescript
 * const response: RaffleCancelResponse = await raffleService.cancel({
 *   raffleId: 1
 * });
 * 
 * if (response.success) {
 *   console.log(`Cancelled raffle ${response.raffleId}`);
 *   console.log(`${response.ticketsRefunded} tickets will be refunded`);
 * }
 * ```
 */
export interface RaffleCancelResponse extends TxResponse<void> {
  /**
   * The raffle ID that was cancelled.
   */
  raffleId?: number;

  /**
   * Number of tickets that were sold and will be refunded.
   */
  ticketsRefunded?: number;
}

/**
 * Response for admin operations (pause, unpause, transfer, etc.).
 * 
 * Extends `TxResponse` with admin-specific metadata.
 * 
 * @example
 * ```typescript
 * const response: AdminOperationResponse = await adminService.pause();
 * 
 * if (response.success) {
 *   console.log(`Operation: ${response.operation}`);
 *   console.log(`Performed by: ${response.adminAddress}`);
 * }
 * ```
 */
export interface AdminOperationResponse extends TxResponse<void> {
  /**
   * The type of admin operation performed.
   */
  operation?: 'pause' | 'unpause' | 'transfer_admin' | 'accept_admin';

  /**
   * The admin address that performed the operation.
   */
  adminAddress?: string;

  /**
   * For transfer operations, the new admin address.
   */
  newAdminAddress?: string;
}

/**
 * Response for batch ticket purchase operations.
 * 
 * Contains individual results for each raffle in the batch.
 * 
 * @example
 * ```typescript
 * const response: BatchPurchaseResponse = await ticketService.buyBatch({
 *   purchases: [
 *     { raffleId: 1, quantity: 5 },
 *     { raffleId: 2, quantity: 3 }
 *   ]
 * });
 * 
 * if (response.success && response.value) {
 *   response.value.forEach(result => {
 *     if (result.success) {
 *       console.log(`Raffle ${result.raffleId}: ${result.ticketIds.length} tickets`);
 *     } else {
 *       console.error(`Raffle ${result.raffleId} failed: ${result.error}`);
 *     }
 *   });
 * }
 * ```
 */
export interface BatchPurchaseResponse extends TxResponse<BatchPurchaseResult[]> {
  /**
   * Total number of tickets successfully purchased across all raffles.
   */
  totalTicketsPurchased?: number;

  /**
   * Total cost across all successful purchases in stroops.
   */
  totalCost?: string;

  /**
   * Number of raffles that had successful purchases.
   */
  successfulPurchases?: number;

  /**
   * Number of raffles that failed.
   */
  failedPurchases?: number;
}

/**
 * Individual result for a single raffle in a batch purchase.
 */
export interface BatchPurchaseResult {
  /**
   * The raffle ID for this purchase attempt.
   */
  raffleId: number;

  /**
   * Ticket IDs that were successfully purchased.
   */
  ticketIds: number[];

  /**
   * Whether this specific raffle purchase succeeded.
   */
  success: boolean;

  /**
   * Error message if this raffle purchase failed.
   */
  error?: string;
}

/**
 * Legacy alias for backward compatibility.
 * 
 * @deprecated Use `TxResponse` instead. This alias will be removed in v2.0.0.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContractResponse<T = any> extends TxResponse<T> {}

/**
 * Type guard to check if a response indicates success.
 * 
 * @example
 * ```typescript
 * const response = await raffleService.create(params);
 * 
 * if (isSuccessResponse(response)) {
 *   // TypeScript knows response.value is defined here
 *   console.log('Raffle ID:', response.value);
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: TxResponse<T>
): response is TxResponse<T> & { success: true; value: T } {
  return response.success === true && response.value !== undefined;
}

/**
 * Type guard to check if a response indicates failure.
 * 
 * @example
 * ```typescript
 * const response = await raffleService.create(params);
 * 
 * if (isErrorResponse(response)) {
 *   // TypeScript knows response.error is defined here
 *   console.error('Error:', response.error);
 * }
 * ```
 */
export function isErrorResponse<T>(
  response: TxResponse<T>
): response is TxResponse<T> & { success: false; error: string } {
  return response.success === false && response.error !== undefined;
}
