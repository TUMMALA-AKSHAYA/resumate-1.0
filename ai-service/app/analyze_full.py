"""Full resume analysis: parse + keyword extraction + ATS + skill overlap."""
from typing import Any

from app.parser_engine import extract_raw_and_text, heuristic_structures, extract_keywords
from app.ats_engine import analyze_ats, tokenize


def _skill_match_score(resume_skills: list[str], job_description: str) -> float:
    if not job_description or not resume_skills:
        return 0.0
    j = set(tokenize(job_description))
    s = {x.lower() for x in resume_skills if x}
    if not s:
        return 0.0
    hits = len(j & s)
    return round(min(100.0, (hits / max(len(s), 1)) * 100.0), 2)


def full_resume_analysis(file_content: bytes, filename: str, job_description: str = "") -> dict[str, Any]:
    _, text = extract_raw_and_text(file_content, filename)
    parsed = heuristic_structures(text)
    parsed["keywords"] = extract_keywords(text)
    resume_plain = parsed.get("rawText") or text
    ats = analyze_ats(resume_plain, job_description)
    sms = _skill_match_score(parsed.get("skills") or [], job_description)
    extraction = {
        "skills": parsed.get("skills") or [],
        "education": parsed.get("education") or [],
        "experience": parsed.get("experience") or [],
        "projects": parsed.get("projects") or [],
        "certifications": parsed.get("certifications") or [],
        "achievements": parsed.get("achievements") or [],
        "languages": parsed.get("languages") or [],
        "keywords": parsed.get("keywords") or [],
    }
    return {
        "parsed": parsed,
        "ats": ats,
        "skill_match_score": sms,
        "extraction": extraction,
    }
