#!/usr/bin/env python3
"""Explicit opt-in ElevenLabs jobs. Default is offline dry-run; stdlib only.

No dotenv/config loading, no retries, no playback. New outputs are restricted to
this worktree's docs/audio/generated. Existing assets are read-only candidates.
"""
import argparse
from contextlib import contextmanager, nullcontext
import fcntl
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
ID = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
MAX_BYTES = 32 * 1024 * 1024


class PrepError(Exception):
    pass


def safe_file(value, reuse, root):
    if not isinstance(value, str) or '\\' in value:
        raise PrepError('Invalid file path')
    p = PurePosixPath(value)
    if p.is_absolute() or any(x in ('.','..','') for x in value.split('/')):
        raise PrepError('Unsafe file path')
    prefix = ('assets','sfx') if reuse else ('docs','audio','generated')
    if p.parts[:-1] != prefix or p.suffix != '.mp3' or not ID.fullmatch(p.stem):
        raise PrepError('File outside allowed audio directory')
    dest = root.joinpath(*p.parts)
    # Reject symlinks, including a parent leading outside the owned output tree.
    for part in [dest, *dest.parents]:
        if part == root:
            break
        if part.is_symlink():
            raise PrepError('Symlink paths are forbidden')
    if not dest.resolve().is_relative_to(root.resolve()):
        raise PrepError('File escapes worktree')
    return dest


def no_duplicate_keys(pairs):
    result = {}
    for key,value in pairs:
        if key in result:
            raise PrepError('Duplicate JSON object key')
        result[key] = value
    return result


def load_manifest(path, root=ROOT):
    with path.open(encoding='utf-8') as f:
        entries = json.load(f,object_pairs_hook=no_duplicate_keys)
    if not isinstance(entries,list) or not entries:
        raise PrepError('Manifest must be a nonempty list')
    ids,files = set(),set()
    for e in entries:
        if not isinstance(e,dict):
            raise PrepError('Invalid manifest entry')
        aid = e.get('id')
        if not isinstance(aid,str) or not ID.fullmatch(aid):
            raise PrepError('Invalid id')
        if aid in ids:
            raise PrepError('Duplicate id')
        ids.add(aid)
        if e.get('kind') not in ('sfx','loop','voice') or type(e.get('reuse')) is not bool:
            raise PrepError('Invalid kind or reuse')
        if not isinstance(e.get('prompt'),str) or not e['prompt'].strip():
            raise PrepError('Missing prompt')
        s = e.get('seconds')
        if type(s) not in (int,float) or not math.isfinite(s) or s <= 0:
            raise PrepError('Invalid seconds')
        if not e['reuse'] and e['kind'] != 'voice' and not 0.5 <= s <= 30:
            raise PrepError('Sound duration must be 0.5 to 30 seconds')
        if not isinstance(e.get('cards'),list) or not e['cards']:
            raise PrepError('Missing source cards')
        dest = safe_file(e.get('file'),e['reuse'],root)
        if dest in files:
            raise PrepError('Duplicate output file')
        files.add(dest)
        if e['reuse'] and not dest.is_file():
            raise PrepError('Missing reused asset')
        if dest.exists() and (not dest.is_file() or dest.stat().st_size == 0):
            raise PrepError('Invalid existing audio file')
    return entries


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise PrepError('API redirect refused')


def request_audio(entry, key, voice_id, opener=None):
    if entry['kind'] == 'voice':
        if not voice_id or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}',voice_id):
            raise PrepError('Voice job requires a safe --voice-id')
        endpoint = '/text-to-speech/' + voice_id
        payload = {'text':entry['prompt'],'model_id':'eleven_multilingual_v2'}
    else:
        endpoint = '/sound-generation'
        payload = {'text':entry['prompt'],'duration_seconds':entry['seconds'],
                   'loop':entry['kind']=='loop','model_id':'eleven_text_to_sound_v2'}
    request = urllib.request.Request(
        'https://api.elevenlabs.io/v1'+endpoint+'?output_format=mp3_44100_128',
        data=json.dumps(payload).encode(),method='POST',
        headers={'xi-api-key':key,'Content-Type':'application/json','Accept':'audio/mpeg'})
    opener = opener or urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(request,timeout=60) as response:
            if response.status != 200:
                raise PrepError('Unexpected API response status')
            if response.headers.get_content_type() not in ('audio/mpeg','audio/mp3','application/octet-stream'):
                raise PrepError('API did not return audio')
            data = response.read(MAX_BYTES+1)
            if not data or len(data)>MAX_BYTES:
                raise PrepError('Empty or oversized API audio')
            # MP3 ID3 tag or MPEG frame sync. Reject HTML/JSON error bodies.
            if not (data.startswith(b'ID3') or (len(data)>=2 and data[0]==255 and data[1]&224==224)):
                raise PrepError('API response lacks an MP3 signature')
            return data
    except urllib.error.HTTPError as exc:
        raise PrepError(f'API HTTP {exc.code}; no retry; reconcile before rerunning') from None
    except (urllib.error.URLError,TimeoutError,OSError):
        raise PrepError('API transport failed; outcome may be uncertain; no retry') from None


