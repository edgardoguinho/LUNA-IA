import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Sparkles, Check, ShieldCheck, Heart } from 'lucide-react';
import { Message } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  userPrompt: string;
  userId: string;
  onSubmitFeedback: (
    messageId: string,
    rating: 'positive' | 'negative',
    correctionText?: string,
    saveAsPreference?: boolean
  ) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  message,
  userPrompt,
  userId,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<'positive' | 'negative'>('negative');
  const [correctionText, setCorrectionText] = useState('');
  const [saveAsPreference, setSaveAsPreference] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitFeedback(
        message.id,
        rating,
        correctionText.trim() ? correctionText.trim() : undefined,
        saveAsPreference && Boolean(correctionText.trim())
      );
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setCorrectionText('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#140827] border border-pink-500/30 p-6 shadow-2xl text-purple-100 relative my-auto animate-fadeIn">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-800/40 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#1b0d33] rounded-[14px] flex items-center justify-center text-pink-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Avaliar & Corrigir Resposta
            </h2>
            <p className="text-xs text-purple-300/80">
              Ensine a Luna suas preferências de resposta
            </p>
          </div>
        </div>

        {/* Snippet */}
        <div className="mb-4 p-3 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs text-purple-200 line-clamp-3 italic">
          "{message.text.slice(0, 180)}..."
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Buttons */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">
              Como foi essa resposta da Luna?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRating('positive')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                  rating === 'positive'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                    : 'bg-[#1b0d33] border-purple-800/40 text-purple-300 hover:border-purple-700'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <span>Muito boa / Útil</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('negative')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition ${
                  rating === 'negative'
                    ? 'bg-pink-600/30 border-pink-500 text-pink-200'
                    : 'bg-[#1b0d33] border-purple-800/40 text-purple-300 hover:border-purple-700'
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-pink-400" />
                <span>Precisa melhorar</span>
              </button>
            </div>
          </div>

          {/* Correction field */}
          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1">
              Como a Luna deveria responder ou o que ela deve lembrar?
            </label>
            <textarea
              rows={3}
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="Ex: Prefiro respostas mais objetivas, ou: Lembre-se que eu não bebo café depois das 18h..."
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1d0d38] border border-pink-500/25 focus:border-pink-500 text-white placeholder-purple-400/40 text-xs focus:outline-none transition resize-none"
            />
          </div>

          {/* Authorization Checkbox */}
          {correctionText.trim().length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-950/70 border border-purple-800/50 cursor-pointer text-xs text-purple-200 select-none">
              <input
                type="checkbox"
                checked={saveAsPreference}
                onChange={(e) => setSaveAsPreference(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-pink-500 rounded"
              />
              <span className="leading-snug">
                Autorizo salvar esta correção como <strong>preferência permanente</strong> na memória da Luna para personalizar conversas futuras.
              </span>
            </label>
          )}

          {/* Honest transparency disclosure */}
          <div className="flex items-start gap-2 text-[10.5px] text-purple-400/70 p-2 rounded-lg bg-black/20">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>Transparência Ética:</strong> As correções são aplicadas via injeção dinâmica de contexto na memória da Luna. Os parâmetros matemáticos do modelo de IA não são retreinados.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Feedback registrado com carinho!</span>
              </>
            ) : submitting ? (
              <span>Gravando...</span>
            ) : (
              <>
                <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
                <span>Salvar Feedback</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
