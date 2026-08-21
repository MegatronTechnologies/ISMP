const DETECTOR_PORT = '8001';

export const getDetectorBaseUrl = () => {
  const configuredUrl = window.localStorage.getItem('ismp_detector_url');
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${window.location.hostname}:${DETECTOR_PORT}`;
};

export const getDetectorStreamUrl = (nonce = '') => {
  const suffix = nonce ? `?v=${encodeURIComponent(nonce)}` : '';
  return `${getDetectorBaseUrl()}/api/v1/stream.mjpg${suffix}`;
};

export const fetchDetectorStatus = async () => {
  const response = await fetch(`${getDetectorBaseUrl()}/api/v1/status`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Detector status request failed with HTTP ${response.status}`);
  }

  return response.json();
};
