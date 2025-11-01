

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  TooltipModel
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import type { CANMessage } from '../types';
import { ChevronDownIcon } from './IconComponents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface DashboardProps {
    messages: CANMessage[];
}

const COLORS = [
    '#0284c7', '#5f57be', '#d946ef', '#e11d48', '#ea580c', '#f59e0b',
    '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#f97316', '#facc15'
];

const calculateStats = (data: number[]) => {
    if (data.length === 0) return { min: NaN, max: NaN, avg: NaN, rms: NaN, std: NaN, delta: NaN };

    const cleanData = data.filter(v => v !== null && !isNaN(v));
    if (cleanData.length === 0) return { min: NaN, max: NaN, avg: NaN, rms: NaN, std: NaN, delta: NaN };

    const sum = cleanData.reduce((acc, val) => acc + val, 0);
    const avg = sum / cleanData.length;
    const min = Math.min(...cleanData);
    const max = Math.max(...cleanData);
    const delta = max - min;
    const rms = Math.sqrt(cleanData.reduce((acc, val) => acc + val * val, 0) / cleanData.length);
    const std = Math.sqrt(cleanData.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / cleanData.length);

    return { min, max, avg, rms, std, delta };
};

const formatStatValue = (value: number, precision = 4) => isNaN(value) ? 'N/A' : value.toFixed(precision);

