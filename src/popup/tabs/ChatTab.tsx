import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Trash2 } from 'lucide-react';
import { useStore, type Message } from '../store';

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
    const { messages, addMessage, clearMessages, pageText } = useStore();
    const [input, setInput] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

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
        setIsWaiting(true);

        chrome.runtime.sendMessage(
            { action: 'chat', message: text, pageText, history: messages.map(m => ({ role: m.role, content: m.content })) },
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

    // Voice input
    const handleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

        if (!SR) {
            alert('Voice input not supported in this browser.');
            return;
        }

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev + (prev ? ' ' : '') + transcript);
            inputRef.current?.focus();
        };
        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="flex flex-col h-full" style={{ height: 'calc(560px - 128px)' }}>

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
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${isListening
                            ? 'bg-red-500 text-white animate-pulse-ring shadow-md shadow-red-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-500'
                            }`}
                        title={isListening ? 'Stop recording' : 'Voice input'}
                    >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>

                    {/* Send button */}
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isWaiting}
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
