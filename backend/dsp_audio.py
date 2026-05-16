"""
dsp_audio.py – Core DSP processing for Smart Speech Studio
Implements multi-band equalization with FIR, Butterworth IIR, and Chebyshev IIR filters.
Aligned with DSP Course Project II – Multi-Band Speech Equalizer for Podcast Enhancement.
"""
from __future__ import annotations
from pathlib import Path
from uuid import uuid4
import numpy as np
import soundfile as sf
from scipy import signal

try:
    import librosa
except Exception:
    librosa = None

# ─── Official speech equalizer bands (Hz) ────────────────────────────────────
BANDS = [
    (0,    100),
    (100,  300),
    (300,  800),
    (800,  2000),
    (2000, 5000),
    (5000, 10000),
    (10000,20000),
]
BAND_LABELS = [
    "0–100 Hz",
    "100–300 Hz",
    "300–800 Hz",
    "800 Hz–2 kHz",
    "2–5 kHz",
    "5–10 kHz",
    "10–20 kHz",
]

# Sentinel for no-processing mode
ORIGINAL_PRESET = "Original / No Processing"

# ─── Enhancement presets (gain dB per band) ───────────────────────────────────
PRESETS: dict[str, list[float]] = {
    "Podcast Cleaner":  [-8.0, -3.0,  2.0,  4.0,  2.0, -2.0, -6.0],
    "Lecture Clarity":  [-6.0, -1.0,  3.0,  5.0,  3.0,  0.0, -4.0],
    "Noise Reduction":  [-10.0,-4.0,  0.0,  1.0,  0.0, -4.0, -8.0],
    "Bass Boost":       [ 7.0,  5.0,  2.0,  0.0,  0.0, -1.0, -2.0],
    "Treble Boost":     [-5.0, -2.0,  0.0,  1.0,  3.0,  5.0,  4.0],
    "Custom Equalizer": [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    ORIGINAL_PRESET:    [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],  # passthrough
}

# ─── Audio Loading ─────────────────────────────────────────────────────────────
def load_audio(path: Path, target_sr: int | None = None) -> tuple[np.ndarray, int]:
    """Load audio, convert to mono float64, normalize peak to 0.95."""
    try:
        y, sr = sf.read(path, always_2d=False)
    except Exception as exc:
        if librosa is None:
            raise ValueError(
                "Unsupported format. WAV is fully supported. "
                "MP3/M4A require librosa/audioread."
            ) from exc
        y, sr = librosa.load(str(path), sr=None, mono=False)
        if y.ndim > 1:
            y = np.mean(y, axis=0)

    if y.ndim > 1:
        y = np.mean(y, axis=1)

    y = y.astype(np.float64)
    y -= np.mean(y)

    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak * 0.95

    if target_sr and sr != target_sr and librosa is not None:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    return y, int(sr)


# ─── Band Classification ───────────────────────────────────────────────────────
def _classify_band(low: float, high: float, sr: int):
    """Return (filter_type, cutoff) or None if band is above Nyquist."""
    nyq = sr / 2.0
    if low >= nyq:
        return None
    high = min(high, nyq * 0.98)
    if high <= 5:
        return None
    if low <= 0:
        return "lowpass", high
    if high >= nyq * 0.97:
        return "highpass", low
    if low >= high:
        return None
    return "bandpass", (low, high)


# ─── Filter Design ─────────────────────────────────────────────────────────────
def design_filter(
    low: float,
    high: float,
    sr: int,
    kind: str = "FIR",
    order: int = 256,
) -> tuple[object | None, dict | None]:
    """
    Design one band-filter. Returns (coefficients, info_dict).
    FIR  → (b, a) tuple suitable for filtfilt
    IIR  → sos array suitable for sosfiltfilt
    """
    band = _classify_band(low, high, sr)
    if band is None:
        return None, None

    ftype, cutoff = band
    nyq = sr / 2.0
    kind_l = kind.lower()

    # ── FIR windowed-sinc ─────────────────────────────────────────────────
    if kind_l == "fir":
        taps = int(max(63, min(order, 1023)))
        if taps % 2 == 0:
            taps += 1

        if ftype == "lowpass":
            b = signal.firwin(taps, cutoff / nyq, window="hamming", pass_zero=True)
        elif ftype == "highpass":
            b = signal.firwin(taps, cutoff / nyq, window="hamming", pass_zero=False)
        else:
            lo_n, hi_n = cutoff[0] / nyq, cutoff[1] / nyq
            b = signal.firwin(taps, [lo_n, hi_n], window="hamming", pass_zero=False)

        info = {
            "structure": "FIR windowed-sinc",
            "order": len(b) - 1,
            "method": "firwin – Hamming window",
            "filter_kind": "FIR",
        }
        return (b, np.array([1.0])), info

    # ── IIR ──────────────────────────────────────────────────────────────
    N = int(max(2, min(order, 10)))
    btype = ftype

    Wn = cutoff / nyq if not isinstance(cutoff, tuple) else [cutoff[0] / nyq, cutoff[1] / nyq]

    if "cheb" in kind_l:
        if "2" in kind_l:
            sos = signal.cheby2(N, 40, Wn, btype=btype, output="sos")
            method    = "Chebyshev Type II – 40 dB stopband attenuation"
            structure = "IIR Chebyshev II SOS"
        else:
            sos = signal.cheby1(N, 1, Wn, btype=btype, output="sos")
            method    = "Chebyshev Type I – 1 dB passband ripple"
            structure = "IIR Chebyshev I SOS"
    else:
        sos = signal.butter(N, Wn, btype=btype, output="sos")
        method    = "Butterworth – maximally flat magnitude"
        structure = "IIR Butterworth SOS"

    info = {"structure": structure, "order": N, "method": method, "filter_kind": "IIR"}
    return sos, info


# ─── Filter Application ────────────────────────────────────────────────────────
def apply_filter(y: np.ndarray, design: tuple) -> np.ndarray:
    """Apply filter to signal using zero-phase filtering."""
    coeffs, _ = design
    if coeffs is None:
        return np.zeros_like(y)

    if isinstance(coeffs, tuple):
        b, a = coeffs
        pad_len = min(max(len(b) * 3, 1), max(y.size - 1, 1))
        try:
            return signal.filtfilt(b, a, y, padlen=pad_len)
        except Exception:
            return signal.lfilter(b, a, y)

    try:
        return signal.sosfiltfilt(coeffs, y)
    except Exception:
        return signal.sosfilt(coeffs, y)


# ─── Per-band Filter Analysis (course requirement) ────────────────────────────
def analyze_filter(low: float, high: float, sr: int, kind: str = "FIR", order: int = 256) -> dict:
    band = _classify_band(low, high, sr)
    if band is None:
        return {"status": "skipped", "reason": "Band above Nyquist frequency"}

    coeffs, info = design_filter(low, high, sr, kind, order)
    if coeffs is None:
        return {"status": "skipped", "reason": "Filter design failed"}

    if isinstance(coeffs, tuple):
        b, a = coeffs
    else:
        b, a = signal.sos2tf(coeffs)

    w, h = signal.freqz(b, a, worN=512, fs=sr)
    mag_db    = 20 * np.log10(np.abs(h) + 1e-12)
    phase_deg = np.angle(h, deg=True)

    n_imp = min(256, max(32, int(order) + 1))
    imp = np.zeros(n_imp); imp[0] = 1.0
    if isinstance(coeffs, tuple):
        imp_resp = signal.lfilter(b, a, imp)
    else:
        imp_resp = signal.sosfilt(coeffs, imp)
    step_resp = np.cumsum(imp_resp)

    zeros = np.roots(b)
    poles = np.roots(a)

    return {
        "status":       "ok",
        **info,
        "freq_hz":      w.tolist(),
        "magnitude_db": mag_db.tolist(),
        "phase_deg":    phase_deg.tolist(),
        "impulse_n":    list(range(n_imp)),
        "impulse_resp": imp_resp.tolist(),
        "step_resp":    step_resp.tolist(),
        "zeros_real":   zeros.real.tolist(),
        "zeros_imag":   zeros.imag.tolist(),
        "poles_real":   poles.real.tolist(),
        "poles_imag":   poles.imag.tolist(),
    }


# ─── Metrics ──────────────────────────────────────────────────────────────────
def compute_metrics(y: np.ndarray, z: np.ndarray, sr: int) -> tuple:
    """Compute clarity score, noise reduction %, RMS before/after, SNR improvement."""
    def band_energy(x, lo, hi):
        f, P = signal.welch(x, sr, nperseg=min(2048, len(x)))
        mask = (f >= lo) & (f <= min(hi, sr / 2))
        trapz = getattr(np, "trapezoid", getattr(np, "trapz", None))
        return float(trapz(P[mask], f[mask])) if np.any(mask) else 0.0

    sp_after  = band_energy(z, 300, 4000)
    ns_after  = band_energy(z, 0, 250) + band_energy(z, 6000, sr / 2)
    clarity   = 100.0 * sp_after / (sp_after + ns_after + 1e-12)

    noise_before = band_energy(y, 0, 250) + band_energy(y, 6000, sr / 2)
    noise_after  = band_energy(z, 0, 250) + band_energy(z, 6000, sr / 2)
    nr_pct       = max(0.0, 100.0 * (noise_before - noise_after) / (noise_before + 1e-12))

    rms_b = float(np.sqrt(np.mean(y ** 2)))
    rms_a = float(np.sqrt(np.mean(z ** 2)))

    sig_pow   = np.mean(z ** 2)
    noise_pow = np.mean((y - z) ** 2) + 1e-12
    snr_after  = 10 * np.log10(sig_pow / noise_pow)
    snr_before = 10 * np.log10(np.mean(y ** 2) / (np.var(y) + 1e-12))
    snr_imp    = round(float(snr_after - snr_before), 2)

    return round(clarity, 2), round(nr_pct, 2), round(rms_b, 6), round(rms_a, 6), snr_imp


# ─── Downsample ───────────────────────────────────────────────────────────────
def _ds(arr: np.ndarray, n: int = 2000) -> list:
    arr = np.asarray(arr, dtype=np.float64)
    if arr.size <= n:
        return arr.tolist()
    idx = np.linspace(0, arr.size - 1, n).astype(int)
    return arr[idx].tolist()


# ─── Main Pipeline ─────────────────────────────────────────────────────────────
def process_audio(
    path: Path,
    preset_mode: str,
    filter_type: str,
    custom_gains=None,
    output_dir: Path | None = None,
    source: str = "built-in",
    selected_test: str = "",
) -> dict:
    """Full DSP pipeline: load → filter → analyze → serialize."""
    y, sr = load_audio(path)
    if y.size < 64:
        raise ValueError("Audio file is too short (minimum 64 samples required).")

    # ── Original / No Processing mode ─────────────────────────────────────
    is_passthrough = (preset_mode == ORIGINAL_PRESET)

    if is_passthrough:
        processed   = y.copy()
        gains       = [0.0] * 7
        filter_info = [
            {"band": lbl, "gain_db": 0.0, "status": "passthrough – no DSP applied",
             "frequency_range_hz": [lo, min(hi, sr / 2)]}
            for (lo, hi), lbl in zip(BANDS, BAND_LABELS)
        ]
    else:
        # Resolve gains
        if preset_mode == "Custom Equalizer" and custom_gains:
            gains = [float(g) for g in custom_gains[:7]]
        else:
            gains = list(PRESETS.get(preset_mode, PRESETS["Podcast Cleaner"]))
        gains = gains + [0.0] * (7 - len(gains))

        # ── Multi-band filtering ───────────────────────────────────────────
        processed   = np.zeros_like(y, dtype=np.float64)
        filter_info = []

        for (lo, hi), g, label in zip(BANDS, gains, BAND_LABELS):
            design = design_filter(lo, hi, sr, filter_type)
            coeffs, info = design

            if coeffs is None:
                filter_info.append({
                    "band": label, "gain_db": g,
                    "status": "skipped – above Nyquist",
                    "frequency_range_hz": [lo, min(hi, sr / 2)],
                })
                continue

            band_signal = apply_filter(y, design)
            processed  += band_signal * (10 ** (g / 20.0))

            entry = {**info, "band": label, "gain_db": g,
                     "status": "applied", "frequency_range_hz": [lo, min(hi, sr / 2)]}
            filter_info.append(entry)

        # Post-process
        processed -= np.mean(processed)
        peak = np.max(np.abs(processed))
        if peak > 0.98:
            processed = processed / peak * 0.98

    # Save output
    if output_dir is None:
        output_dir = Path(__file__).parent / "outputs"
    output_dir.mkdir(exist_ok=True)
    out_name = f"enhanced_{uuid4().hex[:10]}.wav"
    sf.write(output_dir / out_name, processed.astype(np.float32), sr)

    # ── Analysis arrays ────────────────────────────────────────────────────
    n        = len(y)
    t        = np.arange(n) / sr
    nperseg  = min(2048, n)
    nsp      = min(512, n)
    noverlap = min(256, max(0, n // 4))

    yf = np.abs(np.fft.rfft(y))
    zf = np.abs(np.fft.rfft(processed))
    ff = np.fft.rfftfreq(n, 1.0 / sr)

    f_psd, p_before = signal.welch(y,        sr, nperseg=nperseg)
    _,     p_after  = signal.welch(processed, sr, nperseg=nperseg)

    f_s, tt_s, S1 = signal.spectrogram(y,        sr, nperseg=nsp, noverlap=noverlap)
    _,   _,    S2 = signal.spectrogram(processed, sr, nperseg=nsp, noverlap=noverlap)

    clarity, nr_pct, rms_b, rms_a, snr_imp = compute_metrics(y, processed, sr)

    # Per-band filter analysis (for Filter Analysis tab)
    per_band_analysis = []
    if is_passthrough:
        # No filter analysis for passthrough mode
        for (lo, hi), label in zip(BANDS, BAND_LABELS):
            per_band_analysis.append({
                "status": "skipped",
                "reason": "No DSP applied in Original / No Processing mode",
                "band": label, "lo_hz": lo, "hi_hz": hi,
            })
    else:
        for (lo, hi), label in zip(BANDS, BAND_LABELS):
            a = analyze_filter(lo, hi, sr, filter_type)
            a["band"]  = label
            a["lo_hz"] = lo
            a["hi_hz"] = hi
            per_band_analysis.append(a)

    return {
        "input_source":            source,
        "selected_test":           selected_test,
        "original_filename":       path.name,
        "enhanced_filename":       out_name,
        "preset_mode":             preset_mode,
        "filter_type":             filter_type if not is_passthrough else "None",
        "is_passthrough":          is_passthrough,
        "sample_rate":             sr,
        "duration_seconds":        round(n / sr, 3),
        "clarity_score":           clarity,
        "noise_reduction_percent": nr_pct,
        "rms_before":              rms_b,
        "rms_after":               rms_a,
        "snr_improvement_db":      snr_imp,
        "band_gains_db":           gains,
        "band_labels":             BAND_LABELS,
        "time_axis":               _ds(t),
        "original_waveform":       _ds(y),
        "enhanced_waveform":       _ds(processed),
        "fft_freq":                _ds(ff, 1500),
        "fft_before":              _ds(20 * np.log10(yf + 1e-9), 1500),
        "fft_after":               _ds(20 * np.log10(zf + 1e-9), 1500),
        "psd_freq":                f_psd.tolist(),
        "psd_before":              (10 * np.log10(p_before + 1e-12)).tolist(),
        "psd_after":               (10 * np.log10(p_after  + 1e-12)).tolist(),
        "spectrogram_time":        tt_s.tolist(),
        "spectrogram_freq":        f_s.tolist(),
        "spectrogram_before":      (10 * np.log10(S1 + 1e-12)).tolist(),
        "spectrogram_after":       (10 * np.log10(S2 + 1e-12)).tolist(),
        "download_url":            f"/audio/{out_name}",
        "original_url":            f"/audio/{path.name}",
        "filter_info":             filter_info,
        "filter_analysis":         per_band_analysis,
    }
