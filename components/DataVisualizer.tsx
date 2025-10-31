import React, { useState, useMemo, useEffect } from 'react';
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
  ChartData
} from 'chart.js';
import type { CANMessage } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataVisualizerProps {
    messages: CANMessage[];
}

const COLORS = [
    '#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6',
    '#2dd4bf', '#818cf8', '#fb923c', '#eab308', '#c084fc', '#ec4899'
];

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ messages }) => {
    // Group available signals by CAN ID for messages that have decoded signals.
    const signalsByCanId = useMemo(() => {
        const map = new Map<string, Set<string>>();
        messages.forEach(msg => {
            if (msg.decoded && Object.keys(msg.decoded).length > 0) {
                if (!map.has(msg.id)) {
                    map.set(msg.id, new Set<string>());
                }
                const signalSet = map.get(msg.id)!;
                Object.keys(msg.decoded).forEach(signalName => {
                    signalSet.add(signalName);
                });
            }
        });
        return map;
    }, [messages]);
    
    // Get a sorted list of CAN IDs that have plottable signals.
    const plottableCanIds = useMemo(() => {
        return Array.from(signalsByCanId.keys()).sort();
    }, [signalsByCanId]);

    const [selectedCanIds, setSelectedCanIds] = useState<Set<string>>(new Set());
    const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
    
    // Auto-select the first CAN ID with signals to show an initial chart
    useEffect(() => {
        // Only run if there are plottable IDs and none are selected yet.
        if (plottableCanIds.length > 0 && selectedCanIds.size === 0) {
            const firstId = plottableCanIds[0];
            
            if (firstId) {
                // Select the first ID
                setSelectedCanIds(new Set([firstId]));
                
                // And auto-select up to its first 3 signals
                const signalsOfFirstId = Array.from(signalsByCanId.get(firstId) || []);
                setSelectedSignals(new Set(signalsOfFirstId.slice(0, 3)));
            }
        }
    }, [plottableCanIds, signalsByCanId, selectedCanIds.size]);


    const handleCanIdToggle = (canId: string) => {
        setSelectedCanIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(canId)) {
                newSet.delete(canId);
                // When deselecting a CAN ID, remove its signals from the plot
                const signalsToDeselect = signalsByCanId.get(canId);
                if (signalsToDeselect) {
                    setSelectedSignals(currentSelectedSignals => {
                        const nextSelectedSignals = new Set(currentSelectedSignals);
                        signalsToDeselect.forEach(signal => nextSelectedSignals.delete(signal));
                        return nextSelectedSignals;
                    });
                }
            } else {
                newSet.add(canId);
                 // Auto-select the first few signals for the newly selected ID
                const signalsForId = Array.from(signalsByCanId.get(canId) || []);
                const signalsToAutoSelect = signalsForId.slice(0, 3);
                if (signalsToAutoSelect.length > 0) {
                    setSelectedSignals(currentSignals => {
                        const nextSignals = new Set(currentSignals);
                        signalsToAutoSelect.forEach(sig => nextSignals.add(sig));
                        return nextSignals;
                    });
                }
            }
            return newSet;
        });
    };

    const handleSignalToggle = (signalName: string) => {
        setSelectedSignals(prev => {
            const newSet = new Set(prev);
            if (newSet.has(signalName)) {
                newSet.delete(signalName);
            } else {
                newSet.add(signalName);
            }
            return newSet;
        });
    };

    const handleDeselectAllCanIds = () => {
        setSelectedCanIds(new Set());
        setSelectedSignals(new Set());
    };

    const handleDeselectAllSignals = () => {
        setSelectedSignals(new Set());
    };

    const chartData: ChartData<'line'> = useMemo(() => {
        const relevantMessages = messages.filter(
            (m) => m.decoded && selectedCanIds.has(m.id)
        );
        
        if (relevantMessages.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = relevantMessages.map(m => m.timestamp.toString());
        
        const datasets = Array.from(selectedSignals).map((signalName, index) => {
            return {
                label: signalName,
                data: relevantMessages.map(m => m.decoded?.[signalName] ?? null),
                borderColor: COLORS[index % COLORS.length],
                backgroundColor: `${COLORS[index % COLORS.length]}33`, // with transparency
                fill: false,
                tension: 0.1,
                pointRadius: 2,
                borderWidth: 1.5,
                spanGaps: true,
            };
        });

        return { labels, datasets };

    }, [messages, selectedSignals, selectedCanIds]);

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#d1d5db' // text-gray-300
                }
            },
            title: {
                display: true,
                text: 'CAN Signal Visualization',
                color: '#f9fafb' // text-gray-50
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Timestamp',
                    color: '#9ca3af' // text-gray-400
                },
                ticks: {
                     color: '#9ca3af', // text-gray-400
                     maxRotation: 0,
                     autoSkip: true,
                     maxTicksLimit: 20,
                }
            },
            y: {
                 title: {
                    display: true,
                    text: 'Value',
                    color: '#9ca3af' // text-gray-400
                },
                ticks: {
                    color: '#9ca3af' // text-gray-400
                }
            }
        }
    };
    
    if(messages.length === 0) {
        return (
             <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg text-center" role="alert">
                No CAN messages were found to visualize.
            </div>
        )
    }

    return (
        <div className="space-y-6">
             {plottableCanIds.length === 0 ? (
                 <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg text-center" role="alert">
                    No decoded signals found to visualize. Please provide a matching DBC matrix to plot signal values.
                </div>
            ) : (
                <>
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-300">1. Select CAN IDs with Decoded Signals</h3>
                            {selectedCanIds.size > 0 && (
                                <button
                                    onClick={handleDeselectAllCanIds}
                                    className="text-xs font-medium text-gray-400 hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 rounded-sm"
                                >
                                    Deselect All
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-900/50 rounded-lg">
                            {plottableCanIds.map(id => (
                                <button
                                    key={id}
                                    onClick={() => handleCanIdToggle(id)}
                                    className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all duration-200 border ${
                                        selectedCanIds.has(id)
                                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                                    }`}
                                >
                                    {id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedCanIds.size > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-300">2. Select Signals to Plot</h3>
                                {selectedSignals.size > 0 && (
                                    <button
                                        onClick={handleDeselectAllSignals}
                                        className="text-xs font-medium text-gray-400 hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 rounded-sm"
                                    >
                                        Deselect All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {Array.from(selectedCanIds).sort().map(canId => {
                                    const availableSignals = Array.from(signalsByCanId.get(canId) || []).sort();
                                    return (
                                        <div key={canId} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                                            <p className="font-semibold font-mono text-cyan-400 mb-3">{canId}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSignals.map(signalName => (
                                                    <button
                                                        key={signalName}
                                                        onClick={() => handleSignalToggle(signalName)}
                                                        className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                                                            selectedSignals.has(signalName)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {signalName}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
            
            <div className="relative h-96 bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                {selectedSignals.size > 0 && chartData.datasets.length > 0 ? (
                    <Line options={chartOptions} data={chartData} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                         {plottableCanIds.length > 0 ? "Select one or more signals to display the chart." : "No plottable data. Please upload a DBC file."}
                    </div>
                )}
            </div>
        </div>
    );
};
