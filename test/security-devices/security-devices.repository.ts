import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { DeviceViewDto } from '../../src/modules/user-accounts/api/view-dto/device.view-dto';
import { Constants } from '../../src/core/constants';
import { TEST_CONSTANTS } from '../config/test-constants';

interface RequestOptions {
  statusCode?: number;
}

/**
 * Repository for SecurityDevices endpoints.
 * Handles HTTP requests for device management operations.
 */
export class SecurityDevicesRepository {
  private readonly baseUrl = `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SECURITY}${Constants.PATH.DEVICES}`;

  constructor(private readonly httpServer: any) {}

  /**
   * Get all devices with active sessions for current user
   * GET /security/devices
   *
   * @param cookies - Refresh token cookie (required)
   * @param options - Request options (expected status code)
   * @returns Array of devices
   */
  async getAll(
    cookies: string[],
    options: RequestOptions = {},
  ): Promise<DeviceViewDto[]> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;

    const response = await request(this.httpServer)
      .get(this.baseUrl)
      .set('Cookie', cookies)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * Terminate all other device sessions (except current)
   * DELETE /security/devices
   *
   * @param cookies - Refresh token cookie (required)
   * @param options - Request options (expected status code)
   */
  async deleteAllExceptCurrent(
    cookies: string[],
    options: RequestOptions = {},
  ): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;

    await request(this.httpServer)
      .delete(this.baseUrl)
      .set('Cookie', cookies)
      .expect(expectedStatus);
  }

  /**
   * Terminate specified device session
   * DELETE /security/devices/:deviceId
   *
   * @param deviceId - Device ID to terminate
   * @param cookies - Refresh token cookie (required)
   * @param options - Request options (expected status code)
   */
  async deleteById(
    deviceId: string,
    cookies: string[],
    options: RequestOptions = {},
  ): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;

    await request(this.httpServer)
      .delete(`${this.baseUrl}/${deviceId}`)
      .set('Cookie', cookies)
      .expect(expectedStatus);
  }
}
