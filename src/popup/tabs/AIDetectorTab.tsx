import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, Copy, CheckCircle } from 'lucide-react';

export default function AIDetectorTab() {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const parseResult = (result: string) => {
        const lines = result.split('\n').filter((line) => line.trim());
        let verdict = 'Unknown';
        let confidence = 0;
        let reasons: string[] = [];
        let inReasons = false;

        for (const line of lines) {
            if (line.includes('VERDICT:')) {
                const match = line.match(/(AI-Generated|Human-Written|Mixed)/i);
                if (match) verdict = match[1];
            } else if (line.includes('CONFIDENCE:')) {
                const match = line.match(/(\d+)%/);
                if (match) confidence = parseInt(match[1], 10);
            } else if (line.includes('REASONS:')) {
                inReasons = true;
            } else if (inReasons && line.startsWith('-')) {
                reasons.push(line.replace('-', '').trim());
            }
        }

        return { verdict, confidence, reasons };
    };

    const getVerdictColor = (verdict: string) => {
        if (verdict.includes('AI')) return 'text-red-600 dark:text-red-400';
        if (verdict.includes('Human')) return 'text-green-600 dark:text-green-400';
        return 'text-yellow-600 dark:text-yellow-400';
    };

    const getVerdictBg = (verdict: string) => {
        if (verdict.includes('AI')) return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
        if (verdict.includes('Human')) return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
        return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    };

    const handleAnalyze = async () => {
        if (!text.trim()) {
            setError('Please paste text to analyze');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) =>
                chrome.runtime.sendMessage(
                    { action: 'detectAI', text },
                    resolve
                )
            );

            if (response.success && response.data) {
                setResult(response.data);
            } else {
                setError(response.error || 'Failed to analyze text');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const { verdict, confidence, reasons } = result ? parseResult(result) : { verdict: '', confidence: 0, reasons: [] };

    return (
        <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">

            {/* ── Input Section ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Paste Text to Check
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste any text here to check if it's AI-written or human-written..."
                    className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500
                    resize-none"
                />

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
                    onClick={handleAnalyze}
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
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Scan size={16} />
                            Analyze Text
                        </>
                    )}
                </button>
            </motion.div>

            {/* ── Result Section ──────────────────────────────────────── */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-4 min-h-0"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Analysis Result</h3>
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
                                    Copy Result
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── Verdict Box ──────────────────────────────────── */}
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={`p-4 rounded-lg border ${getVerdictBg(verdict)}`}
                    >
                        <div className={`font-bold text-lg ${getVerdictColor(verdict)}`}>
                            {verdict}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Verdict
                        </div>
                    </motion.div>

                    {/* ── Confidence Bar ──────────────────────────────── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Confidence Level
                            </span>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {confidence}%
                            </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
                            />
                        </div>
                    </div>

                    {/* ── Reasons ─────────────────────────────────────– */}
                    {reasons.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Key Indicators:
                            </h4>
                            <ul className="space-y-2">
                                {reasons.map((reason, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex gap-2 text-xs text-gray-700 dark:text-gray-300"
                                    >
                                        <span className="text-purple-500 font-bold mt-0.5">•</span>
                                        <span>{reason}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ── Full Result ──────────────────────────────────– */}
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {result}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Empty State ──────────────────────────────────────────– */}
            {!result && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-4"
                >
                    <div>
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-sm">Paste text and analyze to check if it's AI-generated or human-written</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
