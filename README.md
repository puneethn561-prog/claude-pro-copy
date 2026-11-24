# claude-pro-copy — free AI reel maker (topic ➜ 9:16 MP4)

Type a topic. You get a 30-45 s vertical reel: a story script, a deep AI voice, one-word captions, and flat 2D cartoon
people acting in a sunny 3D world, plus music and sound effects. No paid API, no Claude Pro. Everything runs free on
GitHub Actions.

## Make a video (2 easy ways)

**Way 1 — button:** open the **Actions** tab ➜ **Generate video** ➜ **Run workflow** ➜ type your topic ➜ **Run**.
Wait (about 20-40 min). Open the finished run ➜ **Artifacts** ➜ download `video-…` (the MP4) and `kit-…` (cover image,
titles, descriptions, hashtags).

**Way 2 — list:** add topics to `topics.txt`, one per line, and commit. Each NEW line becomes a video (max 3 per push).
Finished topics are saved in `state/done.json`, so they are not made again.

If the Google Drive secrets are set (see below), every video's upload kit also lands in the Drive folder
**AI Generated Videos (claude-pro-copy)**, one folder per video.

## How it works
1. **Script** — an LLM on **GitHub Models** (free, uses the Actions `GITHUB_TOKEN`; default `openai/gpt-4.1-mini`)
   writes `script.json`. The rules are `prompts/script.md`, copied word for word from the reference skill
   (`engine/rick-clips-copy-skill/SKILL.md` sections 0, 0b, 1 and `references/style-playbook.md` section 1):
   payoff in the first second, one cause-and-effect chain, 30-45 s, loop ending. Bad drafts are sent back to the LLM
   (up to 3 tries); if the LLM is down, an offline template is used so the run still finishes.
2. **Voice** — Kokoro (open source, CPU), voice `am_fenrir`, normal speed. **Word timing** — local Whisper.
3. **Shots** — the LLM writes a shot plan (sets, cast, camera moves, moods, labels) following `skills/tall-tale.md`.
   `generator/director.js` turns the plan into `src/shots.js` for the bundled engine (three.js in headless Chrome).
   If the plan breaks the engine check, a safe plan is used.
4. **Sound + render** — procedural music/SFX mix, headless Chrome renders every frame, ffmpeg makes the MP4
   (1080x1920, 24 fps), with a light warm/saturated grade.
5. **Upload kit** — `NN_Reel1_<date>_9x16_1080.mp4`, `Cover_ig/fb/yt/dm_` images and `00_Text_<Platform>_*.md` files
   in the same format the derick-apps autopost bot reads, plus `metadata.json` (AI label: ON).

## Run it on your own computer
Needs Node.js 22+, Google Chrome, ffmpeg, Python 3.10+.
```bash
pip install -r requirements.txt
export GITHUB_TOKEN=<a GitHub token with models access>   # or OFFLINE=1 to test without an LLM
bash make_video.sh "What if the Moon disappeared?"         # -> out/<name>.mp4 and out/<name> - Upload Package/
```
With a graphics card it is much faster: `SOFTWARE_GL=0 QS="" FPS=30 bash make_video.sh "..."`.

## Add a skill (your own style / rules)
- Change how scripts are written: edit `prompts/script.md`.
- Change how shots are planned: copy `skills/tall-tale.md` to `skills/<name>.md`, edit the rules, then run with
  style `<name>` (it still uses the tall-tale engine and the same allowed values).
- The full original skill (6 styles, examples, references) is in `engine/rick-clips-copy-skill/`.

## Google Drive upload (optional)
Service accounts have no Drive storage, so this uses your own Google account (OAuth):
1. Google Cloud Console ➜ a project ➜ enable **Google Drive API** ➜ OAuth consent screen (External, add yourself as
   test user, or publish) ➜ Credentials ➜ **OAuth client ID** (type *Web application*), redirect URI
   `https://developers.google.com/oauthplayground`.
2. Open https://developers.google.com/oauthplayground ➜ gear icon ➜ *Use your own OAuth credentials* ➜ paste client
   ID/secret ➜ scope `https://www.googleapis.com/auth/drive` ➜ Authorize ➜ *Exchange authorization code for tokens* ➜
   copy the **refresh token**.
3. Repo ➜ Settings ➜ Secrets and variables ➜ Actions ➜ secrets `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`,
   `GDRIVE_REFRESH_TOKEN`. Optional variable `DRIVE_FOLDER_ID` (default `1iysmlIFQfa1Ci3ilmfyqLP8cTOdTP07Z`).
No secrets ➜ the step prints `SKIP Drive upload` and the artifact is still there.

## Honest limits
- The LLM lists sources from memory; they are **not** web-checked (`sources_note` in the kit). Check facts before posting.
- The LLM writes a shot *plan*, not free-form 3D code (the free tier allows ~8k tokens in / 4k out). Shots come from a
  fixed library of sets, camera moves and actions, so they are simpler than a hand-written example reel.
- No GPU on GitHub runners: rendering uses software WebGL at 60% resolution (upscaled), so it is slow and a bit soft.

## Tests
`python -m pytest -q tests` — script validation, plan validation/coercion, timing.

## Licenses
Engine code, stories and drawings: from the bundled skill (original, free to use). three.js: MIT
(`vendor/LICENSE-three.txt`). Inter font: SIL OFL 1.1. Kokoro-82M: Apache-2.0, kokoro-onnx: MIT, faster-whisper: MIT.
