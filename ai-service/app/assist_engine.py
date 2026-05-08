"""OpenAI-assisted or rule-based resume text improvements."""
import os
import re
from typing import Any

import httpx


def rule_based(assist_type: str, text: str, job_description: str) -> str:
    t = text.strip()
    if assist_type == "summary":
        bullets = [b.strip("•*- ") for b in t.split("\n") if b.strip()]
        if not bullets:
            return "Results-driven professional with hands-on experience delivering reliable software."
        return (
            "Professional with expertise in "
            + ", ".join(bullets[:3])
            + ". Proven track record of solving practical problems and collaborating across teams."
        )
    if assist_type == "bullet":
        verb = "Developed"
        if re.search(r"\btest\b", t, re.I):
            verb = "Tested"
        elif re.search(r"\blead\b", t, re.I):
            verb = "Led"
        return f"{verb} and improved outcomes: {t[:1].upper() + t[1:] if t else ''}".strip()
    if assist_type == "keywords" and job_description:
        jtoks = sorted(
            set(re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}", job_description.lower()))
        )
        extra = [w for w in jtoks if w not in t.lower()][:12]
        return "Suggested keywords: " + ", ".join(extra) if extra else "No extra keywords found."
    return t


async def assist(assist_type: str, text: str, job_description: str) -> dict[str, Any]:
    key = os.getenv("OPENAI_API_KEY")
    if key:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You rewrite resume content professionally, concise, ATS-friendly. Return only the improved text, no quotes.",
                            },
                            {
                                "role": "user",
                                "content": f"Type: {assist_type}\nJob context:\n{job_description}\n\nText:\n{text}",
                            },
                        ],
                        "temperature": 0.4,
                    },
                )
                r.raise_for_status()
                data = r.json()
                out = data["choices"][0]["message"]["content"].strip()
                return {"source": "openai", "text": out}
        except Exception as exc:  # noqa: BLE001
            return {"source": "fallback", "text": rule_based(assist_type, text, job_description), "error": str(exc)}
    return {"source": "rule", "text": rule_based(assist_type, text, job_description)}
