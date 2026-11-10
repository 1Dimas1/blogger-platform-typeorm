import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { SecurityDevicesRepository } from './security-devices.repository';
import { AuthRepository } from '../auth/auth.repository';
import { UsersRepository } from '../users/users.repository';
import {
  expectValidDeviceShape,
  expectDevicesToIncludeDevice,
  expectDevicesNotToIncludeDevice,
  expectDevicesCount,
} from './security-devices.expectations';
import {
  createMultipleSessions,
  extractDeviceId,
} from './security-devices.helpers';
import { createUserAndLogin } from '../auth/auth.helpers';
import { delay } from '../utils/delay';

describe('Security Devices', () => {
  let app: INestApplication;
  let securityDevicesRepository: SecurityDevicesRepository;
  let authRepository: AuthRepository;
  let usersRepository: UsersRepository;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    securityDevicesRepository = result.securityDevicesRepository;
    authRepository = result.authRepository;
    usersRepository = result.usersRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('GET /security/devices (Get All Devices)', () => {
    describe('Success cases', () => {
      it('should return all active devices for current user', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        const devices = await securityDevicesRepository.getAll(
          sessions[0].cookies,
        );

        expectDevicesCount(devices, 3);
        devices.forEach((device) => {
          expectValidDeviceShape(device);
        });
      });

      it('should include correct device properties', async () => {
        const authContext = await createUserAndLogin(
          usersRepository,
          authRepository,
        );

        const devices = await securityDevicesRepository.getAll(
          authContext.cookies,
        );

        expectDevicesCount(devices, 1);
        const device = devices[0];

        expectValidDeviceShape(device);
        expect(device.ip).toBe('::ffff:127.0.0.1');
        expect(device.title).toContain('node-superagent');
      });

      it('should return only devices for current user, not other users', async () => {
        // Create sessions for user 1
        const user1Sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          2,
        );

        // Create sessions for user 2
        const user2Sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          2,
        );

        // Get devices for user 1
        const user1Devices = await securityDevicesRepository.getAll(
          user1Sessions[0].cookies,
        );

        // Get devices for user 2
        const user2Devices = await securityDevicesRepository.getAll(
          user2Sessions[0].cookies,
        );

        // Each user should see only their own devices
        expectDevicesCount(user1Devices, 2);
        expectDevicesCount(user2Devices, 2);

        // Verify device IDs don't overlap
        const user1DeviceId = extractDeviceId(user1Sessions[0].cookies);
        const user2DeviceId = extractDeviceId(user2Sessions[0].cookies);

        expectDevicesToIncludeDevice(user1Devices, user1DeviceId);
        expectDevicesNotToIncludeDevice(user1Devices, user2DeviceId);
      });

      it('should update lastActiveDate after token refresh', async () => {
        const authContext = await createUserAndLogin(
          usersRepository,
          authRepository,
        );

        // Get initial devices
        const devicesBefore = await securityDevicesRepository.getAll(
          authContext.cookies,
        );
        const initialLastActiveDate = devicesBefore[0].lastActiveDate;

        // Wait 1 second to ensure different Unix timestamp (iat is in seconds)
        await delay(1000);

        // Refresh token (this should update lastActiveDate)
        const refreshResponse = await authRepository.refreshToken(
          authContext.cookies,
        );

        // Get devices again with new cookies
        const devicesAfter = await securityDevicesRepository.getAll(
          refreshResponse.cookies,
        );

        // lastActiveDate should be updated
        expect(
          new Date(devicesAfter[0].lastActiveDate).getTime(),
        ).toBeGreaterThan(new Date(initialLastActiveDate).getTime());
      });

      it('should return devices sorted by lastActiveDate descending', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        // Refresh session 1 to make it most recent
        const refreshedSession = await authRepository.refreshToken(
          sessions[1].cookies,
        );

        // Get all devices
        const devices = await securityDevicesRepository.getAll(
          refreshedSession.cookies,
        );

        expectDevicesCount(devices, 3);

        // Verify sorted by lastActiveDate descending (most recent first)
        for (let i = 0; i < devices.length - 1; i++) {
          const currentDate = new Date(devices[i].lastActiveDate).getTime();
          const nextDate = new Date(devices[i + 1].lastActiveDate).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      });
    });

    describe('Error cases', () => {
      it('should return 401 without refresh token', async () => {
        await securityDevicesRepository.getAll([], {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });

      it('should return 401 with invalid refresh token', async () => {
        await securityDevicesRepository.getAll(['refreshToken=invalid'], {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });
    });
  });

  describe('DELETE /security/devices (Terminate All Other Sessions)', () => {
    describe('Success cases', () => {
      it('should terminate all other device sessions except current', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        const currentDeviceId = extractDeviceId(sessions[1].cookies);

        // Terminate all other sessions using session 1
        await securityDevicesRepository.deleteAllExceptCurrent(
          sessions[1].cookies,
        );

        // Get remaining devices
        const remainingDevices = await securityDevicesRepository.getAll(
          sessions[1].cookies,
        );

        // Should only have 1 device left (current one)
        expectDevicesCount(remainingDevices, 1);
        expectDevicesToIncludeDevice(remainingDevices, currentDeviceId);
      });

      it('should keep current device session active after deleting others', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        // Terminate all other sessions
        await securityDevicesRepository.deleteAllExceptCurrent(
          sessions[0].cookies,
        );

        // Current session should still work
        const devices = await securityDevicesRepository.getAll(
          sessions[0].cookies,
        );

        expectDevicesCount(devices, 1);
      });

      it('should allow using current refresh token after deleting others', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        // Terminate all other sessions
        await securityDevicesRepository.deleteAllExceptCurrent(
          sessions[0].cookies,
        );

        // Should be able to refresh current token
        const refreshResponse = await authRepository.refreshToken(
          sessions[0].cookies,
        );

        expect(refreshResponse.body.accessToken).toBeDefined();
      });

      it('should not return deleted devices in subsequent getAll calls', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        const device0Id = extractDeviceId(sessions[0].cookies);
        const device2Id = extractDeviceId(sessions[2].cookies);

        // Terminate all other sessions using session 1
        await securityDevicesRepository.deleteAllExceptCurrent(
          sessions[1].cookies,
        );

        // Get remaining devices
        const remainingDevices = await securityDevicesRepository.getAll(
          sessions[1].cookies,
        );

        // Deleted devices should not appear
        expectDevicesNotToIncludeDevice(remainingDevices, device0Id);
        expectDevicesNotToIncludeDevice(remainingDevices, device2Id);
      });
    });

    describe('Error cases', () => {
      it('should return 401 without refresh token', async () => {
        await securityDevicesRepository.deleteAllExceptCurrent([], {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });

      it('should return 401 with invalid refresh token', async () => {
        await securityDevicesRepository.deleteAllExceptCurrent(
          ['refreshToken=invalid'],
          {
            statusCode: HttpStatus.UNAUTHORIZED,
          },
        );
      });
    });
  });

  describe('DELETE /security/devices/:deviceId (Terminate Specific Device)', () => {
    describe('Success cases', () => {
      it('should terminate specific device session', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        const deviceToDelete = extractDeviceId(sessions[1].cookies);

        // Delete specific device using session 0
        await securityDevicesRepository.deleteById(
          deviceToDelete,
          sessions[0].cookies,
        );

        // Get remaining devices
        const remainingDevices = await securityDevicesRepository.getAll(
          sessions[0].cookies,
        );

        // Should have 2 devices left
        expectDevicesCount(remainingDevices, 2);
        expectDevicesNotToIncludeDevice(remainingDevices, deviceToDelete);
      });

      it('should not return deleted device in subsequent getAll calls', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          2,
        );

        const deviceToDelete = extractDeviceId(sessions[1].cookies);

        // Delete device
        await securityDevicesRepository.deleteById(
          deviceToDelete,
          sessions[0].cookies,
        );

        // Verify it's not in the list
        const devices = await securityDevicesRepository.getAll(
          sessions[0].cookies,
        );

        expectDevicesNotToIncludeDevice(devices, deviceToDelete);
      });

      it('should keep other sessions active when deleting one', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          3,
        );

        const device0Id = extractDeviceId(sessions[0].cookies);
        const device1Id = extractDeviceId(sessions[1].cookies);
        const device2Id = extractDeviceId(sessions[2].cookies);

        // Delete middle device
        await securityDevicesRepository.deleteById(
          device1Id,
          sessions[0].cookies,
        );

        const remainingDevices = await securityDevicesRepository.getAll(
          sessions[0].cookies,
        );

        // Should have 2 devices left
        expectDevicesCount(remainingDevices, 2);
        expectDevicesToIncludeDevice(remainingDevices, device0Id);
        expectDevicesToIncludeDevice(remainingDevices, device2Id);
      });

      it('should invalidate refresh token of terminated device', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          2,
        );

        const deviceToDelete = extractDeviceId(sessions[1].cookies);

        // Delete device
        await securityDevicesRepository.deleteById(
          deviceToDelete,
          sessions[0].cookies,
        );

        // Try to use deleted device's refresh token
        await authRepository.refreshToken(sessions[1].cookies, {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });
    });

    describe('Error cases', () => {
      it('should return 401 without refresh token', async () => {
        await securityDevicesRepository.deleteById('some-device-id', [], {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });

      it('should return 401 with invalid refresh token', async () => {
        await securityDevicesRepository.deleteById(
          'some-device-id',
          ['refreshToken=invalid'],
          {
            statusCode: HttpStatus.UNAUTHORIZED,
          },
        );
      });

      it('should return 403 when trying to delete current device', async () => {
        const authContext = await createUserAndLogin(
          usersRepository,
          authRepository,
        );

        const currentDeviceId = extractDeviceId(authContext.cookies);

        // Try to delete current device
        await securityDevicesRepository.deleteById(
          currentDeviceId,
          authContext.cookies,
          {
            statusCode: HttpStatus.FORBIDDEN,
          },
        );
      });

      it("should return 403 when trying to delete other user's device", async () => {
        // Create sessions for user 1
        const user1Sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          1,
        );

        // Create sessions for user 2
        const user2Sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          1,
        );

        const user2DeviceId = extractDeviceId(user2Sessions[0].cookies);

        // User 1 tries to delete user 2's device
        await securityDevicesRepository.deleteById(
          user2DeviceId,
          user1Sessions[0].cookies,
          {
            statusCode: HttpStatus.FORBIDDEN,
          },
        );
      });

      it('should return 404 when device not found', async () => {
        const authContext = await createUserAndLogin(
          usersRepository,
          authRepository,
        );

        const nonExistentDeviceId = 'non-existent-device-id';

        await securityDevicesRepository.deleteById(
          nonExistentDeviceId,
          authContext.cookies,
          {
            statusCode: HttpStatus.NOT_FOUND,
          },
        );
      });

      it('should return 404 when trying to delete already deleted device', async () => {
        const sessions = await createMultipleSessions(
          usersRepository,
          authRepository,
          2,
        );

        const deviceToDelete = extractDeviceId(sessions[1].cookies);

        // Delete device first time
        await securityDevicesRepository.deleteById(
          deviceToDelete,
          sessions[0].cookies,
        );

        // Try to delete same device again
        await securityDevicesRepository.deleteById(
          deviceToDelete,
          sessions[0].cookies,
          {
            statusCode: HttpStatus.NOT_FOUND,
          },
        );
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should track multiple login sessions from same user', async () => {
      const sessions = await createMultipleSessions(
        usersRepository,
        authRepository,
        4,
      );

      // Each session should see all 4 devices
      for (const session of sessions) {
        const devices = await securityDevicesRepository.getAll(session.cookies);
        expectDevicesCount(devices, 4);
      }
    });

    it('should allow independent token refresh for each session', async () => {
      const sessions = await createMultipleSessions(
        usersRepository,
        authRepository,
        3,
      );

      // Refresh each session independently
      const refreshed0 = await authRepository.refreshToken(sessions[0].cookies);
      const refreshed1 = await authRepository.refreshToken(sessions[1].cookies);
      const refreshed2 = await authRepository.refreshToken(sessions[2].cookies);

      // All should still work
      await securityDevicesRepository.getAll(refreshed0.cookies);
      await securityDevicesRepository.getAll(refreshed1.cookies);
      await securityDevicesRepository.getAll(refreshed2.cookies);

      // Should still have 3 devices
      const devices = await securityDevicesRepository.getAll(
        refreshed0.cookies,
      );
      expectDevicesCount(devices, 3);
    });

    it('should terminate only targeted session without affecting others', async () => {
      const sessions = await createMultipleSessions(
        usersRepository,
        authRepository,
        4,
      );

      // Extract all device IDs
      const deviceIds = sessions.map((s) => extractDeviceId(s.cookies));

      // Delete device 2 using device 0
      await securityDevicesRepository.deleteById(
        deviceIds[2],
        sessions[0].cookies,
      );

      // Device 0, 1, 3 should still work
      const refreshed0 = await authRepository.refreshToken(sessions[0].cookies);
      await authRepository.refreshToken(sessions[1].cookies);
      await authRepository.refreshToken(sessions[3].cookies);

      // Device 2 should not work
      await authRepository.refreshToken(sessions[2].cookies, {
        statusCode: HttpStatus.UNAUTHORIZED,
      });

      // Should have 3 devices remaining (use refreshed cookies)
      const devices = await securityDevicesRepository.getAll(
        refreshed0.cookies,
      );
      expectDevicesCount(devices, 3);
    });
  });
});
