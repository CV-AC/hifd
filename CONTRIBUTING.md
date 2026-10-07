# Contributing to the HiFD Leaderboard

Two paths exist depending on how strong a guarantee you want next to your entry.

## Quick path: self-reported (no ✓ badge)

1. **Fork** this repository.
2. **Create one JSON file** at `docs/page/submissions/<YourMethod>.json` using the template below. The filename stem (`<YourMethod>`) must match the `method` field.
3. **Open a pull request.** Our CI runs `scripts/page/validate_submission.py` and posts the would-be rank under each profile as a comment. Schema or sanity failures block merge.
4. A maintainer reviews, merges. The site rebuilds automatically.

### Template

```json
{
  "method": "MyMethod",
  "paradigm": "diffusion",
  "year": 2026,
  "venue": "CVPR 2026",
  "paper": "https://arxiv.org/abs/2601.12345",
  "code":  "https://github.com/user/repo",
  "contact": "you@example.org",
  "submitted_at": "2026-09-30",
  "notes": "Optional: one-line note about training data, hyperparameters, etc.",
  "verified": false,
  "scores": {
    "privacy": 0.50, "quality": 0.45,
    "age": 0.90, "gender": 0.90, "ethnicity": 0.80,
    "macro_exp": 0.90, "landmark": 0.80,
    "gaze": 0.90, "micro_exp": 0.70,
    "bvp": 0.40, "hr": 0.40,
    "U1": 0.86, "U2": 0.80, "U3": 0.40,
    "HiFD_PrivacyFirst": 0.50, "HiFD_Balanced": 0.55, "HiFD_Clinical": 0.50
  }
}
```

If your method does not support video evaluation, set `micro_exp`, `bvp`, `hr`, and `U3` to `null`; the validator will skip those axes and compute HiFD on the remaining four.

### What each score means

All scores are in `[0, 1]`, higher is better.

- `privacy` (P̄): identity-embedding dissimilarity averaged across ArcFace, CosFace, AdaFace. See paper §3.2.
- `quality` (Q): equal-weight combination of LPIPS-VGG and NIQE, both bounded to `[0, 1]`.
- L1 (macro): `age`, `gender`, `ethnicity`, `macro_exp`, `landmark`. `U1` is their unweighted mean.
- L2 (micro): `gaze`, `micro_exp`. `U2` is their mean (or `gaze` alone for image-only methods).
- L3 (imperceptible): `bvp`, `hr` from rPPG. `U3` is their mean.
- `HiFD_*`: weighted harmonic mean over `(P̄, Q, U₁, U₂, U₃)` under each profile:
  - **Privacy-First**: `wP=0.5`, remainder equal.
  - **Balanced**: uniform.
  - **Clinical**: `w3=0.4`, remainder equal.

The validator recomputes each `HiFD_*` from your sub-scores and rejects submissions whose reported values differ by more than `±0.02`.

## Reproducible path: verified (earns ✓ badge)

1. Install the released toolkit:
   ```bash
   pip install hifd
   ```
2. Run the evaluation on **UtilFace + DFME + PURE** with default settings:
   ```bash
   hifd evaluate --method-output /path/to/your_outputs/ --benchmark uface --benchmark dfme --benchmark pure --emit-submission > MyMethod.json
   ```
3. Open a PR with both `MyMethod.json` and the toolkit-printed `output_hash:` line in the PR description.
4. A maintainer reruns the evaluation on the same outputs, confirms the hash, and flips `verified: true` on merge.

## Naming conventions

- File: `docs/page/submissions/<MethodName>.json`, where `<MethodName>` matches `[A-Za-z0-9][A-Za-z0-9._+-]{0,40}`.
- No spaces. Use `-` or `+` as separators (e.g., `TI-DIM`, `G2Face`).
- Duplicates (same `method` field appearing in two files) are rejected by CI.

## Code of conduct

Be civil, attribute prior work, and don't submit weights you cannot redistribute.

## Contact

Questions? Open an issue or email the maintainers (see `CODEOWNERS`).