const StatRow: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500 truncate pr-2" title={label}>{label}</span>
        <span className="font-mono text-gray-800 flex-shrink-0">{value} {unit || ''}</span>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ messages }) => {
    const chartRef = useRef<ChartJS<'line'>>(null);
    const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
    
    // State for statistics panels
    const [cursorStats, setCursorStats] = useState<{ timestamp: string, values: Record<string, string> } | null>(null);
    const [selectedRangeStats, setSelectedRangeStats] = useState<any>(null);
    const [visibleRangeStats, setVisibleRangeStats] = useState<any>(null);
    const [overallStats, setOverallStats] = useState<{ t1: string, t2: string } | null>(null);

    // State for range selection
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selection, setSelection] = useState<{ startX: number | null, endX: number | null }>({ startX: null, endX: null });
    const selectionData = useRef<{ startIndex: number | null, endIndex: number | null }>({ startIndex: null, endIndex: null });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                setIsSelectMode(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                setIsSelectMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const relevantMessages = useMemo(() => messages.filter(m => m.decoded && Object.keys(m.decoded).length > 0), [messages]);

    const allSignals = useMemo(() => {
        const signalNames = new Set<string>();
        relevantMessages.forEach(msg => {
            Object.keys(msg.decoded).forEach(signalName => {
                signalNames.add(signalName);
            });
        });
        return Array.from(signalNames).sort();
    }, [relevantMessages]);
    
    useEffect(() => {
        if (allSignals.length > 0) {
            setSelectedSignals(new Set([allSignals[0]]));
        }
    }, [allSignals]);
    
    const chartData: ChartData<'line'> = useMemo(() => {
        if (relevantMessages.length === 0) {
            return { labels: [], datasets: [] };
        }
        
        const labels = relevantMessages.map(m => m.timestamp.toString());

        const datasets = Array.from(selectedSignals).map((signalName, index) => {
            const data = relevantMessages.map(m => m.decoded?.[signalName] ?? null);
            return {
                label: signalName,
                data: data,
                borderColor: COLORS[index % COLORS.length],
                backgroundColor: `${COLORS[index % COLORS.length]}33`,
                fill: false,
                tension: 0.1,
                pointRadius: 1.5,
                borderWidth: 1.5,
                spanGaps: true,
            };
        });
        return { labels, datasets };
    }, [relevantMessages, selectedSignals]);
    
    const calculateAndSetStats = useCallback((startIndex: number, endIndex: number) => {
        if (startIndex >= endIndex) return null;
        const statsBySignal: Record<string, any> = {};

        for (const signal of selectedSignals) {
            const rangeData = relevantMessages.slice(startIndex, endIndex + 1).map(m => m.decoded?.[signal]).filter(v => v !== undefined && v !== null) as number[];
            statsBySignal[signal] = calculateStats(rangeData);
        }

        const t1 = relevantMessages[startIndex]?.timestamp;
        const t2 = relevantMessages[endIndex]?.timestamp;
        const dt = (typeof t1 === 'number' && typeof t2 === 'number') ? (t2 - t1) : NaN;

        return {
            signals: statsBySignal,
            t1: typeof t1 === 'number' ? t1.toFixed(6) : String(t1 || ''),
            t2: typeof t2 === 'number' ? t2.toFixed(6) : String(t2 || ''),
            dt: dt,
        };
    }, [relevantMessages, selectedSignals]);

    const updateStatsPanels = useCallback(() => {
        const chart = chartRef.current;
        if (!chart || relevantMessages.length === 0) return;
        
        // Overall stats
        if (!overallStats) {
            const firstT = relevantMessages[0].timestamp;
            const lastT = relevantMessages[relevantMessages.length - 1].timestamp;
            setOverallStats({
                t1: typeof firstT === 'number' ? firstT.toFixed(6) : String(firstT),
                t2: typeof lastT === 'number' ? lastT.toFixed(6) : String(lastT),
            });
        }
        
        // Visible range stats
        const { min, max } = chart.scales.x;
        const startIndex = Math.max(0, Math.floor(min));
        const endIndex = Math.min(relevantMessages.length - 1, Math.ceil(max));
        const visibleStats = calculateAndSetStats(startIndex, endIndex);
        setVisibleRangeStats(visibleStats);

    }, [relevantMessages, calculateAndSetStats, overallStats]);

    useEffect(() => {
        setTimeout(updateStatsPanels, 100);
    }, [chartData, updateStatsPanels]);

    const selectionPlugin = useMemo(() => ({
        id: 'rangeSelection',
        afterDraw: (chart: ChartJS) => {
            const { startX, endX } = selection;
            if (startX === null || endX === null) return;
            
            const { ctx, chartArea: { top, bottom } } = chart;
            const x1 = Math.min(startX, endX);
            const x2 = Math.max(startX, endX);

            ctx.save();
            // Shaded area
            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.fillRect(x1, top, x2 - x1, bottom - top);
            
            // Draw lines and triangles
            [x1, x2].forEach(xPos => {
                // Line
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();

                // Triangles
                ctx.fillStyle = '#facc15'; // yellow-400
                const triangleSize = 8;
                // Top triangle
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos - triangleSize / 2, top - triangleSize);
                ctx.lineTo(xPos + triangleSize / 2, top - triangleSize);
                ctx.closePath();
                ctx.fill();
                // Bottom triangle
                ctx.beginPath();
                ctx.moveTo(xPos, bottom);
                ctx.lineTo(xPos - triangleSize / 2, bottom + triangleSize);
                ctx.lineTo(xPos + triangleSize / 2, bottom + triangleSize);
                ctx.closePath();
                ctx.fill();
            });

            ctx.restore();
        }
    }), [selection]);

    // Fix: Changed event type to `React.MouseEvent<HTMLDivElement>` as the handler is on a div.
    // Use `chart.canvas.getBoundingClientRect()` to get correct coordinates relative to the canvas.
    const handleChartMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelectMode || !chartRef.current) return;
        const chart = chartRef.current;
        const rect = chart.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (x >= chart.chartArea.left && x <= chart.chartArea.right) {
            setSelection({ startX: x, endX: x });
            setSelectedRangeStats(null); // Clear previous stats on new selection
        }
    };

    // Fix: Changed event type to `React.MouseEvent<HTMLDivElement>` as the handler is on a div.
    // Use `chart.canvas.getBoundingClientRect()` to get correct coordinates relative to the canvas.
    const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isSelectMode && selection.startX !== null && chartRef.current) {
            const chart = chartRef.current;
            const rect = chart.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clampedX = Math.max(chart.chartArea.left, Math.min(x, chart.chartArea.right));
            setSelection(prev => ({ ...prev, endX: clampedX }));
        }
    };

    const handleChartMouseUp = () => {
        if (isSelectMode && selection.startX !== null && selection.endX !== null) {
            const chart = chartRef.current;
            if (!chart) return;
            
            const x1 = Math.min(selection.startX, selection.endX);
            const x2 = Math.max(selection.startX, selection.endX);

            const startIndex = Math.round(chart.scales.x.getValueForPixel(x1));
            const endIndex = Math.round(chart.scales.x.getValueForPixel(x2));
            
            if (startIndex >= 0 && endIndex < relevantMessages.length && startIndex < endIndex) {
                const stats = calculateAndSetStats(startIndex, endIndex);
                setSelectedRangeStats(stats);
            }
        }
    };
    
    const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: 'category',
                ticks: { color: '#4b5563', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
                grid: { color: 'rgba(0, 0, 0, 0.05)', },
                border: { display: true, color: '#6b7280' },
            },
            y: {
                ticks: { color: '#4b5563' },
                grid: { color: 'rgba(0, 0, 0, 0.05)', },
                border: { display: true, color: '#6b7280' },
                title: {
                    display: selectedSignals.size === 1,
                    text: selectedSignals.size === 1 ? `${Array.from(selectedSignals)[0]} [Volt]` : '',
                    color: '#1f2937',
                    font: { size: 12 }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                external: (context: { tooltip: TooltipModel<'line'> }) => {
                    const { tooltip } = context;
                    if (tooltip.opacity === 0) {
                        setCursorStats(null);
                        return;
                    }
                    const title = tooltip.title?.[0];
                    if (title) {
                        const values: Record<string, string> = {};
                        tooltip.body.forEach(bodyItem => {
                           const label = bodyItem.lines[0];
                           const parts = label.split(': ');
                           if(parts.length === 2) {
                               const signalName = parts[0];
                               const value = parseFloat(parts[1]).toFixed(4);
                               values[signalName] = value;
                           }
                        });
                        setCursorStats({ timestamp: parseFloat(title).toFixed(6), values });
                    }
                }
            },
            zoom: {
                pan: { enabled: true, mode: 'x', onPanComplete: updateStatsPanels },
                zoom: {
                    wheel: { enabled: true, speed: 0.1 },
                    pinch: { enabled: true },
                    mode: 'x',
                    onZoomComplete: updateStatsPanels
                }
            }
        },
        onHover: (event, chartElement) => {
            const canvas = event.native?.target as HTMLCanvasElement;
            if (canvas) {
                canvas.style.cursor = isSelectMode ? 'ew-resize' : (chartElement[0] ? 'crosshair' : 'default');
            }
        }
    }), [selectedSignals, isSelectMode, updateStatsPanels]);

    return (
        <div className="flex h-[80vh] bg-gray-100 text-gray-800 rounded-lg border border-gray-300 text-sm">
            <div className="flex-1 flex overflow-hidden">
                <div className="w-56 flex flex-col border-r border-gray-300">
                    <h2 className="p-2 font-bold border-b border-gray-300">Channels</h2>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {allSignals.map(signal => (
                            <div key={signal} className="flex items-center p-1.5 rounded-md hover:bg-gray-200 cursor-pointer" onClick={() => setSelectedSignals(new Set([signal]))}>
                                <input
                                    type="checkbox"
                                    checked={selectedSignals.has(signal)}
                                    onChange={() => {
                                        setSelectedSignals(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(signal)) newSet.delete(signal); else newSet.add(signal);
                                            return newSet;
                                        });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded bg-gray-300 border-gray-400 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 truncate" title={signal}>{signal}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-1 min-w-0">
                    <div className="flex-1 relative" onMouseDown={handleChartMouseDown} onMouseMove={handleChartMouseMove} onMouseUp={handleChartMouseUp} onMouseLeave={handleChartMouseUp}>
                        <Line ref={chartRef} options={chartOptions} data={chartData} plugins={[selectionPlugin]} />
                        {isSelectMode && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">Range Selection Mode (R)</div>}
                    </div>
                </div>

                <div className="w-64 p-2 space-y-2 border-l border-gray-300 overflow-y-auto custom-scrollbar bg-gray-50">
                    {/* Cursor Panel */}
                    <div className="p-2 border border-gray-200 rounded-md">
                        <h3 className="font-bold text-xs mb-2">Cursor</h3>
                        {cursorStats ? (
                            <>
                                <StatRow label="Timestamp" value={cursorStats.timestamp} unit="s" />
                                {Object.entries(cursorStats.values).map(([name, value]) => (
                                    <StatRow key={name} label={name} value={value} unit="Volt" />
                                ))}
                            </>
                        ) : <StatRow label="Timestamp" value="N/A" unit="s" />}
                    </div>
                    {/* Selected Range Panel */}
                    <div className="p-2 border border-gray-200 rounded-md">
                        <h3 className="font-bold text-xs mb-2">Selected range</h3>
                        {selectedRangeStats ? (
                            <>
                                <StatRow label="First timestamp" value={selectedRangeStats.t1} unit="s" />
                                <StatRow label="Last timestamp" value={selectedRangeStats.t2} unit="s" />
                                <StatRow label="Δt" value={formatStatValue(selectedRangeStats.dt)} unit="s" />
                                {Object.entries(selectedRangeStats.signals).map(([name, stats]: [string, any]) => (
                                    <div key={name} className="mt-2 pt-1 border-t border-gray-200">
                                        <h4 className="font-semibold text-blue-600 text-xs truncate">{name}</h4>
                                        <StatRow label="Min" value={formatStatValue(stats.min)} unit="Volt" />
                                        <StatRow label="Max" value={formatStatValue(stats.max)} unit="Volt" />
                                        <StatRow label="Average" value={formatStatValue(stats.avg)} unit="Volt" />
                                        <StatRow label="RMS" value={formatStatValue(stats.rms)} unit="Volt" />
                                        <StatRow label="STD" value={formatStatValue(stats.std)} unit="Volt" />
                                        <StatRow label="Δ" value={formatStatValue(stats.delta)} unit="Volt" />
                                    </div>
                                ))}
                            </>
                        ) : <p className="text-xs text-gray-400 italic text-center py-1">Hold 'R' and drag on chart</p>}
                    </div>
                    {/* Visible Range Panel */}
                    <div className="p-2 border border-gray-200 rounded-md">
                         <h3 className="font-bold text-xs mb-2">Visible range</h3>
                          {visibleRangeStats ? (
                            <>
                                <StatRow label="First timestamp" value={visibleRangeStats.t1} unit="s" />
                                <StatRow label="Last timestamp" value={visibleRangeStats.t2} unit="s" />
                                <StatRow label="Δt" value={formatStatValue(visibleRangeStats.dt)} unit="s" />
                                {Object.entries(visibleRangeStats.signals).map(([name, stats]: [string, any]) => (
                                    <div key={name} className="mt-2 pt-1 border-t border-gray-200">
                                        <h4 className="font-semibold text-blue-600 text-xs truncate">{name}</h4>
                                        <StatRow label="Min" value={formatStatValue(stats.min)} unit="Volt" />
                                        <StatRow label="Max" value={formatStatValue(stats.max)} unit="Volt" />
                                        <StatRow label="Average" value={formatStatValue(stats.avg)} unit="Volt" />
                                        <StatRow label="RMS" value={formatStatValue(stats.rms)} unit="Volt" />
                                        <StatRow label="STD" value={formatStatValue(stats.std)} unit="Volt" />
                                        <StatRow label="Δ" value={formatStatValue(stats.delta)} unit="Volt" />
                                    </div>
                                ))}
                            </>
                        ) : <p className="text-xs text-gray-400 italic text-center py-1">Loading...</p>}
                    </div>
                    {/* Overall Panel */}
                     <div className="p-2 border border-gray-200 rounded-md">
                        <h3 className="font-bold text-xs mb-2">Overall</h3>
                        <StatRow label="First timestamp" value={overallStats?.t1 ?? 'N/A'} unit="s" />
                        <StatRow label="Last timestamp" value={overallStats?.t2 ?? 'N/A'} unit="s" />
                    </div>
                </div>
            </div>
        </div>
    );
};
