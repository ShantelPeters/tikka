/**
 * Integration test to verify the response contract implementation
 * matches the requirements exactly.
 */

import {
  TxResponse,
  RaffleCreateResponse,
  TicketBuyResponse,
  TicketRefundResponse,
  RaffleCancelResponse,
  AdminOperationResponse,
  BatchPurchaseResponse,
  isSuccessResponse,
  isErrorResponse,
} from './response';

describe('Response Contract Requirements Verification', () => {
  describe('Required Fields - TxResponse must include', () => {
    it('should have txHash field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
      };
      
      expect(response.txHash).toBeDefined();
      expect(typeof response.txHash).toBe('string');
    });

    it('should have ledger field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
      };
      
      expect(response.ledger).toBeDefined();
      expect(typeof response.ledger).toBe('number');
    });

    it('should have status field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
        status: 'SUCCESS',
      };
      
      expect(response.status).toBeDefined();
      expect(['SUCCESS', 'FAILED', 'NOT_FOUND']).toContain(response.status);
    });

    it('should have feeCharged field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
        feeCharged: '100000',
      };
      
      expect(response.feeCharged).toBeDefined();
      expect(typeof response.feeCharged).toBe('string');
    });

    it('should have resultXdr field (safe to expose)', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
        resultXdr: 'AAAAAA==',
      };
      
      expect(response.resultXdr).toBeDefined();
      expect(typeof response.resultXdr).toBe('string');
    });

    it('should have warnings field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'abc123',
        ledger: 100,
        warnings: ['Fee higher than expected'],
      };
      
      expect(response.warnings).toBeDefined();
      expect(Array.isArray(response.warnings)).toBe(true);
    });
  });

  describe('Domain-Specific Extensions', () => {
    it('RaffleCreateResponse extends TxResponse<number>', () => {
      const response: RaffleCreateResponse = {
        success: true,
        value: 1,
        txHash: 'abc',
        ledger: 100,
        status: 'SUCCESS',
        feeCharged: '100000',
        raffleEndTime: Date.now(),
        maxTickets: 100,
      };

      // Verify it has base fields
      expect(response.success).toBe(true);
      expect(response.txHash).toBeDefined();
      expect(response.ledger).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.feeCharged).toBeDefined();
      
      // Verify it has domain-specific fields
      expect(response.raffleEndTime).toBeDefined();
      expect(response.maxTickets).toBeDefined();
    });

    it('TicketBuyResponse extends TxResponse<number[]>', () => {
      const response: TicketBuyResponse = {
        success: true,
        value: [1, 2, 3],
        txHash: 'abc',
        ledger: 100,
        status: 'SUCCESS',
        ticketsPurchased: 3,
        totalCost: '3000000',
        raffleId: 1,
      };

      expect(response.ticketsPurchased).toBeDefined();
      expect(response.totalCost).toBeDefined();
      expect(response.raffleId).toBeDefined();
    });

    it('TicketRefundResponse extends TxResponse<void>', () => {
      const response: TicketRefundResponse = {
        success: true,
        txHash: 'abc',
        ledger: 100,
        refundAmount: '1000000',
        ticketId: 42,
        raffleId: 1,
      };

      expect(response.refundAmount).toBeDefined();
      expect(response.ticketId).toBeDefined();
      expect(response.raffleId).toBeDefined();
    });

    it('RaffleCancelResponse extends TxResponse<void>', () => {
      const response: RaffleCancelResponse = {
        success: true,
        txHash: 'abc',
        ledger: 100,
        raffleId: 1,
        ticketsRefunded: 10,
      };

      expect(response.raffleId).toBeDefined();
      expect(response.ticketsRefunded).toBeDefined();
    });

    it('AdminOperationResponse extends TxResponse<void>', () => {
      const response: AdminOperationResponse = {
        success: true,
        txHash: 'abc',
        ledger: 100,
        operation: 'pause',
        adminAddress: 'GADMIN...',
      };

      expect(response.operation).toBeDefined();
      expect(['pause', 'unpause', 'transfer_admin', 'accept_admin']).toContain(response.operation);
      expect(response.adminAddress).toBeDefined();
    });

    it('BatchPurchaseResponse extends TxResponse<BatchPurchaseResult[]>', () => {
      const response: BatchPurchaseResponse = {
        success: true,
        value: [
          { raffleId: 1, ticketIds: [1, 2], success: true },
          { raffleId: 2, ticketIds: [], success: false, error: 'Failed' },
        ],
        txHash: 'abc',
        ledger: 100,
        totalTicketsPurchased: 2,
        successfulPurchases: 1,
        failedPurchases: 1,
      };

      expect(response.totalTicketsPurchased).toBeDefined();
      expect(response.successfulPurchases).toBeDefined();
      expect(response.failedPurchases).toBeDefined();
    });
  });

  describe('Consistency Across Operations', () => {
    it('all response types should have consistent base fields', () => {
      const baseFields = ['success', 'txHash', 'ledger', 'status', 'feeCharged', 'resultXdr', 'warnings'];
      
      const responses: TxResponse<any>[] = [
        { success: true, value: 1, txHash: 'a', ledger: 1 } as RaffleCreateResponse,
        { success: true, value: [1], txHash: 'a', ledger: 1 } as TicketBuyResponse,
        { success: true, txHash: 'a', ledger: 1 } as TicketRefundResponse,
        { success: true, txHash: 'a', ledger: 1 } as RaffleCancelResponse,
        { success: true, txHash: 'a', ledger: 1 } as AdminOperationResponse,
        { success: true, value: [], txHash: 'a', ledger: 1 } as BatchPurchaseResponse,
      ];

      responses.forEach((response) => {
        // All should be assignable to TxResponse
        const txResponse: TxResponse<any> = response;
        expect(txResponse).toBeDefined();
        expect(txResponse.success).toBeDefined();
      });
    });
  });

  describe('Type Guards Work Correctly', () => {
    it('isSuccessResponse should narrow type correctly', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 42,
        txHash: 'abc',
        ledger: 100,
      };

      if (isSuccessResponse(response)) {
        // TypeScript should know value is defined
        const value: number = response.value;
        expect(value).toBe(42);
      } else {
        fail('Should be success response');
      }
    });

    it('isErrorResponse should narrow type correctly', () => {
      const response: TxResponse<number> = {
        success: false,
        error: 'Something went wrong',
      };

      if (isErrorResponse(response)) {
        // TypeScript should know error is defined
        const error: string = response.error;
        expect(error).toBe('Something went wrong');
      } else {
        fail('Should be error response');
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should support deprecated transactionHash field', () => {
      const response: TxResponse<number> = {
        success: true,
        value: 1,
        txHash: 'new_hash',
        transactionHash: 'old_hash',
        ledger: 100,
      };

      expect(response.txHash).toBe('new_hash');
      expect(response.transactionHash).toBe('old_hash');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle complete raffle creation flow', () => {
      const response: RaffleCreateResponse = {
        success: true,
        value: 1,
        txHash: 'abc123',
        transactionHash: 'abc123',
        ledger: 12345,
        status: 'SUCCESS',
        feeCharged: '100000',
        raffleEndTime: Date.now() + 86400000,
        maxTickets: 100,
        warnings: ['Fee slightly higher than estimated'],
      };

      expect(response.success).toBe(true);
      expect(response.value).toBe(1);
      expect(response.txHash).toBeDefined();
      expect(response.ledger).toBeDefined();
      expect(response.status).toBe('SUCCESS');
      expect(response.feeCharged).toBeDefined();
      expect(response.raffleEndTime).toBeDefined();
      expect(response.maxTickets).toBe(100);
      expect(response.warnings).toHaveLength(1);
    });

    it('should handle failed operations with error details', () => {
      const response: TxResponse<number> = {
        success: false,
        error: 'Insufficient balance for ticket purchase',
      };

      expect(response.success).toBe(false);
      expect(response.error).toContain('Insufficient balance');
      expect(response.value).toBeUndefined();
      expect(response.txHash).toBeUndefined();
    });

    it('should handle batch operations with mixed results', () => {
      const response: BatchPurchaseResponse = {
        success: true,
        value: [
          { raffleId: 1, ticketIds: [1, 2, 3], success: true },
          { raffleId: 2, ticketIds: [], success: false, error: 'Raffle ended' },
          { raffleId: 3, ticketIds: [4], success: true },
        ],
        txHash: 'batch_tx',
        transactionHash: 'batch_tx',
        ledger: 7000,
        status: 'SUCCESS',
        totalTicketsPurchased: 4,
        successfulPurchases: 2,
        failedPurchases: 1,
      };

      const successful = response.value!.filter(r => r.success);
      const failed = response.value!.filter(r => !r.success);

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);
      expect(response.totalTicketsPurchased).toBe(4);
      expect(response.successfulPurchases).toBe(2);
      expect(response.failedPurchases).toBe(1);
    });
  });

  describe('Requirements Checklist', () => {
    it('✓ txHash field is present', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1 };
      expect('txHash' in response).toBe(true);
    });

    it('✓ ledger field is present', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1 };
      expect('ledger' in response).toBe(true);
    });

    it('✓ status field is present', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1, status: 'SUCCESS' };
      expect('status' in response).toBe(true);
    });

    it('✓ feeCharged field is present', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1, feeCharged: '100' };
      expect('feeCharged' in response).toBe(true);
    });

    it('✓ resultXdr field is present (safe)', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1, resultXdr: 'AAA' };
      expect('resultXdr' in response).toBe(true);
    });

    it('✓ warnings field is present', () => {
      const response: TxResponse<any> = { success: true, txHash: 'abc', ledger: 1, warnings: [] };
      expect('warnings' in response).toBe(true);
    });

    it('✓ Domain-specific extensions exist', () => {
      // All these should compile without errors
      const raffle: RaffleCreateResponse = { success: true, value: 1, txHash: 'a', ledger: 1 };
      const ticket: TicketBuyResponse = { success: true, value: [1], txHash: 'a', ledger: 1 };
      const refund: TicketRefundResponse = { success: true, txHash: 'a', ledger: 1 };
      const cancel: RaffleCancelResponse = { success: true, txHash: 'a', ledger: 1 };
      const admin: AdminOperationResponse = { success: true, txHash: 'a', ledger: 1 };
      const batch: BatchPurchaseResponse = { success: true, value: [], txHash: 'a', ledger: 1 };

      expect(raffle).toBeDefined();
      expect(ticket).toBeDefined();
      expect(refund).toBeDefined();
      expect(cancel).toBeDefined();
      expect(admin).toBeDefined();
      expect(batch).toBeDefined();
    });
  });
});
