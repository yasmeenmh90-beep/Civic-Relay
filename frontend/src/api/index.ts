import * as realAuth from './real/auth';
import * as realIssues from './real/issues';
import * as realTickets from './real/tickets';
import * as realUploads from './real/uploads';
import * as realAnalytics from './real/analytics';
import * as realHealth from './real/health';
import { mockService } from './mock/mockService';
import { getIsDynamicMode, probeSystemStatus } from './modeManager';

export * from './real/client';
export * from './modeManager';
export * from './adapters/issueAdapter';
export * from './adapters/ticketAdapter';
export * from './adapters/analyticsAdapter';

// Kick off probe on module load
probeSystemStatus().catch(() => {});

// Helper function to dispatch to real API (when dynamic mode active) or mock service (demo data)
const isDynamic = () => getIsDynamicMode();

// Auth
export const loginUser = async (...args: Parameters<typeof realAuth.loginUser>) => {
  await probeSystemStatus();
  return isDynamic() ? realAuth.loginUser(...args) : mockService.loginUser(...args);
};

export const signupUser = async (...args: Parameters<typeof realAuth.signupUser>) => {
  await probeSystemStatus();
  return isDynamic() ? realAuth.signupUser(...args) : mockService.signupUser(...args);
};

export const getCurrentUser = async (...args: Parameters<typeof realAuth.getCurrentUser>) => {
  await probeSystemStatus();
  return isDynamic() ? realAuth.getCurrentUser(...args) : mockService.getCurrentUser(...args);
};

// Issues
export const createIssue = async (...args: Parameters<typeof realIssues.createIssue>) => {
  await probeSystemStatus();
  return isDynamic() ? realIssues.createIssue(...args) : mockService.createIssue(...args);
};

export const getIssues = async (...args: Parameters<typeof realIssues.getIssues>) => {
  await probeSystemStatus();
  return isDynamic() ? realIssues.getIssues(...args) : mockService.getIssues(...args);
};

export const getIssueById = async (...args: Parameters<typeof realIssues.getIssueById>) => {
  await probeSystemStatus();
  return isDynamic() ? realIssues.getIssueById(...args) : mockService.getIssueById(...args);
};

export const getIssueClusters = async (...args: Parameters<typeof realIssues.getIssueClusters>) => {
  await probeSystemStatus();
  return isDynamic() ? realIssues.getIssueClusters(...args) : mockService.getIssueClusters(...args);
};

// Tickets
export const getSLAStatus = async (...args: Parameters<typeof realTickets.getSLAStatus>) => {
  await probeSystemStatus();
  return isDynamic() ? realTickets.getSLAStatus(...args) : mockService.getSLAStatus(...args);
};

export const simulateSLAExpiry = async (...args: Parameters<typeof realTickets.simulateSLAExpiry>) => {
  await probeSystemStatus();
  return isDynamic() ? realTickets.simulateSLAExpiry(...args) : mockService.simulateSLAExpiry(...args);
};

export const escalateTicket = async (...args: Parameters<typeof realTickets.escalateTicket>) => {
  await probeSystemStatus();
  return isDynamic() ? realTickets.escalateTicket(...args) : mockService.escalateTicket(...args);
};

export const approveEscalation = async (...args: Parameters<typeof realTickets.approveEscalation>) => {
  await probeSystemStatus();
  return isDynamic() ? realTickets.approveEscalation(...args) : mockService.approveEscalation(...args);
};

export const resolveTicket = async (...args: Parameters<typeof realTickets.resolveTicket>) => {
  await probeSystemStatus();
  return isDynamic() ? realTickets.resolveTicket(...args) : mockService.resolveTicket(...args);
};

// Uploads
export const uploadImage = async (...args: Parameters<typeof realUploads.uploadImage>) => {
  await probeSystemStatus();
  return isDynamic() ? realUploads.uploadImage(...args) : mockService.uploadImage(...args);
};

export const uploadAudio = async (...args: Parameters<typeof realUploads.uploadAudio>) => {
  await probeSystemStatus();
  return isDynamic() ? realUploads.uploadAudio(...args) : mockService.uploadAudio(...args);
};

// Analytics
export const getAnalyticsOverview = async (...args: Parameters<typeof realAnalytics.getAnalyticsOverview>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getAnalyticsOverview(...args) : mockService.getAnalyticsOverview(...args);
};

export const getAnalyticsTrends = async (...args: Parameters<typeof realAnalytics.getAnalyticsTrends>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getAnalyticsTrends(...args) : mockService.getAnalyticsTrends(...args);
};

export const getAnalyticsByAuthority = async (...args: Parameters<typeof realAnalytics.getAnalyticsByAuthority>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getAnalyticsByAuthority(...args) : mockService.getAnalyticsByAuthority(...args);
};

export const getAnalyticsMap = async (...args: Parameters<typeof realAnalytics.getAnalyticsMap>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getAnalyticsMap(...args) : mockService.getAnalyticsMap(...args);
};

export const getSensorPredictions = async (...args: Parameters<typeof realAnalytics.getSensorPredictions>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getSensorPredictions(...args) : mockService.getSensorPredictions(...args);
};

export const getRecurrencePredictions = async (...args: Parameters<typeof realAnalytics.getRecurrencePredictions>) => {
  await probeSystemStatus();
  return isDynamic() ? realAnalytics.getRecurrencePredictions(...args) : mockService.getRecurrencePredictions(...args);
};

// Health
export const checkHealth = async (...args: Parameters<typeof realHealth.checkHealth>) => {
  return realHealth.checkHealth(...args);
};
