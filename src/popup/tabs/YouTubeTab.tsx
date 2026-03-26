import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, BookmarkPlus, Loader } from 'lucide-react';

interface YouTubeResult {
    videoTitle: string;
    videoSummary: string;
    keyPoints: string[];
    bestMoments: string[];
}

export default function YouTubeTab() {
    const [isYouTube, setIsYouTube] = useState(false);
    const [videoTitle, setVideoTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<YouTubeResult | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [savedFlashcard, setSavedFlashcard] = useState<string | null>(null);

    useEffect(() => {
        checkIfYouTube();
    }, []);

    const checkIfYouTube = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.url) {
                setIsYouTube(false);
                return;
            }
            const isYT = tabs[0].url.includes('youtube.com/watch');
            setIsYouTube(isYT);
            if (isYT) {
                const title = tabs[0].title || 'YouTube Video';
                setVideoTitle(title);
            }
        });
    };

    const handleSummarize = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Get transcript from content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) throw new Error('No active tab');

            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getYouTubeTranscript' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        setError('Could not extract transcript. Make sure you\'re on a YouTube video page.');
                        setLoading(false);
                        return;
                    }

                    if (!response?.transcript) {
                        setError('No transcript found. The video may not have captions.');
                        setLoading(false);
                        return;
                    }

                    // Send to background for summarization
                    chrome.runtime.sendMessage(
                        { action: 'summarizeYouTube', transcript: response.transcript },
                        (summaryResponse) => {
                            if (chrome.runtime.lastError || !summaryResponse?.success) {
                                setError('Failed to summarize. Please try again.');
                                setLoading(false);
                                return;
                            }

                            setResult(summaryResponse.data);
                            setLoading(false);
                        }
                    );
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const saveAsFlashcard = (text: string) => {
        chrome.runtime.sendMessage(
            { action: 'addHighlightFlashcard', text },
            () => {
                setSavedFlashcard(text);
                setTimeout(() => setSavedFlashcard(null), 3000);
            }
        );
    };

    if (!isYouTube) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">📺</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Not a YouTube Video
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Navigate to any YouTube video page to use the YouTube summarizer.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                    Example: youtube.com/watch?v=...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* ── Header ──────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white"
                >
                    <p className="text-sm font-medium mb-2">📺 YouTube Detected!</p>
                    <p className="text-lg font-bold truncate">{videoTitle}</p>
                </motion.div>

                {/* ── Button ──────────────────────────────────────── */}
                {!result && (
                    <motion.button
                        onClick={handleSummarize}
                        disabled={loading}
                        className="w-full py-4 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold
                        hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Summarizing...
                            </>
                        ) : (
                            '🧠 Summarize Video'
                        )}
                    </motion.button>
                )}

                {/* ── Error ──────────────────────────────────────── */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                    >
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </motion.div>
                )}

                {/* ── Results ──────────────────────────────────────── */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >

                        {/* ── Video Summary ──────────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span>Video Summary</span>
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {result.videoSummary}
                            </p>
                            <button
                                onClick={() => copyToClipboard(result.videoSummary)}
                                className="mt-3 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:font-semibold"
                            >
                                {copied && 'Copied!' || (
                                    <>
                                        <Copy size={14} />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* ── Key Points ──────────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <span>Key Points</span>
                            </h3>
                            <div className="space-y-2">
                                {result.keyPoints.map((point, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex gap-3 items-start group"
                                    >
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">
                                            {idx + 1}.
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{point}</p>
                                            <button
                                                onClick={() => saveAsFlashcard(point)}
                                                className="mt-1 flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:font-semibold
                                                opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {savedFlashcard === point ? (
                                                    <>
                                                        <Check size={12} />
                                                        Saved!
                                                    </>
                                                ) : (
                                                    <>
                                                        <BookmarkPlus size={12} />
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* ── Best Moments ──────────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="text-lg">⏰</span>
                                <span>Best Moments</span>
                            </h3>
                            <div className="space-y-2">
                                {result.bestMoments.map((moment, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex gap-3 items-start"
                                    >
                                        <span className="text-sm text-yellow-500">★</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{moment}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* ── New Summary Button ──────────────────────────────────────── */}
                        <motion.button
                            onClick={() => setResult(null)}
                            className="w-full py-3 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold
                            hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            whileTap={{ scale: 0.98 }}
                        >
                            🔄 Summarize Another Video
                        </motion.button>

                    </motion.div>
                )}

            </div>
        </div>
    );
}
