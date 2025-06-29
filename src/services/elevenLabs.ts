const ELEVEN_LABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const DEFAULT_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // "Rachel" por defecto

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

interface TTSSource {
  url: string;
  cleanup: () => void;
}

/**
 * Convierte texto a voz usando ElevenLabs y devuelve una URL de objeto para reproducir.
 */
export async function textToSpeechElevenLabs(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<TTSSource> {
  if (!API_KEY) {
    throw new Error('ElevenLabs API key no configurada');
  }

  const response = await fetch(`${ELEVEN_LABS_URL}/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Error en ElevenLabs TTS');
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);

  const cleanup = () => {
    URL.revokeObjectURL(url);
  };

  return { url, cleanup };
} 