def save_audio(dest, data, root=ROOT):
    safe_file(str(dest.relative_to(root)),False,root)
    dest.parent.mkdir(parents=True,exist_ok=True)
    # Complete temporary file, then atomic no-clobber publication on this filesystem.
    # Never leave a partial .mp3 that a later run would mistake for completion.
    with tempfile.TemporaryDirectory(prefix='.audio-',dir=dest.parent) as tmp:
        temp = Path(tmp)/'complete.mp3'
        with temp.open('wb') as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        try:
            os.link(temp,dest)
        except FileExistsError:
            raise PrepError('Output appeared during generation; not overwritten') from None


@contextmanager
def generation_lock(root):
    """Office Mac advisory lock: overlapping live batches must not spend twice."""
    folder = root/'docs/audio/generated'
    safe_file('docs/audio/generated/lock-check.mp3',False,root)
    folder.mkdir(parents=True,exist_ok=True)
    fd = os.open(folder/'.generation.lock',os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW,0o600)
    try:
        try:
            fcntl.flock(fd,fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise PrepError('Another generation batch is running; no request made') from None
        yield
    finally:
        os.close(fd)


def main(argv=None, root=ROOT, opener=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',type=Path,default=root/'docs/audio/manifest.json')
    parser.add_argument('--ids',nargs='+')
    parser.add_argument('--go',action='store_true')
    parser.add_argument('--voice-id')
    args = parser.parse_args(argv)
    try:
        entries = load_manifest(args.manifest,root)
        selected = args.ids or [e['id'] for e in entries]
        if len(selected)!=len(set(selected)):
            raise PrepError('Duplicate selected ids')
        if any(not ID.fullmatch(x) for x in selected):
            raise PrepError('Unsafe selected id')
        by_id = {e['id']:e for e in entries}
        if any(x not in by_id for x in selected):
            raise PrepError('Unknown selected id')
        if args.go and not args.ids:
            raise PrepError('--go requires explicit --ids')
        jobs = [by_id[x] for x in selected]
        pending = [e for e in jobs if not safe_file(e['file'],e['reuse'],root).exists()]
        # Validate the entire selected batch before any paid request.
        if args.go and any(e['kind']=='voice' for e in pending):
            if not args.voice_id or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}',args.voice_id):
                raise PrepError('Voice job requires a safe --voice-id')
        key = None
        if args.go and pending:
            key = os.environ.get('ELEVENLABS_API_KEY')
            if not key or not key.strip():
                raise PrepError('ELEVENLABS_API_KEY required for --go')
        with generation_lock(root) if args.go and pending else nullcontext():
            for e in jobs:
                dest = safe_file(e['file'],e['reuse'],root)
                if dest.exists():
                    if not dest.is_file() or dest.stat().st_size == 0:
                        raise PrepError('Invalid existing audio file')
                    print(f"SKIP existing {e['id']}: {e['file']}")
                elif not args.go:
                    print(f"DRY-RUN {e['id']} {e['kind']} {e['seconds']}s -> {e['file']}")
                else:
                    save_audio(dest,request_audio(e,key,args.voice_id,opener),root)
                    print(f"SAVED {e['id']}: {e['file']}")
        print(f"{'GO' if args.go else 'DRY-RUN'} selected={len(jobs)} existing={len(jobs)-len(pending)} pending={len(pending)}")
        return 0
    except PrepError as exc:
        print(f'ERROR: {exc}',file=sys.stderr)
        return 1
    except (OSError,ValueError,TypeError):
        # Do not print exception strings: remote data, paths or headers may contain secrets.
        print('ERROR: local input/output failure; no automatic retry',file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
