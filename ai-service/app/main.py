from typing import Dict, List

import json

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from app.parser_engine import extract_raw_and_text, heuristic_structures
from app.analyze_full import full_resume_analysis
from app.ats_engine import analyze_ats
from app.match_engine import match_resume_to_jobs
from app.assist_engine import assist
from app.export_engine import export_pdf, export_docx


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})


async def analyze_resume_upload(request: Request) -> JSONResponse:
    form = await request.form()
    upload = form.get("file")
    if upload is None:
        return JSONResponse({"error": "file required"}, status_code=400)
    content = await upload.read()  # type: ignore[union-attr]
    filename = getattr(upload, "filename", None) or "resume.pdf"
    jd = str(form.get("job_description") or "")
    result = full_resume_analysis(content, str(filename), jd)
    return JSONResponse(result)


async def parse_resume(request: Request) -> JSONResponse:
    form = await request.form()
    upload = form.get("file")
    if upload is None:
        return JSONResponse({"error": "file required"}, status_code=400)
    content = await upload.read()  # type: ignore[union-attr]
    filename = getattr(upload, "filename", None) or "resume.pdf"
    _, text = extract_raw_and_text(content, str(filename))
    structured = heuristic_structures(text)
    return JSONResponse(structured)


async def analyze_ats_endpoint(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return JSONResponse({"error": "invalid json"}, status_code=400)
    resume_text = body.get("resume_text") or ""
    job_description = body.get("job_description") or ""
    return JSONResponse(analyze_ats(resume_text, job_description))


async def match_endpoint(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return JSONResponse({"error": "invalid json"}, status_code=400)
    resume_text = body.get("resume_text") or ""
    jobs: List[Dict[str, str]] = body.get("jobs") or []
    return JSONResponse(match_resume_to_jobs(resume_text, jobs))


async def assist_endpoint(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return JSONResponse({"error": "invalid json"}, status_code=400)
    assist_type = body.get("assist_type")
    text = body.get("text") or ""
    job_description = body.get("job_description") or ""
    if not assist_type:
        return JSONResponse({"error": "assist_type required"}, status_code=400)
    result = await assist(assist_type, text, job_description)
    return JSONResponse(result)


async def export_pdf_route(request: Request) -> Response:
    try:
        draft = await request.json()
    except json.JSONDecodeError:
        return Response("invalid json", status_code=400)
    data = export_pdf(draft)
    return Response(content=data, media_type="application/pdf")


async def export_docx_route(request: Request) -> Response:
    try:
        draft = await request.json()
    except json.JSONDecodeError:
        return Response("invalid json", status_code=400)
    data = export_docx(draft)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


routes = [
    Route("/health", health, methods=["GET"]),
    Route("/analyze-resume", analyze_resume_upload, methods=["POST"]),
    Route("/parse", parse_resume, methods=["POST"]),
    Route("/analyze-ats", analyze_ats_endpoint, methods=["POST"]),
    Route("/match", match_endpoint, methods=["POST"]),
    Route("/assist", assist_endpoint, methods=["POST"]),
    Route("/export/pdf", export_pdf_route, methods=["POST"]),
    Route("/export/docx", export_docx_route, methods=["POST"]),
]

app = Starlette(debug=False, routes=routes)
