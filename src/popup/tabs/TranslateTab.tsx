import { useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, Copy, CheckCircle } from 'lucide-react';

const TARGET_LANGUAGES = [
    'Hindi',
    'Marathi',
    'Tamil',
    'Telugu',
    'Bengali',
    'Gujarati',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Chinese',
    'Arabic',
];

export default function TranslateTab() {
    const [text, setText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('Hindi');
    const [translation, setTranslation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) {
            setError('Please enter text to translate');
            return;
        }

        setLoading(true);
        setError('');
        setTranslation('');

        try {
            const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) =>
                chrome.runtime.sendMessage(
                    { action: 'translate', text, targetLanguage },
                    resolve
                )
            );

            if (response.success && response.data) {
                setTranslation(response.data);
            } else {
                setError(response.error || 'Failed to translate text');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(translation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">

            {/* ── Input Section ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Text to Translate
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter or paste text to translate..."
                    className="w-full h-28 p-3 rounded-lg border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500
                    resize-none"
                />

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Target Language
                    </label>
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {TARGET_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-500"
                    >
                        ❌ {error}
                    </motion.p>
                )}

                <button
                    onClick={handleTranslate}
                    disabled={loading || !text.trim()}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500
                    text-white font-semibold flex items-center justify-center gap-2
                    hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="inline-block"
                            >
                                ⚙️
                            </motion.span>
                            Translating...
                        </>
                    ) : (
                        <>
                            <Languages size={16} />
                            Translate
                        </>
                    )}
                </button>
            </motion.div>

            {/* ── Translation Section ────────────────────────────────── */}
            {translation && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-3 min-h-0"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Translation</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {targetLanguage}
                            </p>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                            bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                            hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle size={14} className="text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    Copy Translation
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-gradient-to-br from-purple-50 to-teal-50 
                    dark:from-purple-900/20 dark:to-teal-900/20 border border-purple-200 dark:border-purple-900/30">
                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {translation}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Original Text Display ──────────────────────────────────– */}
            {translation && text && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Original Text
                    </h4>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {text}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Empty State ──────────────────────────────────────────– */}
            {!translation && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-4"
                >
                    <div>
                        <div className="text-4xl mb-2">🌍</div>
                        <p className="text-sm">Enter text and select a language to translate instantly</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
