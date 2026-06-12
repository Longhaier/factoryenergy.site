# MEM Practice Site V1 Design

## Goal
Convert the current Hexo site into a usable practice website for Sichuan University 2027 MEM prep. V1 serves two subjects only: `199 管理类综合能力` and `204 英语（二）`. It must support mixed homepage navigation, knowledge-point learning, objective-question practice, answer checking, explanations, and local progress persistence.

## Confirmed Scope
- No real account system in V1.
- No paid membership in V1.
- No writing tasks in V1.
- Objective questions only.
- Homepage uses a mixed layout: practice entry first, knowledge content below.

## Product Structure
The site keeps Hexo as the shell and content engine.

Two layers are separated:

1. Knowledge layer
   - Built with Hexo Markdown pages.
   - Used for subject overviews, topic lists, and detailed study notes.
2. Practice layer
   - Built with custom pages plus browser-side JavaScript.
   - Reads structured local JSON question banks.
   - Handles answer selection, scoring, explanations, wrong-question review, and local progress.

## Information Architecture
- Homepage
  - Brand and positioning for Sichuan University 2027 MEM prep
  - Continue practice entry
  - Subject selection cards
  - Knowledge-point entry area
  - Recent updates or study suggestions
- Subject overview page
  - One page each for `英语二` and `管综199`
  - Subject intro, topic navigation, practice entry, local progress summary
- Knowledge-point list page
  - Topic groups for each subject
  - Links from each topic to matching practice
- Knowledge-point detail page
  - Markdown study content
  - Related practice entry
  - Related topics
- Practice page
  - Question display
  - Objective options
  - Submit, judge, explanation reveal
  - Previous/next navigation
  - Wrong-question mark and optional favorite mark
- Wrong-question review page
  - Local wrong-question aggregation
  - Filter by subject
  - Re-practice flow

## Content and Question Scope
### English II
- Vocabulary
- Reading
- Cloze

### Management Aptitude 199
- Math
- Logic

Excluded from V1:
- English writing
- 管综写作
- Cloud sync
- Community features

## Question Data Model
Question banks live under `source/exam-data/` and are split by subject and category.

Recommended files:
- `source/exam-data/english2/vocabulary.json`
- `source/exam-data/english2/reading.json`
- `source/exam-data/english2/cloze.json`
- `source/exam-data/mba199/math.json`
- `source/exam-data/mba199/logic.json`

Each question should use a unified schema:
- `id`
- `subject`
- `category`
- `type`
- `stem`
- `options`
- `answer`
- `explanation`
- `difficulty`
- `source`
- `tags`

This schema is intentionally backend-friendly so future account or sync work can reuse it.

## Progress and State
V1 stores progress in browser `localStorage`.

Stored state includes:
- Last visited subject/category/question
- Correctness per question
- Wrong-question set
- Completion counters per subject

User behavior requirements:
- Resume from the previous local position
- Show answer and explanation immediately after submission
- Automatically add incorrect questions into wrong-question review
- Show completion summaries on homepage and subject pages

## Implementation Approach
Recommended approach is a hybrid:
- Keep Hexo for routing, layout, and knowledge content
- Add custom pages/templates for practice flows
- Render practice UI from local JSON with plain JavaScript

This avoids a full framework migration now, while keeping the data model reusable for a future real account system.

## Content Sourcing Constraints
External websites and public repositories can be used for reference, but copyrighted third-party question banks must not be copied wholesale without permission.

Safer V1 sourcing:
- Use openly shared vocabulary data where licensing is clear
- Use manually curated or self-structured objective questions
- Record `source` per question for future auditing

Known reference sources already identified:
- Sichuan University MEM admissions information for exam scope
- `KaoYan-2023/kaoyanzhenti` for reference to English exam materials
- `exam-data/NETEMVocabulary` for structured vocabulary data
- `lambertstu/Postgraduate-question-system` for feature reference only

## Error Handling
- Empty or missing question files should show a clear “content not ready” state
- Invalid question objects should be skipped instead of breaking the whole page
- Local storage read failures should fall back to a clean session

## Validation
For each implementation increment:
- Run `npm run build`
- Open `npm run server`
- Manually verify homepage navigation, subject routing, question rendering, answer checking, explanation display, and local progress persistence

## V1 Success Criteria
V1 is successful when:
- Users can open a mixed homepage and choose a subject
- Users can browse knowledge points for English II and 199
- Users can practice objective questions in the chosen category
- Users can see immediate answer feedback and explanations
- Users can return later on the same device and continue locally
- Users can revisit wrong questions from a dedicated page
