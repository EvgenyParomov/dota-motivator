export const isAllowedClientCallback = (
  candidate: string,
  allowlist: readonly string[],
): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  return allowlist.some((allowed) => {
    try {
      const a = new URL(allowed);
      return (
        a.protocol === parsed.protocol &&
        a.hostname === parsed.hostname &&
        (a.port === '' || a.port === parsed.port)
      );
    } catch {
      return false;
    }
  });
};
