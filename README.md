# Smart Speech Studio v2.1
**DSP Course Project II – Multi-Band Speech Equalizer for Podcast Enhancement**
Zewail City of Science and Technology

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend will be live at: http://localhost:8000

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: http://localhost:5173

> **Note:** The frontend proxies all `/api/*` requests to the backend via Vite,
> so no CORS issues and no hardcoded URLs. Both must run simultaneously.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Original / No Processing** | Listen to and analyze raw audio with NO DSP applied |
| **Podcast Cleaner** | Reduces rumble & hiss, boosts speech presence |
| **Lecture Clarity** | Enhances mid-range vocal intelligibility |
| **Noise Reduction** | Aggressive suppression of non-speech bands |
| **Bass Boost / Treble Boost** | Frequency-specific enhancement |
| **Custom Equalizer** | Manual control of all 7 frequency bands |
| **FIR Filters** | Linear phase, Hamming-windowed sinc |
| **Butterworth IIR** | Maximally flat magnitude response |
| **Chebyshev IIR** | Steeper rolloff, 1 dB passband ripple |

## 📊 Dashboard Tabs

- **🎧 Audio** – A/B player (original vs enhanced) + download button
- **〰 Waveform** – Time-domain comparison plots
- **📊 Frequency** – FFT magnitude and Welch PSD plots
- **🌈 Spectrogram** – Time-frequency spectrogram (before/after)
- **🎚 EQ Bands** – Per-band gain visualization
- **🔬 Filter Analysis** – Impulse, frequency, phase, pole-zero plots

## 🔗 Backend API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/tests` | List built-in test files |
| POST | `/enhance` | Process a built-in test file |
| POST | `/upload-enhance` | Process an uploaded audio file |
| GET | `/audio/{filename}` | Serve audio file (original or enhanced) |
| GET | `/download/{filename}` | Download enhanced output |

## 🛠 Architecture

```
smart_speech_studio/
├── backend/
│   ├── main.py              – FastAPI app + CORS + endpoints
│   ├── dsp_audio.py         – DSP engine (FIR/IIR filtering, analysis)
│   ├── generate_audio_tests.py – Generates synthetic test WAVs
│   ├── requirements.txt
│   ├── data/                – Built-in test WAV files
│   ├── uploads/             – User-uploaded files
│   └── outputs/             – Enhanced output WAVs
└── frontend/
    ├── vite.config.js       – Vite + /api proxy to backend
    ├── src/
    │   ├── api.js           – API client (uses /api prefix)
    │   ├── App.jsx          – Main app with health check + tabs
    │   └── components/
    │       ├── ControlPanel.jsx
    │       ├── AudioPlayers.jsx
    │       ├── MetricCards.jsx
    │       ├── WaveformCharts.jsx
    │       ├── FrequencyCharts.jsx
    │       ├── SpectrogramCharts.jsx
    │       ├── EqualizerBands.jsx
    │       └── FilterAnalysis.jsx
    └── ...
```
