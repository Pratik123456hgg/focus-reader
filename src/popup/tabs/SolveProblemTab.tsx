import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Copy, CheckCircle } from 'lucide-react';

export default function SolveProblemTab() {
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSolve = async () => {
        if (!problem.trim()) {
            setError('Please enter a problem');
            return;
        }

        setLoading(true);
        setError('');
        setSolution('');

        try {
            const response = await new Promise<{ success: boolean; data?: string; error?: string }>((resolve) =>
                chrome.runtime.sendMessage(
                    { action: 'solveProblem', problem },
                    resolve
                )
            );

            if (response.success && response.data) {
                setSolution(response.data);
            } else {
                setError(response.error || 'Failed to solve problem');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(solution);
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
                    Paste Your Study Problem
                </label>
                <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Enter math problem, essay prompt, code issue, or any study question..."
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
                    onClick={handleSolve}
                    disabled={loading || !problem.trim()}
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
                            Solving...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Solve It
                        </>
                    )}
                </button>
            </motion.div>

            {/* ── Solution Section ──────────────────────────────────────── */}
            {solution && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-3 min-h-0"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Solution</h3>
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
                                    Copy Solution
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-gray-100 dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {solution}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Empty State ──────────────────────────────────────────── */}
            {!solution && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-4"
                >
                    <div>
                        <div className="text-4xl mb-2">💡</div>
                        <p className="text-sm">Enter a problem and click "Solve It" to get step-by-step solutions</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
