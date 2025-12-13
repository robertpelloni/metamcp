/**
 * TOON (Token-Oriented Object Notation) Serializer
 * A compressed format for JSON to reduce token usage by removing keys when they are repetitive
 * or by using a more concise syntax.
 *
 * This is a simplified implementation based on the concept of reducing structural overhead.
 * For a list of objects, it can convert to a CSV-like or Header-Value format.
 */

export class ToonSerializer {
  /**
   * Serialize an arbitrary object/array to TOON format.
   */
  serialize(data: any): string {
    if (Array.isArray(data)) {
      return this.serializeArray(data);
    } else if (typeof data === 'object' && data !== null) {
      return this.serializeObject(data);
    } else {
      return String(data);
    }
  }

  /**
   * Serialize an array of objects.
   * If all objects share the same keys (schema), uses a table-like format.
   * Otherwise falls back to simplified JSON-like.
   */
  private serializeArray(arr: any[]): string {
    if (arr.length === 0) return "[]";

    // check if array of objects
    const first = arr[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const keys = Object.keys(first);
      // Check if all items have roughly same keys
      const isUniform = arr.every(item =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
      );

      if (isUniform) {
        // Create Header Row
        // Using Markdown Table format or similar compact format
        // | id | name | status |
        // | -- | -- | -- |
        // | 1 | test | active |

        // OR simplified CSV-style:
        // id,name,status
        // 1,test,active

        // Let's use a dense format:
        // KEYS: id, name, status
        // 1, "test", "active"

        // Gather all unique keys from all objects to handle partials
        const allKeys = new Set<string>();
        arr.forEach(obj => Object.keys(obj).forEach(k => allKeys.add(k)));
        const sortedKeys = Array.from(allKeys);

        let output = `KEYS:[${sortedKeys.join(",")}]\n`;

        output += arr.map(obj => {
          return sortedKeys.map(k => {
             const val = obj[k];
             return this.serializeValue(val);
          }).join("|");
        }).join("\n");

        return output;
      }
    }

    return JSON.stringify(arr);
  }

  private serializeObject(obj: any): string {
    // Standard object: key=value
    // If nested, might use brackets.
    // { a: 1, b: 2 } -> a=1, b=2

    // Fallback to JSON for complex nested objects for safety,
    // unless we strictly want TOON.

    // Let's try a "Key-Value Block"
    // a: 1
    // b: "text"

    return Object.entries(obj).map(([k, v]) => {
      return `${k}:${this.serializeValue(v)}`;
    }).join(", ");
  }

  private serializeValue(val: any): string {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') return JSON.stringify(val); // Nested objects kept as JSON for now
    if (typeof val === 'string') {
        // If string contains special chars, quote it
        if (val.includes(",") || val.includes("|") || val.includes("\n")) {
            return JSON.stringify(val);
        }
        return val;
    }
    return String(val);
  }
}

export const toonSerializer = new ToonSerializer();
