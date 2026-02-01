export const speak = (text: string, locale: string = 'en-US') => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map 'sr' to a supported code (or fallback)
    // Most browsers support 'sr-RS' or generally pick best match
    utterance.lang = locale === 'sr' ? 'sr-RS' : locale;

    // Optional: Select a better voice if available
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google voices if available (usually better quality)
    const preferredVoice = voices.find(
        (v) => v.lang.startsWith(utterance.lang) && v.name.includes('Google')
    ) || voices.find((v) => v.lang.startsWith(utterance.lang));

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
};

export const cancelSpeech = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};

export const isSpeaking = () => {
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
};
