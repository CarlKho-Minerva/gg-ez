# Retake two short Cebuano lines with Ate Marcela, keep the take Scribe reads back best.
import os, sys, json, difflib, re, urllib.request, uuid, shutil
key = os.environ['ELEVENLABS_API_KEY_GRANT']
voice = 'NL3wAdhrhsFZAoDTBMHk'
out = sys.argv[1]
lines = {'voice-n-5-lia': 'Usa pa.', 'voice-c1-10-lia': 'Kana. Customer empathy.'}
variants = {'voice-n-5-lia': ['Usa pa.', 'Usa pa!', 'Usa pa...'], 'voice-c1-10-lia': ['Kana. Customer empathy.', 'Kana! Customer empathy.', 'Kana. Customer empathy...']}
def norm(s): return re.sub(r'[^a-z0-9 ]+', ' ', re.sub(r'\[.*?\]', '', s.lower())).split()
def tts(text, stability):
    body = json.dumps({'text': text, 'model_id': 'eleven_v3', 'language_code': 'ceb', 'voice_settings': {'stability': stability, 'similarity_boost': 0.8, 'style': 0.35}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_64', data=body, method='POST', headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r: return r.read()
def stt(data, name):
    b = uuid.uuid4().hex; body = b''
    for f, v in [('model_id', 'scribe_v1'), ('language_code', 'ceb'), ('tag_audio_events', 'false')]:
        body += f'--{b}\r\nContent-Disposition: form-data; name="{f}"\r\n\r\n{v}\r\n'.encode()
    body += f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{name}.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + data + f'\r\n--{b}--\r\n'.encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body, method='POST', headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': f'multipart/form-data; boundary={b}'})
    with urllib.request.urlopen(req, timeout=90) as r: return json.load(r).get('text', '')
for f, exp in lines.items():
    cur = open(os.path.join(out, f + '.mp3'), 'rb').read()
    best = (difflib.SequenceMatcher(None, norm(exp), norm(stt(cur, f))).ratio(), 'current', cur, '')
    print(f'{f}: current {best[0]:.2f}')
    for i, (text, stab) in enumerate([(variants[f][0], 0.6), (variants[f][1], 0.45), (variants[f][2], 0.5)]):
        try:
            data = tts(text, stab)
            if len(data) < 4000: print('  take', i, 'too small'); continue
            heard = stt(data, f)
            r = difflib.SequenceMatcher(None, norm(exp), norm(heard)).ratio()
            print(f'  take {i} ({text!r}, stability {stab}): {r:.2f} heard {heard!r} {len(data)} B')
            if r > best[0]: best = (r, f'take {i}', data, heard)
        except Exception as e: print('  take', i, 'failed', str(e)[:120])
    if best[1] != 'current':
        shutil.copy(os.path.join(out, f + '.mp3'), os.path.join(out, f + '.before-retake.mp3'))
        open(os.path.join(out, f + '.mp3'), 'wb').write(best[2])
        print(f'  replaced with {best[1]} ({best[0]:.2f})')
    else: print('  kept current')
