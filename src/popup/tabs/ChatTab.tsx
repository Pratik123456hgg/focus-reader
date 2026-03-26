import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Trash2, ChevronDown } from 'lucide-react';
import { useStore, type Message } from '../store';

// ─── Language codes and names mapping
const VOICE_LANGUAGES = {
    'auto': { name: 'Auto-detect', code: 'en-US' },
    'en': { name: 'English', code: 'en-US' },
    'hi': { name: 'Hindi', code: 'hi-IN' },
    'mr': { name: 'Marathi', code: 'mr-IN' },
    'ta': { name: 'Tamil', code: 'ta-IN' },
    'te': { name: 'Telugu', code: 'te-IN' },
    'bn': { name: 'Bengali', code: 'bn-IN' },
    'es': { name: 'Spanish', code: 'es-ES' },
    'fr': { name: 'French', code: 'fr-FR' },
    'de': { name: 'German', code: 'de-DE' },
    'ar': { name: 'Arabic', code: 'ar-SA' },
    'zh': { name: 'Chinese', code: 'zh-CN' },
    'ja': { name: 'Japanese', code: 'ja-JP' },
};

// ─── Typing bubble ────────────────────────────────────────────────
function TypingBubble() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-end gap-2 max-w-[75%]"
        >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center text-white text-xs shrink-0">
                🧠
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dot1" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dot2" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dot3" />
            </div>
        </motion.div>
    );
}

