export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cx(...values: ClassValue[]): string {
  let out = "";
  for (const value of values) {
    if (!value && value !== 0) continue;
    const part = Array.isArray(value) ? cx(...value) : String(value);
    if (part) out += out ? " " + part : part;
  }
  return out;
}
