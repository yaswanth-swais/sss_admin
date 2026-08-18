from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel

from app.ai.ai_controller import (
    translate_admin_text,
    admin_text_to_voice,
    admin_voice_to_text,
    admin_audio_translator
)


class TranslateRequest(BaseModel):
    text: str
    target_language: str
    user_email: str
    client_name: str = "SSS"


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin AI"]
)


@router.post("/translate")
async def admin_translate(payload: TranslateRequest):
    result = await translate_admin_text(
        payload.model_dump()
    )
    return result


@router.post("/text-to-voice")
async def text_to_voice_api(payload: dict):
    result = await admin_text_to_voice(payload)
    return result


@router.post("/voice-to-text")
async def voice_to_text_api(
    file: UploadFile = File(...),
    language: str = Form("English")
):
    result = await admin_voice_to_text(
        file.file,
        language
    )
    return result


@router.post("/audio-translator")
async def audio_translator_api(
    file: UploadFile = File(...),
    source_language: str = Form("English"),
    target_language: str = Form(...)
):
    result = await admin_audio_translator(
        file.file,
        source_language,
        target_language
    )
    return result