# CBT Assistant Research Documentation

All research findings, dataset sources, and algorithm decisions are required to be documented here for transparency and future optimization.

## Core Cognitive Distortion Datasets (Open Source)
- [C2D2 Dataset: Cognitive Distortion Analysis](https://openreview.net/forum?id=SkEoQoDbKl)
- [Reddit Suicide-risk Dataset](https://github.com/405200144/Dataset-of-Cognitive-Distortion-detection-and-Positive-reconstruction)
- [C-journal Dataset](https://arxiv.org/abs/2310.08463)

## Key Research
- BERT fine-tuning for cognitive distortion detection [https://www.ijfmr.com/papers/IJFMR102647.pdf]
- Multi-task learning improves accuracy and contextual understanding [https://www.aclweb.org/anthology/2024.cogbtherapy-1.11.pdf]
- List of 13 cognitive distortions and detection difficulty

## Algorithmic Decisions
- Start regex-pattern for obvious distortions (see ROADMAP)
- Expand with fine-tuned BERT as resources/datasets allow
- Add conversation context, user feedback, and difficulty selector in later upgrades

Roadmap and research notes are version-controlled. Last updated: Nov 17, 2025