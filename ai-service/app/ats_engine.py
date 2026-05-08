"""Rule-based ATS-style scoring."""
import re
from typing import Any


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9#+.]+", text.lower())


def analyze_ats(resume_text: str, job_description: str) -> dict[str, Any]:
    rtoks = tokenize(resume_text)
    jtoks = tokenize(job_description) if job_description else []
    jset = set(jtoks)
    rset = set(rtoks)
    missing = sorted(jset - rset)[:25] if jset else []
    overlap = len(jset & rset)
    denom = max(len(jset), 1)
    keyword_score = min(100, int((overlap / denom) * 100))

    word_count = len(rtoks)
    readability_proxy = min(100, 40 + min(60, word_count // 5))

    has_email = bool(re.search(r"@\w+\.\w+", resume_text))
    sections = 0
    for pat in [r"experience", r"education", r"skills", r"project"]:
        if re.search(pat, resume_text, re.I):
            sections += 1
    structure_score = min(100, 20 + sections * 20 + (15 if has_email else 0))

    score = int(
        max(
            0,
            min(
                100,
                keyword_score * 0.55 + readability_proxy * 0.15 + structure_score * 0.3,
            ),
        )
    )

    suggestions = []
    if missing:
        suggestions.append(f"Consider adding keywords: {', '.join(missing[:8])}.")
    if word_count < 120:
        suggestions.append("Expand role impact with quantified bullets.")
    if sections < 3:
        suggestions.append("Add clear Experience, Skills, and Education sections.")

    strengths = []
    if overlap > 5:
        strengths.append("Good keyword overlap with the job description.")
    if sections >= 3:
        strengths.append("Resume covers common section headings.")

    return {
        "score": score,
        "missing_keywords": missing[:20],
        "suggestions": suggestions,
        "strengths": strengths,
        "weaknesses": ["Heuristic-only scoring in MVP"] if score < 60 else [],
    }
