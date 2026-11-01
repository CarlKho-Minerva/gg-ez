#!/usr/bin/env python3
"""Offline tests. Synthetic key and fake opener only; never play audio."""
import contextlib
import copy
from email.message import Message
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

SPEC = importlib.util.spec_from_file_location('audio_generate',Path(__file__).with_name('elevenlabs_generate.py'))
g = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(g)


class Response:
    def __init__(self,data=b'ID3mock-audio',status=200,ctype='audio/mpeg'):
        self.data,self.status = data,status
        self.headers = Message()
        self.headers['Content-Type'] = ctype
    def read(self,n):
        return self.data[:n]
    def __enter__(self):
        return self
    def __exit__(self,*args):
        pass


class Opener:
    def __init__(self,response=None,error=None):
        self.response = response or Response()
        self.error = error
        self.calls = []
    def open(self,request,timeout):
        self.calls.append((request,timeout))
        if self.error:
            raise self.error
        return self.response


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.manifest = self.root/'manifest.json'
        self.entry = dict(id='tick',kind='sfx',prompt='Single tick',seconds=0.5,
                          file='docs/audio/generated/tick.mp3',reuse=False,
                          cards=[{'id':'1.02','cue':'One selection tick'}])
        self.write([self.entry])
    def tearDown(self):
        self.tmp.cleanup()
    def write(self,entries):
        self.manifest.write_text(json.dumps(entries))
    def run_cli(self,*args,opener=None,key=None):
        out,err = io.StringIO(),io.StringIO()
        # Replaces rather than inspects the real environment. No real key read.
        with patch.object(os,'environ',{} if key is None else {'ELEVENLABS_API_KEY':key}), contextlib.redirect_stdout(out),contextlib.redirect_stderr(err):
            rc = g.main(['--manifest',str(self.manifest),*args],self.root,opener)
        return rc,out.getvalue(),err.getvalue()
    def test_dryrun_no_env_or_network_or_writes(self):
        # Argparse may inspect locale variables; block only the credential lookup.
        class NoSecretEnv(dict):
            def get(self,key,default=None):
                if key == 'ELEVENLABS_API_KEY':
                    raise AssertionError('secret read')
                return super().get(key,default)
        out,err = io.StringIO(),io.StringIO()
        with patch.object(g.os,'environ',NoSecretEnv()), patch.object(g.urllib.request,'build_opener',side_effect=AssertionError('network')), contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = g.main(['--manifest',str(self.manifest)],self.root)
        out,err = out.getvalue(),err.getvalue()
        self.assertEqual(rc,0)
        self.assertIn('DRY-RUN selected=1 existing=0 pending=1',out)
        self.assertEqual(err,'')
        self.assertFalse((self.root/'docs').exists())
    def test_go_explicit_ids_and_key(self):
        for args,message in [(('--go',),'explicit --ids'),(('--go','--ids','tick'),'ELEVENLABS_API_KEY')]:
            rc,out,err = self.run_cli(*args)
            self.assertEqual(rc,1)
            self.assertIn(message,err)
            self.assertFalse((self.root/'docs').exists())
    def test_selected_id_errors(self):
        for ids in [('tick','tick'),('../tick',),('unknown',)]:
            self.assertEqual(self.run_cli('--ids',*ids)[0],1)
    def test_manifest_duplicate_ids_files_keys(self):
        duplicate = copy.deepcopy(self.entry)
        self.write([self.entry,duplicate])
        self.assertEqual(self.run_cli()[0],1)
        duplicate['id'] = 'other'
        self.write([self.entry,duplicate])
        self.assertEqual(self.run_cli()[0],1)
        self.manifest.write_text('[{"id":"tick","id":"other"}]')
        self.assertEqual(self.run_cli()[0],1)
    def test_paths_and_ids(self):
        for field,values in {
            'id':['../x','X','a/b','a\\b','a.b',''],
            'file':['/tmp/x.mp3','docs/audio/generated/../x.mp3','docs/audio/generated/./x.mp3','tools/audio/x.mp3','docs/audio/generated/a/b.mp3','docs/audio/generated/x.wav','docs\\audio\\generated\\x.mp3','docs/audio/generated//x.mp3']
        }.items():
            for value in values:
                with self.subTest(field=field,value=value):
                    e = dict(self.entry,**{field:value})
                    self.write([e])
                    self.assertEqual(self.run_cli()[0],1)
    def test_symlink_file_and_parent(self):
        folder = self.root/'docs/audio/generated'
        folder.mkdir(parents=True)
        dest = folder/'tick.mp3'
        dest.symlink_to(self.root/'elsewhere')
        self.assertEqual(self.run_cli()[0],1)
        # Temporary fixture disposal only, never project deletion.
        dest.unlink()
        folder.rmdir()
        folder.symlink_to(self.root)
        self.assertEqual(self.run_cli()[0],1)
    def test_schema_bad_duration_missing_cards(self):
        for changes in [{'seconds':0},{'seconds':31},{'seconds':float('nan')},{'seconds':True},{'kind':'music'},{'reuse':'yes'},{'prompt':''},{'cards':[]}]:
            self.write([dict(self.entry,**changes)])
            self.assertEqual(self.run_cli()[0],1)
    def test_existing_skipped_no_key_no_network(self):
        dest = self.root/self.entry['file']
        dest.parent.mkdir(parents=True)
        dest.write_bytes(b'ID3existing')
        opener = Opener(error=AssertionError('must skip'))
        rc,out,err = self.run_cli('--go','--ids','tick',opener=opener)
        self.assertEqual(rc,0)
        self.assertIn('SKIP existing',out)
        self.assertEqual(opener.calls,[])
        self.assertEqual(dest.read_bytes(),b'ID3existing')
        dest.write_bytes(b'')
        self.assertEqual(self.run_cli()[0],1)
    def test_missing_reuse(self):
        self.write([dict(self.entry,reuse=True,file='assets/sfx/tick.mp3')])
        self.assertEqual(self.run_cli()[0],1)
    def test_mock_success_payload_and_no_key_log(self):
        opener = Opener()
        rc,out,err = self.run_cli('--go','--ids','tick',opener=opener,key='MOCK-ONLY-KEY')
        self.assertEqual(rc,0)
        self.assertEqual((self.root/self.entry['file']).read_bytes(),b'ID3mock-audio')
        request,timeout = opener.calls[0]
        self.assertEqual(timeout,60)
        self.assertEqual(json.loads(request.data),{'text':'Single tick','duration_seconds':0.5,'loop':False,'model_id':'eleven_text_to_sound_v2'})
        self.assertNotIn('MOCK-ONLY-KEY',out+err)
        self.assertEqual(list((self.root/'docs/audio/generated').glob('*.mp3')),[self.root/self.entry['file']])
    def test_loop_and_voice_payload(self):
        for kind in ('loop','voice'):
            entry = dict(self.entry,kind=kind)
            opener = Opener()
            g.request_audio(entry,'MOCK-ONLY-KEY','MockVoice',opener)
            request = opener.calls[0][0]
            payload = json.loads(request.data)
            if kind=='loop':
                self.assertTrue(payload['loop'])
            else:
                self.assertIn('/text-to-speech/MockVoice',request.full_url)
                self.assertEqual(payload,{'text':'Single tick','model_id':'eleven_multilingual_v2'})
    def test_voice_preflight_entire_batch(self):
        voice = dict(self.entry,id='voice-lia',kind='voice',file='docs/audio/generated/voice-lia.mp3')
        self.write([self.entry,voice])
        opener = Opener()
        for args in [(),('--voice-id','../bad')]:
            rc,out,err = self.run_cli('--go','--ids','tick','voice-lia',*args,opener=opener,key='MOCK-ONLY-KEY')
            self.assertEqual(rc,1)
            self.assertEqual(opener.calls,[])
    def test_http_transport_errors_no_retries_no_leaks(self):
        for error in [urllib.error.HTTPError('https://example.invalid',429,'MOCK-ONLY-KEY',{},None),urllib.error.URLError('MOCK-ONLY-KEY'),TimeoutError('MOCK-ONLY-KEY')]:
            opener = Opener(error=error)
            rc,out,err = self.run_cli('--go','--ids','tick',opener=opener,key='MOCK-ONLY-KEY')
            self.assertEqual(rc,1)
            self.assertEqual(len(opener.calls),1)
            self.assertNotIn('MOCK-ONLY-KEY',out+err)
            self.assertEqual(list(self.root.rglob('*.mp3')),[])
    def test_bad_responses(self):
        for response in [Response(b''),Response(b'{"error":"bad"}'),Response(ctype='application/json'),Response(status=201),Response(b'ID3'+b'x'*100)]:
            with patch.object(g,'MAX_BYTES',32):
                rc,out,err = self.run_cli('--go','--ids','tick',opener=Opener(response),key='MOCK-ONLY-KEY')
            self.assertEqual(rc,1)
            self.assertEqual(list(self.root.rglob('*.mp3')),[])
    def test_concurrent_batch_rejected_before_network(self):
        opener = Opener()
        with g.generation_lock(self.root):
            rc,out,err = self.run_cli('--go','--ids','tick',opener=opener,key='MOCK-ONLY-KEY')
        self.assertEqual(rc,1)
        self.assertIn('Another generation batch',err)
        self.assertEqual(opener.calls,[])
    def test_lock_symlink_rejected(self):
        folder = self.root/'docs/audio/generated'
        folder.mkdir(parents=True)
        (folder/'.generation.lock').symlink_to(self.root/'outside')
        opener = Opener()
        self.assertEqual(self.run_cli('--go','--ids','tick',opener=opener,key='MOCK-ONLY-KEY')[0],1)
        self.assertEqual(opener.calls,[])
    def test_redirect_rejected(self):
        with self.assertRaises(g.PrepError):
            g.NoRedirect().redirect_request(None,None,302,'redirect',{},'https://other.invalid')
    def test_publish_race_no_overwrite(self):
        dest = self.root/self.entry['file']
        dest.parent.mkdir(parents=True)
        dest.write_bytes(b'ID3winner')
        with self.assertRaises(g.PrepError):
            g.save_audio(dest,b'ID3new',self.root)
        self.assertEqual(dest.read_bytes(),b'ID3winner')
        self.assertEqual(list(dest.parent.iterdir()),[dest])
    def test_every_manifest_reference_matches_source(self):
        entries = g.load_manifest(g.ROOT/'docs/audio/manifest.json')
        cache = {}
        for e in entries:
            for ref in e['cards']:
                path = Path(ref['source'])
                if path not in cache:
                    cache[path] = json.loads(path.read_text()) if path.suffix=='.json' else path.read_text().splitlines()
                if path.suffix=='.json':
                    group = ref['locator'].split('[')[0]
                    field = ref['locator'].split('].')[1]
                    cards = [c for c in cache[path][group] if c['id']==ref['id']]
                    self.assertEqual(len(cards),1)
                    self.assertEqual(cards[0][field],ref['cue'])
                else:
                    line_no = int(ref['locator'].split(',')[0].split()[1])
                    cols = [c.strip() for c in cache[path][line_no-1].split('|')[1:-1]]
                    self.assertEqual(cols[3] if 'SCENE-01' in path.name else cols[2],ref['cue'])
    def test_actual_manifest_offline(self):
        entries = g.load_manifest(g.ROOT/'docs/audio/manifest.json')
        self.assertEqual(len(entries),len({e['id'] for e in entries}))
        self.assertTrue(all(e.get('optional') for e in entries if e['kind']=='voice'))
        self.assertFalse(any(e['kind']=='voice' and any(r['id'].startswith(('2.','M2.')) for r in e['cards']) for e in entries))

if __name__ == '__main__':
    unittest.main(verbosity=2)
