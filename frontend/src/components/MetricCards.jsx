// MetricCards.jsx – Result metrics display
import React from 'react';
import { Activity, Zap, Volume2, Clock, Cpu, TrendingUp, Info } from 'lucide-react';

function MetricCard({ label, value, sub, icon: Icon, accent = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-400',
    cyan:   'text-cyan-400',
    emerald:'text-emerald-400',
    violet: 'text-violet-400',
    amber:  'text-amber-400',
    rose:   'text-rose-400',
    slate:  'text-slate-400',
  };
  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={14} className={colors[accent]} />}
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-black ${colors[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MetricCards({ res }) {
  if (!res) return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">Result Metrics</h2>
      </div>
      <p className="text-slate-400 text-sm">
        Select an audio source, choose a preset and filter type, then click{' '}
        <strong className="text-slate-200">Run Enhancement</strong> to see DSP analysis results here.
      </p>
    </div>
  );

  const isPassthrough = res.is_passthrough;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">Result Metrics</h2>
        {isPassthrough && (
          <span className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 text-xs font-semibold">
            <Info size={10} /> No DSP applied
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard label="Source"      value={res.selected_test || res.original_filename} icon={Volume2}    accent="cyan"    />
        <MetricCard label="Preset"      value={res.preset_mode}                            icon={Zap}        accent={isPassthrough ? 'amber' : 'violet'} />
        <MetricCard label="Filter"      value={res.filter_type}                            icon={Cpu}        accent={isPassthrough ? 'slate' : 'indigo'} />
        <MetricCard label="Sample Rate" value={`${res.sample_rate.toLocaleString()} Hz`}  icon={Activity}   accent="cyan"    />
        <MetricCard label="Duration"    value={`${res.duration_seconds}s`}                icon={Clock}      accent="amber"   />
        <MetricCard
          label="Clarity Score"
          value={isPassthrough ? `${res.clarity_score}%` : `${res.clarity_score}%`}
          icon={TrendingUp}
          accent="emerald"
          sub={isPassthrough ? 'Original audio baseline' : 'Speech band energy ratio'}
        />
        <MetricCard
          label="Noise Reduction"
          value={isPassthrough ? 'N/A' : `${res.noise_reduction_percent}%`}
          icon={Zap}
          accent={isPassthrough ? 'slate' : 'emerald'}
          sub={isPassthrough ? 'No filtering applied' : 'Non-speech energy reduction'}
        />
        <MetricCard
          label="SNR Improvement"
          value={isPassthrough ? 'N/A' : `${res.snr_improvement_db >= 0 ? '+' : ''}${res.snr_improvement_db} dB`}
          icon={TrendingUp}
          accent={isPassthrough ? 'slate' : 'violet'}
          sub={isPassthrough ? 'No DSP processing' : 'Signal-to-noise ratio'}
        />
        <MetricCard label="RMS Level"   value={res.rms_before.toFixed(4)}                 icon={Volume2}    accent="rose"    sub="Original RMS amplitude"  />
        {!isPassthrough && (
          <>
            <MetricCard label="RMS After"   value={res.rms_after.toFixed(4)}              icon={Volume2}    accent="emerald" sub="Enhanced RMS amplitude" />
            <MetricCard
              label="RMS Change"
              value={`${res.rms_after >= res.rms_before ? '+' : ''}${((res.rms_after - res.rms_before) * 100 / (res.rms_before + 1e-9)).toFixed(1)}%`}
              icon={TrendingUp}
              accent="amber"
              sub="Loudness change"
            />
            <MetricCard
              label="Bands Applied"
              value={`${res.filter_info.filter(f => f.status === 'applied').length} / 7`}
              icon={Cpu}
              accent="indigo"
              sub="Active EQ bands"
            />
          </>
        )}
      </div>
    </div>
  );
}
