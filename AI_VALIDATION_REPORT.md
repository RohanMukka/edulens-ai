# 🤖 EduLens AI — Validation Report

**Generated:** 4/26/2026, 11:33:34 PM
**Model:** Llama-3.1-8b-instant (via Groq)

## Executive Summary

| Metric | Result |
| --- | --- |
| **Score Range Accuracy** | 33.3% |
| **Misconception Diagnosis Accuracy** | 83.3% |
| **Average Response Time** | 3197ms |
| **Gatekeeper Flag Rate** | 56% |

## Detailed Results

| Concept | Description | Expected Score | Actual | Status | Misconception (Exp/Act) |
| --- | --- | --- | --- | --- | --- |
| Cell Structure | Strong understanding of key organelles | 0.8-1 | 0.50 | ❌ | NO_MISCONCEPTION / INCOMPLETE_UNDERSTANDING ❓ |
| Cell Structure | Direct plagiarism (should be flagged by Gatekeeper) | 0-0.2 | 0.00 | ✅ | N/A / SURFACE_LEVEL 🎯 |
| Cell Structure | Flipped roles of nucleus and mitochondria | 0.1-0.4 | 0.00 | ❌ | PROCESS_CONFUSION / SURFACE_LEVEL ❓ |
| Photosynthesis | Correct but very basic/incomplete | 0.4-0.6 | 0.20 | ❌ | INCOMPLETE_UNDERSTANDING / INCOMPLETE_UNDERSTANDING 🎯 |
| Photosynthesis | Inverted the inputs and outputs | 0-0.3 | 0.00 | ✅ | CAUSE_EFFECT_REVERSAL / SURFACE_LEVEL ❓ |
| Photosynthesis | Completely off-topic/gibberish | 0-0.1 | 0.00 | ✅ | N/A / SURFACE_LEVEL 🎯 |
| Variables & Expressions | Strong understanding with correct terminology | 0.9-1 | 0.50 | ❌ | N/A / INCOMPLETE_UNDERSTANDING 🎯 |
| Variables & Expressions | Swapped definitions of variable and coefficient | 0.2-0.5 | 0.00 | ❌ | TERMINOLOGY_CONFUSION / SURFACE_LEVEL ❓ |
| Ancient Civilizations | Vague and lacks specific details | 0.4-0.7 | 0.00 | ❌ | SURFACE_LEVEL / SURFACE_LEVEL 🎯 |


## Conclusion
**WARNING:** Some discrepancies detected. Consider refining the scoring prompts or transitioning to a larger model (e.g., Llama-3 70b) for higher nuanced accuracy.
