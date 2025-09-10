// src\utils\generateNumber.ts
export function generateNumericUppercasePassword(length: number) {
  let result = "";
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
