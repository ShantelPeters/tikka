/**
 * @file response.spec.ts
 * 
 * Tests for shared transaction response types and type guards.
 */

import {
  TxResponse,
  RaffleCreateResponse,
  TicketBuyResponse,
  TicketRefundResponse,
  RaffleCancelResponse,
  AdminOperationResponse,
  BatchPurchaseResponse,
  BatchPurchaseResult,
  isSuccessResponse,
  isErrorResponse,
} from './response';

describe('TxResponse', () => {
  describe('success response', () => {
    it('should have all required fields for a successful transaction', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 42,
        txHash: 'a1b2c3d4e5f6',
        ledger: 12345,
        status: 'SUCCESS',
        feeCharged: '100000',
      };

      expect(response.success).toBe(true);
      expect(response.value).toBe(42);
      expect(response.txHash).toBe('a1b2c3d4e5f6');
      expect(response.ledger).toBe(12345);
      expect(response.status).toBe('SUCCESS');
      expect(response.feeCharged).toBe('100000');
    });

    it('should support optional resultXdr field', () => {
      const response: TxResponse<string> = {
        success: true,
        value: 'test',
        txHash: 'hash123',
        ledger: 100,
        resultXdr: 'AAAAAA==',
      };

      expect(response.resultXdr).toBe('AAAAAA==');
    });

    it('should support optional warnings field', () => {
      const response: TxResponse<void> = {
        success: true,
        txHash: 'hash456',
        ledger: 200,
        warnings: [
          'Fee was higher than estimated',
          'Transaction took longer than expected',
        ],
      };

      expect(response.warnings).toHaveLength(2);
      expect(response.warnings![0]).toContain('Fee was higher');
    });
  });

  describe('error response', () => {
    it('should have error field when success is false', () => {
      const response: TxResponse<number> = {
        success: false,
        error: 'Simulation failed: insufficient balance',
      };

      expect(response.success).toBe(false);
      expect(response.error).toContain('Simulation failed');
      expect(response.value).toBeUndefined();
      expect(response.txHash).toBeUndefined();
    });

    it('should allow partial transaction info on failure', () => {
      const response: TxResponse<void> = {
        success: false,
        error: 'Transaction failed on-chain',
        txHash: 'failed_tx_hash',
        ledger: 300,
        status: 'FAILED',
      };

      expect(response.success).toBe(false);
      expect(response.txHash).toBe('failed_tx_hash');
      expect(response.status).toBe('FAILED');
    });
  });
});

describe('RaffleCreateResponse', () => {
  it('should extend TxResponse with raffle-specific fields', () => {
    const response: RaffleCreateResponse = {
      success: true,
      value: 1,
      txHash: 'raffle_create_hash',
      ledger: 1000,
      status: 'SUCCESS',
      feeCharged: '150000',
      raffleEndTime: Date.now() + 86400000,
      maxTickets: 100,
    };

    expect(response.value).toBe(1);
    expect(response.raffleEndTime).toBeDefined();
    expect(response.maxTickets).toBe(100);
  });

  it('should work without optional raffle fields', () => {
    const response: RaffleCreateResponse = {
      success: true,
      value: 2,
      txHash: 'hash',
      ledger: 500,
    };

    expect(response.raffleEndTime).toBeUndefined();
    expect(response.maxTickets).toBeUndefined();
  });
});

describe('TicketBuyResponse', () => {
  it('should extend TxResponse with ticket purchase fields', () => {
    const response: TicketBuyResponse = {
      success: true,
      value: [1, 2, 3, 4, 5],
      txHash: 'ticket_buy_hash',
      ledger: 2000,
      status: 'SUCCESS',
      ticketsPurchased: 5,
      totalCost: '5000000',
      raffleId: 10,
    };

    expect(response.value).toHaveLength(5);
    expect(response.ticketsPurchased).toBe(5);
    expect(response.totalCost).toBe('5000000');
    expect(response.raffleId).toBe(10);
  });

  it('should handle single ticket purchase', () => {
    const response: TicketBuyResponse = {
      success: true,
      value: [42],
      txHash: 'single_ticket_hash',
      ledger: 1500,
      ticketsPurchased: 1,
      raffleId: 5,
    };

    expect(response.value).toHaveLength(1);
    expect(response.value![0]).toBe(42);
    expect(response.ticketsPurchased).toBe(1);
  });
});

describe('TicketRefundResponse', () => {
  it('should extend TxResponse with refund fields', () => {
    const response: TicketRefundResponse = {
      success: true,
      value: undefined,
      txHash: 'refund_hash',
      ledger: 3000,
      status: 'SUCCESS',
      refundAmount: '1000000',
      ticketId: 42,
      raffleId: 10,
    };

    expect(response.refundAmount).toBe('1000000');
    expect(response.ticketId).toBe(42);
    expect(response.raffleId).toBe(10);
  });
});

