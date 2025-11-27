import crypto from 'crypto';

/**
 * Generate device fingerprint from request headers
 * Combines multiple factors for unique identification
 */
export const generateDeviceFingerprint = (req: any): string => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const accept = req.headers['accept'] || '';
  const connection = req.headers['connection'] || '';
  const upgradeInsecureRequests = req.headers['upgrade-insecure-requests'] || '';
  const secFetchDest = req.headers['sec-fetch-dest'] || '';
  const secFetchMode = req.headers['sec-fetch-mode'] || '';
  const secFetchSite = req.headers['sec-fetch-site'] || '';

  // Combine all headers
  const fingerprintString = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    accept,
    connection,
    upgradeInsecureRequests,
    secFetchDest,
    secFetchMode,
    secFetchSite,
  ].join('|');

  // Generate hash
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

/**
 * Compare device fingerprints
 * Returns similarity score (0-1)
 */
export const compareDeviceFingerprints = (
  fingerprint1: string,
  fingerprint2: string
): number => {
  if (fingerprint1 === fingerprint2) {
    return 1.0;
  }
  // Simple comparison - in production, use more sophisticated algorithms
  let matches = 0;
  const length = Math.min(fingerprint1.length, fingerprint2.length);
  for (let i = 0; i < length; i++) {
    if (fingerprint1[i] === fingerprint2[i]) {
      matches++;
    }
  }
  return matches / length;
};

/**
 * Get device info as readable string
 */
export const getDeviceInfoString = (req: any): string => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const acceptLanguage = req.headers['accept-language'] || '';
  return `${userAgent} | ${acceptLanguage}`;
};


