/** Compile-time exhaustiveness check — fails typecheck if a union case is missed. */
export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
