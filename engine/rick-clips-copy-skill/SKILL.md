---
name: rick-clips-copy-skill
description: Make finished 30-45 second vertical reels (built to hold 70%+ viewed in the first second) for the YouTube channel "The What If Lab" fully in code - story-led Ricks Clips / Tall Tale 3D style (flat 2D cartoon people in a rich 3D world), deep male AI voice, one-word captions, music and sound effects, rendered to MP4. Use whenever the user asks for a what-if reel, a short, a story reel, a new script, or a video for The What If Lab, even from just a topic.
---

# The What If Lab - Reels

You make one finished reel at a time: idea -> script -> voice -> captions -> animated 3D shots -> sound -> MP4.
Everything is code. The engine is the bundled `faceless-shorts/` skill (style **Tall Tale 3D**). Read
`faceless-shorts/SKILL.md` and `faceless-shorts/styles/tall-tale/STYLE.md` in full before planning.
A complete worked reel is in `examples/longyearbyen/` (script + all 17 shots) - copy its patterns.

The user writes in romanized Telugu (Tenglish). Reply in the same style, short and clear.

## 0. SCRIPT CORE - win the first second (target 70%+ "viewed", never below)

Half the viewers swipe in the first second; at 50% viewed YouTube stops pushing the Short. Every script is
written for the first second first. These rules beat every other script rule below.

1. **Payoff first, never a question.** Line 1 is the most shocking number/fact of the story, said at 0.0 s
   ("Thirteen years. One day. Three point eight billion dollars."). No "Have you ever wondered", no setup.
2. **Frame 0 is already moving.** No fade-in, no black, no logo, no title card. Motion starts within 0.3 s.
3. **Caption on screen from frame 0**, big, with the shocking number in digits.
4. **Instant recognition.** The subject (the thing people searched) is visible in frame 0.
5. **Line 2 = the promise:** tell them what they will get ("...and here's why it took so long.").
6. **Cut every 1.5-2 s**, nothing static, no filler line. If a line doesn't add a new fact or laugh, delete it.
7. **Seamless loop:** the last line ends mid-motion and flows back into line 1, so replays add watch time.
8. **Keep it tight:** aim for the shortest length that tells the story (30-35 s is ideal; the 40-45 s rule
   below is the maximum, not the target).
9. **Plan check before "Build it?":** run the continuity check (section 0b), then read line 1 alone - would a stranger stop scrolling? If not, rewrite it.
10. **After upload:** check "Viewed vs swiped away" in YouTube Studio; under 70% = fix the first second next time.

## 0b. CONTINUITY - the script is ONE story, never a list of facts (mandatory)

A reel with good facts but no thread loses viewers mid-way. Every script must read as one chain of cause and effect.

1. **One thread from start to end.** Pick one named character (e.g. Leo the gamer) or one object that is in the
   story from line 2 to the last line; it reacts in the shots and is named again in the last line.
2. **Every line links to the one before it.** Lines 3+ start with (or contain) a link word that shows WHY or WHAT
   NEXT: because, so, which means, instead, when, but, then, even after that, until, and that's why.
   No line may be a standalone fact that could be moved to another position.
3. **Cause -> effect order.** Each fact is the reason for the next one (sales kept coming -> so no rush -> instead
   they moved to another game -> when they came back...). If two facts have no link, write the link or cut one.
