"""TF-IDF cosine similarity (pure Python, no sklearn)."""
import math
import re
from collections import Counter
from typing import Any


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9#+.]+", (text or "").lower())


def _tfidf_vectors(docs: list[str]) -> list[dict[str, float]]:
    tokenized = [_tokenize(d) for d in docs]
    df: Counter[str] = Counter()
    for toks in tokenized:
        for t in set(toks):
            df[t] += 1
    n = len(docs)

    out: list[dict[str, float]] = []
    for toks in tokenized:
        tf = Counter(toks)
        vec: dict[str, float] = {}
        denom = max(len(toks), 1)
        for term, c in tf.items():
            idf = math.log((n + 1) / (df[term] + 1)) + 1.0
            vec[term] = (c / denom) * idf
        out.append(vec)
    return out


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) | set(b)
    dot = sum(a.get(k, 0.0) * b.get(k, 0.0) for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def match_resume_to_jobs(resume_text: str, jobs: list[dict[str, str]]) -> dict[str, Any]:
    if not jobs:
        return {"results": []}
    texts = [resume_text or ""] + [j.get("description") or "" for j in jobs]
    vecs = _tfidf_vectors(texts)
    resume_vec = vecs[0]
    results = []
    resume_tokens = set(_tokenize(resume_text or ""))
    for idx, job in enumerate(jobs):
        score = _cosine(resume_vec, vecs[idx + 1])
        job_tokens = set(_tokenize(job.get("description") or ""))
        gap = sorted(list(job_tokens - resume_tokens))[:15]
        results.append(
            {
                "id": job.get("id"),
                "score": round(max(0.0, min(100.0, score * 100)), 2),
                "skill_gap": gap,
            }
        )
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results}
