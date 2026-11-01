# Audio Prep Verification Notebook

## 1. Inputs and outputs

Worked locally on m5-max-128.local, branch dev/audio. Read the existing sound credits and the four requested storyboards. No game file or existing sound asset changed. No key/config file read, no live audio playback, no generation request, no credit or account lookup.

The manifest and sheet are rebuilt by tools/audio/build_manifest.py. Rebuilding twice produced identical SHA-256 hashes. All manifest source quotations were compared against their actual source lines or JSON card fields by the local tests.

Computed inventory: 62 jobs, comprising 35 effects, 6 loops and 21 optional voice jobs. Twelve entries reference existing clips; 29 non-voice entries need new audio. The remaining 21 are optional speech, not a requirement to voice text balloons. whiff.mp3 is the sole unassigned existing clip. Existing durations were read with ffprobe, without playback.

## 2. Repair and failure-path checks

An initial fixture blocked every environment lookup, including argparse's locale lookup. Narrowed the fixture to forbid only ELEVENLABS_API_KEY access during dry-run, while replacing the real environment with an empty mock. This was a test correction, not a workaround in the generator.

Final local run: 20 tests passed in 0.025 seconds. Covered no-key/no-network/no-write dry-run; explicit IDs and key gates; duplicate JSON keys, IDs, files and selected IDs; unknown IDs; traversal and symlink rejection; source-reference matching; invalid durations/schema; missing reuse; zero-byte files; skip-existing without a key; mocked sound/loop/TTS payloads; HTTP/timeout/transport failures without retries or leaked fake keys; empty, oversized, wrong-content and invalid-signature responses; redirects; concurrent-batch rejection; lock symlinks; atomic no-clobber publication.

Observed CLI output:

```text
DRY-RUN selected=62 existing=12 pending=50
DRY-RUN selected=2 existing=0 pending=2
ERROR: ELEVENLABS_API_KEY required for --go
missing-key exit=1
ERROR: --go requires explicit --ids
no-ids exit=1
ERROR: Unsafe selected id
traversal exit=1
Reproducible rebuild, unique IDs/files, no generated folder: PASS
```

Mock success creates only synthetic fixture bytes in temporary directories, not game assets. Temporary fixture cleanup is not project deletion. The actual docs/audio/generated folder remains absent.

## 3. Optimization and resources

A measured two-ID dry-run took 0.06 seconds elapsed, 0.04 user seconds and 0.01 system seconds on this Mac; maximum resident memory was 29,360,128 bytes (28 MiB). This includes Python startup and validation of the whole manifest, not an API or playback benchmark. A prior full dry-run took 0.0567 seconds elapsed. These are single-run checks, not statistical latency estimates.

Validation is linear in manifest entries and source references, with sets/dictionaries for duplicate detection and selection. Source paths have fixed shallow depth. API work is sequential, with a 60-second request timeout, a 32-MiB response cap, no automatic retries and one nonblocking batch lock. Publication holds the bounded audio bytes in memory, writes one temporary file and atomically links it without overwriting. Manifest/sheet duplication stores exact cue quotations for traceability; there is no background process or cache. Owned files occupied 118,751 bytes before this notebook.

## 4. Review gaps, not claimed passes

Attempted the narrow staged vet-hc Azure route with a zero spending budget. It exited 2 before review:

```text
vet-hc: pfc lane (Azure credits) primary: gpt-5.5
vet: max spend must be a positive number, got: 0.0
```

No remote model review was completed. A positive budget was not used because this prep task forbids spending. The local checks above are not an independent Azure review.

Production endpoints, voice eligibility, account permissions, pricing, music quality, clip content, loop seams and Cebuano pronunciation remain untested. Reuse is an editorial candidate mapping, not an audition approval. In particular, ko.mp3's spoken GAME content and phone.mp3's vibration suitability have not been confirmed by listening. Scene 2 action-only sound proposals are labelled in the sheet; the superseded reply pair remains text-only. Unspecified caller background at C1.1 does not invent another spoken line.

The generator's path checks and advisory lock protect ordinary local use, not a hostile process replacing directories after validation. Transport errors can leave a remote outcome uncertain: stop and reconcile before manually rerunning. A later --go needs fresh authorization; this prep request did not authorize generation.
