import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

if (!API) {
  console.warn("NEXT_PUBLIC_API_URL is not configured");
}

/* -------------------------------------------------------------------------- */
/*                              TRANSLATE TEXT                                */
/* -------------------------------------------------------------------------- */

export interface TranslatePayload {
  text: string;
  target_language: string;
  user_email: string;
  client_name: string;
}

export const translateAdminText = async (
  payload: TranslatePayload
) => {
  try {
    console.log(
      "TRANSLATE API URL:",
      `${API}/api/admin/translate`
    );

    console.log("TRANSLATE PAYLOAD:", payload);

    const response = await axios.post(
      `${API}/api/admin/translate`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "TRANSLATE ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "TRANSLATE ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "TRANSLATE ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                              TEXT TO VOICE                                 */
/* -------------------------------------------------------------------------- */

export interface TextToVoicePayload {
  text: string;
  language: string;
  user_email: string;
  client_name: string;
}

export interface TextToVoiceResponse {
  status: string;
  audio_base64: string;
}

export const textToVoice = async (
  payload: TextToVoicePayload
): Promise<TextToVoiceResponse> => {
  try {
    const response = await axios.post(
      `${API}/api/admin/text-to-voice`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("TEXT TO VOICE RESPONSE:", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "TEXT TO VOICE ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "TEXT TO VOICE ERROR DATA:",
      error?.response?.data
    );

    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                              VOICE TO TEXT                                 */
/* -------------------------------------------------------------------------- */

export const voiceToText = async (
  formData: FormData
) => {
  try {
    console.log(
      "VOICE TO TEXT API URL:",
      `${API}/api/admin/voice-to-text`
    );

    const response = await axios.post(
      `${API}/api/admin/voice-to-text`,
      formData
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "VOICE TO TEXT ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "VOICE TO TEXT ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "VOICE TO TEXT ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                            AUDIO TRANSLATOR                                */
/* -------------------------------------------------------------------------- */

export const audioTranslator = async (
  formData: FormData
): Promise<Blob> => {
  try {
    console.log(
      "AUDIO TRANSLATOR API URL:",
      `${API}/api/admin/audio-translator`
    );

    const response = await axios.post(
      `${API}/api/admin/audio-translator`,
      formData,
      {
        responseType: "blob",
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "AUDIO TRANSLATOR ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "AUDIO TRANSLATOR ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "AUDIO TRANSLATOR ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
};
/* -------------------------------------------------------------------------- */
/*                             BULK TRANSLATION                               */
/* -------------------------------------------------------------------------- */

export const bulkTranslateAdminText = async (
  texts: string[],
  target_language: string,
  user_email: string
): Promise<string[]> => {
  try {
    if (!texts || texts.length === 0) {
      return [];
    }

    const payload = {
      text: texts,
      target_language,
      user_email,
      client_name: "SSS",
    };

    console.log(
      "BULK TRANSLATE API URL:",
      `${API}/api/admin/translate`
    );

    console.log(
      "BULK TRANSLATE PAYLOAD:",
      payload
    );

    const response = await axios.post(
      `${API}/api/admin/translate`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "BULK TRANSLATE RESPONSE:",
      response.data
    );

    if (Array.isArray(response.data?.translated_text)) {
      return response.data.translated_text;
    }

    console.error(
      "Unexpected bulk translate response:",
      response.data
    );

    return texts;
  } catch (error: any) {
    console.error(
      "BULK TRANSLATE ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "BULK TRANSLATE ERROR DATA:",
      error?.response?.data
    );

    console.error(
      "BULK TRANSLATE ERROR MESSAGE:",
      error?.message
    );

    throw error;
  }
};