export const API_BASE = 'http://127.0.0.1:8010';
export const AUDIO_BASE = 'http://127.0.0.1:8010';

export async function getTests() {
    const r = await fetch(`${API_BASE}/tests`);
    if (!r.ok) throw new Error('Failed to load speech tests');
    return r.json();
}

export async function healthCheck() {
    try {
        const r = await fetch(`${API_BASE}/health`);
        return r.ok;
    } catch {
        return false;
    }
}

export async function enhanceBuiltIn({ test_id, preset_mode, filter_type, custom_gains }) {
    const r = await fetch(`${API_BASE}/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id, preset_mode, filter_type, custom_gains }),
    });

    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || 'Processing failed');
    return j;
}

export async function enhanceUpload(file, preset_mode, filter_type, custom_gains) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('preset_mode', preset_mode);
    fd.append('filter_type', filter_type);
    fd.append('custom_gains', JSON.stringify(custom_gains));

    const r = await fetch(`${API_BASE}/upload-enhance`, {
        method: 'POST',
        body: fd,
    });

    const j = await r.json();
    if (!r.ok) throw new Error(j.detail || 'Upload failed');
    return j;
}