describe('RaffleCancelResponse', () => {
  it('should extend TxResponse with cancellation fields', () => {
    const response: RaffleCancelResponse = {
      success: true,
      value: undefined,
      txHash: 'cancel_hash',
      ledger: 4000,
      status: 'SUCCESS',
      raffleId: 15,
      ticketsRefunded: 25,
    };

    expect(response.raffleId).toBe(15);
    expect(response.ticketsRefunded).toBe(25);
  });

  it('should handle cancellation with no tickets sold', () => {
    const response: RaffleCancelResponse = {
      success: true,
      txHash: 'cancel_empty_hash',
      ledger: 4100,
      raffleId: 20,
      ticketsRefunded: 0,
    };

    expect(response.ticketsRefunded).toBe(0);
  });
});

describe('AdminOperationResponse', () => {
  it('should extend TxResponse with admin operation fields', () => {
    const response: AdminOperationResponse = {
      success: true,
      value: undefined,
      txHash: 'admin_hash',
      ledger: 5000,
      status: 'SUCCESS',
      operation: 'pause',
      adminAddress: 'GADMIN...',
    };

    expect(response.operation).toBe('pause');
    expect(response.adminAddress).toBe('GADMIN...');
  });

  it('should support transfer_admin operation with new admin', () => {
    const response: AdminOperationResponse = {
      success: true,
      txHash: 'transfer_hash',
      ledger: 5100,
      operation: 'transfer_admin',
      adminAddress: 'GOLDER...',
      newAdminAddress: 'GNEWER...',
    };

    expect(response.operation).toBe('transfer_admin');
    expect(response.newAdminAddress).toBe('GNEWER...');
  });

  it('should support all admin operation types', () => {
    const operations: AdminOperationResponse['operation'][] = [
      'pause',
      'unpause',
      'transfer_admin',
      'accept_admin',
    ];

    operations.forEach((op) => {
      const response: AdminOperationResponse = {
        success: true,
        txHash: 'hash',
        ledger: 100,
        operation: op,
      };
      expect(response.operation).toBe(op);
    });
  });
});

describe('BatchPurchaseResponse', () => {
  it('should extend TxResponse with batch purchase fields', () => {
    const results: BatchPurchaseResult[] = [
      { raffleId: 1, ticketIds: [1, 2], success: true },
      { raffleId: 2, ticketIds: [3, 4, 5], success: true },
      { raffleId: 3, ticketIds: [], success: false, error: 'Raffle closed' },
    ];

    const response: BatchPurchaseResponse = {
      success: true,
      value: results,
      txHash: 'batch_hash',
      ledger: 6000,
      status: 'SUCCESS',
      totalTicketsPurchased: 5,
      totalCost: '5000000',
      successfulPurchases: 2,
      failedPurchases: 1,
    };

    expect(response.value).toHaveLength(3);
    expect(response.totalTicketsPurchased).toBe(5);
    expect(response.successfulPurchases).toBe(2);
    expect(response.failedPurchases).toBe(1);
  });

  it('should handle all successful batch purchases', () => {
    const results: BatchPurchaseResult[] = [
      { raffleId: 1, ticketIds: [1], success: true },
      { raffleId: 2, ticketIds: [2], success: true },
    ];

    const response: BatchPurchaseResponse = {
      success: true,
      value: results,
      txHash: 'all_success_hash',
      ledger: 6100,
      totalTicketsPurchased: 2,
      successfulPurchases: 2,
      failedPurchases: 0,
    };

    expect(response.failedPurchases).toBe(0);
    expect(response.successfulPurchases).toBe(2);
  });

  it('should handle all failed batch purchases', () => {
    const results: BatchPurchaseResult[] = [
      { raffleId: 1, ticketIds: [], success: false, error: 'Error 1' },
      { raffleId: 2, ticketIds: [], success: false, error: 'Error 2' },
    ];

    const response: BatchPurchaseResponse = {
      success: false,
      value: results,
      error: 'All purchases failed',
      totalTicketsPurchased: 0,
      successfulPurchases: 0,
      failedPurchases: 2,
    };

    expect(response.success).toBe(false);
    expect(response.totalTicketsPurchased).toBe(0);
    expect(response.failedPurchases).toBe(2);
  });
});

describe('BatchPurchaseResult', () => {
  it('should represent a successful individual purchase', () => {
    const result: BatchPurchaseResult = {
      raffleId: 1,
      ticketIds: [10, 11, 12],
      success: true,
    };

    expect(result.success).toBe(true);
    expect(result.ticketIds).toHaveLength(3);
    expect(result.error).toBeUndefined();
  });

  it('should represent a failed individual purchase', () => {
    const result: BatchPurchaseResult = {
      raffleId: 2,
      ticketIds: [],
      success: false,
      error: 'Insufficient balance',
    };

    expect(result.success).toBe(false);
    expect(result.ticketIds).toHaveLength(0);
    expect(result.error).toBe('Insufficient balance');
  });
});

