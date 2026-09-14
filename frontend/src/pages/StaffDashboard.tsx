import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Activity,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  Radio,
  Cpu,
  RefreshCw,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getAnalyticsByAuthority,
  getAnalyticsMap,
  getSensorPredictions,
  getRecurrencePredictions,
} from '../api/analytics';
import {
  AnalyticsOverview,
  TrendDataPoint,
  AuthorityAnalytics,
  MapAnalyticsPoint,
  SensorPrediction,
  RecurrencePrediction,
} from '../types/analytics';
import { AnalyticsCard } from '../components/analytics/AnalyticsCard';
import { TrendChart } from '../components/analytics/TrendChart';
import { AuthorityChart } from '../components/analytics/AuthorityChart';
import {
  SensorPredictionCard,
  RecurrencePredictionCard,
} from '../components/analytics/PredictionCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatNumber, formatPercent } from '../utils/formatters';

export const StaffDashboardPage: React.FC = () => {
  const { user, isStaff, isAuthenticated, isLoading: authLoading } = useAuth();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityAnalytics[]>([]);
  const [mapPoints, setMapPoints] = useState<MapAnalyticsPoint[]>([]);
  const [sensors, setSensors] = useState<SensorPrediction[]>([]);
  const [recurrences, setRecurrences] = useState<RecurrencePrediction[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ovData, trData, authData, mapData, sensData, recData] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsTrends(),
        getAnalyticsByAuthority(),
        getAnalyticsMap(),
        getSensorPredictions(),
        getRecurrencePredictions(),
      ]);

      setOverview(ovData);
      setTrends(trData);
      setAuthorities(authData);
      setMapPoints(mapData);
      setSensors(sensData);
      setRecurrences(recData);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isStaff) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isStaff]);

  // Auth Protection (Requirement #38)
  if (!authLoading && (!isAuthenticated || !isStaff)) {
    return <Navigate to="/my-issues" replace />;
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Civic Operations & Intelligence Command
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Municipal Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Real-time telemetry, authority SLA compliance, and predictive sensor anomaly detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchDashboardData} />
      ) : (
        <>
          {/* Top KPI Cards (Requirement #39) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading || !overview ? (
              <>
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
              </>
            ) : (
              <>
                <AnalyticsCard
                  title="Total Influx Reports"
                  value={formatNumber(overview.total_reports)}
                  subtitle="Autonomous ingest from citizens"
                  trend={{ value: '+14% vs last week', isPositive: true }}
                  icon={<Layers className="w-6 h-6" />}
                  iconBgColor="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-neon-cyan border border-cyan-200 dark:border-cyan-800"
                />

                <AnalyticsCard
                  title="Active Managed Cases"
                  value={formatNumber(overview.active_issues)}
                  subtitle="Under municipal investigation"
                  trend={{ value: '342 in flight' }}
                  icon={<Clock className="w-6 h-6" />}
                  iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                />

                <AnalyticsCard
                  title="SLA Compliance Rate"
                  value={formatPercent(overview.sla_compliance_rate)}
                  subtitle="Within statutory response window"
                  trend={{ value: 'Target: >90%', isPositive: true }}
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-neon-mint border border-emerald-200 dark:border-emerald-800"
                />

                <AnalyticsCard
                  title="Autonomous Escalations"
                  value={formatNumber(overview.escalated_issues)}
                  subtitle="Approved citizen escalations"
                  trend={{ value: '78 escalated', isPositive: false }}
                  icon={<Flame className="w-6 h-6" />}
                  iconBgColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                />
              </>
            )}
          </div>

          {/* Charts Section: Influx Trends & Authority Adherence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? (
              <>
                <Skeleton className="h-96 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
              </>
            ) : (
              <>
                <TrendChart data={trends} />
                <AuthorityChart data={authorities} />
              </>
            )}
          </div>

          {/* Operations Hotspots & Anomaly Grid (Requirement #42) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  District Operations & Anomaly Grid
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Real-time density metrics by sector and telemetry anomaly flags
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapPoints.map((pt) => (
                <Card
                  key={pt.id}
                  className={`p-5 text-left border ${
                    pt.is_anomaly
                      ? 'border-rose-300 bg-rose-50/20 shadow-neon-danger'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={`w-4 h-4 ${
                          pt.is_anomaly ? 'text-rose-600' : 'text-cyan-600'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-foreground">{pt.hotspot_name}</h4>
                    </div>
                    {pt.is_anomaly && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-rose-500 text-white animate-pulse">
                        Anomaly Flag
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-foreground-secondary">
                      <span>Defect Density</span>
                      <span className="font-mono font-bold text-foreground">{pt.density}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pt.density > 80
                            ? 'bg-rose-500'
                            : pt.density > 60
                            ? 'bg-amber-500'
                            : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pt.density}%` }}
                      />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="capitalize text-foreground-muted">Type: {pt.category}</span>
                      <span className="uppercase font-mono font-semibold text-slate-700">
                        Severity: {pt.severity}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Predictive Intelligence Section (Requirement #43) */}
          <div className="space-y-6 pt-4 border-t border-border">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  AI Predictive Intelligence & Recurrence Engine
                </h3>
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                Early infrastructure risk forecasts generated from municipal IoT sensor networks and spatial pattern analysis
              </p>
            </div>

            {/* Sensor Anomaly Predictions */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary block">
                Telemetry & IoT Sensor Alerts
              </span>
              {sensors.length === 0 ? (
                <EmptyState
                  icon={<Radio className="w-6 h-6" />}
                  title="No Sensor Anomalies Detected"
                  description="All municipal IoT infrastructure telemetry is operating within nominal baselines."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sensors.map((pred) => (
                    <SensorPredictionCard key={pred.id} prediction={pred} />
                  ))}
                </div>
              )}
            </div>

            {/* Recurrence Pattern Predictions */}
            <div className="space-y-3 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary block">
                Spatial Recurrence & Preventive Resurfacing Forecasts
              </span>
              {recurrences.length === 0 ? (
                <EmptyState
                  icon={<Activity className="w-6 h-6" />}
                  title="No Recurrence Patterns"
                  description="AI predictions will appear as additional historical case volume accumulates."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recurrences.map((rec) => (
                    <RecurrencePredictionCard key={rec.id} prediction={rec} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
