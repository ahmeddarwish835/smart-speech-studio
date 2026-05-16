// AudioPlayers.jsx – Original vs Enhanced A/B audio player
import React from 'react';
import { Download, Music, Wand2, Info } from 'lucide-react';
import { AUDIO_BASE } from '../api';

export default function AudioPlayers({ res }) {
  if (!res) return null;

  const isPassthrough = res.is_passthrough;

  return (
    <div className="space-y-4">
      {/* Passthrough notice */}
      {isPassthrough && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 p-4 text-amber-200 text-sm">
          <Info size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-300">No DSP Enhancement Applied</p>
            <p className="text-amber-200/80 text-xs mt-0.5">
              You are listening to the original audio without any filtering or equalization.
              The waveform, FFT, PSD, and spectrogram reflect the raw audio signal.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-5 ${isPassthrough ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
        {/* Original */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Music size={16} className="text-cyan-400" />
            <h3 className="font-bold text-slate-100">Original Audio</h3>
            <span className="ml-auto text-xs text-slate-400">{res.duration_seconds}s · {res.sample_rate.toLocaleString()} Hz</span>
          </div>
          <audio controls className="w-full" src={`${AUDIO_BASE}${res.original_url}`} />
          <p className="text-xs text-slate-500 mt-2">{res.original_filename}</p>
        </div>

        {/* Enhanced / Output audio – show separately only when DSP was applied */}
        {!isPassthrough && (
          <div className="glass rounded-2xl p-5 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={16} className="text-indigo-400" />
              <h3 className="font-bold text-slate-100">Enhanced Audio</h3>
              <span className="ml-auto text-xs text-emerald-400">✓ {res.preset_mode}</span>
            </div>
            <audio controls className="w-full" src={`${AUDIO_BASE}${res.download_url}`} />
            <a
              className="btn-secondary mt-3 w-full justify-center"
              href={`${AUDIO_BASE}${res.download_url}`}
              download={res.enhanced_filename}
            >
              <Download size={15} /> Download Enhanced WAV
            </a>
          </div>
        )}
      </div>

      {/* Download for passthrough too */}
      {isPassthrough && (
        <div className="flex justify-center">
          <a
            className="btn-secondary justify-center"
            href={`${AUDIO_BASE}${res.original_url}`}
            download={res.original_filename}
          >
            <Download size={15} /> Download Original WAV
          </a>
        </div>
      )}
    </div>
  );
}
