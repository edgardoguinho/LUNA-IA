import { useState, useEffect, useCallback, useRef } from 'react';

export interface FemaleVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  displayName: string;
  isDefault?: boolean;
}

export type LunaVoiceTone = 'acolhedora' | 'serena' | 'expressiva';

const MALE_VOICE_KEYWORDS = [
  'male',
  'homem',
  'ricardo',
  'felipe',
  'daniel',
  'antonio',
  'antónio',
  'jorge',
  'tiago',
  'pedro',
  'lucas',
  'matheus',
  'mateus',
  'yuri',
  'carlos',
  'joão',
  'joao',
  'gabriel',
  'edgar',
  'marcos',
  'marcio',
  'mrcio',
  'paulo',
  'helio',
  'hélio',
  'david',
  'sergio',
  'sérgio',
  'andre',
  'andré',
  'gustavo',
  'eduardo',
  'bruno',
  'rodrigo',
  'marcelo',
  'leandro',
  'diego',
  'fabio',
  'fábio',
  'alexandre',
  'rafael',
  'thiago',
  'renato',
  'caio',
  'vinicius',
  'vinícius',
];

const KNOWN_FEMALE_KEYWORDS = [
  'luciana',
  'maria',
  'francisca',
  'vitória',
  'vitoria',
  'letícia',
  'leticia',
  'fernanda',
  'camila',
  'female',
  'mulher',
  'zira',
  'helena',
  'raquel',
  'yara',
  'joana',
  'clara',
  'isabela',
  'isabel',
  'bia',
  'monica',
  'mônica',
  'juliana',
  'larissa',
  'carolina',
  'amanda',
  'google português do brasil',
  'google portugues do brasil',
];

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [femaleVoices, setFemaleVoices] = useState<FemaleVoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    try {
      return localStorage.getItem('luna_selected_voice_uri') || '';
    } catch {
      return '';
    }
  });
  const [voiceTone, setVoiceTone] = useState<LunaVoiceTone>(() => {
    try {
      const saved = localStorage.getItem('luna_voice_tone');
      if (saved === 'acolhedora' || saved === 'serena' || saved === 'expressiva') return saved;
    } catch {}
    return 'acolhedora';
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Filter and populate exclusively female PT-BR voices
  const populateVoices = useCallback(() => {
    if (!synthRef.current) return;
    const allVoices = synthRef.current.getVoices();
    if (!allVoices || allVoices.length === 0) return;

    // Filter pt-BR / pt voices
    const ptVoices = allVoices.filter(
      (v) => v.lang.toLowerCase().startsWith('pt-br') || v.lang.toLowerCase().startsWith('pt')
    );

    // Filter strictly female voices
    const filtered = ptVoices.filter((v) => {
      const lowerName = v.name.toLowerCase();
      // Reject any voice with male keywords
      const isMale = MALE_VOICE_KEYWORDS.some((kw) => lowerName.includes(kw));
      if (isMale) return false;

      // Prefer explicit female identifiers
      const isKnownFemale = KNOWN_FEMALE_KEYWORDS.some((kw) => lowerName.includes(kw));
      if (isKnownFemale) return true;

      // If no explicit gender indicator in name and not male, keep if pt-BR
      return v.lang.toLowerCase().includes('br');
    });

    const options: FemaleVoiceOption[] = (filtered.length > 0 ? filtered : ptVoices.slice(0, 1)).map((v) => {
      let cleanName = v.name
        .replace(/Microsoft/i, '')
        .replace(/Google/i, '')
        .replace(/Online \(Natural\)/i, '')
        .replace(/Natural/i, '')
        .replace(/Desktop/i, '')
        .replace(/pt-BR/i, '')
        .replace(/Portuguese \(Brazil\)/i, '')
        .replace(/Português \(Brasil\)/i, '')
        .replace(/[-()]/g, '')
        .trim();

      if (!cleanName || cleanName.toLowerCase() === 'português' || cleanName.toLowerCase() === 'portugues') {
        cleanName = 'Luna Padrão';
      }

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        displayName: `Luna (${cleanName})`,
        isDefault: v.default,
      };
    });

    setFemaleVoices(options);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setSupported(true);
      populateVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
      }
    }
  }, [populateVoices]);

  const selectVoice = (uri: string) => {
    setSelectedVoiceURI(uri);
    try {
      localStorage.setItem('luna_selected_voice_uri', uri);
    } catch {}
  };

  const selectVoiceTone = (tone: LunaVoiceTone) => {
    setVoiceTone(tone);
    try {
      localStorage.setItem('luna_voice_tone', tone);
    } catch {}
  };

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[*_~`#>]/g, '') // remove markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // link to text
      .replace(/https?:\/\/\S+/g, '') // remove urls
      .replace(/([❤️✨🥰🌸🫂☕🌙💖🥺🌷💕🎯📚⚖️])/g, '') // strip emojis from speech
      .trim();
  };

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    }
  }, []);

  const speak = useCallback(
    (text: string, messageId: string) => {
      if (!synthRef.current) return;

      // If already speaking this message, toggle off
      if (isSpeaking && currentSpeakingId === messageId) {
        stop();
        return;
      }

      synthRef.current.cancel();

      const clean = cleanTextForSpeech(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'pt-BR';

      // Pitch & Rate tuning according to chosen tone
      let pitch = 1.15; // sweet and warm default
      let rate = 1.0;
      if (voiceTone === 'acolhedora') {
        pitch = 1.2;
        rate = 0.98;
      } else if (voiceTone === 'serena') {
        pitch = 1.05;
        rate = 0.95;
      } else if (voiceTone === 'expressiva') {
        pitch = 1.18;
        rate = 1.05;
      }

      utterance.pitch = pitch;
      utterance.rate = rate;

      // Find selected or best female voice
      const allVoices = synthRef.current.getVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (selectedVoiceURI) {
        chosenVoice = allVoices.find((v) => v.voiceURI === selectedVoiceURI);
      }

      if (!chosenVoice) {
        // Fallback to best female pt-BR voice
        const ptVoices = allVoices.filter((v) => v.lang.startsWith('pt'));
        chosenVoice =
          ptVoices.find((v) => {
            const n = v.name.toLowerCase();
            return (
              !MALE_VOICE_KEYWORDS.some((m) => n.includes(m)) &&
              KNOWN_FEMALE_KEYWORDS.some((f) => n.includes(f))
            );
          }) ||
          ptVoices.find((v) => !MALE_VOICE_KEYWORDS.some((m) => v.name.toLowerCase().includes(m))) ||
          ptVoices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentSpeakingId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
      };

      synthRef.current.speak(utterance);
    },
    [isSpeaking, currentSpeakingId, stop, selectedVoiceURI, voiceTone]
  );

  return {
    supported,
    isSpeaking,
    currentSpeakingId,
    femaleVoices,
    selectedVoiceURI,
    voiceTone,
    selectVoice,
    selectVoiceTone,
    speak,
    stop,
  };
}
