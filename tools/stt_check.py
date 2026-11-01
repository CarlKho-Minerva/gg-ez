# Round-trip check: transcribe Lia's Cebuano clips with ElevenLabs Scribe (language ceb) and score against the script.
import os, sys, json, glob, difflib, re, urllib.request, mimetypes, uuid
key = os.environ.get('ELEVENLABS_API_KEY_GRANT') or os.environ.get('ELEVENLABS_API_KEY')
alt = os.environ.get('ELEVENLABS_API_KEY')
sets = {}
for name, folder in [('marcela', sys.argv[1]), ('jesi', sys.argv[2])]:
    sets[name] = folder
script = json.load(open(sys.argv[3], encoding='utf-8'))
lines = {e['file']: e['text'] for e in script if e['speaker'] == 'lia'}
ceb = ['voice-r-5-lia', 'voice-r-2-lia', 'voice-p-5-lia', 'voice-k-5-lia', 'voice-n-5-lia', 'voice-e-6-lia', 'voice-c1-11-lia', 'voice-c1-10-lia', 'voice-c4-lia', 'voice-n2-lia', 'voice-c1-12-lia']
def norm(s):
    s = re.sub(r'\[.*?\]', '', s.lower())
    return re.sub(r'[^a-z0-9 ]+', ' ', s).split()
def stt(path, k):
    boundary = uuid.uuid4().hex
    data = open(path, 'rb').read()
    body = b''
    for field, val in [('model_id', 'scribe_v1'), ('language_code', 'ceb'), ('tag_audio_events', 'false')]:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"\r\n\r\n{val}\r\n'.encode()
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{os.path.basename(path)}"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + data + f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body, method='POST',
        headers={'xi-api-key': k, 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r).get('text', ''), None
    except urllib.error.HTTPError as e:
        return '', f'HTTP {e.code} {e.read()[:160].decode(errors="replace")}'
results = {}
for name, folder in sets.items():
    rows = []
    for f in ceb:
        path = os.path.join(folder, f + '.mp3')
        if not os.path.exists(path):
            rows.append((f, 'missing', 0, '')); continue
        text, err = stt(path, key)
        if err and alt and alt != key:
            text, err = stt(path, alt)
        exp = lines[f]
        ratio = difflib.SequenceMatcher(None, norm(exp), norm(text)).ratio() if text else 0
        rows.append((f, exp, round(ratio, 2), err or text))
    results[name] = rows
for name, rows in results.items():
    mean = sum(r[2] for r in rows) / len(rows)
    print(f'== {name}: mean word-match {mean:.2f}')
    for f, exp, ratio, got in rows:
        print(f'  {ratio:.2f}  {f:16} | {exp[:40]:40} | {got[:70]}')
