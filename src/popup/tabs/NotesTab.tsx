import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bookmark, AlertCircle, FileText, Download } from 'lucide-react';
import { useStore } from '../store';
import type { Flashcard } from '../store';

// ─── Parser ──────────────────────────────────────────────────────
interface ParsedNotes {
    summary: string[];
    questions: string[];
}

function parseNotes(raw: string): ParsedNotes {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const summary: string[] = [];
    const questions: string[] = [];
    let section: 'summary' | 'questions' | '' = '';

    for (const line of lines) {
        const upper = line.toUpperCase();
        if (upper.startsWith('SUMMARY')) { section = 'summary'; continue; }
        if (upper.startsWith('EXAM QUESTION')) { section = 'questions'; continue; }

        if (section === 'summary' && line.startsWith('-')) {
            summary.push(line.slice(1).trim());
        } else if (section === 'questions' && /^\d+\./.test(line)) {
            questions.push(line.replace(/^\d+\.\s*/, ''));
        }
    }

    return { summary, questions };
}

// ─── Spinner ─────────────────────────────────────────────────────
function Spinner() {
    return (
        <div className="flex items-center justify-center gap-2 py-10">
            <div className="w-2 h-2 rounded-full bg-purple-500 dot1" />
            <div className="w-2 h-2 rounded-full bg-purple-400 dot2" />
            <div className="w-2 h-2 rounded-full bg-teal-400 dot3" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function NotesTab() {
    const { pageText, pageTitle, lastNotes, setLastNotes, addFlashcard, updateFlashcardBack, flashcards } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const parsed = lastNotes ? parseNotes(lastNotes) : null;

    const handleGenerate = async () => {
        if (loading) return;
        if (!pageText.trim()) {
            setError('Could not extract text from this page. Navigate to an article or study page and try again.');
            return;
        }
        setLoading(true);
        setError('');

        chrome.runtime.sendMessage(
            { action: 'summarize', pageText },
            (res: { success: boolean; data?: string; error?: string }) => {
                setLoading(false);
                if (res?.success && res.data) {
                    setLastNotes(res.data);
                } else {
                    setError(res?.error ?? 'Unknown error. Check your API key in background/index.ts.');
                }
            },
        );
    };

    const handleSaveFlashcard = (point: string) => {
        const id = `fc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const card: Flashcard = {
            id,
            front: point,
            back: 'Generating explanation…',
            pageTitle: pageTitle || 'Study Note',
            createdAt: Date.now(),
            backLoading: true,
        };
        addFlashcard(card);
        setSavedIds((prev) => new Set([...prev, point]));

        // Generate the back asynchronously
        chrome.runtime.sendMessage(
            { action: 'generateFlashcardBack', front: point, pageText },
            (res: { success: boolean; data?: string }) => {
                if (res?.success && res.data) {
                    updateFlashcardBack(id, res.data);
                } else {
                    updateFlashcardBack(id, 'Could not generate explanation. Tap to add your own notes.');
                }
            },
        );
    };

    const handleExportPDF = () => {
        if (!parsed) return;

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FocusRead AI — Study Notes</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      color: #111;
      line-height: 1.6;
      padding: 0 20px;
    }
    h1 {
      color: #6C63FF;
      border-bottom: 3px solid #6C63FF;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    h2 {
      color: #4ECDC4;
      margin-top: 32px;
      margin-bottom: 16px;
      font-size: 18px;
    }
    .note {
      background: #f8f9ff;
      border-left: 4px solid #6C63FF;
      padding: 12px;
      margin: 12px 0;
      border-radius: 4px;
    }
    .question {
      background: #f0fffe;
      border-left: 4px solid #4ECDC4;
      padding: 12px;
      margin: 12px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body { margin: 0; }
      h1, h2 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1>📚 Study Notes</h1>
  <div class="meta">
    Generated by FocusRead AI • ${new Date().toLocaleDateString()}
  </div>

  <h2>Key Points (${parsed.summary.length})</h2>
  ${parsed.summary.map(n => `<div class="note">• ${n}</div>`).join('')}

  <h2>Exam Questions (${parsed.questions.length})</h2>
  ${parsed.questions.map((q, i) => `<div class="question">❓ ${q}</div>`).join('')}

  <div class="footer">
    <p>FocusRead AI v2.0.0 — Your AI Study Buddy</p>
  </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        chrome.tabs.create({ url }, (tab) => {
            if (tab.id) {
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id!, { action: 'printPage' });
                }, 1000);
            }
        });
    };

    return (
        <div className="p-4 flex flex-col gap-3">

            {/* Page info */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                <FileText size={12} className="text-purple-400 shrink-0" />
                <span className="truncate">{pageTitle || 'Navigate to a page to start'}</span>
            </div>

            {/* Generate button */}
            <motion.button
                onClick={handleGenerate}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-teal-400
          text-white font-bold text-sm rounded-xl py-3 shadow-lg shadow-purple-500/25
          disabled:opacity-70 disabled:cursor-not-allowed transition-shadow hover:shadow-purple-500/40"
            >
                <Sparkles size={16} />
                {loading ? 'Generating…' : 'Generate Study Notes'}
            </motion.button>

            {/* Loading */}
            {loading && <Spinner />}

            {/* Error */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-600 dark:text-red-400"
                >
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {error}
                </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
                {parsed && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-3"
                    >

                        {/* Summary */}
                        {parsed.summary.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-purple-50 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/20">
                                    <span className="text-base">📋</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                        Summary
                                    </span>
                                </div>
                                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {parsed.summary.map((point, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="flex items-start justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <span className="text-purple-400 text-xs font-bold mt-0.5 shrink-0">•</span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {point}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleSaveFlashcard(point)}
                                                disabled={savedIds.has(point)}
                                                title={savedIds.has(point) ? 'Saved!' : 'Save as Flashcard'}
                                                className={`shrink-0 p-1.5 rounded-lg transition-all ${savedIds.has(point)
                                                        ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400'
                                                        : 'hover:bg-purple-100 dark:hover:bg-purple-900/40 text-gray-400 hover:text-purple-500'
                                                    }`}
                                            >
                                                <Bookmark size={13} fill={savedIds.has(point) ? 'currentColor' : 'none'} />
                                            </button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Exam questions */}
                        {parsed.questions.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-teal-100 dark:border-gray-700 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-teal-50 dark:border-gray-700 bg-teal-50/50 dark:bg-teal-900/20">
                                    <span className="text-base">❓</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                        Exam Questions
                                    </span>
                                </div>
                                <ol className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {parsed.questions.map((q, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.07 }}
                                            className="flex items-start gap-2 px-4 py-3"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {q}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Card count */}
                        {flashcards.length > 0 && (
                            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} saved
                            </p>
                        )}

                        {/* Export PDF Button */}
                        <motion.button
                            onClick={handleExportPDF}
                            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
                            whileTap={{ scale: 0.98 }}
                        >
                            <Download size={16} />
                            Export as PDF
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {!parsed && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400 dark:text-gray-500">
                    <span className="text-4xl">📖</span>
                    <p className="text-sm text-center leading-relaxed max-w-[220px]">
                        Click <strong>Generate Study Notes</strong> to get an AI summary + exam questions.
                    </p>
                </div>
            )}
        </div>
    );
}