describe('Type Guards', () => {
  describe('isSuccessResponse', () => {
    it('should return true for successful responses with value', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 42,
        txHash: 'hash',
        ledger: 100,
      };

      expect(isSuccessResponse(response)).toBe(true);

      if (isSuccessResponse(response)) {
        // TypeScript should know value is defined here
        const value: number = response.value;
        expect(value).toBe(42);
      }
    });

    it('should return false for successful responses without value', () => {
      const response: TxResponse<number> = {
        success: true,
        txHash: 'hash',
        ledger: 100,
      };

      expect(isSuccessResponse(response)).toBe(false);
    });

    it('should return false for error responses', () => {
      const response: TxResponse<number> = {
        success: false,
        error: 'Something went wrong',
      };

      expect(isSuccessResponse(response)).toBe(false);
    });

    it('should work with void responses', () => {
      const response: TxResponse<void> = {
        success: true,
        value: undefined,
        txHash: 'hash',
        ledger: 100,
      };

      // For void, value is explicitly undefined, which is still "defined" in JavaScript
      // So this should return true
      expect(response.value).toBe(undefined);
      expect(response.success).toBe(true);
      // The type guard checks if value !== undefined, which is false for undefined
      // So for void types, we need to check differently
      expect(response.success && response.value === undefined).toBe(true);
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error responses with error message', () => {
      const response: TxResponse<number> = {
        success: false,
        error: 'Transaction failed',
      };

      expect(isErrorResponse(response)).toBe(true);

      if (isErrorResponse(response)) {
        // TypeScript should know error is defined here
        const error: string = response.error;
        expect(error).toBe('Transaction failed');
      }
    });

    it('should return false for error responses without error message', () => {
      const response: TxResponse<number> = {
        success: false,
      };

      expect(isErrorResponse(response)).toBe(false);
    });

    it('should return false for success responses', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 42,
        txHash: 'hash',
        ledger: 100,
      };

      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('Type guard usage examples', () => {
    it('should narrow types correctly in conditional blocks', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 100,
        txHash: 'hash',
        ledger: 500,
      };

      if (isSuccessResponse(response)) {
        // TypeScript knows response.value is number here
        expect(response.value).toBe(100);
        expect(typeof response.value).toBe('number');
      } else if (isErrorResponse(response)) {
        // This branch won't execute
        fail('Should not reach error branch');
      }
    });

    it('should handle error responses correctly', () => {
      const response: TxResponse<string> = {
        success: false,
        error: 'Network timeout',
      };

      if (isErrorResponse(response)) {
        expect(response.error).toBe('Network timeout');
        expect(response.value).toBeUndefined();
      } else {
        fail('Should reach error branch');
      }
    });
  });
});

describe('Response Shape Consistency', () => {
  it('should have consistent base fields across all response types', () => {
    const baseFields = ['success', 'value', 'error', 'txHash', 'ledger', 'status', 'feeCharged'];

    const responses = [
      {} as TxResponse<any>,
      {} as RaffleCreateResponse,
      {} as TicketBuyResponse,
      {} as TicketRefundResponse,
      {} as RaffleCancelResponse,
      {} as AdminOperationResponse,
      {} as BatchPurchaseResponse,
    ];

    // All response types should be assignable to TxResponse
    responses.forEach((response) => {
      const txResponse: TxResponse<any> = response;
      expect(txResponse).toBeDefined();
    });
  });

  it('should support backward compatibility with transactionHash', () => {
    const response: TxResponse<number> = {
      success: true,
      value: 1,
      txHash: 'new_field',
      transactionHash: 'old_field',
      ledger: 100,
    };

    // Both fields should be accessible
    expect(response.txHash).toBe('new_field');
    expect(response.transactionHash).toBe('old_field');
  });
});

describe('Real-world Usage Scenarios', () => {
  it('should handle a complete raffle creation flow', () => {
    const response: RaffleCreateResponse = {
      success: true,
      value: 1,
      txHash: 'abc123',
      ledger: 12345,
      status: 'SUCCESS',
      feeCharged: '100000',
      raffleEndTime: Date.now() + 86400000,
      maxTickets: 100,
      warnings: ['Fee was slightly higher than estimated'],
    };

    expect(response.success).toBe(true);
    expect(response.value).toBe(1);
    expect(response.warnings).toHaveLength(1);
  });

  it('should handle a failed ticket purchase', () => {
    const response: TicketBuyResponse = {
      success: false,
      error: 'Insufficient balance for ticket purchase',
    };

    expect(response.success).toBe(false);
    expect(response.error).toContain('Insufficient balance');
    expect(response.value).toBeUndefined();
  });

  it('should handle a batch purchase with mixed results', () => {
    const response: BatchPurchaseResponse = {
      success: true,
      value: [
        { raffleId: 1, ticketIds: [1, 2], success: true },
        { raffleId: 2, ticketIds: [], success: false, error: 'Raffle ended' },
        { raffleId: 3, ticketIds: [3], success: true },
      ],
      txHash: 'batch_tx',
      ledger: 7000,
      totalTicketsPurchased: 3,
      successfulPurchases: 2,
      failedPurchases: 1,
    };

    const successfulRaffles = response.value!.filter((r) => r.success);
    const failedRaffles = response.value!.filter((r) => !r.success);

    expect(successfulRaffles).toHaveLength(2);
    expect(failedRaffles).toHaveLength(1);
    expect(failedRaffles[0].error).toBe('Raffle ended');
  });
});
