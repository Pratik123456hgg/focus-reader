import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader } from 'lucide-react';

interface MindMapData {
    center: string;
    branches: Array<{
        label: string;
        children: string[];
    }>;
}

export default function MindMapTab() {
    const [loading, setLoading] = useState(false);
    const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
    const [error, setError] = useState('');

    const generateMindMap = async () => {
        setLoading(true);
        setError('');
        setMindMapData(null);

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) throw new Error('No active tab');

            // Get page text from content script
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getPageText' },
                (response) => {
                    if (chrome.runtime.lastError || !response?.text) {
                        setError('Could not extract page text. Try again on a different page.');
                        setLoading(false);
                        return;
                    }

                    // Send to background for mind map generation
                    chrome.runtime.sendMessage(
                        { action: 'generateMindMap', pageText: response.text },
                        (mapResponse) => {
                            if (chrome.runtime.lastError || !mapResponse?.success) {
                                setError('Failed to generate mind map. Please try again.');
                                setLoading(false);
                                return;
                            }

                            setMindMapData(mapResponse.data);
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

    const downloadAsImage = () => {
        const svgElement = document.getElementById('mindmap-svg') as SVGSVGElement;
        if (!svgElement) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = 1200;
        const height = 1000;
        canvas.width = width;
        canvas.height = height;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `mindmap-${Date.now()}.png`;
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                {/* ── Header ──────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        🗺️ Mind Map Generator
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Visualize page content as an interactive mind map
                    </p>
                </motion.div>

                {/* ── Generate Button ──────────────────────────────────────── */}
                {!mindMapData && (
                    <motion.button
                        onClick={generateMindMap}
                        disabled={loading}
                        className="w-full py-4 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold
                        hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            '🧠 Generate Mind Map'
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

                {/* ── Mind Map Render ──────────────────────────────────────── */}
                {mindMapData && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* ── SVG Mind Map ──────────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 overflow-auto max-h-[400px]">
                            <svg
                                id="mindmap-svg"
                                width="600"
                                height="500"
                                viewBox="0 0 600 500"
                                className="w-full h-auto"
                            >
                                {/* ── Background ──────────────────────────────────────── */}
                                <defs>
                                    <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#6C63FF', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#4ECDC4', stopOpacity: 1 }} />
                                    </linearGradient>
                                    <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#4ECDC4', stopOpacity: 0.8 }} />
                                        <stop offset="100%" style={{ stopColor: '#1DD1A1', stopOpacity: 0.8 }} />
                                    </linearGradient>
                                </defs>

                                {/* ── Connection Lines ──────────────────────────────────────── */}
                                {mindMapData.branches.map((branch, idx) => {
                                    const angle = (idx / mindMapData.branches.length) * Math.PI * 2 - Math.PI / 2;
                                    const branchX = 300 + Math.cos(angle) * 120;
                                    const branchY = 250 + Math.sin(angle) * 120;
                                    return (
                                        <g key={`line-${idx}`}>
                                            <path
                                                d={`M 300 250 Q ${(300 + branchX) / 2} ${(250 + branchY) / 2 - 30} ${branchX} ${branchY}`}
                                                stroke="url(#branchGradient)"
                                                strokeWidth="3"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    );
                                })}

                                {/* ── Center Node ──────────────────────────────────────── */}
                                <circle cx="300" cy="250" r="35" fill="url(#centerGradient)" />
                                <text
                                    x="300"
                                    y="255"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill="white"
                                    className="select-none"
                                >
                                    {mindMapData.center.substring(0, 15)}
                                </text>

                                {/* ── Branch Nodes ──────────────────────────────────────── */}
                                {mindMapData.branches.map((branch, idx) => {
                                    const angle = (idx / mindMapData.branches.length) * Math.PI * 2 - Math.PI / 2;
                                    const branchX = 300 + Math.cos(angle) * 120;
                                    const branchY = 250 + Math.sin(angle) * 120;

                                    return (
                                        <g key={`branch-${idx}`}>
                                            {/* ── Branch Circle ──────────────────────────────────────── */}
                                            <circle cx={branchX} cy={branchY} r="25" fill="#4ECDC4" opacity="0.9" />
                                            <text
                                                x={branchX}
                                                y={branchY + 4}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fontWeight="bold"
                                                fill="white"
                                                className="select-none"
                                            >
                                                {branch.label.substring(0, 12)}
                                            </text>

                                            {/* ── Leaf Nodes ──────────────────────────────────────── */}
                                            {branch.children.map((child, childIdx) => {
                                                const leafAngle = angle + ((childIdx - (branch.children.length - 1) / 2) * 0.4);
                                                const leafX = branchX + Math.cos(leafAngle) * 70;
                                                const leafY = branchY + Math.sin(leafAngle) * 70;

                                                return (
                                                    <g key={`leaf-${idx}-${childIdx}`}>
                                                        <line
                                                            x1={branchX}
                                                            y1={branchY}
                                                            x2={leafX}
                                                            y2={leafY}
                                                            stroke="#9b87f5"
                                                            strokeWidth="1.5"
                                                            opacity="0.6"
                                                        />
                                                        <rect
                                                            x={leafX - 30}
                                                            y={leafY - 10}
                                                            width="60"
                                                            height="20"
                                                            rx="3"
                                                            fill="#1a1a2e"
                                                            opacity="0.8"
                                                        />
                                                        <text
                                                            x={leafX}
                                                            y={leafY + 4}
                                                            textAnchor="middle"
                                                            fontSize="8"
                                                            fill="white"
                                                            className="select-none"
                                                        >
                                                            {child.substring(0, 10)}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* ── Download Button ──────────────────────────────────────── */}
                        <motion.button
                            onClick={downloadAsImage}
                            className="w-full py-3 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold
                            flex items-center justify-center gap-2 transition-colors"
                            whileTap={{ scale: 0.98 }}
                        >
                            <Download size={18} />
                            Download as PNG
                        </motion.button>

                        {/* ── New Map Button ──────────────────────────────────────── */}
                        <motion.button
                            onClick={() => setMindMapData(null)}
                            className="w-full py-3 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold
                            hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            whileTap={{ scale: 0.98 }}
                        >
                            🔄 Generate New Mind Map
                        </motion.button>

                    </motion.div>
                )}

            </div>
        </div>
    );
}
