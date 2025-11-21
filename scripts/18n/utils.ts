/**
 * Extract specific keys from an object.
 * @param source Source object
 * @param keys Keys to extract (dot notation supported)
 * @returns Object containing only the requested keys
 */
export function extractKeys(source: Record<string, any>, keys: string[]): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key of keys) {
    const parts = key.split('.')
    let current = source
    let currentResult = result

    // Walk the path segments
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      if (i === parts.length - 1) {
        // Last segment: set the value
        if (current && typeof current === 'object' && part in current) {
          currentResult[part] = current[part]
        }
      } else {
        // Intermediate segment: ensure the object exists
        if (!(part in currentResult)) {
          currentResult[part] = {}
        }
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
          currentResult = currentResult[part]
        } else {
          break
        }
      }
    }
  }

  return result
}

/**
 * Find missing keys between two objects.
 * @param source Source object (usually English messages)
 * @param target Target object (another locale)
 * @returns Missing keys in dot notation
 */
export function findMissingKeys(source: Record<string, any>, target: Record<string, any>, prefix = ''): string[] {
  const missingKeys: string[] = []

  for (const key in source) {
    const currentPath = prefix ? `${prefix}.${key}` : key

    if (!(key in target)) {
      // Key is completely missing
      missingKeys.push(currentPath)
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      // Recurse into nested objects
      const nestedMissing = findMissingKeys(source[key], target[key], currentPath)
      missingKeys.push(...nestedMissing)
    }
  }

  return missingKeys
}

/**
 * Deep merge two objects.
 * @param target Target object
 * @param source Source object
 * @returns Merged object
 */
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const output = { ...target }

  for (const key in source) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      key in output &&
      typeof output[key] === 'object' &&
      output[key] !== null
    ) {
      // Merge nested objects recursively
      output[key] = deepMerge(output[key], source[key])
    } else {
      // Shallow assignment
      output[key] = source[key]
    }
  }

  return output
}

/**
 * Remove a key from an object (supports dot notation).
 * @param obj Object to mutate
 * @param key Key to remove (dot notation for nested paths)
 * @returns Whether the key was removed
 */
export function removeKey(obj: Record<string, any>, key: string): boolean {
  const parts = key.split('.')

  // Early return for top-level keys
  if (parts.length === 1) {
    if (obj.hasOwnProperty(parts[0])) {
      delete obj[parts[0]]
      return true
    }
    return false
  }

  // Handle nested keys
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] === undefined || typeof current[part] !== 'object') {
      return false
    }
    current = current[part]
  }

  const lastPart = parts[parts.length - 1]
  if (current.hasOwnProperty(lastPart)) {
    delete current[lastPart]
    return true
  }

  return false
}
