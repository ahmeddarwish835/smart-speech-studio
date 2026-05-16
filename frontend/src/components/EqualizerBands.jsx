// EqualizerBands.jsx – Band gain bar chart and filter summary table
import React from 'react';
import { Chart } from './WaveformCharts';

export default function EqualizerBands({ res }) {
  if (!res) return null;

  const colors = res.band_gains_db.map(g =>
    g > 0 ? 'rgba(52,211,153,0.85)' : g < 0 ? 'rgba(248,113,113,0.85)' : 'rgba(148,163,184,0.6)'
  );

  return (
    <div className="space-y-5">
      {/* Bar chart */}
      <Chart
        data={[{
          x: res.band_labels,
          y: res.band_gains_db,
          type: 'bar',
          name: 'Band Gain (dB)',
          marker: { color: colors, line: { color: 'rgba(255,255,255,0.1)', width: 1 } },
          text: res.band_gains_db.map(g => `${g > 0 ? '+' : ''}${g} dB`),
          textposition: 'auto',
          textfont: { color: '#e2eaf7', size: 11 },
        }]}
        layout={{
          title: { text: 'Multi-Band Equalizer Gains', font: { color: '#e2eaf7', size: 13 } },
          xaxis: { title: 'Frequency Band' },
          yaxis: { title: 'Gain (dB)', zeroline: true, zerolinewidth: 2, zerolinecolor: 'rgba(148,163,184,0.4)' },
          shapes: [{ type: 'line', x0: -0.5, x1: 6.5, y0: 0, y1: 0,
            line: { color: 'rgba(148,163,184,0.4)', width: 1, dash: 'dot' } }],
        }}
        style={{ minHeight: 300 }}
      />

      {/* Filter summary table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/80 bg-slate-900/60">
              <th className="text-left p-3 text-slate-400 font-semibold">Band</th>
              <th className="text-left p-3 text-slate-400 font-semibold">Gain</th>
              <th className="text-left p-3 text-slate-400 font-semibold">Status</th>
              <th className="text-left p-3 text-slate-400 font-semibold">Structure</th>
              <th className="text-left p-3 text-slate-400 font-semibold">Method</th>
              <th className="text-left p-3 text-slate-400 font-semibold">Order</th>
            </tr>
          </thead>
          <tbody>
            {res.filter_info.map((f, i) => (
              <tr key={i} className="border-t border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                <td className="p-3 text-slate-200 font-medium">{f.band}</td>
                <td className="p-3">
                  <span className={`font-bold ${f.gain_db > 0 ? 'text-emerald-400' : f.gain_db < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {f.gain_db > 0 ? '+' : ''}{f.gain_db} dB
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    f.status === 'applied' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
                  }`}>{f.status}</span>
                </td>
                <td className="p-3 text-slate-300">{f.structure || '—'}</td>
                <td className="p-3 text-slate-400 text-xs max-w-[180px] truncate" title={f.method}>{f.method || '—'}</td>
                <td className="p-3 text-slate-300">{f.order ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
