from app.ai.ai_service import (
    translate_text,
    text_to_voice,
    voice_to_text,
    audio_translator
)


async def translate_admin_text(payload):
    result = await translate_text(payload)
    return result


async def admin_text_to_voice(payload):
    result = await text_to_voice(payload)
    return result


async def admin_voice_to_text(file, language="English"):

    result = await voice_to_text(
        file,
        language
    )

    return result


async def admin_audio_translator(
    file,
    source_language="English",
    target_language="English"
):

    result = await audio_translator(
        file,
        source_language,
        target_language
    )

    return result