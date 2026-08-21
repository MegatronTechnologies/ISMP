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
  setAlarmPlaying,
  setNotificationPermission,
} from '../redux/slices/emergencySlice';
import './EmergencyAlertManager.scss';

export const EmergencyArmingBanner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const {
    activeAlert,
    isArmed,
    soundReady,
    notificationPermission,
  } = useSelector(
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
      if (audioReady && activeAlert) {
        const started = await startSosAlarm();
        dispatch(setAlarmPlaying(started));
      }
    } catch (err) {
      console.warn('Error arming emergency alert:', err);
    } finally {
      setIsArming(false);
    }
  };

  if (!isAuthenticated) return null;

  const isSoundActive = soundReady || isAudioArmed();
  const notificationLabel = notificationPermission === 'granted'
    ? t('Notifications Granted')
    : notificationPermission === 'denied'
      ? t('Notifications Denied')
      : notificationPermission === 'unsupported'
        ? t('Notifications Unsupported')
        : t('Notifications Not Enabled');

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
                {notificationLabel}
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
  const {
    realIncidents,
    simulatedIncidents,
    lastSyncedAt,
  } = useSelector((state) => state.incidents);
  const {
    activeAlert,
    isAlarmPlaying,
    isOverlayOpen,
    isBannerActive,
    isArmed,
    handledIncidentIds,
  } = useSelector((state) => state.emergency);

  const knownRealIncidentIdsRef = useRef(new Set());
  const knownSimulatedIncidentIdsRef = useRef(new Set());
  const realBaselineReadyRef = useRef(false);
  const simulatedBaselineReadyRef = useRef(false);
  const liveButtonRef = useRef(null);

  // Sync current notification permission on mount
  useEffect(() => {
    const currentPerm = getNotificationPermission();
    dispatch(setNotificationPermission(currentPerm));
    dispatch(setSoundReady(isAudioArmed()));
  }, [dispatch]);

  const presentEmergencyAlert = useCallback((incident) => {
    dispatch(triggerAlert(incident));

    if (isArmed || isAudioArmed()) {
      startSosAlarm().then((started) => {
        dispatch(setAlarmPlaying(started));
        if (started) dispatch(setSoundReady(true));
      });
    } else {
      dispatch(setAlarmPlaying(false));
    }

    const cameraLabel = incident.cameraName || incident.cameraId || t('Camera');
    const detectionKey = incident.detectionType || incident.label || 'Threat Detected';
    const detectionLabel = t(detectionKey);
    const confPct = incident.confidence !== undefined
      ? Math.round(Number(incident.confidence) * 100)
      : 90;

    showSystemSosNotification({
      title: t('SOS — Threat Detected'),
      body: t('{{label}} detected on {{camera}} · Confidence {{confidence}}%', {
        label: detectionLabel,
        camera: cameraLabel,
        confidence: confPct,
      }),
      incidentId: incident.id,
      onClick: () => {
        navigate('/live-monitoring');
        dispatch(dismissOverlay());
      },
    });
  }, [dispatch, isArmed, navigate, t]);

  // The first successful central sync establishes a baseline. Existing server
  // incidents must never look like fresh emergencies after login or reload.
  useEffect(() => {
    const currentRealIncidents = Array.isArray(realIncidents) ? realIncidents : [];

    if (!isAuthenticated) {
      knownRealIncidentIdsRef.current = new Set(
        currentRealIncidents.filter((incident) => incident?.id).map((incident) => incident.id)
      );
      realBaselineReadyRef.current = false;
      return;
    }

    if (!lastSyncedAt) return;

    if (!realBaselineReadyRef.current) {
      currentRealIncidents.forEach((incident) => {
        if (incident?.id) knownRealIncidentIdsRef.current.add(incident.id);
      });
      handledIncidentIds.forEach((id) => knownRealIncidentIdsRef.current.add(id));
      realBaselineReadyRef.current = true;
      return;
    }

    const newCandidate = currentRealIncidents.find((incident) => (
      incident?.id
      && incident.status === 'NEW'
      && !knownRealIncidentIdsRef.current.has(incident.id)
      && !handledIncidentIds.includes(incident.id)
    ));

    currentRealIncidents.forEach((incident) => {
      if (incident?.id) knownRealIncidentIdsRef.current.add(incident.id);
    });

    if (newCandidate) presentEmergencyAlert(newCandidate);
  }, [
    handledIncidentIds,
    isAuthenticated,
    lastSyncedAt,
    presentEmergencyAlert,
    realIncidents,
  ]);

  // Simulated incidents are tracked independently so the existing Demo
  // Controls can exercise the same SOS workflow without a physical object.
  useEffect(() => {
    const currentSimulatedIncidents = Array.isArray(simulatedIncidents)
      ? simulatedIncidents
      : [];

    if (!simulatedBaselineReadyRef.current || !isAuthenticated) {
      knownSimulatedIncidentIdsRef.current = new Set(
        currentSimulatedIncidents
          .filter((incident) => incident?.id)
          .map((incident) => incident.id)
      );
      simulatedBaselineReadyRef.current = isAuthenticated;
      return;
    }

    const newCandidate = currentSimulatedIncidents.find((incident) => (
      incident?.id
      && incident.status === 'NEW'
      && !knownSimulatedIncidentIdsRef.current.has(incident.id)
      && !handledIncidentIds.includes(incident.id)
    ));

    currentSimulatedIncidents.forEach((incident) => {
      if (incident?.id) knownSimulatedIncidentIdsRef.current.add(incident.id);
    });

    if (newCandidate) presentEmergencyAlert(newCandidate);
  }, [
    handledIncidentIds,
    isAuthenticated,
    presentEmergencyAlert,
    simulatedIncidents,
  ]);

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

  useEffect(() => {
    if (isAuthenticated) return;
    stopSosAlarm();
    if (activeAlert || isAlarmPlaying || isOverlayOpen || isBannerActive) {
      dispatch(stopEmergencyAlert());
    }
  }, [
    activeAlert,
    dispatch,
    isAlarmPlaying,
    isAuthenticated,
    isBannerActive,
    isOverlayOpen,
  ]);

  const handleOpenLiveMonitoring = () => {
    dispatch(dismissOverlay());
    navigate('/live-monitoring');
  };

  const handleStopAlarm = () => {
    stopSosAlarm();
    dispatch(stopEmergencyAlert());
  };

  const handleEnableAlarmSound = async () => {
    const ready = await initAudioContext();
    dispatch(setSoundReady(ready));
    dispatch(setArmed(true));
    if (!ready || !activeAlert) {
      dispatch(setAlarmPlaying(false));
      return;
    }
    const started = await startSosAlarm();
    dispatch(setAlarmPlaying(started));
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
                {t('Emergency Alert Active')}: {t(activeAlert.detectionType)}
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
                    {t(activeAlert.detectionType)}
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
              {isAlarmPlaying ? (
                <div className="sos-audio-indicator">
                  <div className="audio-pulse-dot" />
                  <Volume2 size={16} />
                  <span>{t('Audio Alarm Running')} — SOS (··· ——— ···)</span>
                </div>
              ) : (
                <div className="sos-audio-indicator sound-blocked">
                  <VolumeX size={16} />
                  <span>{t('Sound Requires Activation')}</span>
                  <button type="button" onClick={handleEnableAlarmSound}>
                    {t('Enable Alarm Sound')}
                  </button>
                </div>
              )}
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
