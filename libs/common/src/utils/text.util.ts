import { snakeCase } from 'lodash';

export function toSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (obj instanceof Buffer || obj instanceof RegExp) {
      return obj;
    }

    return Object.keys(obj).reduce(
      (result: Record<string, unknown>, key: string) => {
        // Only convert to snake_case if the key contains uppercase characters
        const hasUpperCase = /[A-Z]/.test(key);
        const convertedKey = hasUpperCase ? snakeCase(key) : key;
        result[convertedKey] = toSnakeCase(obj[key as keyof typeof obj]);
        return result;
      },
      {},
    );
  }
  return obj;
}
