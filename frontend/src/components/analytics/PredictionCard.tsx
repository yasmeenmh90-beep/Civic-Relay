import React from 'react';
import { SensorPrediction, RecurrencePrediction } from '../../types/analytics';
import { Card } from '../ui/Card';
import { Sparkles, Radio, AlertOctagon, Activity, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { formatPercent } from '../../utils/formatters';

export interface SensorPredictionCardProps {
  prediction: SensorPrediction;
}

export const SensorPredictionCard: React.FC<SensorPredictionCardProps> = ({ prediction }) => {
  const isCritical = prediction.risk_level === 'critical' || prediction.risk_level === 'high';

  return (
    <Card
      className={`p-5 text-left border transition-all duration-300 ${
        isCritical ? 'border-rose-200/80 bg-rose-50/20 hover:border-rose-300' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border ${
              isCritical
                ? 'bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-100'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              {prediction.zone}
            </span>
            <h4 className="text-sm font-bold text-foreground">{prediction.anomaly_type}</h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isCritical
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {prediction.risk_level} Risk
          </span>
          <div className="text-[11px] font-mono text-foreground-secondary mt-0.5">
            {formatPercent(prediction.confidence_score)} Confidence
          </div>
        </div>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100 mb-3">
        {prediction.description}
      </p>

      <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground">Recommended Preventive Action: </span>
          <span className="text-foreground-secondary">{prediction.suggested_action}</span>
        </div>
      </div>
    </Card>
  );
};

export interface RecurrencePredictionCardProps {
  prediction: RecurrencePrediction;
}

export const RecurrencePredictionCard: React.FC<RecurrencePredictionCardProps> = ({ prediction }) => {
  return (
    <Card className="p-5 text-left border border-border hover:border-slate-300 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              {prediction.zone}
            </span>
            <h4 className="text-sm font-bold text-foreground">{prediction.issue_category}</h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
            {prediction.recurrence_probability}% Recurrence
          </span>
          <div className="text-[11px] font-mono text-foreground-secondary mt-0.5">
            {prediction.cluster_history_count} Past Cases
          </div>
        </div>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100 mb-3">
        {prediction.summary}
      </p>

      <div className="text-xs bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2 text-purple-950">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Preventive Measure: </span>
          <span className="text-purple-800">{prediction.recommended_preventive_measure}</span>
        </div>
      </div>
    </Card>
  );
};
