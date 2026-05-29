import { Injectable } from '@nestjs/common';
import { ContractService } from '../../contract/contract.service';
import { ContractFn } from '../../contract/bindings';
import { assertNonEmpty } from '../../utils/validation';
import { AdminWriteOptions } from './admin.types';
import { ContractResponse, AdminOperationResponse } from '../../contract/response';

@Injectable()
export class AdminService {
  constructor(private readonly contract: ContractService) {}

  async pause(options: AdminWriteOptions = {}): Promise<AdminOperationResponse> {
    const response = await this.contract.invoke<void>(ContractFn.PAUSE, [], { memo: options.memo });
    return {
      ...response,
      operation: 'pause',
    };
  }

  async unpause(options: AdminWriteOptions = {}): Promise<AdminOperationResponse> {
    const response = await this.contract.invoke<void>(ContractFn.UNPAUSE, [], { memo: options.memo });
    return {
      ...response,
      operation: 'unpause',
    };
  }

  async isPaused(): Promise<ContractResponse<boolean>> {
    return this.contract.simulateReadOnly<boolean>(ContractFn.IS_PAUSED, []);
  }

  async getAdmin(): Promise<ContractResponse<string>> {
    return this.contract.simulateReadOnly<string>(ContractFn.GET_ADMIN, []);
  }

  async transferAdmin(newAdmin: string, options: AdminWriteOptions = {}): Promise<AdminOperationResponse> {
    assertNonEmpty(newAdmin, 'newAdmin');
    const response = await this.contract.invoke<void>(
      ContractFn.TRANSFER_ADMIN,
      [newAdmin],
      { memo: options.memo },
    );
    return {
      ...response,
      operation: 'transfer_admin',
      newAdminAddress: newAdmin,
    };
  }

  async acceptAdmin(options: AdminWriteOptions = {}): Promise<AdminOperationResponse> {
    const response = await this.contract.invoke<void>(ContractFn.ACCEPT_ADMIN, [], { memo: options.memo });
    return {
      ...response,
      operation: 'accept_admin',
    };
  }
}
