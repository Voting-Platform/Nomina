/**
 * Deeply converts a Mongoose lean document (or toObject() result) into
 * a plain JS object that is safe to pass across the Next.js RSC boundary.
 *
 * - ObjectIds → hex strings
 * - Dates → ISO strings
 * - Buffers → removed
 * - Nested objects/arrays → recursively cleaned
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc;
  if (typeof doc !== "object") return doc;

  // Handle Date
  if (doc instanceof Date) return doc.toISOString() as unknown as T;

  // Handle ObjectId (has toHexString method)
  if (typeof doc.toHexString === "function") return doc.toHexString() as unknown as T;

  // Handle Buffer / Uint8Array
  if (Buffer.isBuffer(doc) || doc instanceof Uint8Array) return undefined as unknown as T;

  // Handle Arrays
  if (Array.isArray(doc)) return doc.map((item) => serialize(item)) as unknown as T;

  // Handle plain objects
  const plain: Record<string, unknown> = {};
  for (const key of Object.keys(doc)) {
    if (key === "__v") continue; // skip Mongoose version key
    plain[key] = serialize(doc[key]);
  }
  return plain as T;
}
