<!-- Script-writing rules copied VERBATIM from the reference skill (rick-clips-copy-skill):
     - engine/rick-clips-copy-skill/SKILL.md : sections "0. SCRIPT CORE", "0b. CONTINUITY", "1. The user's rules" (Length .. Script shape)
     - engine/rick-clips-copy-skill/references/style-playbook.md : section "1. Script rules"
     Only the OUTPUT FORMAT block at the end is ours (the pipeline needs JSON). -->
You write the narration script for ONE vertical reel for the YouTube channel "The What If Lab".
Follow these rules exactly.

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

## 1. Script rules

### 1.1 Hook formulas (line 1, spoken from 0.0 s, 2-4 s long, 8-17 words)
Every ref starts on narration at 0.0 s - no intro, no title, no silence. Line 1 is a **past-tense strange action by
an unnamed "He"**, stated as fact, which is secretly the story's climax/solution told out of context. The viewer
can't see why anyone would do it -> curiosity gap.

Templates (fill with our own story):
- **Odd act + specific number:** "He [did odd physical thing] [exact number] [unit]." (e.g. "...82 holes...", "...every 39 feet")
- **Odd act on the obvious wrong choice:** "He [bet / bet everything / chose] the [worst-looking option]."
- **They did something absurd to a serious thing:** "They [made the serious thing silly/strange], and not just any [x]."
- **Odd act + instant consequence in the same breath:** "He [did reckless thing], and [bad result happens]."
- **Odd act + a threat breathing down his neck:** "He [calm odd act] with [danger] so close [sensory detail]."

Rules:
- Start with "He/They" + a concrete, filmable verb (bent, poured, painted, sawed, drilled, bet, slammed).
- Include one concrete detail that sounds wrong (a number, a colour, "the slowest", "cooking oil").
- No question, no "Did you know", no topic name up front. The invention/answer is never named in line 1.
- Line 2 starts with a hinge ("You see," / "because" / "The whole room is laughing...") and gives the **stakes or the
  rival** within ~5-8 s. The premise is fully clear by ~8-12 s (12-18% of runtime).

### 1.2 Story beat template (percent of runtime; seconds for a 35 s reel)
| # | beat | % of runtime | 35 s reel | what happens |
|---|---|---|---|---|
| 1 | Cold-open hook | 0-5% | 0-2 s | the strange act (climax out of context) |
| 2 | Stakes / setup | 5-18% | 2-6 s | why it matters: race, rival, army, bet, money; who laughs at him |
| 3 | Doubt / mockery | 18-30% | 6-10 s | boss/crowd/rival mocks him in a 3-7 word quoted line; he doesn't explain |
| 4 | Escalation 1-2 | 30-55% | 10-19 s | the world seems to prove him wrong (rival wins, everyone switches, it rains, more crashes) |
| 5 | Turn | 55-70% | 19-25 s | "Then..." / "Until one..." / "On the hottest day..." - the condition arrives |
| 6 | Reveal / mechanism | 65-85% | 23-30 s | "You see," + one everyday analogy (car on a hairpin, blowing on soup) told in 2-3 sentences |
| 7 | Payoff + loop | 85-100% | 30-35 s | rival/villain gets the consequence, hero is fine; last words flow into line 1 |

Variants seen: the reveal can come BEFORE the payoff (mechanism, then "So when..." the disaster lands), or the reel can
skip the explanation and end on the disaster cliffhanger (railroad ref), or the last line names the invention
("And that's how the [X] was invented.").

### 1.3 Cause -> effect chain
- One protagonist from line 1 to the end, almost never named ("He", "the owner", "the youngest engineer").
- One antagonist/foil: a rival, a boss, a crowd, the insurance company, a pirate ship.
- Every sentence starts with a chain word. Frequency in the refs: **But** (most), **So**, **Then**, **And**,
  **You see,**, **Until**, **Meanwhile**, **By [time]**, **Eventually**, **That's when**.
- Time progression is explicit and stamped: "the next week", "by the fifth race", "In May... By July...",
  "within a year", "one rainy morning", "At 15 minutes... At 20...". Use a 3-step ladder for slow builds.
- One "Wait, what?" style 2-4 word beat right after the most surprising event (~50-55%), then "Well, ..." answer.
- 1-3 short quoted dialogue lines from side characters (4-9 words, sarcastic). The hero almost never explains himself.

### 1.4 Line-length and pace rules
- Speech rate 3.5-3.8 words/s, gaps between sentences 0.2-0.4 s, no long pauses.
- Sentence length: mean 11-15 words, range 1-25. Mix: one long setup sentence (18-25 words), then a punch (2-7 words:
  "Not really.", "But it's too late.", "Rail touching rail."). Never two long sentences without a short one after.
- Two refs are written as one breathless run-on chain - fine for action stories, still with chain words.
- The narration runs to the very last frame (tail after last word 0.1-0.4 s). No outro, no "subscribe".

### 1.5 Ending / loop rules
- The final sentence is a payoff that (a) completes the image line 1 started, and (b) ends on a word that sets up
  line 1 grammatically or visually, so on replay "...[last word]. He [hook act]..." reads as cause and effect.
- Ending shapes: villain gets his own trap; crowd stops laughing; "the exact opposite" twist; "that's how X was
  invented"; cliffhanger mid-disaster.
- Last image = hero in foreground, calm/smug, consequence (explosion, money, crash) behind him.

---

---
## OUTPUT FORMAT (pipeline requirement - not part of the skill text)
- The topic may be phrased as a question; the script itself must still follow the rules above (line 1 = payoff, never a question).
- Voice override from the user (2026-11-24): voice "am_fenrir", speed 1.0.
- Reply with ONE JSON object only, no markdown fences:
{"title": "statement-hook title", "voice": "am_fenrir", "speed": 1.0, "lead": 0.15, "outro": 0.4, "gap": 0.2,
  "music": {"mood": "playful|wonder|tension|epic|chill|sad", "seed": <random int>},
  "sources": ["source name - what it supports", "..."],
  "lines": [{"text": "spoken words, numbers written as said", "caps": "optional: chunks | with | 1950 digits"}, ...]}
- One line = one cut (1.5-3.5 s, about 5-12 words). 10-18 lines. 90-130 words total.
