import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Mic,
  MicOff,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

export interface AttachedImage {
  data: string; // Base64 data URI
  mimeType: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSendMessage: (text: string, image?: AttachedImage | null) => void;
  onGenerateImage?: (prompt: string, aspectRatio: string, provider?: 'auto' | 'magichour' | 'pollinations') => void;
  isLoading: boolean;
  disabled?: boolean;
  initialImage?: AttachedImage | null;
  onClearInitialImage?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onGenerateImage,
  isLoading,
  disabled,
  initialImage = null,
  onClearInitialImage,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [imageGenAspectRatio, setImageGenAspectRatio] = useState('1:1');
  const [imageGenProvider, setImageGenProvider] = useState<'auto' | 'magichour' | 'pollinations'>('auto');
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(initialImage);
  const [inputNotification, setInputNotification] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const notify = (msg: string) => {
    setInputNotification(msg);
    setTimeout(() => {
      setInputNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    if (initialImage) {
      setAttachedImage(initialImage);
      if (!text.trim()) {
        setText('Luna, por favor edite esta imagem para: ');
      }
      textareaRef.current?.focus();
    }
  }, [initialImage]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      notify('Reconhecimento de voz não suportado neste navegador. Use digitação por teclado.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Erro ao iniciar reconhecimento:', err);
        setIsRecording(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('A imagem é muito grande. Escolha uma foto com até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedImage({
        data: result,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
        size: file.size,
      });
      notify('Foto anexada com sucesso. Envie uma instrução para a Luna.');
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (onClearInitialImage) onClearInitialImage();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachedImage) return;
    if (isLoading || disabled) return;

    onSendMessage(trimmed, attachedImage);
    setText('');
    setAttachedImage(null);
    if (onClearInitialImage) onClearInitialImage();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`;
  };

  const handleTriggerImageGen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageGenPrompt.trim()) return;
    if (onGenerateImage) {
      onGenerateImage(imageGenPrompt.trim(), imageGenAspectRatio, imageGenProvider);
      setShowImageGenModal(false);
      setImageGenPrompt('');
    }
  };

  const hasContent = text.trim().length > 0 || attachedImage !== null;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
      {/* Toast Notification */}
      {inputNotification && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs flex items-center justify-between shadow-md animate-fadeIn">
          <span>{inputNotification}</span>
          <button
            onClick={() => setInputNotification(null)}
            className="text-neutral-400 hover:text-white ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main ChatGPT-style Pill Box */}
      <div className="relative rounded-2xl bg-[#212121] dark:bg-[#212121] border border-neutral-700/80 focus-within:border-neutral-500 shadow-sm transition-all">
        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="p-2.5 pb-0 flex items-center gap-2">
            <div className="relative group rounded-xl overflow-hidden border border-neutral-700 bg-black/40">
              <img
                src={attachedImage.data}
                alt="Foto anexada"
                className="w-14 h-14 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                title="Remover foto"
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-neutral-300 min-w-0">
              <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{attachedImage.name}</p>
              <p className="text-[10px] text-neutral-500">{(attachedImage.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="px-3.5 pt-2.5 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Ouvindo sua voz... fale agora' : 'Mensagem para Luna...'}
            disabled={disabled || isLoading}
            className="w-full bg-transparent resize-none text-[14.5px] leading-relaxed text-neutral-100 placeholder-neutral-500 outline-none max-h-40 overflow-y-auto"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          {/* Left tools: Attach, Camera, Gen Image */}
          <div className="flex items-center gap-1">
            {/* Gallery Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar foto da galeria"
              disabled={disabled || isLoading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              title="Tirar foto com a câmera"
              disabled={disabled || isLoading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Generate Image Button */}
            {onGenerateImage && (
              <button
                type="button"
                onClick={() => setShowImageGenModal(true)}
                title="Criar arte ou imagem com a Luna"
                disabled={disabled || isLoading}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Criar imagem</span>
              </button>
            )}
          </div>

          {/* Right tools: Voice & Send */}
          <div className="flex items-center gap-1.5">
            {/* Microphone / Speech Input */}
            <button
              type="button"
              onClick={handleToggleVoice}
              title={isRecording ? 'Parar gravação de voz' : 'Falar por voz'}
              disabled={disabled || isLoading}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!hasContent || isLoading || disabled}
              title="Enviar mensagem (Enter)"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                hasContent && !isLoading && !disabled
                  ? 'bg-white text-black hover:bg-neutral-200 shadow-sm active:scale-95'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Generation Modal (Clean Minimalist Redesign) */}
      {showImageGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#181818] border border-neutral-700 p-5 shadow-2xl text-neutral-200 relative">
            <button
              type="button"
              onClick={() => setShowImageGenModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-emerald-400 border border-neutral-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Criar Imagem com Luna</h3>
                <p className="text-[11px] text-neutral-400">Geração gratuita em alta definição</p>
              </div>
            </div>

            <form onSubmit={handleTriggerImageGen} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  O que você quer ver desenhado?
                </label>
                <textarea
                  rows={3}
                  required
                  value={imageGenPrompt}
                  onChange={(e) => setImageGenPrompt(e.target.value)}
                  placeholder="Ex: Um lindo pôr do sol na praia de Copacabana com iluminação dourada e ondas calmas..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-neutral-400" /> Formato / Proporção
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: '1:1', label: '1:1 Quadrado', desc: 'Avatar / Feed' },
                    { id: '9:16', label: '9:16 Vertical', desc: 'Stories / Celular' },
                    { id: '16:9', label: '16:9 Paisagem', desc: 'Wallpaper' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setImageGenAspectRatio(ratio.id)}
                      className={`p-2 rounded-xl border text-left transition ${
                        imageGenAspectRatio === ratio.id
                          ? 'border-emerald-500/80 bg-emerald-950/20 text-white font-medium'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{ratio.label}</div>
                      <div className="text-[9.5px] text-neutral-500">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Provedor de Geração
                  </span>
                  <span className="text-[10px] text-emerald-400">Magic Hour & Pollinations</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'auto', label: 'Automático', desc: 'Magic Hour + Fallback' },
                    { id: 'magichour', label: 'Magic Hour', desc: 'Oficial • 395 pts' },
                    { id: 'pollinations', label: 'Pollinations', desc: 'Flux • Ilimitado' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setImageGenProvider(p.id as any)}
                      className={`p-2 rounded-xl border text-left transition ${
                        imageGenProvider === p.id
                          ? 'border-indigo-500/80 bg-indigo-950/40 text-white font-medium'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{p.label}</div>
                      <div className="text-[9.5px] text-neutral-500 truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageGenModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!imageGenPrompt.trim()}
                  className="w-1/2 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-xs font-semibold transition"
                >
                  Gerar Imagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
