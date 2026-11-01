#!/usr/bin/env python3
"""Rebuild the audio handoff from local storyboards, never generate audio."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT.parent.parent / 'pi-labs'
SOURCES = {
    'scene1': LAB / '2026-10-31-gg-ez-direct/SCENE-01.md',
    'scene2': LAB / '2026-10-31-gg-ez-scene2/SCENE-02.md',
    'vacuum': LAB / '2026-10-31-gg-ez-vacuum/story.json',
    'act3': LAB / '2026-11-01-gg-ez-act3/act3-story.json',
}
# Explicit editorial mapping. Reuse is a candidate, not a listening approval.
MAP = {
 '1.01':'arcade swing hit', '1.02':'tick arcade', '1.03':'confirm arcade',
 '1.04':'whoosh arcade', '1.05':'whoosh arcade', '1.06':'loading',
 '1.07':'chat', '1.08':'tick', '1.09':'warning', '1.10':'street',
 '2.01':'footsteps', '2.02':'hit', '2.03':'', '2.04':'whoosh hit',
 '2.05':'guard', '2.06':'ko chat', '2.07':'', '2.08A':'', '2.08B':'', '2.08C':'',
 'L2.1':'round footsteps', 'L2.2':'blast landing', 'L2.3':'swing',
 'L2.4':'hit ko', 'L2.5':'tick', 'L3.1':'arcade staff', 'L3.2':'arcade type',
 'L3.3':'type burst', 'L3.4':'whoosh ko', 'L3.5':'chat',
 'T.1':'grip', 'T.2':'smash glass arcade', 'T.3':'suction arcade',
 'T.4':'suction', 'T.5':'whistle', 'T.6':'suction', 'T.7':'fan arcade',
 'T.8':'fan street laugh', 'T.9':'fan street', 'R.1':'fan street',
 'R.2':'whoosh laugh', 'R.3':'ko', 'R.4':'laugh', 'R.5':'tick chuckle',
 'A1':'fan', 'A2':'fan', 'A3':'fan', 'A4':'mouse fan', 'B1':'phone fan',
 'B2':'fan', 'B3':'fan', 'B4':'mouse fan', 'C1':'container fan',
 'C2':'chew', 'C3':'fan', 'C4':'fan', 'C5':'laugh spoon fan',
 'N1':'fan', 'N2':'warning', 'N3':'queue crt suction arcade',
 'M2.1':'arcade fan', 'M2.2':'arcade', 'M2.3':'blast hit chat',
 'M2.4':'type guard', 'M2.5':'whoosh ko', 'M2.6':'chat tick',
 'M2.7A':'send chat', 'M2.7B':'send chat', 'M2.7C':'tick',
 'M2.8':'arcade suction', 'V2.1':'fan room', 'V2.2':'fan type',
 'V2.3':'fabric breath', 'V2.4':'mouse', 'V2.5':'call', 'V2.6':'arcade',
 'C1.1':'type', 'C1.2':'', 'C1.3':'type', 'C1.4':'type', 'C1.5':'type',
 'C1.6':'', 'C1.7':'transfer', 'C1.8':'fan', 'C1.9':'chair',
 'C1.10':'', 'C1.11':'mouse', 'C1.12':'mouse', 'C1.13':'fan',
}
# id: kind, desired seconds (new only), existing basename or None, prompt
DEFS = {
 'arcade':('loop',20,None,'Bright playful energetic arcade arena instrumental bed, driving synthetic rhythm, no vocals, seamless loop; no ominous emotional hint.'),
 'swing':('sfx',1,'swing','Light combat swing / cloak swish, short dry movement accent.'),
 'hit':('sfx',1,'hit','One clear arcade hit thud, clean impact.'),
 'tick':('sfx',0.5,None,'Single quiet interface selection tick; dry, gentle, not a notification.'),
 'confirm':('sfx',0.5,None,'Single sharp arcade menu confirmation tone, concise and bright.'),
 'whoosh':('sfx',1,None,'Short sideways launch whoosh, fast lateral air movement, no impact or voice.'),
 'loading':('loop',4,None,'Quiet electronic loading pulse, low-key and seamless, no alarm.'),
 'chat':('sfx',1,'chat','Single chat / opponent-found notification ping.'),
 'warning':('sfx',0.5,None,'Brief restrained interface warning chirp / work-app break beep, not an emergency alarm.'),
 'street':('loop',12,'street','Distant late-night city traffic, unobtrusive room-window ambience.'),
 'footsteps':('sfx',1,None,'Two responsive light footsteps on a flat arena platform; no voice.'),
 'guard':('sfx',0.5,None,'Single short dry guard clack, defensive block accent.'),
 'ko':('sfx',1,'ko','Arcade knockout result cue; candidate for existing GAME announcer cue, inspect before approving.'),
 'round':('sfx',1,None,'Short bright arcade round-start cue, no spoken announcement.'),
 'blast':('sfx',1,'blast','Cyan arcade spell hiss and release.'),
 'landing':('sfx',0.5,None,'One small landing thump on platform, no impact explosion.'),
 'staff':('sfx',0.5,None,'Brief staff recovery movement, soft wooden handling.'),
 'type':('sfx',1,'type','Dry button press / keyboard taps, candidate shared input accent.'),
 'burst':('sfx',1,None,'Combined arcade attack burst as buffered attacks release together, one compact accent.'),
 'grip':('sfx',0.5,None,'Tight plastic game-controller grip creak, close and dry.'),
 'smash':('sfx',1,'smash','Controller striking a monitor, one hard physical impact.'),
 'glass':('sfx',1,None,'Brief monitor glass crack spreading, brittle fracture, no explosion.'),
 'suction':('loop',4,None,'Low monitor-aperture air suction, rising narrow airflow, no 3D vortex or music; mix intensity per card.'),
 'whistle':('sfx',0.5,None,'Narrow air whistle as a silhouette compresses through monitor aperture.'),
 'fan':('loop',12,None,'Close rattling electric fan in a small late-night room, steady imperfect mechanical rattle, no dramatic score.'),
 'room':('loop',12,'room','Quiet small-room tone, candidate existing room bed without extra dramatic sound.'),
 'laugh':('sfx',1.5,None,'Natural small amused laugh from a young adult woman, understated shoulder laugh, no words or audience.'),
 'chuckle':('sfx',1,None,'Small frustrated amused chuckle from a young adult woman, no words.'),
 'mouse':('sfx',0.5,None,'One quiet computer mouse click, dry close perspective.'),
 'phone':('sfx',1,'phone','One soft phone vibration against a desk; existing phone clip is a candidate only.'),
 'container':('sfx',0.5,None,'Soft plastic food container sliding a short distance on desk.'),
 'chew':('sfx',1,None,'Very quiet natural chewing, close but unobtrusive, no speech.'),
 'spoon':('sfx',0.5,None,'Single soft spoon tap against plastic food container.'),
 'queue':('sfx',1,'queue','Single queue confirmation click.'),
 'crt':('sfx',1,'crt','Brief monitor flicker/static accent, no continuous dramatic drone.'),
 'send':('sfx',0.5,None,'Single short outgoing chat send blip, distinct from incoming notification.'),
 'fabric':('sfx',1,None,'Small T-shirt fabric rustle as someone straightens their shirt.'),
 'breath':('sfx',1.5,None,'One calm inhale and exhale, close adult woman, no words or sigh.'),
 'call':('sfx',1,None,'Soft work-app double chime as a headset call connects.'),
 'transfer':('sfx',1.5,None,'Restrained short electronic call-transfer tone, no voice.'),
 'chair':('sfx',0.5,None,'Small plastic chair creak as a seated person shifts slightly.'),
}


def main():
    cues = {}
    for key in ('scene1','scene2'):
        for line_no,line in enumerate(SOURCES[key].read_text().splitlines(),1):
            if not line.startswith('| '):
                continue
            cols = [x.strip() for x in line.split('|')[1:-1]]
            match = re.match(r'(?:\[)?(\d\.\d{2}[ABC]?)', cols[0])
            if match:
                cid = match.group(1)
                field = 'Sound' if key == 'scene1' else 'Action / sound'
                cues[cid] = {'id':cid, 'source':str(SOURCES[key]), 'locator':f'line {line_no}, {field}', 'cue':cols[3] if key == 'scene1' else cols[2]}
    stories = []
    for key,groups in [('vacuum',('loss2','loss3','objects')),('act3',('m2','v2','c1'))]:
        data = json.loads(SOURCES[key].read_text())
        for group in groups:
            for card in data[group]:
                cues[card['id']] = {'id':card['id'],'source':str(SOURCES[key]),'locator':f"{group}[id={card['id']}].sound",'cue':card['sound']}
                stories.append((key,group,card))
    if set(cues) != set(MAP):
        raise ValueError(f'Mapping drift: {set(cues)^set(MAP)}')
    entries = []
    for aid,(kind,seconds,reuse,prompt) in DEFS.items():
        cards = [cues[cid] for cid,ids in MAP.items() if aid in ids.split()]
        if reuse:
            file = f'assets/sfx/{reuse}.mp3'
            seconds = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(ROOT/file)],text=True).strip())
        else:
            file = f'docs/audio/generated/{aid}.mp3'
        entries.append(dict(id=aid,kind=kind,prompt=prompt,seconds=round(seconds,3),file=file,reuse=bool(reuse),cards=cards))
    # Only actual speech/customer fields are optional voice jobs. Text balloons,
    # chats, narration, translations and UI labels do not imply voice work.
    voices = {}
    for key,group,card in stories:
        for field in ('speech','customer'):
            if field not in card:
                continue
            text = card[field]
            speaker = 'caller' if field == 'customer' else 'lia'
            identity = (speaker,text)
            ref = dict(cues[card['id']],locator=f"{group}[id={card['id']}].{field}",cue=text)
            if identity in voices:
                voices[identity]['cards'].append(ref)
                continue
            aid = 'voice-' + card['id'].lower().replace('.','-') + '-' + speaker
            entry = dict(id=aid,kind='voice',prompt=text,seconds=round(max(1,len(text.split())/2.5),1),file=f'docs/audio/generated/{aid}.mp3',reuse=False,cards=[ref],optional=True,speaker=speaker)
            voices[identity] = entry
    entries.extend(voices.values())
    out = ROOT/'docs/audio'
    out.mkdir(parents=True,exist_ok=True)
    (out/'manifest.json').write_text(json.dumps(entries,indent=2,ensure_ascii=False)+'\n')
    counts = {k:sum(e['kind']==k for e in entries) for k in ('sfx','loop','voice')}
    reused = [e for e in entries if e['reuse']]
    lines = ['# Audio Preparation Sheet','', 'Preparation only. No audio was generated or listened to. Reuse mappings are editorial candidates, not an audition or loop-seam approval. New files do not exist yet.', '',f"Manifest: {len(entries)} unique jobs: {counts['sfx']} effects, {counts['loop']} loops, {counts['voice']} optional voice jobs. {len(reused)} reuse candidates; {len(entries)-len(reused)-counts['voice']} new non-voice jobs. Counts computed by tools/audio/build_manifest.py.",'', '## Source and cue policy','', 'Every row links to the exact source card and quotes its sound field (or combined Action / sound field in Scene 2). Effects attached to action-only Scene 2 cells are explicitly editorial proposals, not recovered sound cues. JSON links use a card/field fragment (a lookup label, not a web-renderer anchor). Durations for new jobs are proposed generation lengths, not storyboard holds. Reused durations are measured with ffprobe. Speech durations are rehearsal estimates only; TTS does not accept a target duration.', '', 'Scene 2 reply text is superseded by the user-approved pair **okay that was clean / fuck off**, also recorded in Act 3 M2.6. The older joke/challenge lines in SCENE-02.md must not become voice jobs. All chat replies, text balloons, inner narration, translations, timers and UI labels can remain text-only. Optional spoken lines below are not required deliverables.', '', '## Effects and loops','', '| ID | Kind | Seconds | Reused vs new / file | Prompt | Exact source cues |','|---|---|---:|---|---|---|']
    def esc(s):
        return s.replace('|','\\|').replace('\n',' / ')
    def refs(e):
        return '<br>'.join(f"[{r['id']} {r['locator']}]({r['source']}#{r['id']}) : {esc(r['cue'])}" for r in e['cards'])
    for e in entries:
        if e['kind']=='voice':
            continue
        lines.append(f"| {e['id']} | {e['kind']} | {e['seconds']} | {'Reuse candidate' if e['reuse'] else 'New, not generated'}: `{e['file']}` | {esc(e['prompt'])} | {refs(e)} |")
    represented = {r['id'] for e in entries for r in e['cards']}
    lines += ['', '## Cards with no separate audio job','', 'Action-only pauses and text choices do not invent sounds. Existing ambience continues as directed; the Scene 2 reply wording is superseded as noted above.', '', '| Card | Exact source field |','|---|---|']
    for cid in cues:
        if cid not in represented:
            r = cues[cid]
            lines.append(f"| {cid} | [{r['locator']}]({r['source']}#{cid}) : {esc(r['cue'])} |")
    lines += ['', '## Optional spoken lines, separate from effects','', 'No voice selection is embedded. A future explicitly approved voice job also requires --voice-id. Caller lines should sound tinny through a headset; Lia lines should stay natural. Cebuano draft pronunciation and delivery need human review. Existing ko.mp3 is a candidate for GAME; whether it contains that word is unverified because playback was not requested. Do not add announcer generation by assumption.', '', '| ID | Speaker | Draft seconds | Optional text | Exact source |','|---|---|---:|---|---|']
    for e in voices.values():
        lines.append(f"| {e['id']} | {e['speaker']} | {e['seconds']} | {esc(e['prompt'])} | {refs(e)} |")
    unused = sorted(p.name for p in (ROOT/'assets/sfx').glob('*.mp3') if p.name not in {Path(e['file']).name for e in reused})
    lines += ['', '## Existing inventory and mix instructions','', '[Existing clip provenance](../../assets/sfx/CREDITS.md). Reused candidates: '+', '.join(Path(e['file']).name for e in reused)+'. Unassigned existing clips: '+', '.join(unused)+'. No existing asset changed.', '', 'Deduplication is by sound identity, not by card. Replays use the same whoosh/GAME assets. Repeated input presses and timer ticks retrigger one clip; do not generate triples. Fan and traffic persist across title blackouts; cut the fan dead at M2.1 and return it before the second room reveal. Suction intensity, arcade slowing/pitch-down, abrupt stops, silence and fades are mix operations, not extra generation jobs. Do not add dramatic stings to object discovery or caller aftermath. Existing room/street loops need seam and content review; sound-effect generation is not a promise of finished music.', '', '## Generator and safety','', 'Run from this worktree: `python3 tools/audio/elevenlabs_generate.py` (dry-run, no key needed). Selecting jobs: `python3 tools/audio/elevenlabs_generate.py --ids tick fan`. Actual requests require --go, explicit --ids, and ELEVENLABS_API_KEY in the environment. Voice requests additionally require --voice-id. Do not use --go during prep. No credential files are read, no keys are logged, no automatic retries after uncertain outcomes. Live batches hold a nonblocking Office Mac file lock to prevent overlapping requests; the persistent .generation.lock is not audio. Outputs stay under docs/audio/generated; existing files are skipped. A zero-byte existing output is an error, not a successful skip.', '', 'Official docs consulted: [Sound generation](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert), [Text to speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). Uses POST /v1/sound-generation, loop, duration_seconds (0.5–30), eleven_text_to_sound_v2; TTS uses POST /v1/text-to-speech/{voice_id}, eleven_multilingual_v2. No credit estimate is supplied. No account, quota or secret lookup was performed.', '']
    (out/'ELEVENLABS_SHEET.md').write_text('\n'.join(lines))
    print(json.dumps({'jobs':len(entries),'kinds':counts,'reuse':len(reused),'new_nonvoice':len(entries)-len(reused)-counts['voice'],'unused_assets':unused},sort_keys=True))

if __name__ == '__main__':
    main()
