/**
 * Check if a regex pattern is safe from catastrophic backtracking (ReDoS).
 * Rejects patterns with nested quantifiers like (a+)+, (a*)+, (a+)*, etc.
 */
export function isSafeRegex(pattern: string): boolean {
  // Reject patterns with nested quantifiers: group with quantifier inside, followed by quantifier
  // e.g. (a+)+, (a*)+, (a{2,})+, (\w+)*, etc.
  const nestedQuantifier = /(\([^)]*[+*}][^)]*\))[+*?]|\(\?:[^)]*[+*}][^)]*\)[+*?]/;
  if (nestedQuantifier.test(pattern)) {
    return false;
  }

  // Reject overlapping alternations with quantifiers: (a|a)+
  const overlappingAlt = /\([^)]*\|[^)]*\)[+*]/;
  if (overlappingAlt.test(pattern)) {
    return false;
  }

  // Reject excessively long patterns
  if (pattern.length > 200) {
    return false;
  }

  return true;
}
