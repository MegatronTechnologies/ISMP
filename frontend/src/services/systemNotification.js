/**
 * Native System Notification Service for SOS Emergency Alerts
 */

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return Notification.permission || 'denied';
  }
};

/**
 * Dispatches a native browser OS notification with user click action.
 */
export const showSystemSosNotification = ({
  title,
  body,
  incidentId,
  onClick,
}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const tag = incidentId ? `ismp-sos-${incidentId}` : 'ismp-sos-alert';
    const notification = new Notification(title || 'SOS — Threat Detected', {
      body: body || 'Emergency threat detected on camera.',
      tag,
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch (_e) {}
      if (typeof onClick === 'function') {
        onClick();
      }
      try {
        notification.close();
      } catch (_e) {}
    };

    return notification;
  } catch (err) {
    console.warn('Could not dispatch OS notification:', err);
    return null;
  }
};
