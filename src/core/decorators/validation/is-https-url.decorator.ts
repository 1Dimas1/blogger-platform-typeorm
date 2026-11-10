import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator decorator that enforces HTTPS-only URLs.
 * Validates that the URL starts with 'https://' protocol.
 *
 * @param validationOptions - Optional validation options
 *
 * @example
 * class BlogDto {
 *   @IsHttpsUrl()
 *   websiteUrl: string;
 * }
 */
export function IsHttpsUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isHttpsUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          // Check if URL starts with https://
          return /^https:\/\/.+/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid HTTPS URL`;
        },
      },
    });
  };
}
