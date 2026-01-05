import { Search, Wind, Droplets, Users, Star, BarChart3 } from 'lucide-react';

export default function SearchPoints({ isPremium }: { isPremium: boolean }) {
    // Mock Data simulating RAWRIS + AI Analysis
    const reservoirs = [
        {
            id: 1, name: 'Chungju Lake', location: 'Chungju-si',
            weather: 'Cloudy', wind: '2m/s', waterLevel: '72%',
            aiScore: 92, aiColor: 'text-green-400', aiLabel: 'Excellent',
            liveUsers: 12
        },
        {
            id: 2, name: 'Andong Lake', location: 'Andong-si',
            weather: 'Rain', wind: '5m/s', waterLevel: '65%',
            aiScore: 45, aiColor: 'text-red-400', aiLabel: 'Poor',
            liveUsers: 3
        },
        {
            id: 3, name: 'Daecheong Lake', location: 'Daejeon',
            weather: 'Clear', wind: '1m/s', waterLevel: '80%',
            aiScore: 85, aiColor: 'text-green-400', aiLabel: 'Good',
            liveUsers: 8
        }
    ];

    return (
        <div className="p-4 animate-fade-in pb-24">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">저수지 및 지역 검색</h2>
                <span className="text-xs text-slate-500">Data: RAWRIS</span>
            </div>

            <div className="glass-panel flex items-center gap-2 mb-6">
                <Search className="text-slate-400" />
                <input
                    type="text"
                    placeholder="지역 또는 저수지 검색..."
                    className="bg-transparent border-none outline-none text-white w-full"
                />
            </div>

            <div className="flex flex-col gap-4">
                {reservoirs.map((res) => (
                    <div key={res.id} className="glass-panel flex flex-col gap-3 group relative overflow-hidden">
                        {/* Premium Live User Indicator */}
                        {isPremium && res.liveUsers > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-sky-400 bg-sky-900/30 px-2 py-1 rounded-full animate-pulse">
                                <Users size={12} /> {res.liveUsers} Live
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{res.name}</h3>
                            <p className="text-slate-400 text-sm">{res.location}</p>
                        </div>

                        {/* Basic Stats */}
                        <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg">
                            <div className="flex flex-col items-center">
                                <Wind size={16} className="mb-1 text-slate-500" />
                                <span>{res.wind}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Droplets size={16} className="mb-1 text-slate-500" />
                                <span>{res.weather}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <BarChart3 size={16} className="mb-1 text-slate-500" />
                                <span>{res.waterLevel}</span>
                            </div>
                        </div>

                        {/* Premium Analysis */}
                        {isPremium ? (
                            <div className="flex items-center gap-3 mt-1 border-t border-white/5 pt-3">
                                <div className={`text-2xl font-black ${res.aiColor}`}>{res.aiScore}</div>
                                <div className="flex flex-col">
                                    <span className={`font-bold ${res.aiColor} text-sm flex items-center gap-1 uppercase`}>
                                        AI Analysis: {res.aiLabel}
                                    </span>
                                    <span className="text-xs text-slate-500">Based on wind, pressure, & historical data</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-center py-2 border-t border-white/5 bg-slate-900/40 rounded">
                                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                                    <Star size={12} className="text-premium-gold" /> Premium: Unlock AI Fishing Analysis
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
