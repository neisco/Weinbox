type FirestoreValue =
  | string
  | number
  | boolean
  | null
  | Date
  | FirestoreValue[]
  | { [key: string]: FirestoreValue }
  | object;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cleanValue(value: unknown): FirestoreValue | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item) ?? null) as FirestoreValue[];
  }
  if (!isPlainObject(value)) return value as FirestoreValue;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, nestedValue]) => [key, cleanValue(nestedValue)] as const)
      .filter((entry): entry is readonly [string, FirestoreValue] => entry[1] !== undefined)
  );
}

export function cleanFirestoreData<T extends object>(data: T) {
  return cleanValue(data) as Record<string, FirestoreValue>;
}
