import os
import httpx


AI_BASE_URL = os.getenv("AI_BASE_URL")
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", 60))


async def translate_text(payload):
    print("Sending translation payload:", payload)

    async with httpx.AsyncClient(
        timeout=AI_TIMEOUT
    ) as client:

        response = await client.post(
            f"{AI_BASE_URL}/admin/translate",
            json=payload
        )
        print("AI status:", response.status_code)
        print("AI response:", response.text)

        response.raise_for_status()

        return response.json()

async def text_to_voice(payload):

    async with httpx.AsyncClient(
        timeout=AI_TIMEOUT
    ) as client:

        response = await client.post(
            f"{AI_BASE_URL}/admin/text-to-voice",
            json=payload
        )

        response.raise_for_status()

        return response.json()

async def voice_to_text(file, language="English"):

    async with httpx.AsyncClient(
        timeout=AI_TIMEOUT
    ) as client:

        files = {
    "file": (
        "audio.wav",
        file,
        "audio/wav"
    )
}

        data = {
            "language": language
        }

        response = await client.post(
            f"{AI_BASE_URL}/admin/voice-to-text",
            files=files,
            data=data
        )

        response.raise_for_status()

        return response.json()



async def audio_translator(
    file,
    source_language="English",
    target_language="English"
):

    async with httpx.AsyncClient(
        timeout=AI_TIMEOUT
    ) as client:

        files = {
            "file": (
                "audio.wav",
                file,
                "audio/wav"
            )
        }

        data = {
            "source_language": source_language,
            "target_language": target_language
        }

        response = await client.post(
            f"{AI_BASE_URL}/admin/audio-translator",
            files=files,
            data=data
        )

        response.raise_for_status()

        return response.json()