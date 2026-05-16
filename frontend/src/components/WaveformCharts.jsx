// WaveformCharts.jsx – Original vs Enhanced waveform plots
import React from 'react';
import Plot from 'react-plotly.js';

const DARK_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(7,13,26,0.6)',
  font:          { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
  margin:        { l: 55, r: 20, t: 45, b: 50 },
  legend:        { bgcolor: 'rgba(0,0,0,0)', font: { color: '#cbd5e1' } },
  xaxis: {
    gridcolor: 'rgba(51,65,85,0.5)', zerolinecolor: 'rgba(51,65,85,0.7)',
    showgrid: true, title: { font: { color: '#64748b' } },
  },
  yaxis: {
    gridcolor: 'rgba(51,65,85,0.5)', zerolinecolor: 'rgba(51,65,85,0.7)',
    showgrid: true, title: { font: { color: '#64748b' } },
  },
};

export function Chart({ data, layout, style }) {
  return (
    <Plot
      data={data}
      layout={{ ...DARK_LAYOUT, ...layout,
        xaxis: { ...DARK_LAYOUT.xaxis, ...(layout.xaxis || {}) },
        yaxis: { ...DARK_LAYOUT.yaxis, ...(layout.yaxis || {}) },
      }}
      config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ['toImage'] }}
      className="w-full"
      style={style || { minHeight: 280 }}
    />
  );
}

export default function WaveformCharts({ res }) {
  if (!res) return null;
  const { time_axis: t, original_waveform: orig, enhanced_waveform: enh, is_passthrough } = res;

  const enhancedLabel  = is_passthrough ? 'Original (No DSP)' : 'Enhanced';
  const enhancedColor  = is_passthrough ? '#38bdf8' : '#818cf8';
  const enhancedTitle  = is_passthrough ? 'Original Waveform (No DSP Applied)' : 'Enhanced Waveform';
  const comparisonTitle = is_passthrough
    ? 'Waveform – Original Audio (No DSP)'
    : 'Waveform Comparison';

  return (
    <div className="space-y-4">
      {/* Overlay comparison */}
      <Chart
        data={[
          { x: t, y: orig, name: 'Original', type: 'scatter', mode: 'lines',
            line: { color: '#38bdf8', width: 1.2 } },
          ...(!is_passthrough ? [{ x: t, y: enh, name: enhancedLabel, type: 'scatter', mode: 'lines',
            line: { color: enhancedColor, width: 1.2 } }] : []),
        ]}
        layout={{
          title: { text: comparisonTitle, font: { color: '#e2eaf7', size: 13 } },
          xaxis: { title: 'Time (s)' },
          yaxis: { title: 'Amplitude' },
        }}
      />
      {/* Side by side */}
      <div className={`grid gap-4 ${is_passthrough ? '' : 'md:grid-cols-2'}`}>
        <Chart
          data={[{ x: t, y: orig, name: 'Original', type: 'scatter', mode: 'lines',
            line: { color: '#38bdf8', width: 1 } }]}
          layout={{ title: { text: 'Original Waveform', font: { color: '#e2eaf7', size: 12 } },
            xaxis: { title: 'Time (s)' }, yaxis: { title: 'Amplitude' } }}
        />
        {!is_passthrough && (
          <Chart
            data={[{ x: t, y: enh, name: enhancedLabel, type: 'scatter', mode: 'lines',
              line: { color: enhancedColor, width: 1 } }]}
            layout={{ title: { text: enhancedTitle, font: { color: '#e2eaf7', size: 12 } },
              xaxis: { title: 'Time (s)' }, yaxis: { title: 'Amplitude' } }}
          />
        )}
      </div>
    </div>
  );
}