4. **The last line pays off the thread** (the character's wait, the question from line 2) and flows back into line 1.
5. **Continuity check before "Build it?":** read the lines in order and ask "does each line answer 'so what
   happened next?' from the line before?" Then shuffle-test: if any line could swap places without breaking the
   story, it is a fact list - rewrite it.

Bad (fact list): "GTA Five never stopped selling. / Rockstar moved to Red Dead Two. / A hacker leaked it."
Good (chain): "Because GTA Five never stopped selling, Rockstar had no reason to rush. Instead, they moved the
studio onto Red Dead Two. When they came back... but then a hacker leaked it..."

## 0c. SCRIPT APPROVAL GATE - no build without an approved script (mandatory)

1. Before ANY build step (voice, words, shots, render), send the full script (every line, numbered) and ask
   "Build it?". Do nothing else until the user answers.
2. User approves ("ok", "yes", "build") -> build exactly that script, word for word.
3. User asks for changes -> rewrite only what they asked, send the updated full script again, and wait for approval
   again. Never build a version the user has not seen and approved.
4. If the user objects to the script while a build is already running, STOP the build immediately (before voice /
   render), fix the script, get approval, then continue.
5. This applies to every new reel AND every rebuild / v2 of an existing reel.

## 1. The user's rules (always apply)

**Length:** 30-35 s ideal, 40-45 seconds max. About 90-110 spoken words for 30-35 s (140-150 words max for 45 s) at the chosen voice speed. Never over 60 s
(the channel's 1:30+ Shorts get swiped away).

**Voice:** `am_fenrir` (deep US male), speed **1.12**. Ask only if the user wants a different voice.

**Format (Ricks Clips / Tall Tale 3D):** flat 2D cartoon people (big round heads in real skin tones - see Anti-Whiteout, ink outlines, bean bodies,
stick limbs, hats/props) acting inside a 3D world. One-word white captions in the centre. Story-led, real
science/history reveal, twist ending.

**Script shape:**
1. Hook = the payoff/shocking fact at 0.0 s (see section 0) ("There's a town where dying is against the law.")
2. A character (named, e.g. Olaf) runs into the problem - short funny dialogue lines.
3. Escalation: 2-3 beats, side characters.
4. "So what's going on?" / "But why?"
5. The real reveal (science/history), told simply.
6. Twist / punchline last line that loops back to the hook.
Write it like talking to a friend, flowing sentences; a line = a cut (1.5-3.5 s). Numbers as spoken ("nineteen fifty")
with digits in the caption (`caps`). Every fact checked against 2+ reliable sources, listed in `script.json` "sources".

**Visuals - "animation, visuals, camera angles, sets rich, top notch":**
- One **wide establishing shot** at the start (crane over the whole set).
- **Slow push-ins** on whoever is speaking.
- **Quick whip pans** between scenes (yaw + horizontal smear in the first ~0.2 s of the new shot).
- **Every camera move finishes in under 2 s**, then a slow drift. New shot every ~1.5-3 s; split any shot longer than ~4 s.
- Punch-ins / crash zooms on the key word (a date, a number, "ticket", "flu").
- Rich sets: many props, signs, vehicles, background extras, weather (snow particles, clouds), a different set per act.
- On-screen stamps/labels on the reveal words (e.g. ILLEGAL? -> crossed out -> MYTH), kept clear of the caption band.
- Characters' faces always react (shock, smug, angry, dizzy, laugh) and mouths talk on their lines.

**Lighting - ANTI-WHITEOUT (mandatory, full rules; these win over anything else in this skill):**

You are rendering a vertical 9:16 cartoon reel: flat 2D cartoon characters (round heads, simple faces) inside a 3D world (three.js or similar). The past problem was WHITEOUT: snow, sky, fog and glow blew out to pure white, and the characters' white heads and white clothes vanished into the background. Follow these rules on every shot, with no exceptions.

COLOUR AND MATERIALS
- Nothing in the scene is pure white (#FFFFFF). The brightest allowed surface is about #E6E9EE.
- Snow and ice: blue-grey, around #BCC8D6, never white.
- Sky and fog: muted, darker than the snow (for example #8FA3B8 to #6E8299). Fog density moderate, never a white wall.
- Character heads get a real skin tone, never white: light #F3D2B5, medium #D9A27C, dark #8D5A3B. Give each character a different one.
- No white clothes. Doctors, scientists and nurses wear coloured scrubs or coats (teal, navy, maroon, olive).
- Every character has a dark outline (2 to 4 px, #1E1E24) so the silhouette reads on any background.
- Character colours must contrast with the set behind them: a light character on a mid or dark background, a dark one on a light background.

LIGHTING AND RENDERING
- Tone mapping ACES Filmic, exposure 0.80 to 0.90 (outdoor snow 0.80 to 0.82, indoor 0.85 to 0.90). Never above 1.0.
- Sun or key light intensity about 1.5 to 1.8; hemisphere or ambient light about 0.6 to 0.75. No extra fill lights pointing at white surfaces.
- Bloom strength 0.06 to 0.15, threshold 0.85 or higher. Glowing objects (lamps, screens, lab panels, ice) stay small and dim; emissive intensity 0.5 or less.
- Windows and bright backgrounds behind a character are darkened or blurred so the face stays the brightest-contrast thing in frame.
- Cross-section and diagram shots (for example ice layers, permafrost) use rich saturated colour, not glowing white.

CHECK BEFORE THE FULL RENDER (mandatory)
1. Render one still frame from every shot and put them on a contact sheet.
2. For each frame, measure: share of pixels above 240 brightness (on all of R, G, B) must be under 8%; the character's face must have clear contrast with the area right behind it.
3. Look at every frame yourself. If any face, outline or caption is hard to read, or any area looks blown out, lower exposure or bloom, darken that background, and re-check.
4. Only after every frame passes, render the full video. Then check a contact sheet of the final video the same way before delivering.

CAPTIONS
- White one-word captions stay white, but always with a thick dark stroke (6 px or more) and a soft drop shadow, so they read even on snow.

If any instruction elsewhere conflicts with these rules (a brighter look, white snow, white coats), these rules win.

**Topics that work on this channel:** global / pop-culture / science what-ifs and strange true stories
(Godzilla & Kong, smartphones, Thanos, sleep did best). India-only niche topics (exams, Flipkart) flopped.
Titles = statement hooks ("The Town Where You're Not Allowed to Die"), not questions.

**Use only the skills the video needs.** The engine is faceless-shorts. The reference skills below are optional
toolkits; open one only when the reel needs what it is for.

## 2. Workflow

1. **Intake** (one message): topic (or offer 3 ideas), anything changed from the defaults above.
2. **Plan** (one screen): title, full narration one line per cut, shot list (what we see, camera move, which word it
   lands on), sources. Ask "Build it?" and wait.
3. **Build** (from `faceless-shorts/`):
   - `bash SKILL/faceless-shorts/scripts/new_video.sh tall-tale <name>`
   - write `script.json` -> `scripts/py scripts/voice.py <proj>` (am_fenrir x1.12) -> `scripts/py scripts/words.py <proj>`
   - Check the speech ends at 40-45 s. If longer, cut words and re-voice.
   - write `src/shots.js` (see the example for helpers: `mv` move-under-2s, `whipA` + `smear`, `stamp`, `label`,
     per-set reset functions so shots render correctly out of order).
   - `node tools/capture.mjs check` -> fix errors.
4. **QA with the contact sheet** - `node tools/capture.mjs sheet review/all.jpg 1.5 8`, LOOK at it, fix, repeat. Common faults:
   camera inside a character or prop, fence/mound blocking the subject, punch-in missing its target, subject off-frame
   after a drift, scientists/clerks hidden behind walls, overexposed snow. Interior people stand behind a desk
   (`PR.desk`) facing camera, not inside the wall.
5. **Sound:** `node tools/capture.mjs cues` then `scripts/py tools/mix.py .` (voice + music + SFX: whoosh on cuts,
   stamp/ding on reveals).
   **MUSIC RULE (user, 2026-11-23): never reuse the same track. Every reel gets its own music, matched to its story.**
   In `script.json` set `"music": {"mood": "<mood>", "seed": <new random int>}`. Moods: `playful` (funny, light),
   `wonder` (science, awe), `tension` (danger, mystery), `epic` (big disasters, history), `chill` (calm facts), `sad`.
   The seed picks key, tempo, chords, melody, lead instrument and groove, so a new seed = a new track. Pick the mood
   from the script's tone (it may change only if the user asks), pick a fresh seed each reel, and note mood+seed in the
   plan. Don't use the old fixed "bed"/"bounce"/"tension" tracks unless the user asks for one. Copy the score code
   (`music_score` in `faceless-shorts/styles/tall-tale/example/tools/mix.py`) into older projects if missing. If the user wants no voice, render captions-only (`estimate.py`) and/or drop the voice track.
6. **Render:** `FPS=24 node tools/capture.mjs video renders/out.mp4`. On a slow/CPU-only machine use
   `SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024'` and render in ~11 s chunks (`video renders/p1.mp4 0 11.5` ...),
   2 in parallel, then concat with ffmpeg and mux `data/mix.wav`. 1080x1920 output.
7. Deliver the MP4, mention any known weak shot, offer the next reel.

### Local render on the user's PC (DEFAULT for every reel - user's standing rule, 2026-11-23)
The user renders every reel on their own PC. Do not do the full render in the sandbox (only check + contact-sheet
QA frames + the audio mix). Always deliver the zipped project AND tell them the render steps below in simple Tenglish,
every time, even if they know them.
The sandbox has no GPU, so a full render is slow there (10-15+ min). The user's Windows 11 PC rendered a 13 s reel
in 47 s. So once `check` passes, the contact sheet is approved and `data/mix.wav` is mixed:
1. Delete `review/` and `renders/` contents, add `RENDER-LOCALLY.txt` (steps below), zip the project folder, send it
   with display_file.
2. Steps for the user (Windows, in Tenglish, simple):
   - One time only: install Node.js LTS (nodejs.org), Google Chrome, and ffmpeg (`winget install Gyan.FFmpeg` in
     PowerShell, type Y for the agreement), then close and reopen PowerShell.
   - Extract the zip (right click > Extract All). Open the project folder, right click on empty space >
     **Open in Terminal**. (Don't type "power shell" with a space in a browser; that opens a Bing search.)
   - Run `node tools/capture.mjs video renders/<name>.mp4`. Output: `renders/<name>.mp4` with sound.
   - Slow / no graphics card: `$env:FPS=24; $env:SOFTWARE_GL=1; node tools/capture.mjs video renders/<name>.mp4`.
   - capture.mjs finds Chrome at the standard Windows/Mac paths; no npm install needed (Node 22+).
3. Ask them to upload the MP4 back so you can QA it (contact sheet + whiteout check) before they post.

### Style reference videos
The user supplies the reference reels for look and pacing. Keep them in `style-refs/` inside this skill folder
(the old reference "The Instinct That Makes You Crash" was dropped on 2026-11-23 at the user's request). Before
planning shots, extract a contact sheet of each file in `style-refs/` (`ffmpeg -i ref.mp4 -vf fps=1,scale=240:-1,tile=8x4 sheet.jpg`)
and look at it; match its framing, prop detail, camera energy and caption style. Never copy its script or footage.

**Read `references/style-playbook.md` before writing any script or shot list** (mandatory). It holds the hook formulas,
beat template with timings, line-length rules, shot grammar table, framing/caption/sound rules and per-video
breakdowns extracted from the refs. Files in `style-refs/` (7): `roller-coasters.mp4`, `storm-oil.mp4`,
`pink-prison.mp4`, `perfect-railroads.mp4`, `mirror-horse-race.mp4`, `cart-army.mp4`, `drivers-filming.mp4`.
Key rules (refs are ~65 s; keep our 30-45 s length and scale the beats, not the pace):
- Line 1 at 0.0 s = "He/They + a strange filmable act + one wrong-sounding detail" (the climax out of context), no question.
- One unnamed hero + one mocking foil; every sentence opens with a chain word (But/So/Then/Until/You see); time ladder.
- Reveal = "You see," + one everyday analogy at 65-85%; foil gets the consequence; last words loop into line 1.
- ~3.7 words/s, sentences 11-15 words avg with 2-7 word punches; narration and music run to the last frame.
- Shots 1.4-2.2 s, cut on the naming noun/chain word with a 2-4 frame whip blur; camera never still; ~50% MS/CU,
  ~25% wides, ~25% macro/POV inserts; labels are in-world signs/counters; captions 1-2 words, centred ~70% down.

### 3D visual fidelity & pin-to-pin recreation (MANDATORY for every reference-reel recreation)
The reference reel is the visual source of truth. Recreate **everything visible in every shot** as a deliberate 3D element. Do not focus only on the hero character or the main action. Tiny background details matter too. This rule applies to every scene, every frame, and every generated/rendered asset.

**1. Inspect before building**
- Watch the complete reference reel and inspect it shot by shot. Create a timestamped shot breakdown and a visual inventory before writing the 3D scene.
- For each shot, record every visible person/character, animal, vehicle, prop, piece of furniture, architectural feature, environmental object, sign, decoration and background element. Include partially visible objects when they are recognizable.
- Record each item's screen position, approximate real-world size, orientation, rotation, distance/depth, relationship to nearby objects, visible side, colour, material, texture, shape, condition and state (open/closed, held/placed, moving/stationary).
- Record set layout and spatial relationships: wall/floor boundaries, doors and windows, furniture placement, foreground/midground/background layers, entrances, exits and the path characters take.
- Track small details: handles, knobs, hinges, seams, buttons, labels, straps, stitching, wheels, spokes, rims, lights, trim, patterns, scratches, folds, surface grain, reflections and cast shadows. Do not silently omit a detail because it seems unimportant.
- If a detail is hidden or genuinely impossible to identify from the reference, do not invent a confident exact answer. Mark it as obscured/uncertain and use the least intrusive plausible reconstruction.

**2. Build a complete 3D recreation**
- Every visible subject and object must be represented by actual 3D geometry or a suitable 3D surface/material treatment. Do not replace a detailed 3D object with a plain cube, flat card, generic silhouette or vague placeholder.
- Match the reference's silhouette and proportions first, then its smaller geometry, colour, material, texture and surface details. Use bevels, rounded edges, thickness, layered parts, joints and physically plausible construction wherever visible.
- Recreate people and characters individually: head and face shape, skin tone, hair, facial features, body proportions, clothing layers, folds, footwear, accessories, posture, expression and hand-held items. Keep each person's identity and appearance consistent across all shots.
- Recreate sets, architecture and surroundings with the same care as foreground subjects. Background objects must not be randomly simplified, removed, replaced or rearranged.
- Match object placement and scale relative to the characters and set. A prop must remain where it is placed, and must move only when the reference shows it moving or a character interacts with it.
- Match visible lighting direction, softness, colour, shadow placement, reflections, surface roughness and depth cues. Use appropriate materials (wood, metal, glass, fabric, plastic, stone, skin, foliage, etc.) rather than one generic material.
- Recreate readable text, symbols, logos and markings only when they are legible in the reference. Never fabricate extra writing or decorative markings.

**3. Enforce pin-to-pin continuity**
- Maintain a scene/asset continuity ledger. Reuse the same 3D model and material definitions for recurring people, props and set pieces; do not regenerate them with slightly different proportions or colours in later shots.
- Preserve exact relative positions, scale, orientation, costume, accessories, prop ownership, object state, set dressing, lighting direction and time-of-day across consecutive shots unless the reference visibly changes them.
- Track interaction state frame by frame: which hand holds each object, where it is placed after release, which door is open, which drawer is pulled out, what has moved or been damaged, and what remains in the environment.
- Camera cuts may change the viewpoint, but must not cause the world layout or object positions to reset. Maintain a consistent 3D coordinate space for the set.
- No unexplained popping, disappearing, duplicated, floating, intersecting or teleporting objects. Every change must have a visible cause or be supported by the reference edit.

**4. Mandatory completeness check**
- Before rendering, compare the shot inventory against the 3D scene. Every listed visible item must be present, correctly placed and recognizably modelled.
- Render a contact sheet with enough frames to cover every shot and every meaningful action/state change. Inspect the frames against the corresponding reference timestamps, not from memory.
- Check foreground, midground and background separately. Zoom in to inspect small props, set dressing, character accessories, object edges, shadows and material details.
- Fix missing, generic, misplaced, incorrectly scaled, incorrectly coloured or inconsistent elements before approving the shot.
- Do not call a recreation complete if only the main subject matches while the set, props or background details are missing.
- If a detail cannot be reproduced because of tool, model or render limitations, state exactly what is approximate or missing. Never claim perfect pin-to-pin fidelity when it has not passed the visual comparison.

**Priority:** visual completeness and reference accuracy come before adding decorative creativity. Do not add new props, people, set pieces, visual effects or design flourishes that are absent from the reference unless the user explicitly asks for creative additions.

### 3D quality rules (user feedback, 2026-11-23)
- Props must read as real 3D, never box stacks: use rounded/lathe/capsule geometry, bevels, spoked wheels, curved
  canvas, animals with rounded bodies, heads and tapered legs; trains with domed boilers, rivets, cowcatcher, rods.
- Nothing important cropped: every character's full head (hat included) and the key prop stay inside the frame and
  out of the caption band; signs are readable whole or kept out of shot. Check this on the contact sheet.

## 3. Reference skills (bundled in `references/`, text only)

| folder | use it for |
|---|---|
| `Vincentwei1021_video-shotcraft` | shot grammar, camera moves, pacing, transitions - plan the shot list |
| `CK42BB_vox-explainer-skill` | explainer structure, reveal pacing, diagrams for the science part |
| `bangtutorial_bang-motion` | punchy motion graphics, kinetic text, stamps |
| `alchaincyf_huashu-art-motion` | art-directed motion, easing, visual polish |
| `greensock_gsap-skills` | GSAP timelines if you build an HTML-based overlay/animation |
| `remotion-dev_skills` | Remotion (React video) alternative pipeline |
| `heygen-com_hyperframes` | HTML-to-video frame pipeline alternative |
| `cloveric_claude-drawing-skill` | drawing custom 2D props/characters in code |
| `pbakaus_impeccable` | design taste / polish checklist for frames, thumbnails |
| `anthropics_skills` | general Anthropic skills (docs, canvas design, etc.) |
| `ahujasid_mcp-for-blender` | Blender via MCP - only if desktop Blender is available |

The faceless-shorts engine needs Node 22+, ffmpeg, Chrome/Chromium and its own setup (`scripts/setup.sh`).

## 4. Photoreal world + paper cut-out cast (user rules, 2026-11-24 — apply to every new reel unless the user says otherwise)
1. **World:** hyper-realistic, cinematic, live-action look: CC0 Poly Haven HDRI photo backgrounds (grounded projection + shadow catcher + sun matched to the HDRI), PBR vehicles/props, filmic lighting, depth of field. Space shots use NASA Blue Marble textures. Kit: `kits/photoreal-paper/real.js`.
2. **Characters:** 2D paper cut-outs (simple shapes, bold ink outlines, bright flat colours, crude satirical vibe) — ORIGINAL characters, never copies of South Park or any show. Built as a real paper card: visible card thickness/edges, slight bend, lit by the scene, real cast shadows. **No white scissor border** (rejected). **No full-3D clay/toy people** (tried and rejected). Kit: `kits/photoreal-paper/paper.js`.
3. **Act like real people:** seated characters sit IN the seat in side profile (car: on the seat, hand on the steering wheel; scooter/bike: astride, facing forward, both hands on the grips, feet on the footboard). Elbows/knees bend (IK), phones held and looked at for real, knocking hand touches the window. Never standing or facing camera when they should be seated.
4. **Camera:** always straight-on views (perpendicular to the action, like a stage / first-person side view). Never angled or three-quarter shots. Moves = straight push-ins, pans and trucks along that plane.
5. **Look approval:** before the full build, render sample stills of the main scenes (`sets2.html` + `tools/sets.mjs`) and get the user's ok on the look, then the script ("Build it?"). Build only after both.
6. Whiteout rules still apply (HDRI scenes exposure ~1.25 with the ACES curve, check <2% pixels over 94% grey).
