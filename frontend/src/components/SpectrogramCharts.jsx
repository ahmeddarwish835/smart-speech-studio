// SpectrogramCharts.jsx – STFT Spectrograms before and after
import React from 'react';
import { Chart } from './WaveformCharts';

export default function SpectrogramCharts({ res }) {
  if (!res) return null;

  const commonLayout = (title) => ({
    title: { text: title, font: { color: '#e2eaf7', size: 12 } },
    xaxis: { title: 'Time (s)' },
    yaxis: { title: 'Frequency (Hz)' },
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Chart
        data={[{
          x: res.spectrogram_time,
          y: res.spectrogram_freq,
          z: res.spectrogram_before,
          type: 'heatmap',
          colorscale: 'Viridis',
          colorbar: { title: 'dB', tickfont: { color: '#94a3b8' } },
        }]}
        layout={commonLayout('Spectrogram – Before Enhancement')}
        style={{ minHeight: 340 }}
      />
      <Chart
        data={[{
          x: res.spectrogram_time,
          y: res.spectrogram_freq,
          z: res.spectrogram_after,
          type: 'heatmap',
          colorscale: 'Plasma',
          colorbar: { title: 'dB', tickfont: { color: '#94a3b8' } },
        }]}
        layout={commonLayout('Spectrogram – After Enhancement')}
        style={{ minHeight: 340 }}
      />
    </div>
  );
}
