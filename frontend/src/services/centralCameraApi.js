/**
 * Dedicated client service for the Central Camera Control Plane.
 * Communicates with the Node.js central backend read-only endpoints:
 * - GET /api/v1/cameras
 * - GET /api/v1/cameras/:cameraId
 *
 * NOTE: The browser never registers cameras or handles device tokens.
 */

export const getCentralApiBaseUrl = () => {
  const configuredUrl = window.localStorage.getItem('ismp_central_api_url');
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  // Default to relative API route served by backend
  return '/api/v1';
};

export const fetchCentralCameras = async () => {
  const baseUrl = getCentralApiBaseUrl();
  const response = await fetch(`${baseUrl}/cameras`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Central camera registry request failed with HTTP ${response.status}`);
  }

  return response.json();
};

export const fetchCentralCameraById = async (cameraId) => {
  if (!cameraId) {
    throw new Error('Camera ID is required');
  }

  const baseUrl = getCentralApiBaseUrl();
  const response = await fetch(`${baseUrl}/cameras/${encodeURIComponent(cameraId)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch camera ${cameraId} (HTTP ${response.status})`);
  }

  return response.json();
};