// ─── Message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, x: isUser ? 10 : -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
        >
            {!isUser && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center text-xs shrink-0 mb-0.5">
                    🧠
                </div>
            )}
            <div
                className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser
                    ? 'bg-purple-500 text-white rounded-br-sm shadow-md shadow-purple-500/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                    }`}
            >
                {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                        {line}
                        {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ChatTab() {
    const { messages, addMessage, clearMessages, pageText, lastSummary, pageContent, selectedVoiceLang, setSelectedVoiceLang } = useStore();
    const [input, setInput] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaiting]);

    // Send message
    const sendMessage = () => {
        const text = input.trim();
        if (!text || isWaiting) return;

        const userMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now(),
        };
        addMessage(userMsg);
        setInput('');
        setSpokenText('');
        setIsWaiting(true);

        chrome.runtime.sendMessage(
            { action: 'chat', message: text, pageContent: pageContent || pageText, lastSummary, history: messages.map(m => ({ role: m.role, content: m.content })) },
            (res: { success: boolean; data?: string; error?: string }) => {
                setIsWaiting(false);
                const aiMsg: Message = {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: res?.success && res.data
                        ? res.data
                        : `⚠️ ${res?.error ?? 'Something went wrong. Check your API key.'}`,
                    timestamp: Date.now(),
                };
                addMessage(aiMsg);
            },
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Voice input with language support
    const handleVoice = () => {
        if (isListening) {
            // Stop recording
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'stopVoiceRecognition' }).catch(() => {
                        // Ignore errors
                    });
                }
            });
            setIsListening(false);
            return;
        }

        setIsListening(true);
        setSpokenText('');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                setIsListening(false);
                alert('⚠️ No active tab found. Navigate to a webpage to use voice input.');
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    action: 'startVoiceRecognition',
                    lang: selectedVoiceLang === 'auto' ? '' : selectedVoiceLang,
                },
                (response: {
                    transcript?: string;
                    confidence?: number;
                    error?: string;
                    stopped?: boolean;
                }) => {
                    setIsListening(false);

                    if (chrome.runtime.lastError) {
                        console.log('[FocusRead] Chrome error:', chrome.runtime.lastError.message);
                        alert(
                            '⚠️ Navigate to a webpage to use voice input. Voice does not work on Chrome system pages (like new tab), only on regular websites.',
                        );
                        return;
                    }

                    if (response?.error === 'permission_denied') {
                        alert(
                            'Microphone blocked. Click the 🔒 lock icon in the Chrome address bar → Site settings → Allow Microphone.',
                        );
                        return;
                    }

                    if (response?.error === 'not_supported') {
                        alert(
                            '⚠️ Navigate to a webpage to use voice input. Voice does not work on Chrome system pages (like new tab), only on regular websites.',
                        );
                        return;
                    }

                    if (response?.error) {
                        alert(`Speech Error: ${response.error}`);
                        return;
                    }

                    if (response?.transcript) {
                        const transcript = response.transcript;
                        setSpokenText(transcript);

                        // If not English, translate via background
                        if (selectedVoiceLang !== 'auto' && selectedVoiceLang !== 'en') {
                            setIsTranslating(true);
                            const langName =
                                VOICE_LANGUAGES[selectedVoiceLang as keyof typeof VOICE_LANGUAGES]?.name || 'Unknown';
                            chrome.runtime.sendMessage(
                                {
                                    action: 'translateToEnglish',
                                    text: transcript,
                                    detectedLanguage: langName,
                                },
                                (translationResponse: { success: boolean; data?: string }) => {
                                    setIsTranslating(false);
                                    if (translationResponse?.success && translationResponse.data) {
                                        setInput(translationResponse.data);
                                    } else {
                                        setInput(transcript);
                                    }
                                    inputRef.current?.focus();
                                },
                            );
                        } else {
                            setInput(transcript);
                            inputRef.current?.focus();
                        }
                    }
                },
            );
        });
    };

    return (
        <div className="flex flex-col h-full" style={{ height: 'calc(560px - 128px)' }}>

            {/* Summary indicator */}
            {lastSummary && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 px-3 py-2.5 border-b border-teal-100 dark:border-teal-900/50 flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-medium">
                    <span className="text-sm">✓</span>
                    <span>AI has access to your video/page summary</span>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-500">
                        <span className="text-4xl">🤖</span>
                        <p className="text-sm text-center leading-relaxed max-w-[200px]">
                            Ask me anything about this page — I'm here to help you study!
                        </p>
                        <div className="flex flex-col gap-1.5 w-full max-w-[250px]">
                            {['Summarise this for me', 'What are the key concepts?', 'Quiz me on this topic'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                                    className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-left"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message list */}
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {isWaiting && <TypingBubble key="typing" />}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-3 flex flex-col gap-2 bg-white dark:bg-gray-800">
                
                {/* Voice info hint */}
                <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <span className="font-medium">💡 Tip:</span> Voice input works on websites. On Chrome system pages (new tab, settings, etc.), use text input instead.
                </div>

                {/* Language selector dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <span>🎤 {VOICE_LANGUAGES[selectedVoiceLang as keyof typeof VOICE_LANGUAGES]?.name || 'Auto'}</span>
                        <ChevronDown size={12} />
                    </button>

                    {showLanguageDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 z-50 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-0 max-h-56 overflow-y-auto">
                                {Object.entries(VOICE_LANGUAGES).map(([key, { name }]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedVoiceLang(key);
                                            setShowLanguageDropdown(false);
                                        }}
                                        className={`text-xs px-3 py-2 text-left whitespace-nowrap transition-colors ${
                                            selectedVoiceLang === key
                                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Spoken text label */}
                {spokenText && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1.5 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                        <span className="font-medium">Heard:</span> {spokenText}
                    </motion.div>
                )}

                {/* Input with mic and send buttons */}
                <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about this page…"
                            rows={1}
                            maxLength={800}
                            className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2.5 pr-9
                focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
                            style={{ minHeight: '42px', maxHeight: '100px', overflowY: 'auto' }}
                        />
                    </div>

                    {/* Voice button */}
                    <button
                        onClick={handleVoice}
                        disabled={isTranslating}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-500 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        title={isListening ? 'Stop recording' : 'Voice input'}
                    >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>

                    {/* Send button */}
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isWaiting || isTranslating}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-teal-400 text-white
              flex items-center justify-center shadow-md shadow-purple-500/25
              disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/40 transition-shadow shrink-0"
                    >
                        <Send size={14} />
                    </button>
                </div>

                {/* Clear chat */}
                {messages.length > 0 && (
                    <button
                        onClick={clearMessages}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 dark:hover:text-red-400 transition-colors self-end"
                    >
                        <Trash2 size={11} /> Clear chat
                    </button>
                )}
            </div>
        </div>
    );
}
