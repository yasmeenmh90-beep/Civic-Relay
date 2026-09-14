type AnalyticsEvent =
  | 'page_view'
  | 'issue_started'
  | 'issue_submitted'
  | 'sla_expired_simulated'
  | 'escalation_requested'
  | 'escalation_approved'
  | 'theme_changed';

interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined | null;
}

class AnalyticsManager {
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined';
  }

  public track(event: AnalyticsEvent, properties?: AnalyticsPayload): void {
    if (!this.enabled) return;

    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      ...properties,
    };

    try {
      window.dispatchEvent(new CustomEvent('civicrelay_analytics', { detail: eventData }));
    } catch {
      // ignore
    }
  }

  public pageView(pageName: string): void {
    this.track('page_view', { page: pageName });
  }
}

export const analytics = new AnalyticsManager();

