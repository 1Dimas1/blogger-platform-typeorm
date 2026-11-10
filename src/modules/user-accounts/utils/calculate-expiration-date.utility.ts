export function calculateExpirationDate(ttl: string): Date {
  const match: RegExpMatchArray | null = ttl.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 20 * 1000);
  }

  const value: number = parseInt(match[1], 10);
  const unit: string = match[2];

  let milliseconds: number;
  switch (unit) {
    case 's':
      milliseconds = value * 1000;
      break;
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    default:
      milliseconds = 20 * 1000;
  }

  return new Date(Date.now() + milliseconds);
}
