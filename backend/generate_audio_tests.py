"""Generate five speech-like WAV test files for the DSP dashboard.
These are synthetic voiced signals so the ZIP works immediately without external data.
"""
from pathlib import Path
import numpy as np
import soundfile as sf

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
SR = 44100
DUR = 4.0

def speech_like(seed=0, f0=125, gain=1.0):
    rng = np.random.default_rng(seed)
    t = np.linspace(0, DUR, int(SR * DUR), endpoint=False)
    envelope = 0.55 + 0.35*np.sin(2*np.pi*2.1*t) + 0.10*np.sin(2*np.pi*5.2*t)
    carrier = sum((1/k)*np.sin(2*np.pi*f0*k*t + rng.uniform(0, np.pi)) for k in range(1, 12))
    formants = 0.35*np.sin(2*np.pi*700*t) + 0.22*np.sin(2*np.pi*1300*t) + 0.12*np.sin(2*np.pi*2500*t)
    y = envelope * (0.55*carrier + formants)
    y /= max(np.max(np.abs(y)), 1e-9)
    return gain * y

def save(name, y):
    y = y / max(np.max(np.abs(y)), 1e-9) * 0.85
    sf.write(DATA_DIR / name, y.astype(np.float32), SR)

base = speech_like(1)
t = np.linspace(0, DUR, int(SR * DUR), endpoint=False)
rng = np.random.default_rng(22)

save("test1.wav", base)  # clean speech
save("test2.wav", 0.65*base + 0.18*rng.normal(size=base.size) + 0.08*np.sin(2*np.pi*60*t))
save("test3.wav", 0.22*base)
save("test4.wav", 0.75*base + 0.28*np.sin(2*np.pi*80*t) + 0.16*np.sin(2*np.pi*140*t))
# muffled: low-pass the synthetic voice by attenuating high spectrum
freq = np.fft.rfftfreq(base.size, 1/SR)
X = np.fft.rfft(base)
X *= 1 / (1 + (freq/1200)**4)
save("test5.wav", np.fft.irfft(X, n=base.size))
print("Generated audio tests in", DATA_DIR)

if __name__ == "__main__":
    pass
