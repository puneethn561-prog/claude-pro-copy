#!/bin/bash
# One topic -> one finished reel + upload kit.
#   bash make_video.sh "What if the Moon disappeared?" [style=tall-tale] [voice=am_fenrir]
# Env: GITHUB_TOKEN (GitHub Models; without it the offline template is used), VG_MODEL, OFFLINE=1,
#      PAR (parallel render chunks, default 3), FPS (default 24), QS (render quality, default software-GL settings).
# Output: out/<slug>.mp4, out/<slug> - Upload Package/, out/<slug>-project.tgz (script, timing, plan, shots, sheet)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
TOPIC="${1:?topic}"; STYLE="${2:-tall-tale}"; export VG_VOICE="${3:-am_fenrir}"
E="$ROOT/engine/rick-clips-copy-skill/faceless-shorts"
PY="${PYTHON:-python3}"
[ "$STYLE" = "tall-tale" ] || { echo "NOTE: only the tall-tale style has an LLM shot director so far; using tall-tale"; STYLE=tall-tale; }
SLUG=$(echo "$TOPIC" | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//' | cut -c1-50)-$(date +%H%M%S)
mkdir -p work out; PROJ="$ROOT/work/$SLUG"
bash "$E/scripts/new_video.sh" "$STYLE" "$SLUG" --dir "$ROOT/work"
OFF=""; [ "${OFFLINE:-0}" = 1 ] && OFF="--offline"
echo "::group::1. script (LLM, rules from prompts/script.md)"; $PY generator/vg.py script "$PROJ" "$TOPIC" $OFF; cat "$PROJ/script.json"; echo "::endgroup::"
echo "::group::2. voice (Kokoro $VG_VOICE x1.0) + word timing (Whisper)"
if ! $PY "$E/scripts/voice.py" "$PROJ"; then echo "voice failed -> estimated timing, silent narration"; $PY "$E/scripts/estimate.py" "$PROJ"; else $PY "$E/scripts/words.py" "$PROJ"; fi
echo "::endgroup::"
echo "::group::3. shots (LLM plan -> director -> src/shots.js) + check"
cd "$PROJ"
$PY "$ROOT/generator/vg.py" shots "$PROJ" --style "$STYLE" $OFF
export FPS="${FPS:-24}" SOFTWARE_GL="${SOFTWARE_GL:-1}" QS="${QS:-&res=0.6&aa=0&shadow=1024}"
if ! node tools/capture.mjs check | tee review-check.txt | tail -5 | grep -q "CHECK OK"; then
  echo "LLM plan failed the check -> safe plan"; cat review-check.txt | grep -E "ERROR|EXCEPTION|boot" | head -20 || true
  $PY "$ROOT/generator/vg.py" shots "$PROJ" --safe
  node tools/capture.mjs check | tee review-check.txt | tail -3 | grep -q "CHECK OK" || { cat review-check.txt; exit 1; }
fi
echo "::endgroup::"
echo "::group::4. sound (cues + procedural music/SFX mix)"; node tools/capture.mjs cues; $PY tools/mix.py .; echo "::endgroup::"
echo "::group::5. contact sheet"; node tools/capture.mjs sheet review/all.jpg 1.5 8 || true; echo "::endgroup::"
echo "::group::6. render (headless Chrome, $FPS fps, ${PAR:-3} chunks in parallel)"
DUR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('data/lines.json')).duration)")
N=${PAR:-3}; T0=$(date +%s); pids=(); : > renders/list.txt; mkdir -p renders
for i in $(seq 0 $((N-1))); do
  A=$(node -e "console.log(($DUR*$i/$N).toFixed(4))"); B=$(node -e "console.log(($DUR*($i+1)/$N).toFixed(4))")
  node tools/capture.mjs video "renders/part$i.mp4" "$A" "$B" > "renders/part$i.log" 2>&1 & pids+=($!)
  echo "file 'part$i.mp4'" >> renders/list.txt
done
for p in "${pids[@]}"; do wait "$p" || { cat renders/part*.log; exit 1; }; done
echo "render took $(( $(date +%s) - T0 )) s"
# join chunks, mux the full mix, light grade toward the reference reels (warm, saturated, a bit of contrast)
ffmpeg -v error -y -f concat -safe 0 -i renders/list.txt -i data/mix.wav -map 0:v -map 1:a \
  -vf "eq=saturation=1.10:contrast=1.04:gamma=0.98,colorbalance=rs=0.02:bs=-0.02" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r "$FPS" -c:a aac -b:a 192k -shortest -movflags +faststart "$ROOT/out/$SLUG.mp4"
echo "::endgroup::"
cd "$ROOT"
$PY generator/vg.py kit "$PROJ" "out/$SLUG.mp4" out
tar czf "out/$SLUG-project.tgz" -C work "$SLUG/script.json" "$SLUG/data" "$SLUG/src/shots.js" "$SLUG/review" 2>/dev/null || true
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact "out/$SLUG.mp4"
echo "$SLUG" > out/LAST
