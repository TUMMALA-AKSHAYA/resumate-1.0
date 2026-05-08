"""Extract text and heuristic structured fields from PDF/DOCX."""
import re
from typing import Any

import pdfplumber


def _extract_pdf_text(data: bytes) -> str:
    from io import BytesIO

    parts = []
    with pdfplumber.open(BytesIO(data)) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            parts.append(t)
    return "\n".join(parts).strip()


def _extract_docx_text(data: bytes) -> str:
    from io import BytesIO

    from docx import Document

    doc = Document(BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text).strip()


def extract_raw_and_text(file_content: bytes, filename: str) -> tuple[str, str]:
    name = filename.lower()
    if name.endswith(".pdf"):
        text = _extract_pdf_text(file_content)
    elif name.endswith(".docx"):
        text = _extract_docx_text(file_content)
    else:
        text = file_content.decode("utf-8", errors="ignore")
    return text, text


EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{8,}\d)")

_STOPWORDS = set(
    """
    the a an and or for to of in on at with as by is are was were be been being it this that
    these those you your my our their we they he she his her its from into over under out up
    but not no yes all any some such than then so if into about per via
    """.split()
)


def extract_keywords(text: str, top_n: int = 35) -> list[str]:
    toks = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", text.lower())
    freq: dict[str, int] = {}
    for t in toks:
        if t in _STOPWORDS:
            continue
        freq[t] = freq.get(t, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: -x[1])
    return [k for k, _ in ranked[:top_n]]


def heuristic_structures(text: str) -> dict[str, Any]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    email_m = EMAIL_RE.search(text)
    phone_m = PHONE_RE.search(text.replace("\n", " "))
    name = lines[0] if lines else ""
    if email_m and lines and email_m.group(0) in lines[0]:
        name = lines[1] if len(lines) > 1 else ""
    skills_keywords = [
        "python",
        "javascript",
        "typescript",
        "react",
        "node",
        "java",
        "sql",
        "mongodb",
        "aws",
        "docker",
        "kubernetes",
        "ml",
        "nlp",
        "fastapi",
        "express",
    ]
    lower = text.lower()
    skills = [k for k in skills_keywords if k in lower]

    education: list[dict[str, Any]] = []
    experience: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    certifications: list[dict[str, Any]] = []

    sec = None
    buf: list[str] = []
    headers = (
        "experience",
        "work history",
        "employment",
        "education",
        "academic",
        "projects",
        "certifications",
        "skills",
    )

    for ln in lines:
        low = ln.lower()
        hit = None
        for h in headers:
            if low == h or low.startswith(h + ":") or low.startswith(h + " "):
                hit = h
                break
        if hit:
            if sec == "experience" and buf:
                experience.append(
                    {"company": "", "role": "", "start": "", "end": "", "description": " ".join(buf)[:2000]}
                )
            elif sec == "education" and buf:
                education.append({"school": "", "degree": "", "field": "", "end": " ".join(buf)[:500]})
            elif sec == "projects" and buf:
                projects.append({"title": buf[0][:200], "description": " ".join(buf[1:])[:1500]})
            buf = []
            if hit in ("experience", "work history", "employment"):
                sec = "experience"
            elif hit in ("education", "academic"):
                sec = "education"
            elif hit == "projects":
                sec = "projects"
            else:
                sec = None
            continue
        if sec:
            buf.append(ln)
    if sec == "experience" and buf:
        experience.append(
            {"company": "", "role": "", "start": "", "end": "", "description": " ".join(buf)[:2000]}
        )
    if sec == "projects" and buf:
        projects.append({"title": buf[0][:200], "description": " ".join(buf[1:])[:1500]})

    return {
        "rawText": text,
        "name": name[:120],
        "email": email_m.group(0) if email_m else "",
        "phone": phone_m.group(1).strip() if phone_m else "",
        "summary": "",
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "achievements": [],
        "languages": [],
        "linkedin": "",
        "github": "",
        "title": "",
    }
