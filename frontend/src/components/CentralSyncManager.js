import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCentralIncidents, fetchCentralNotifications } from '../services/centralIncidentApi';
import { setRealIncidents, setIncidentSyncError } from '../redux/slices/incidentSlice';
import { setRealNotifications, setNotificationSyncError } from '../redux/slices/notificationSlice';

/**
 * Background synchronization manager for Central Control Plane data.
 * Safely polls central incidents and notifications every 2 seconds when mounted,
 * cancels in-flight requests on unmount, and preserves state during errors.
 */
const CentralSyncManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const isSyncingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);

  const performSync = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const [incidentsResult, notificationsResult] = await Promise.allSettled([
        fetchCentralIncidents({ signal: controller.signal }),
        fetchCentralNotifications({ signal: controller.signal }),
      ]);

      if (incidentsResult.status === 'fulfilled') {
        dispatch(setRealIncidents(incidentsResult.value));
      } else if (!controller.signal.aborted) {
        dispatch(setIncidentSyncError(incidentsResult.reason?.message || 'Incident sync error'));
      }

      if (notificationsResult.status === 'fulfilled') {
        dispatch(setRealNotifications(notificationsResult.value));
      } else if (!controller.signal.aborted) {
        dispatch(setNotificationSyncError(notificationsResult.reason?.message || 'Notification sync error'));
      }
    } catch (_error) {
      // Ignored - handled in settled results
    } finally {
      isSyncingRef.current = false;
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    performSync();

    intervalRef.current = setInterval(() => {
      performSync();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isSyncingRef.current = false;
    };
  }, [isAuthenticated, performSync]);

  return null;
};

export default CentralSyncManager;
