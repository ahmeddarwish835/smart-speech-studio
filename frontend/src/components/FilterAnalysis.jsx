// FilterAnalysis.jsx – Per-band filter analysis plots (course requirement)
// Shows: Magnitude response, Phase response, Impulse response, Step response, Pole-zero diagram
import React, { useState } from 'react';
import { Chart } from './WaveformCharts';

const BAND_COLORS = [
  '#38bdf8', '#818cf8', '#c084fc', '#f472b6',
  '#fb923c', '#34d399', '#facc15',
];

// Pole-zero diagram using scatter plot
function PoleZeroPlot({ band }) {
  if (band.status !== 'ok') return null;
  const { zeros_real: zr, zeros_imag: zi, poles_real: pr, poles_imag: pi } = band;
  // Unit circle
  const theta = Array.from({ length: 200 }, (_, i) => (2 * Math.PI * i) / 199);
  const ux = theta.map(Math.cos);
  const uy = theta.map(Math.sin);

  return (
    <Chart
      data={[
        { x: ux, y: uy, type: 'scatter', mode: 'lines', name: 'Unit Circle',
          line: { color: 'rgba(148,163,184,0.35)', width: 1, dash: 'dot' }, showlegend: false },
        { x: zr, y: zi, type: 'scatter', mode: 'markers', name: 'Zeros',
          marker: { symbol: 'circle-open', size: 10, color: '#38bdf8', line: { width: 2 } } },
        { x: pr, y: pi, type: 'scatter', mode: 'markers', name: 'Poles',
          marker: { symbol: 'x', size: 10, color: '#f472b6', line: { width: 2 } } },
      ]}
      layout={{
        title:  { text: 'Pole-Zero Diagram', font: { color: '#e2eaf7', size: 12 } },
        xaxis:  { title: 'Real', zeroline: true, zerolinecolor: 'rgba(148,163,184,0.3)', scaleanchor: 'y' },
        yaxis:  { title: 'Imaginary', zeroline: true, zerolinecolor: 'rgba(148,163,184,0.3)' },
        margin: { l: 55, r: 20, t: 45, b: 50 },
      }}
      style={{ minHeight: 240 }}
    />
  );
}

export default function FilterAnalysis({ res }) {
  const [selectedBand, setSelectedBand] = useState(0);

  if (!res?.filter_analysis) return null;
  const bands    = res.filter_analysis;
  const band     = bands[selectedBand];
  const isOk     = band.status === 'ok';
  const clr      = BAND_COLORS[selectedBand % BAND_COLORS.length];

  return (
    <div className="space-y-5">
      {/* Band selector */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Frequency Band</p>
        <div className="flex flex-wrap gap-2">
          {bands.map((b, i) => (
            <button
              key={i}
              onClick={() => setSelectedBand(i)}
              className={`band-btn ${selectedBand === i ? 'active' : ''}`}
              style={selectedBand === i ? { borderColor: BAND_COLORS[i] + '80', color: BAND_COLORS[i] } : {}}
            >
              {b.band}
            </button>
          ))}
        </div>
      </div>

      {/* Band info strip */}
      {isOk && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="text-slate-500">Structure:</span> <span className="text-slate-200 font-medium">{band.structure}</span></span>
          <span><span className="text-slate-500">Method:</span> <span className="text-slate-200 font-medium">{band.method}</span></span>
          <span><span className="text-slate-500">Order:</span> <span className="text-slate-200 font-medium">{band.order}</span></span>
          <span><span className="text-slate-500">Range:</span> <span style={{ color: clr }} className="font-medium">{band.lo_hz ?? ''}–{band.hi_hz ?? ''} Hz</span></span>
        </div>
      )}

      {!isOk && (
        <div className="rounded-xl bg-amber-900/20 border border-amber-500/30 px-5 py-3 text-amber-300 text-sm">
          ⚠ {band.reason || 'Band skipped (above Nyquist or invalid)'}
        </div>
      )}

      {isOk && (
        <>
          {/* Magnitude + Phase side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            <Chart
              data={[{ x: band.freq_hz, y: band.magnitude_db, type: 'scatter', mode: 'lines',
                name: 'Magnitude (dB)', line: { color: clr, width: 2 } }]}
              layout={{
                title: { text: 'Magnitude Response', font: { color: '#e2eaf7', size: 12 } },
                xaxis: { title: 'Frequency (Hz)', type: 'log' },
                yaxis: { title: 'Magnitude (dB)' },
              }}
              style={{ minHeight: 260 }}
            />
            <Chart
              data={[{ x: band.freq_hz, y: band.phase_deg, type: 'scatter', mode: 'lines',
                name: 'Phase (°)', line: { color: '#f472b6', width: 2 } }]}
              layout={{
                title: { text: 'Phase Response', font: { color: '#e2eaf7', size: 12 } },
                xaxis: { title: 'Frequency (Hz)', type: 'log' },
                yaxis: { title: 'Phase (degrees)' },
              }}
              style={{ minHeight: 260 }}
            />
          </div>

          {/* Impulse + Step side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            <Chart
              data={[{ x: band.impulse_n, y: band.impulse_resp, type: 'scatter', mode: 'lines+markers',
                name: 'Impulse Response', line: { color: '#34d399', width: 1.5 },
                marker: { size: 3, color: '#34d399' } }]}
              layout={{
                title: { text: 'Impulse Response', font: { color: '#e2eaf7', size: 12 } },
                xaxis: { title: 'Sample (n)' },
                yaxis: { title: 'Amplitude' },
              }}
              style={{ minHeight: 260 }}
            />
            <Chart
              data={[{ x: band.impulse_n, y: band.step_resp, type: 'scatter', mode: 'lines',
                name: 'Step Response', line: { color: '#fb923c', width: 2 } }]}
              layout={{
                title: { text: 'Step Response', font: { color: '#e2eaf7', size: 12 } },
                xaxis: { title: 'Sample (n)' },
                yaxis: { title: 'Amplitude' },
              }}
              style={{ minHeight: 260 }}
            />
          </div>

          {/* Pole-zero plot */}
          <div className="md:w-1/2">
            <PoleZeroPlot band={band} />
          </div>
        </>
      )}
    </div>
  );
}
