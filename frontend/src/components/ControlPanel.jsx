// ControlPanel.jsx – Audio source selection, preset/filter controls, EQ sliders
import React from 'react';
import { SlidersHorizontal, Upload, Music, Play } from 'lucide-react';

const PRESETS = [
  'Original / No Processing',
  'Podcast Cleaner',
  'Lecture Clarity',
  'Noise Reduction',
  'Bass Boost',
  'Treble Boost',
  'Custom Equalizer',
];
const FILTERS  = ['FIR', 'Butterworth', 'Chebyshev'];
const BAND_LABELS = ['0–100 Hz','100–300 Hz','300–800 Hz','800 Hz–2 kHz','2–5 kHz','5–10 kHz','10–20 kHz'];

const PRESET_DESCRIPTIONS = {
  'Original / No Processing': 'Passthrough – original audio returned with no DSP applied',
  'Podcast Cleaner':   'Reduces low rumble & high hiss; boosts speech presence',
  'Lecture Clarity':   'Enhances mid-range vocal intelligibility',
  'Noise Reduction':   'Aggressive suppression of non-speech frequency bands',
  'Bass Boost':        'Boosts sub-bass and bass frequency bands',
  'Treble Boost':      'Boosts presence and air frequencies',
  'Custom Equalizer':  'Manually adjust each frequency band below',
};

export default function ControlPanel({
  tests, mode, setMode, testId, setTestId, preset, setPreset,
  filter, setFilter, file, setFile, gains, setGains, loading, onRun,
}) {
  const isPassthrough = preset === 'Original / No Processing';

  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={20} className="text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">Control Panel</h2>
      </div>

      {/* Mode toggle */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Input Source</p>
        <div className="flex gap-2">
          <button onClick={() => setMode('built-in')} className={`mode-btn ${mode === 'built-in' ? 'active' : ''}`}>
            <Music size={13} className="inline mr-1" /> Built-in Test
          </button>
          <button onClick={() => setMode('upload')} className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}>
            <Upload size={13} className="inline mr-1" /> Upload Audio
          </button>
        </div>
      </div>

      {/* Audio source */}
      {mode === 'built-in' ? (
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Test File</label>
          <select value={testId} onChange={e => setTestId(e.target.value)}>
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.label} – {t.description}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Upload File (.wav / .mp3 / .m4a)</label>
          <input type="file" accept=".wav,.mp3,.m4a" onChange={e => setFile(e.target.files[0])} />
          {file && <p className="text-xs text-emerald-400 mt-1.5">✓ {file.name}</p>}
        </div>
      )}

      {/* Preset */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Enhancement Preset</label>
        <select value={preset} onChange={e => setPreset(e.target.value)}>
          {PRESETS.map(p => <option key={p}>{p}</option>)}
        </select>
        {/* Preset description badge */}
        <p className={`text-xs mt-1.5 ${isPassthrough ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
          {PRESET_DESCRIPTIONS[preset] || ''}
        </p>
        {isPassthrough && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold">
            ⚡ No DSP enhancement applied — original audio only
          </div>
        )}
      </div>

      {/* Filter type – hidden in passthrough mode */}
      {!isPassthrough && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Filter Type</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            {FILTERS.map(f => <option key={f}>{f}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'FIR'         && 'FIR: Linear phase, Hamming-windowed sinc'}
            {filter === 'Butterworth' && 'IIR Butterworth: Maximally flat magnitude response'}
            {filter === 'Chebyshev'   && 'IIR Chebyshev Type I: Steeper rolloff, 1 dB passband ripple'}
          </p>
        </div>
      )}

      {/* Custom EQ sliders – hidden in passthrough mode */}
      {preset === 'Custom Equalizer' && !isPassthrough && (
        <div className="space-y-3 border-t border-slate-700/60 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custom Band Gains</p>
          {BAND_LABELS.map((lbl, i) => (
            <label key={lbl} className="block">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{lbl}</span>
                <span className={`font-bold ${gains[i] > 0 ? 'text-emerald-400' : gains[i] < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {gains[i] > 0 ? '+' : ''}{gains[i]} dB
                </span>
              </div>
              <input
                type="range" min="-12" max="12" step="0.5"
                value={gains[i]}
                onChange={e => {
                  const ng = [...gains];
                  ng[i] = Number(e.target.value);
                  setGains(ng);
                }}
              />
            </label>
          ))}
          <button
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            onClick={() => setGains([0,0,0,0,0,0,0])}
          >Reset all bands to 0 dB</button>
        </div>
      )}

      {/* Run button */}
      <button
        className="btn-primary w-full mt-2"
        disabled={loading || (mode === 'upload' && !file)}
        onClick={onRun}
      >
        <Play size={16} />
        {loading ? 'Processing…' : isPassthrough ? 'Load Original Audio' : 'Run Enhancement'}
      </button>
    </div>
  );
}
