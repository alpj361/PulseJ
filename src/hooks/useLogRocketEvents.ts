import { useCallback } from 'react';
import LogRocket from 'logrocket';
import { useUserProfile } from './useUserProfile';

export function useLogRocketEvents() {
  const { profile } = useUserProfile();

  // Eventos de navegación
  const trackPageView = useCallback((pageName: string, additionalData?: Record<string, any>) => {
    LogRocket.track('Page View', {
      page: pageName,
      userId: profile?.id,
      userRole: profile?.role,
      userCredits: profile?.credits,
      ...additionalData
    });
  }, [profile]);

  // Eventos de créditos
  const trackCreditUsage = useCallback((action: string, creditsUsed: number, remainingCredits: number, operation?: string) => {
    LogRocket.track('Credit Usage', {
      action,
      creditsUsed,
      remainingCredits,
      operation,
      userId: profile?.id,
      userRole: profile?.role
    });
  }, [profile]);

  // Eventos de proyectos
  const trackProjectAction = useCallback((action: string, projectId?: string, projectName?: string, additionalData?: Record<string, any>) => {
    LogRocket.track('Project Action', {
      action,
      projectId,
      projectName,
      userId: profile?.id,
      userRole: profile?.role,
      userCredits: profile?.credits,
      ...additionalData
    });
  }, [profile]);

  // Eventos de decisiones por capas
  const trackLayerDecision = useCallback((action: string, decisionType: 'enfoque' | 'alcance' | 'configuracion', projectId?: string, additionalData?: Record<string, any>) => {
    LogRocket.track('Layer Decision', {
      action,
      decisionType,
      projectId,
      userId: profile?.id,
      userRole: profile?.role,
      userLayersLimit: profile?.layerslimit,
      ...additionalData
    });
  }, [profile]);

  // Eventos de sondeos
  const trackSondeoAction = useCallback((action: string, contexts?: string[], question?: string, additionalData?: Record<string, any>) => {
    LogRocket.track('Sondeo Action', {
      action,
      contexts,
      questionLength: question?.length,
      userId: profile?.id,
      userRole: profile?.role,
      userCredits: profile?.credits,
      ...additionalData
    });
  }, [profile]);

  // Eventos de transcripción
  const trackTranscriptionAction = useCallback((action: string, fileType?: string, fileSize?: number, additionalData?: Record<string, any>) => {
    LogRocket.track('Transcription Action', {
      action,
      fileType,
      fileSize,
      userId: profile?.id,
      userRole: profile?.role,
      ...additionalData
    });
  }, [profile]);

  // Eventos de errores
  const trackError = useCallback((errorType: string, errorMessage: string, context?: string, additionalData?: Record<string, any>) => {
    LogRocket.track('Error', {
      errorType,
      errorMessage,
      context,
      userId: profile?.id,
      userRole: profile?.role,
      userCredits: profile?.credits,
      ...additionalData
    });
  }, [profile]);

  // Eventos de autenticación
  const trackAuthAction = useCallback((action: 'login' | 'logout' | 'register' | 'profile_update', additionalData?: Record<string, any>) => {
    LogRocket.track('Auth Action', {
      action,
      userId: profile?.id,
      userRole: profile?.role,
      ...additionalData
    });
  }, [profile]);

  return {
    trackPageView,
    trackCreditUsage,
    trackProjectAction,
    trackLayerDecision,
    trackSondeoAction,
    trackTranscriptionAction,
    trackError,
    trackAuthAction
  };
} 