from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os

templates = Jinja2Templates(directory="src/web/templates")

async def supervisor_page(request: Request):
    """Serve the supervisor dashboard page"""
    return templates.TemplateResponse("supervisor.html", {"request": request})