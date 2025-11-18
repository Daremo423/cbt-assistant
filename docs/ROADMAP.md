# CBT Assistant Technical Roadmap

## Documentation Policy
Always document all research findings, resources, and sources in the repository for transparency, reproducibility, and future model improvement. Create a dedicated `/docs/RESEARCH.md` and always cite datasets and papers.

## Cognitive Distortion Types: Classification Difficulty

| Distortion Type                | Detection Difficulty                |
|-------------------------------|-------------------------------------|
| All-or-Nothing / Black-White  | Obvious (keywords, absolute terms)  |
| Overgeneralization            | Moderate (needs context)            |
| Mental Filter                 | Hard (requires conversation context) |
| Disqualifying the Positive    | Hard (often subtle language)         |
| Jumping to Conclusions        | Moderate (requires pattern)          |
| Magnification/Minimization    | Moderate (extreme language)          |
| Emotional Reasoning           | Moderate (emotion-to-fact pattern)   |
| Should Statements             | Obvious (keywords, "should")         |
| Labeling                      | Obvious (self-labels, e.g., "I'm worthless") |
| Personalization               | Hard (requires context)              |
| Catastrophizing               | Obvious (extreme, worst-case language) |
| Control Fallacies             | Hard (context, comparison)           |

## Sensitivity Selector Feature
- Add a UI selector: Low / Medium / High sensitivity
    - Low: Only obvious distortions flagged
    - Medium: Obvious + moderate difficulty
    - High: All types (including subtle/hard)
- Sensitivity setting governs frequency of alerts and threshold for detection
- Default: Medium

## OPEN SOURCE Prioritization
- Use only open-source datasets for initial model training: C2D2, Reddit mental health posts, C-journal, suicide-risk datasets
- All datasets and licenses documented in `/docs/RESEARCH.md`

## Minimal Viable Product (MVP) - Tonight
- [x] Basic UI: Transcription window + reframe window
- [x] Integrate Deepgram for real-time speech-to-text
- [x] Naive distortion detection using regex/patterns (obvious types: All-or-Nothing, Should Statements, Labeling, Catastrophizing)
- [x] Audio beep on detection
- [x] Highlight detected distortion in transcript
- [x] Provide alternate/reframed text in dual window
- [x] Sensitivity selector UI (default to Medium)
- [x] Display disclaimers from legal branch on app start
- [x] Storing all research notes in `/docs/RESEARCH.md`

## Iterative Upgrade Roadmap
### $0 Upgrades First
1. [x] Fine-tune regex and pattern-based detection (improve recall/precision for obvious types)
2. [ ] Add feedback button for user false positive/negative flagging
3. [ ] Expand obvious detection to include moderate patterns (e.g., emotional reasoning)
4. [ ] Document all sources/datasets in `/docs/RESEARCH.md`
5. [ ] Push new legal/UX disclaimer updates (earbuds recommendation)

### Next-Level Upgrades (cost = zero if open source)
6. [ ] Integrate open-source BERT fine-tuned on cognitive distortion datasets (after initial MVP)
7. [ ] Add contextual analysis using conversation history
8. [ ] Incremental training based on user feedback
9. [ ] Benchmark model accuracy, optimize for latency

### Paid Upgrades (as funding is available)
10. [ ] Train/fine-tune larger model on proprietary CBT transcripts (if/when acquired)
11. [ ] Add real-time multimodal detection (voice tonality, sarcasm detection, etc)
12. [ ] Live privacy/geolocation checker linked to consent/recording law DB
13. [ ] Premium TTS/voice synthesis for reframing (OpenAI/Google API)

## Documentation
- Every algorithm change, dataset, and research finding logged and cited
- All discovery is a living document in `/docs/RESEARCH.md`

# Deliverable Tonight
- Working MVP, all code open source, using regex-based text flagging for 4 obvious CD types
- Sensitivity selector governs frequency of alerts
- Disclaimers and privacy policy shown at app start
- All research notes and dataset sources pushed to repo docs folder.

Last updated: Nov 17, 2025