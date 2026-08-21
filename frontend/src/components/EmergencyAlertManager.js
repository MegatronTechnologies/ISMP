import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Bell,
  Radio,
  Video,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Info,
} from 'lucide-react';
import {
  startSosAlarm,
  stopSosAlarm,
  initAudioContext,
  isAudioArmed,
} from '../services/sosAlarm';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showSystemSosNotification,
} from '../services/systemNotification';
import {
  triggerAlert,
  dismissOverlay,
  stopEmergencyAlert,
  setArmed,
  setSoundReady,
  setNotificationPermission,
} from '../redux/slices/emergencySlice';
import './EmergencyAlertManager.scss';

export const EmergencyArmingBanner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isArmed, soundReady, notificationPermission } = useSelector(
    (state) => state.emergency
  );
  const [isArming, setIsArming] = useState(false);

  const handleArm = async () => {
    setIsArming(true);
    try {
      // 1. Request notification permissions
      const perm = await requestNotificationPermission();
      dispatch(setNotificationPermission(perm));

      // 2. Initialize and unlock Web Audio AudioContext with user interaction
      const audioReady = await initAudioContext();
      dispatch(setSoundReady(audioReady));
      dispatch(setArmed(true));
    } catch (err) {
      console.warn('Error arming emergency alert:', err);
    } finally {
      setIsArming(false);
    }
  };

  if (!isAuthenticated) return null;

  const isSoundActive = soundReady || isAudioArmed();

  return (
    <div
      className={`sos-arming-banner ${isArmed && isSoundActive ? 'armed' : ''}`}
      id="sos-arming-banner"
    >
      <div className="arming-left">
        <ShieldAlert size={22} className="arming-icon" />
        <div className="arming-info">
          <div className="arming-title-row">
            <span className="arming-title">
              {isArmed ? t('SOS Alerts Enabled') : t('Enable SOS Alerts')}
            </span>
            <div className="arming-badges">
              {/* Notification Badge */}
              <span
                className={`badge-pill badge-${notificationPermission}`}
                title={t('Browser Notification Status')}
              >
                <Bell size={12} />
                {notificationPermission === 'granted'
                  ? t('Notifications Granted')
                  : notificationPermission === 'denied'
                  ? t('Notifications Denied')
                  : t('Notifications Unsupported')}
              </span>

              {/* Sound Status Badge */}
              <span
                className={`badge-pill ${
                  isSoundActive ? 'badge-ready' : 'badge-requires-action'
                }`}
                title={t('Audio Alarm Status')}
              >
                {isSoundActive ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {isSoundActive ? t('Sound Armed') : t('Sound Requires Activation')}
              </span>
            </div>
          </div>
          <span className="arming-desc">
            {t(
              'After a browser reload, audio must be re-activated due to browser autoplay policies.'
            )}
          </span>
        </div>
      </div>

      <div className="arming-actions">
        {(!isArmed || !isSoundActive) ? (
          <button
            type="button"
            className="btn-arm-sos"
            onClick={handleArm}
            disabled={isArming}
            id="btn-enable-sos"
          >
            <Radio size={14} />
            {isArming ? '...' : t('Enable SOS Alerts')}
          </button>
        ) : (
          <button
            type="button"
            className="btn-arm-armed"
            onClick={handleArm}
            title={t('Click to re-verify audio context')}
            id="btn-sos-armed-status"
          >
            <CheckCircle2 size={14} />
            {t('SOS Alerts Enabled')}
          </button>
        )}
      </div>
    </div>
  );
};

