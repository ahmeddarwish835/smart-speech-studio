// App.jsx – Smart Speech Studio
// DSP Course Project II – Multi-Band Speech Equalizer for Podcast Enhancement
import React, { useState, useEffect } from 'react';
import { Waves, AlertCircle, Loader2, Zap, CheckCircle2, WifiOff } from 'lucide-react';
import { getTests, enhanceBuiltIn, enhanceUpload, healthCheck } from './api';

import ControlPanel      from './components/ControlPanel';
import MetricCards       from './components/MetricCards';
import AudioPlayers      from './components/AudioPlayers';
import WaveformCharts    from './components/WaveformCharts';
import FrequencyCharts   from './components/FrequencyCharts';
import SpectrogramCharts from './components/SpectrogramCharts';
import EqualizerBands    from './components/EqualizerBands';
import FilterAnalysis    from './components/FilterAnalysis';

const TABS = [
  { id: 'audio',       label: '🎧 Audio' },
  { id: 'waveform',    label: '〰 Waveform' },
  { id: 'frequency',   label: '📊 Frequency' },
  { id: 'spectrogram', label: '🌈 Spectrogram' },
  { id: 'equalizer',   label: '🎚 EQ Bands' },
  { id: 'filter',      label: '🔬 Filter Analysis' },
];

export default function App() {
  const [tests,       setTests]       = useState([]);
  const [mode,        setMode]        = useState('built-in');
  const [testId,      setTestId]      = useState('test1');
  const [preset,      setPreset]      = useState('Podcast Cleaner');
  const [filter,      setFilter]      = useState('FIR');
  const [file,        setFile]        = useState(null);
  const [gains,       setGains]       = useState([0,0,0,0,0,0,0]);
  const [res,         setRes]         = useState(null);
  const [err,         setErr]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState('audio');
  const [backendOk,   setBackendOk]   = useState(null); // null=unknown, true/false

  // On mount: health check + load test list
  useEffect(() => {
    (async () => {
      const ok = await healthCheck();
      setBackendOk(ok);
      if (ok) {
        try {
          const t = await getTests();
          setTests(t);
        } catch (e) {
          setErr(e.message);
        }
      } else {
        setErr('Backend is not reachable. Please start it:\n  cd backend && uvicorn main:app --reload --port 8000');
      }
    })();
  }, []);

  async function run() {
    setErr('');
    setLoading(true);
    try {
      const data = mode === 'built-in'
        ? await enhanceBuiltIn({ test_id: testId, preset_mode: preset, filter_type: filter, custom_gains: gains })
        : await enhanceUpload(file, preset, filter, gains);
      setRes(data);
      setTab('audio');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const isPassthrough = preset === 'Original / No Processing';

  // Tabs: hide Filter Analysis in passthrough mode (no filters applied)
  const visibleTabs = isPassthrough
    ? TABS.filter(t => t.id !== 'filter')
    : TABS;

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{
        background: 'radial-gradient(ellipse 70% 60% at 10% 0%, #0f2547 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 90% 5%, #2e1065 0%, transparent 50%), #070d1a',
      }}>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                <Waves size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black gradient-text tracking-tight">
                Smart Speech Studio
              </h1>
            </div>
            <p className="text-slate-400 mt-1 ml-12 text-sm">
              Interactive Podcast Enhancement &amp; DSP Equalizer Dashboard
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-300/20 text-xs font-semibold">
              DSP Course Project II
            </span>
            <span className="px-3 py-1.5 rounded-full bg-violet-400/10 text-violet-300 border border-violet-300/20 text-xs font-semibold">
              Zewail City
            </span>
            {/* Backend status badge */}
            {backendOk === true && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-300/20 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={10} /> Backend Online
              </span>
            )}
            {backendOk === false && (
              <span className="px-3 py-1.5 rounded-full bg-red-400/10 text-red-300 border border-red-300/20 text-xs font-semibold flex items-center gap-1">
                <WifiOff size={10} /> Backend Offline
              </span>
            )}
            {res && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-300/20 text-xs font-semibold flex items-center gap-1">
                <Zap size={10} /> {res.is_passthrough ? 'Original Loaded' : 'Enhancement Complete'}
              </span>
            )}
          </div>
        </header>

        {/* ── Error banner ───────────────────────────────────────────── */}
        {err && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-400/25 p-4 text-red-200 text-sm">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <pre className="whitespace-pre-wrap font-sans">{err}</pre>
          </div>
        )}

        {/* ── Main layout: left panel + right metrics ─────────────────── */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          {/* Left: Control Panel */}
          <ControlPanel
            tests={tests} mode={mode} setMode={setMode}
            testId={testId} setTestId={setTestId}
            preset={preset} setPreset={setPreset}
            filter={filter} setFilter={setFilter}
            file={file}     setFile={setFile}
            gains={gains}   setGains={setGains}
            loading={loading} onRun={run}
          />

          {/* Right: Metrics */}
          <MetricCards res={res} />
        </div>

        {/* ── Loading indicator ──────────────────────────────────────── */}
        {loading && (
          <div className="glass rounded-3xl p-8 flex flex-col items-center gap-3 text-slate-300">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
            <p className="font-semibold">
              {isPassthrough ? 'Loading original audio…' : 'Processing audio…'}
            </p>
            {!isPassthrough && (
              <p className="text-sm text-slate-500">Applying {filter} filters across 7 frequency bands</p>
            )}
          </div>
        )}

        {/* ── Results Tabs ───────────────────────────────────────────── */}
        {res && !loading && (
          <div className="glass rounded-3xl p-6">
            {/* Tab bar */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700/50 pb-4">
              {visibleTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'audio'       && <AudioPlayers      res={res} />}
            {tab === 'waveform'    && <WaveformCharts    res={res} />}
            {tab === 'frequency'   && <FrequencyCharts   res={res} />}
            {tab === 'spectrogram' && <SpectrogramCharts res={res} />}
            {tab === 'equalizer'   && <EqualizerBands    res={res} />}
            {tab === 'filter'      && !res.is_passthrough && <FilterAnalysis res={res} />}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="text-center text-xs text-slate-600 pb-4">
          Smart Speech Studio · DSP Course Project II · Multi-Band Speech Equalizer for Podcast Enhancement
        </footer>
      </div>
    </main>
  );
}
