import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Copy, CheckCircle } from 'lucide-react';

export default function WriteEssayTab() {
    const [topic, setTopic] = useState('');
    const [essayType, setEssayType] = useState('Argumentative');
    const [wordCount, setWordCount] = useState('500');
    const [essay, setEssay] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const essayTypes = ['Argumentative', 'Descriptive', 'Analytical', 'Narrative'];
    const wordCounts = ['250', '500', '1000'];

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter an essay topic');
            return;
        }

        setLoading(true);
        setError('');
        setEssay('');

        try {
            const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) =>
                chrome.runtime.sendMessage(
                    { action: 'writeEssay', topic, essayType, wordCount },
                    resolve
                )
            );

            if (response.success && response.data) {
                setEssay(response.data);
            } else {
                setError(response.error || 'Failed to generate essay');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(essay);
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
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Essay Topic
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter your essay topic..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                        placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Essay Type
                        </label>
                        <select
                            value={essayType}
                            onChange={(e) => setEssayType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {essayTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Word Count
                        </label>
                        <select
                            value={wordCount}
                            onChange={(e) => setWordCount(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {wordCounts.map((count) => (
                                <option key={count} value={count}>{count} words</option>
                            ))}
                        </select>
                    </div>
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
                    onClick={handleGenerate}
                    disabled={loading || !topic.trim()}
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
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 size={16} />
                            Generate Essay
                        </>
                    )}
                </button>
            </motion.div>

            {/* ── Essay Section ──────────────────────────────────────── */}
            {essay && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-3 min-h-0"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Generated Essay</h3>
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
                                    Copy Essay
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-gray-100 dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {essay}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Empty State ──────────────────────────────────────────── */}
            {!essay && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-4"
                >
                    <div>
                        <div className="text-4xl mb-2">✍️</div>
                        <p className="text-sm">Enter a topic and configure settings to generate a complete essay</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
