#!/bin/bash
# Assemble the narrated GG EZ trailer from the Playwright clips, the edge-tts lines and the arcade loop.
set -euo pipefail
F=/opt/homebrew/bin/ffmpeg
W=/tmp/gg-ez-trailer; C=$W/clips; S=$W/segs; N=$W/narr
MUSIC=/Users/carl/CODELocalProjects/_worktrees/gg-ez-html-polish-review/web/public/assets/audio/arcade.mp3
rm -rf "$S"; mkdir -p "$S"
seg(){ "$F" -v error -y -ss "$3" -t "$4" -i "$C/$2.webm" -vf "scale=1280:720:flags=lanczos,fps=30,format=yuv420p" -an -c:v libx264 -preset fast -crf 18 "$S/$1.mp4"; }
card(){ "$F" -v error -y -loop 1 -framerate 30 -i "$C/$2.png" -t "$3" -vf "scale=1280:720,format=yuv420p$4" -an -c:v libx264 -preset fast -crf 18 "$S/$1.mp4"; }
# name            source    start  length   (absolute start in the montage)
card 00-title      card-title 2.0 ",fade=t=in:st=0:d=0.4"   #  0.0
seg  01-menu       title      0.5  2.8                      #  2.0
seg  02-matchmake  title      3.8  2.5                      #  4.8
seg  03-hair       match1    30.8  4.0                      #  7.3  lose by a hair: 3 HIT at 8.0, KO at 8.5, DEFEAT at 9.0
seg  04-chat       match1    37.3  4.7                      # 11.3  lia_ph: ez, two replies, reply at 13.6
seg  05-controls   match1     0.5  9.5                      # 16.0  move, string, FINISHER pop at 19.5
seg  06-rematch    rematch    1.0  3.5                      # 25.5
seg  07-third      third     18.8  5.8                      # 29.0  third loss, KO flash 32.2, DEFEAT at 33.6
seg  08-throw      third     25.4  5.8                      # 34.8  pad trembles, flight 35.7, crack 36.3, connection lost 37.4, air streaks 39.4
seg  09-room       room       0.6  6.5                      # 40.6
seg  10-call       call       0.8  8.0                      # 47.1
seg  11-final      final      0.8  9.0                      # 55.1  fair fight under CONNECTION STABLE (the result lands after 12 s, outside the cut)
card 12-end        card-end   6.5 ",fade=t=out:st=5.0:d=1.5" # 64.1 -> 70.6
ls "$S"/*.mp4 | sort | sed "s/^/file '/;s/$/'/" > "$W/list.txt"
TOTAL=70.6
# Narration line starts (seconds): one line per matching segment.
T1=8.3; T2=16.2; T3=26.0; T4=35.0; T5=40.9; T6=47.6; T7=55.6; T8=62.3
ms(){ python3 -c "print(int(round($1*1000)))"; }
# Music: -8 dB bed, -14 dB while a line plays (0.3 s before, 0.4 s after), fade out at the end.
DUCK="between(t,8.0,15.6)+between(t,15.9,26.1)+between(t,25.7,34.4)+between(t,34.7,39.6)+between(t,40.6,45.2)+between(t,47.3,52.8)+between(t,55.3,60.6)+between(t,62.0,69.7)"
"$F" -y -v warning -stats -f concat -safe 0 -i "$W/list.txt" \
  -i "$N/01.wav" -i "$N/02.wav" -i "$N/03.wav" -i "$N/04.wav" -i "$N/05.wav" -i "$N/06.wav" -i "$N/07.wav" -i "$N/08.wav" \
  -stream_loop -1 -i "$MUSIC" \
  -filter_complex "[1:a]adelay=$(ms $T1):all=1[n1];[2:a]adelay=$(ms $T2):all=1[n2];[3:a]adelay=$(ms $T3):all=1[n3];[4:a]adelay=$(ms $T4):all=1[n4];[5:a]adelay=$(ms $T5):all=1[n5];[6:a]adelay=$(ms $T6):all=1[n6];[7:a]adelay=$(ms $T7):all=1[n7];[8:a]adelay=$(ms $T8):all=1[n8];[n1][n2][n3][n4][n5][n6][n7][n8]amix=inputs=8:normalize=0,volume=6dB,apad=whole_dur=$TOTAL[narr];[9:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$TOTAL,asetpts=PTS-STARTPTS,volume=-8dB,volume=eval=frame:volume='if(gt($DUCK,0),0.5012,1)',afade=t=out:st=68.6:d=2[music];[narr][music]amix=inputs=2:normalize=0:duration=first[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 48000 -movflags +faststart -t $TOTAL "$W/build_trailer.mp4"
/opt/homebrew/bin/ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -of compact "$W/build_trailer.mp4"
"$F" -v info -i "$W/build_trailer.mp4" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
