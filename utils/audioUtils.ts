export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const decodeAudioData = async (
  base64Data: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // The Gemini TTS returns raw PCM (no header) or wav depending on request?
  // Actually, Gemini TTS endpoint usually returns Base64 encoded WAV or MP3 if configured, 
  // but the 'Modality.AUDIO' in generateContent returns raw PCM sometimes.
  // HOWEVER, the standard `gemini-2.5-flash-preview-tts` returns audio data in the payload.
  // Let's assume standard decoding works if it's a valid container, or use raw PCM decoding if it fails.
  
  try {
    // Try standard decode first (e.g. if it has a WAV header)
    // We clone the buffer because decodeAudioData might detach it
    return await ctx.decodeAudioData(bytes.buffer.slice(0));
  } catch (e) {
    // Fallback to raw PCM assuming 24kHz mono (common default for Gemini)
    // This is required for Gemini 2.5 Flash TTS via generateContent which often returns raw PCM.
    
    try {
      const sampleRate = 24000;
      const numChannels = 1;
      const dataInt16 = new Int16Array(bytes.buffer);
      const frameCount = dataInt16.length / numChannels;
      
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
    } catch (err) {
      console.error("Decode failed, raw PCM fallback also failed.", err);
      throw e;
    }
  }
};