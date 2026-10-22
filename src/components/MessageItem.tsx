import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Download,
  Wand2,
  ExternalLink,
  Globe,
  Youtube,
} from 'lucide-react';
import { Message, SearchSource } from '../types';
import { LunaVerifiedBadge } from './LunaVerifiedBadge';

interface MessageItemProps {
  message: Message;
  isSpeaking: boolean;
  onSpeak: (text: string, id: string) => void;
  onStopSpeech: () => void;
  onRetry?: (messageText: string) => void;
  onThumbsUp?: (message: Message) => void;
  onOpenFeedback?: (message: Message) => void;
  onEditImage?: (imageUrl: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSpeaking,
  onSpeak,
  onStopSpeech,
  onRetry,
  onThumbsUp,
  onOpenFeedback,
  onEditImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const isUser = message.role === 'user';

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sanitizeSafeUrl = (rawUrl: string): string | null => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      return null;
    }
    return null;
  };

  const formatInline = (text: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // 1. Markdown link: [Title](url) with support for balanced parentheses in URLs (e.g. Wikipedia)
      const mdLinkMatch = remaining.match(/^([\s\S]*?)\[([^\]]+)\]\(((?:https?:\/\/|\/)(?:[^\s\(\)]|\([^\s\(\)]*\))+)\)/);
      // 2. Raw URL: http:// or https://
      const rawUrlMatch = remaining.match(/^([\s\S]*?)(https?:\/\/[^\s<>'"`\(\)\[\]]+)/);
      // 3. Bold: **text**
      const boldMatch = remaining.match(/^([\s\S]*?)\*\*([^*]+)\*\*/);
      // 4. Code: `code`
      const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`/);
      // 5. Italic: *text*
      const italicMatch = remaining.match(/^([\s\S]*?)\*([^*]+)\*/);

      const candidates = [
        mdLinkMatch ? { type: 'mdLink', match: mdLinkMatch, index: mdLinkMatch[1].length } : null,
        rawUrlMatch ? { type: 'rawUrl', match: rawUrlMatch, index: rawUrlMatch[1].length } : null,
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch[1].length } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch[1].length } : null,
        italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch[1].length } : null,
      ].filter(Boolean) as { type: string; match: RegExpMatchArray; index: number }[];

      if (candidates.length === 0) {
        parts.push(remaining);
        break;
      }

      candidates.sort((a, b) => a.index - b.index);
      const earliest = candidates[0];
      const prefix = remaining.substring(0, earliest.index);
      if (prefix) {
        parts.push(prefix);
      }

      if (earliest.type === 'mdLink') {
        const linkTitle = earliest.match[2];
        const linkUrl = earliest.match[3];
        const safeUrl = sanitizeSafeUrl(linkUrl);
        if (safeUrl) {
          parts.push(
            <a
              key={key++}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir link: ${linkTitle}`}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/60 hover:decoration-emerald-300 decoration-1 underline-offset-2 font-medium break-all transition active:bg-emerald-500/20 px-1 py-0.5 -my-0.5 rounded cursor-pointer pointer-events-auto touch-manipulation"
            >
              <span>{linkTitle}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
            </a>
          );
        } else {
          parts.push(linkTitle);
        }
        remaining = remaining.substring(earliest.index + earliest.match[0].length - earliest.match[1].length);
      } else if (earliest.type === 'rawUrl') {
        let rawUrl = earliest.match[2];
        let trailingPunct = '';
        while (rawUrl.length > 0 && /[.,;:!?)]$/.test(rawUrl)) {
          trailingPunct = rawUrl.slice(-1) + trailingPunct;
          rawUrl = rawUrl.slice(0, -1);
        }
        const safeUrl = sanitizeSafeUrl(rawUrl);
        if (safeUrl) {
          parts.push(
            <a
              key={key++}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir link: ${rawUrl}`}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/60 hover:decoration-emerald-300 decoration-1 underline-offset-2 font-medium break-all transition active:bg-emerald-500/20 px-1 py-0.5 -my-0.5 rounded cursor-pointer pointer-events-auto touch-manipulation"
            >
              <span>{rawUrl}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
            </a>
          );
        } else {
          parts.push(rawUrl);
        }
        if (trailingPunct) {
          parts.push(trailingPunct);
        }
        remaining = remaining.substring(earliest.index + earliest.match[2].length);
      } else if (earliest.type === 'bold') {
        parts.push(
          <strong key={key++} className="font-semibold text-white">
            {earliest.match[2]}
          </strong>
        );
        remaining = remaining.substring(earliest.index + earliest.match[0].length - earliest.match[1].length);
      } else if (earliest.type === 'code') {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono"
          >
            {earliest.match[2]}
          </code>
        );
        remaining = remaining.substring(earliest.index + earliest.match[0].length - earliest.match[1].length);
      } else if (earliest.type === 'italic') {
        parts.push(
          <em key={key++} className="italic text-neutral-300">
            {earliest.match[2]}
          </em>
        );
        remaining = remaining.substring(earliest.index + earliest.match[0].length - earliest.match[1].length);
      }
    }

    return parts;
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-neutral-600 pl-3 py-0.5 my-1 text-neutral-300 italic text-sm">
            {formatInline(line.substring(2))}
          </blockquote>
        );
      }

      if (line.match(/^[-*•]\s+/)) {
        const content = line.replace(/^[-*•]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5">
            <span className="text-neutral-400 text-xs mt-1.5">•</span>
            <div className="flex-1">{formatInline(content)}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <div className={`w-full py-2.5 px-3 sm:px-4 flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-start gap-3 max-w-full sm:max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Luna Avatar (left) */}
        {!isUser && (
          <div className="relative shrink-0 mt-0.5 select-none">
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs shadow-2xs">
              🌙
            </div>
            <div className="absolute -bottom-1 -right-1">
              <LunaVerifiedBadge size="sm" />
            </div>
          </div>
        )}

        {/* Message Bubble Content */}
        <div className="flex flex-col min-w-0">
          <div
            className={`rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed relative ${
              isUser
                ? 'bg-[#2f2f2f] text-white rounded-tr-xs shadow-2xs'
                : message.isError
                ? 'bg-red-950/40 border border-red-800/60 text-red-100 rounded-tl-xs'
                : 'bg-transparent text-neutral-200 rounded-tl-xs'
            }`}
          >
            {/* Error badge */}
            {message.isError && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-300 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Mensagem de Atenção</span>
              </div>
            )}

            {/* Attached User Photo */}
            {message.imageUrl && (
              <div className="mb-2.5 rounded-xl overflow-hidden border border-neutral-700 bg-black/40 shadow-sm max-w-sm">
                <img
                  src={message.imageUrl}
                  alt="Foto enviada"
                  className="w-full max-h-72 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {/* AI Generated Artwork */}
            {message.generatedImageUrl && (
              <div className="my-2.5 rounded-xl overflow-hidden border border-neutral-700 bg-[#141414] shadow-md max-w-md">
                <img
                  src={message.generatedImageUrl}
                  alt="Arte gerada pela Luna"
                  className="w-full max-h-80 object-contain bg-black/40"
                  loading="lazy"
                />
                <div className="flex items-center justify-between gap-2 p-2 bg-neutral-900 border-t border-neutral-800 text-xs">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Imagem gerada
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={message.generatedImageUrl}
                      download={`luna-arte-${message.id}.jpg`}
                      title="Baixar imagem"
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar</span>
                    </a>
                    {onEditImage && (
                      <button
                        type="button"
                        onClick={() => onEditImage(message.generatedImageUrl!)}
                        title="Editar imagem"
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 text-emerald-400" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Text Message */}
            {message.text && (
              <div className="break-words select-text">
                {renderFormattedText(message.text)}
              </div>
            )}

            {/* Real Search Sources (Discrete ChatGPT citation style) */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-2">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Fontes da pesquisa ({message.sources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.sources.map((source, sIdx) => {
                    const safeUrl = sanitizeSafeUrl(source.url);
                    const isYt =
                      source.type === 'youtube' ||
                      (safeUrl ? safeUrl.includes('youtube.com') || safeUrl.includes('youtu.be') : false);

                    if (!safeUrl) {
                      return (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2 p-2 rounded-xl bg-neutral-850 border border-neutral-800 text-xs text-neutral-400"
                        >
                          <span className="text-neutral-500">•</span>
                          <span className="font-medium truncate">{source.title || 'Fonte'}</span>
                        </div>
                      );
                    }

                    let hostname = '';
                    try {
                      hostname = new URL(safeUrl).hostname.replace(/^www\./, '');
                    } catch {
                      hostname = '';
                    }

                    return (
                      <a
                        key={sIdx}
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir fonte original: ${source.title}`}
                        title={`Abrir fonte original: ${source.title}`}
                        className="group/source flex items-start gap-2.5 p-2.5 min-h-[48px] rounded-xl bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition text-left no-underline touch-manipulation cursor-pointer pointer-events-auto shadow-2xs"
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition ${
                            isYt ? 'bg-red-950/60 text-red-400' : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {isYt ? <Youtube className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-neutral-200 group-hover/source:text-white line-clamp-1 leading-snug flex items-center gap-1">
                            <span className="truncate">{source.title || 'Ver fonte'}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover/source:opacity-100 ml-0.5 inline-block" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400 font-mono">
                            <span className="font-medium uppercase">
                              {source.source || (isYt ? 'YouTube' : 'Web')}
                            </span>
                            {hostname && <span className="truncate text-neutral-500">{hostname}</span>}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Minimalist Message Actions Toolbar (Below Bubble) */}
          <div
            className={`flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 ${
              isUser ? 'justify-end pr-1' : 'justify-start pl-1'
            }`}
          >
            <span className="text-[10px] select-none">{formatTimestamp(message.timestamp)}</span>

            {!isUser && (
              <>
                {/* Voice speech */}
                <button
                  type="button"
                  onClick={() => (isSpeaking ? onStopSpeech() : onSpeak(message.text, message.id))}
                  title={isSpeaking ? 'Parar leitura de voz' : 'Ouvir resposta'}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-emerald-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copiar mensagem"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Thumbs up */}
                {onThumbsUp && (
                  <button
                    type="button"
                    onClick={() => onThumbsUp(message)}
                    title="Gostei da resposta"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Thumbs down / feedback */}
                {onOpenFeedback && (
                  <button
                    type="button"
                    onClick={() => onOpenFeedback(message)}
                    title="Dar feedback ou sugerir melhoria"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            {/* Retry on error */}
            {message.isError && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.text)}
                title="Tentar enviar novamente"
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition flex items-center gap-1 text-[10px]"
              >
                <RotateCcw className="w-3 h-3 text-red-400" />
                <span>Reenviar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
