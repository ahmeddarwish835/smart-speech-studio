"""
main.py – Smart Speech Studio FastAPI Backend
DSP Course Project II – Multi-Band Speech Equalizer for Podcast Enhancement
"""
from pathlib import Path
import json, shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dsp_audio import process_audio, analyze_filter, BANDS, BAND_LABELS
import generate_audio_tests  # generates test WAVs on import if missing

BASE    = Path(__file__).parent
DATA    = BASE / "data"
UPLOADS = BASE / "uploads"
OUTPUTS = BASE / "outputs"
UPLOADS.mkdir(exist_ok=True)
OUTPUTS.mkdir(exist_ok=True)

app = FastAPI(
    title="Smart Speech Studio API",
    version="2.0.0",
    description="DSP Course Project – Multi-Band Speech Equalizer",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TESTS = [
    {"id": "test1", "label": "Test 1", "filename": "test1.wav", "description": "Clean speech"},
    {"id": "test2", "label": "Test 2", "filename": "test2.wav", "description": "Noisy lecture"},
    {"id": "test3", "label": "Test 3", "filename": "test3.wav", "description": "Low-volume speech"},
    {"id": "test4", "label": "Test 4", "filename": "test4.wav", "description": "Bassy voice"},
    {"id": "test5", "label": "Test 5", "filename": "test5.wav", "description": "Muffled speech"},
]


@app.get("/health")
def health():
    return {"status": "ok", "message": "Smart Speech Studio backend is running", "version": "2.0.0"}


@app.get("/tests")
def get_tests():
    return TESTS


@app.post("/enhance")
def enhance(payload: dict):
    """Process a built-in test audio file."""
    test_id = payload.get("test_id", "test1")
    test = next((t for t in TESTS if t["id"] == test_id), None)
    if not test:
        raise HTTPException(404, f"Unknown test_id: {test_id}")

    audio_path = DATA / test["filename"]
    if not audio_path.exists():
        raise HTTPException(404, f"Audio file not found: {test['filename']}")

    try:
        return process_audio(
            path=audio_path,
            preset_mode=payload.get("preset_mode", "Podcast Cleaner"),
            filter_type=payload.get("filter_type", "FIR"),
            custom_gains=payload.get("custom_gains"),
            output_dir=OUTPUTS,
            source="built-in",
            selected_test=test["label"],
        )
    except Exception as exc:
        raise HTTPException(400, str(exc))


@app.post("/upload-enhance")
async def upload_enhance(
    file:         UploadFile = File(...),
    preset_mode:  str = Form("Podcast Cleaner"),
    filter_type:  str = Form("FIR"),
    custom_gains: str = Form("[]"),
):
    """Process an uploaded audio file (WAV, MP3, M4A)."""
    suffix = Path(file.filename or "audio.wav").suffix.lower()
    if suffix not in [".wav", ".mp3", ".m4a"]:
        raise HTTPException(
            400,
            "Unsupported format. Accepted: .wav, .mp3, .m4a. WAV is most reliable.",
        )

    dest = UPLOADS / f"upload_{Path(file.filename).stem}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        gains = json.loads(custom_gains) if custom_gains else []
        return process_audio(
            path=dest,
            preset_mode=preset_mode,
            filter_type=filter_type,
            custom_gains=gains,
            output_dir=OUTPUTS,
            source="upload",
            selected_test=file.filename or dest.name,
        )
    except Exception as exc:
        raise HTTPException(400, str(exc))


@app.get("/audio/{filename}")
def serve_audio(filename: str):
    """Serve any audio file (original, uploaded, or enhanced)."""
    for folder in (DATA, UPLOADS, OUTPUTS):
        path = folder / filename
        if path.exists():
            media_type = "audio/mpeg" if filename.lower().endswith(".mp3") else "audio/wav"
            return FileResponse(path, media_type=media_type, filename=filename)
    raise HTTPException(404, "Audio file not found")


@app.get("/download/{filename}")
def download(filename: str):
    """Download an enhanced audio file."""
    path = OUTPUTS / filename
    if not path.exists():
        raise HTTPException(404, "Enhanced file not found. Run enhancement first.")
    return FileResponse(path, media_type="audio/wav", filename=filename)