const EmergencyAlertManager = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const incidents = useSelector((state) => state.incidents.incidents);
  const {
    activeAlert,
    isAlarmPlaying,
    isOverlayOpen,
    isBannerActive,
    isArmed,
    handledIncidentIds,
  } = useSelector((state) => state.emergency);

  const knownIncidentIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);
  const liveButtonRef = useRef(null);

  // Sync current notification permission on mount
  useEffect(() => {
    const currentPerm = getNotificationPermission();
    dispatch(setNotificationPermission(currentPerm));
    dispatch(setSoundReady(isAudioArmed()));
  }, [dispatch]);

  // Track initial state and handle detection of genuinely new incidents
  useEffect(() => {
    if (!incidents || !Array.isArray(incidents)) return;

    // First load: populate existing IDs without triggering alarms
    if (!isInitializedRef.current) {
      incidents.forEach((inc) => {
        if (inc && inc.id) knownIncidentIdsRef.current.add(inc.id);
      });
      handledIncidentIds.forEach((id) => {
        if (id) knownIncidentIdsRef.current.add(id);
      });
      isInitializedRef.current = true;
      return;
    }

    // Subsequent updates: check for new unhandled incident
    const newCandidate = incidents.find(
      (inc) =>
        inc &&
        inc.id &&
        !knownIncidentIdsRef.current.has(inc.id) &&
        !handledIncidentIds.includes(inc.id) &&
        (inc.status === 'NEW' || inc.source === 'YOLO_EDGE' || inc.source === 'SIMULATED')
    );

    // Keep known IDs updated to prevent retriggering during polling
    incidents.forEach((inc) => {
      if (inc && inc.id) knownIncidentIdsRef.current.add(inc.id);
    });

    if (newCandidate) {
      knownIncidentIdsRef.current.add(newCandidate.id);

      // Trigger Redux emergency state
      dispatch(triggerAlert(newCandidate));

      // Start Web Audio Morse Code SOS Alarm
      startSosAlarm().then((started) => {
        if (started) {
          dispatch(setSoundReady(true));
        }
      });

      // Dispatch Native System Notification
      const cameraLabel = newCandidate.cameraName || newCandidate.cameraId || 'Camera';
      const detectionLabel = newCandidate.detectionType || newCandidate.label || 'Threat';
      const confPct =
        newCandidate.confidence !== undefined
          ? Math.round(Number(newCandidate.confidence) * 100)
          : 90;

      showSystemSosNotification({
        title: t('SOS — Threat Detected'),
        body: t('{{label}} detected on {{camera}} · Confidence {{confidence}}%', {
          label: detectionLabel,
          camera: cameraLabel,
          confidence: confPct,
        }),
        incidentId: newCandidate.id,
        onClick: () => {
          navigate('/live-monitoring');
          dispatch(dismissOverlay());
        },
      });
    }
  }, [incidents, handledIncidentIds, dispatch, navigate, t]);

  // Focus management when overlay opens
  useEffect(() => {
    if (isOverlayOpen && liveButtonRef.current) {
      liveButtonRef.current.focus();
    }
  }, [isOverlayOpen]);

  // Prevent Escape from silently stopping the critical alarm
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOverlayOpen) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isOverlayOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const handleOpenLiveMonitoring = () => {
    dispatch(dismissOverlay());
    navigate('/live-monitoring');
  };

  const handleStopAlarm = () => {
    stopSosAlarm();
    dispatch(stopEmergencyAlert());
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toLocaleTimeString();
    try {
      return new Date(timestamp).toLocaleString(i18n.language || 'en', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch (_e) {
      return timestamp;
    }
  };

  return (
    <div className="emergency-alert-manager" id="emergency-alert-manager">
      {/* 1. Persistent Emergency Active Top Bar (Visible when banner is active and full overlay is dismissed) */}
      {isBannerActive && !isOverlayOpen && activeAlert && (
        <div
          className="sos-persistent-banner"
          role="status"
          aria-live="assertive"
          id="sos-persistent-banner"
        >
          <div className="banner-left">
            <Radio size={20} className="banner-pulse-icon" />
            <div className="banner-text">
              <span className="banner-title">
                {t('Emergency Alert Active')}: {activeAlert.detectionType}
              </span>
              <span className="banner-subtitle">
                {activeAlert.cameraName} ({activeAlert.id})
              </span>
            </div>
          </div>

          <div className="banner-right">
            {location.pathname !== '/live-monitoring' && (
              <button
                type="button"
                className="btn-banner-live"
                onClick={handleOpenLiveMonitoring}
                id="btn-banner-live"
              >
                <Video size={14} />
                {t('Open Live Monitoring')}
              </button>
            )}
            <button
              type="button"
              className="btn-banner-stop"
              onClick={handleStopAlarm}
              id="btn-banner-stop"
            >
              <VolumeX size={14} />
              {t('Stop Alarm')}
            </button>
          </div>
        </div>
      )}

      {/* 2. Full-Viewport Emergency SOS Overlay Dialog */}
      {isOverlayOpen && activeAlert && (
        <div
          className="sos-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sos-alert-title"
          aria-describedby="sos-alert-desc"
          id="sos-alert-dialog"
        >
          <div className="sos-modal-card">
            {/* Header */}
            <div className="sos-header">
              <div className="sos-beacon">
                <ShieldAlert size={32} />
              </div>
              <div className="sos-header-text">
                <div className="sos-eyebrow">
                  <AlertTriangle size={14} />
                  <span>{t('SOS Emergency Alert')}</span>
                </div>
                <h2 className="sos-title" id="sos-alert-title">
                  {t('CRITICAL THREAT DETECTED')}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="sos-body">
              <p className="sos-description" id="sos-alert-desc">
                {t(
                  'Live edge detection identified a potential threat. Immediate response required.'
                )}
              </p>

              {/* Details Grid */}
              <div className="sos-details-grid">
                <div className="sos-detail-item">
                  <span className="label">{t('Camera')}</span>
                  <span className="value">
                    {activeAlert.cameraName} ({activeAlert.cameraId})
                  </span>
                </div>

                <div className="sos-detail-item">
                  <span className="label">{t('Detection Type')}</span>
                  <span className="value highlight-red">
                    {activeAlert.detectionType}
                  </span>
                </div>

                <div className="sos-detail-item">
                  <span className="label">{t('Confidence')}</span>
                  <span className="value">
                    {Math.round((activeAlert.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="sos-detail-item">
                  <span className="label">{t('Detection Time')}</span>
                  <span className="value">
                    {formatTimestamp(activeAlert.timestamp)}
                  </span>
                </div>

                <div className="sos-detail-item">
                  <span className="label">{t('Incident ID')}</span>
                  <span className="value">{activeAlert.id}</span>
                </div>

                <div className="sos-detail-item">
                  <span className="label">{t('Source')}</span>
                  <span className="value">
                    {activeAlert.source === 'SIMULATED'
                      ? t('Simulated Threat')
                      : 'Edge AI (YOLO)'}
                  </span>
                </div>
              </div>

              {/* Audio Pulse Bar */}
              <div className="sos-audio-indicator">
                <div className="audio-pulse-dot" />
                <Volume2 size={16} />
                <span>{t('Audio Alarm Running')} — SOS (··· ——— ···)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="sos-actions">
              <button
                type="button"
                className="btn-sos-live"
                ref={liveButtonRef}
                onClick={handleOpenLiveMonitoring}
                id="btn-sos-open-live"
              >
                <Video size={18} />
                {t('Open Live Monitoring')}
              </button>

              <button
                type="button"
                className="btn-sos-stop"
                onClick={handleStopAlarm}
                id="btn-sos-stop"
              >
                <VolumeX size={18} />
                {t('Stop Alarm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertManager;
