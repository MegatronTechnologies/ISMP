/**
 * Dedicated client service for the Central Incident & Notification Control Plane.
 * Communicates with the Node.js central backend read-only endpoints:
 * - GET /api/v1/incidents
 * - GET /api/v1/incidents/:incidentId
 * - GET /api/v1/incidents/:incidentId/evidence/:evidenceId
 * - GET /api/v1/notifications
 */

import { getCentralApiBaseUrl } from './centralCameraApi';

export { getCentralApiBaseUrl };

/**
 * Fetch all registered incidents from the central backend.
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array>}
 */
export const fetchCentralIncidents = async (options = {}) => {
  const baseUrl = getCentralApiBaseUrl();
  const response = await fetch(`${baseUrl}/incidents`, {
    method: 'GET',
    cache: 'no-store',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Central incident request failed with HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch a single incident by ID with its evidence metadata from central backend.
 * @param {string} incidentId
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Object>}
 */
export const fetchCentralIncidentById = async (incidentId, options = {}) => {
  if (!incidentId) {
    throw new Error('Incident ID is required');
  }

  const baseUrl = getCentralApiBaseUrl();
  const response = await fetch(`${baseUrl}/incidents/${encodeURIComponent(incidentId)}`, {
    method: 'GET',
    cache: 'no-store',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Incident ${incidentId} not found`);
    }
    throw new Error(`Failed to fetch incident ${incidentId} (HTTP ${response.status})`);
  }

  return response.json();
};

/**
 * Fetch all central notifications from the central backend.
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array>}
 */
export const fetchCentralNotifications = async (options = {}) => {
  const baseUrl = getCentralApiBaseUrl();
  const response = await fetch(`${baseUrl}/notifications`, {
    method: 'GET',
    cache: 'no-store',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Central notification request failed with HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Resolve evidence URL relative to the central backend base URL or absolute origin.
 * @param {string} evidenceUrl
 * @returns {string}
 */
export const resolveEvidenceUrl = (evidenceUrl) => {
  if (!evidenceUrl) return '';
  if (
    evidenceUrl.startsWith('http://') ||
    evidenceUrl.startsWith('https://') ||
    evidenceUrl.startsWith('blob:') ||
    evidenceUrl.startsWith('data:')
  ) {
    return evidenceUrl;
  }

  const baseUrl = getCentralApiBaseUrl();
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    try {
      const parsed = new URL(baseUrl);
      if (evidenceUrl.startsWith('/')) {
        return `${parsed.origin}${evidenceUrl}`;
      }
      return `${baseUrl.replace(/\/$/, '')}/${evidenceUrl.replace(/^\//, '')}`;
    } catch (_error) {
      return evidenceUrl;
    }
  }

  return evidenceUrl;
};
