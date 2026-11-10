import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator that extracts and parses the user-agent header from the request.
 * Returns a formatted device title (e.g., "Chrome 120") or "Unknown device" if not available.
 */
export const ParsedUserAgent = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const userAgent: string = request.headers['user-agent'] || '';

    if (!userAgent) {
      return 'Unknown device';
    }

    // Match browsers and test agents
    const match: RegExpMatchArray | null = userAgent.match(
      /(Chrome|Firefox|Safari|Edge|Opera|node-superagent)\/(\d+)/i,
    );

    if (match) {
      return `${match[1]} ${match[2]}`;
    }

    // Fallback: return first 50 chars or full string if shorter
    return userAgent.length > 50 ? userAgent.substring(0, 50) : userAgent;
  },
);
