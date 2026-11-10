import { DeviceViewDto } from '../../src/modules/user-accounts/api/view-dto/device.view-dto';
import { expectValidISODateString } from '../infrastructure/expect-helpers';

/**
 * Validates that a device has the correct structure.
 *
 * @param device - Device to validate
 *
 * @example
 * const devices = await securityDevicesRepository.getAll(cookies);
 * expectValidDeviceShape(devices[0]);
 */
export function expectValidDeviceShape(device: DeviceViewDto) {
  expect(device).toBeDefined();
  expect(device.ip).toBeDefined();
  expect(typeof device.ip).toBe('string');

  expect(device.title).toBeDefined();
  expect(typeof device.title).toBe('string');

  expect(device.lastActiveDate).toBeDefined();
  expectValidISODateString(device.lastActiveDate);

  expect(device.deviceId).toBeDefined();
  expect(typeof device.deviceId).toBe('string');
  expect(device.deviceId.length).toBeGreaterThan(0);
}

/**
 * Validates that the devices array includes a specific deviceId.
 *
 * @param devices - Array of devices
 * @param deviceId - Device ID to find
 *
 * @example
 * const devices = await securityDevicesRepository.getAll(cookies);
 * expectDevicesToIncludeDevice(devices, 'device-id-123');
 */
export function expectDevicesToIncludeDevice(
  devices: DeviceViewDto[],
  deviceId: string,
) {
  const foundDevice = devices.find((d) => d.deviceId === deviceId);
  expect(foundDevice).toBeDefined();
  expect(foundDevice?.deviceId).toBe(deviceId);
}

/**
 * Validates that the devices array does NOT include a specific deviceId.
 *
 * @param devices - Array of devices
 * @param deviceId - Device ID that should not be present
 *
 * @example
 * const devices = await securityDevicesRepository.getAll(cookies);
 * expectDevicesNotToIncludeDevice(devices, 'deleted-device-id');
 */
export function expectDevicesNotToIncludeDevice(
  devices: DeviceViewDto[],
  deviceId: string,
) {
  const foundDevice = devices.find((d) => d.deviceId === deviceId);
  expect(foundDevice).toBeUndefined();
}

/**
 * Validates the number of devices in the array.
 *
 * @param devices - Array of devices
 * @param expectedCount - Expected number of devices
 *
 * @example
 * const devices = await securityDevicesRepository.getAll(cookies);
 * expectDevicesCount(devices, 3);
 */
export function expectDevicesCount(
  devices: DeviceViewDto[],
  expectedCount: number,
) {
  expect(Array.isArray(devices)).toBe(true);
  expect(devices.length).toBe(expectedCount);
}
