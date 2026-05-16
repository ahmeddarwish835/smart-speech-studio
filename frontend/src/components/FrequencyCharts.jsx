// FrequencyCharts.jsx – FFT and PSD (Welch) frequency analysis
import React from 'react';
import { Chart } from './WaveformCharts';

export default function FrequencyCharts({ res }) {
  if (!res) return null;

  return (
    <div className="space-y-4">
      {/* FFT Spectrum */}
      <Chart
        data={[
          { x: res.fft_freq, y: res.fft_before, name: 'FFT Before', type: 'scatter', mode: 'lines',
            line: { color: '#38bdf8', width: 1.5 } },
          { x: res.fft_freq, y: res.fft_after,  name: 'FFT After',  type: 'scatter', mode: 'lines',
            line: { color: '#c084fc', width: 1.5 } },
        ]}
        layout={{
          title: { text: 'FFT Frequency Spectrum – Before vs After', font: { color: '#e2eaf7', size: 13 } },
          xaxis: { title: 'Frequency (Hz)', type: 'log', range: [Math.log10(10), Math.log10(res.sample_rate / 2)] },
          yaxis: { title: 'Magnitude (dB)' },
        }}
        style={{ minHeight: 320 }}
      />

      {/* PSD Welch */}
      <Chart
        data={[
          { x: res.psd_freq, y: res.psd_before, name: 'PSD Before', type: 'scatter', mode: 'lines',
            line: { color: '#38bdf8', width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(56,189,248,0.07)' },
          { x: res.psd_freq, y: res.psd_after,  name: 'PSD After',  type: 'scatter', mode: 'lines',
            line: { color: '#c084fc', width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(192,132,252,0.07)' },
        ]}
        layout={{
          title: { text: 'Power Spectral Density – Welch Method', font: { color: '#e2eaf7', size: 13 } },
          xaxis: { title: 'Frequency (Hz)', type: 'log', range: [Math.log10(10), Math.log10(res.sample_rate / 2)] },
          yaxis: { title: 'Power/Frequency (dB/Hz)' },
        }}
        style={{ minHeight: 320 }}
      />
    </div>
  );
}
