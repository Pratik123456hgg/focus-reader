import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, Layers, Download } from 'lucide-react';
import { useStore, type Flashcard } from '../store';

// ─── Single Flashcard ─────────────────────────────────────────────
function FlashcardItem({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className="relative"
            style={{ perspective: '1000px' }}
        >
            {/* 3D flip container */}
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className="relative cursor-pointer preserve-3d"
                style={{ minHeight: '130px', transformStyle: 'preserve-3d' }}
                onClick={() => setFlipped((f) => !f)}
            >

                {/* Front face */}
                <div
                    className="absolute inset-0 backface-hidden rounded-xl bg-white dark:bg-gray-800
            border border-purple-100 dark:border-gray-700 p-4 flex flex-col justify-between
            shadow-sm hover:shadow-md transition-shadow"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Study Point</span>
                            <div className="flex-1 h-px bg-purple-100 dark:bg-purple-900/40" />
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {card.front}
                        </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-500 px-2 py-0.5 rounded-full">
                            {card.pageTitle.slice(0, 24)}{card.pageTitle.length > 24 ? '…' : ''}
                        </span>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[10px]">
                            <RotateCcw size={9} />
                            flip
                        </div>
                    </div>
                </div>

                {/* Back face */}
                <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl
            bg-gradient-to-br from-purple-500 to-teal-400 p-4
            flex flex-col justify-between shadow-md"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Explanation</span>
                            <div className="flex-1 h-px bg-white/25" />
                        </div>
                        <p className="text-sm text-white leading-relaxed">
                            {card.backLoading ? 'Generating AI explanation…' : card.back}
                        </p>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-white/60 text-[10px] mt-3">
                        <RotateCcw size={9} />
                        flip back
                    </div>
                </div>
            </motion.div>

            {/* Delete button — always visible outside flip area */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white
          flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                title="Delete flashcard"
            >
                <Trash2 size={10} />
            </button>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function FlashcardsTab() {
    const { flashcards, deleteFlashcard } = useStore();

    const handleExportPDF = () => {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FocusRead AI — Flashcards</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      color: #111;
      line-height: 1.8;
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
    .card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .front, .back {
      border: 2px solid #eee;
      border-radius: 8px;
      padding: 16px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .front {
      background: #f8f9ff;
      border-left: 4px solid #6C63FF;
    }
    .back {
      background: #f0fffe;
      border-left: 4px solid #4ECDC4;
    }
    .card-title {
      font-size: 11px;
      font-weight: bold;
      color: #999;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .card-content {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }
    .page-title {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
      font-style: italic;
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
      .card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>🗃️ Flashcards</h1>
  <div class="meta">
    Total: ${flashcards.length} cards • Generated by FocusRead AI • ${new Date().toLocaleDateString()}
  </div>

  ${flashcards.map(card => `
    <div class="card">
      <div class="front">
        <div class="card-title">Front</div>
        <div class="card-content">${card.front}</div>
        <div class="page-title">${card.pageTitle}</div>
      </div>
      <div class="back">
        <div class="card-title">Back</div>
        <div class="card-content">${card.back}</div>
      </div>
    </div>
  `).join('')}

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
        <div className="p-4 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-purple-500" />
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                        My Flashcards
                    </span>
                </div>
                <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {flashcards.length} card{flashcards.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Empty state */}
            {flashcards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-500">
                    <span className="text-5xl">🗃️</span>
                    <p className="text-sm text-center leading-relaxed max-w-[210px]">
                        No flashcards yet. Go to the <strong>Notes</strong> tab and save bullet points as flashcards!
                    </p>
                </div>
            )}

            {/* Cards grid */}
            {flashcards.length > 0 && (
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                        Tap a card to flip it and see the AI explanation
                    </p>
                    <AnimatePresence mode="popLayout">
                        {[...flashcards].reverse().map((card) => (
                            <FlashcardItem
                                key={card.id}
                                card={card}
                                onDelete={() => deleteFlashcard(card.id)}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Export PDF Button */}
                    <motion.button
                        onClick={handleExportPDF}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl py-3 transition-colors mt-4"
                        whileTap={{ scale: 0.98 }}
                    >
                        <Download size={16} />
                        Export as PDF
                    </motion.button>
                </div>
            )}
        </div>
    );
}
