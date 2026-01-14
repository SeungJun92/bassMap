import { useState, useEffect } from 'react';
import { Search, Navigation, Map as MapIcon, Layers, Crosshair, Cloud, User, Fish, Wind, Droplets, Star, ChevronLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map flyTo and size refresh
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

interface Reservoir {
    id: number;
    name: string;
    lat: number;
    lng: number;
    weather: string;
    wind: string;
    waterLevel: string;
    liveUsers: number;
    aiScore: number;
    aiColor: string;
    aiLabel: string;
}

import { supabase } from '../supabase';

// ... (previous imports)

export default function SearchPoints() {
    // ... (state definitions remain the same)
    const [activePoint, setActivePoint] = useState<number | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([36.5, 127.8]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reservoirs, setReservoirs] = useState<Reservoir[]>([]);
    const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
    const [_isSearching, setIsSearching] = useState(false);
    const [showResultsList, setShowResultsList] = useState(false);

    useEffect(() => {
        checkDbConnection();
    }, []);

    const checkDbConnection = async () => {
        try {
            const { error } = await supabase.from('reservoirs').select('count', { count: 'exact', head: true });
            if (!error) {
                setDbStatus('connected');
                // Optional: Fetch initial data
                fetchReservoirs();
            } else {
                setDbStatus('disconnected');
            }
        } catch (e) {
            setDbStatus('disconnected');
        }
    };

    const fetchReservoirs = async (query: string = '') => {
        setIsSearching(true);
        try {
            let queryBuilder = supabase.from('reservoirs').select('*');

            if (query) {
                queryBuilder = queryBuilder.ilike('name', `%${query}%`);
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;

            const typedData = (data || []) as Reservoir[];
            setReservoirs(typedData);
            setIsSearching(false);
            return typedData;
        } catch (error) {
            console.error('Supabase fetch error:', error);
            setIsSearching(false);
            return [];
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            await fetchReservoirs();
            setShowResultsList(false);
            return;
        }

        const data = await fetchReservoirs(searchQuery);
        if (data && data.length > 0) {
            setMapCenter([data[0].lat, data[0].lng]);
            if (data.length === 1) {
                setActivePoint(data[0].id);
                setShowResultsList(false);
            } else {
                setShowResultsList(true);
                setActivePoint(null);
            }
        } else {
            alert(`'${searchQuery}'에 대한 검색 결과가 없습니다.`);
        }
    };

    const resSelected = reservoirs.find(r => r.id === activePoint);

    return (
        <div className="relative h-full w-full bg-slate-100 overflow-hidden font-sans">
            {/* Full Screen Map */}
            <div className="absolute inset-0 z-0">
                <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapUpdater center={mapCenter} />
                    {reservoirs.map((res: Reservoir) => (
                        <Marker
                            key={res.id}
                            position={[res.lat, res.lng]}
                            eventHandlers={{
                                click: () => {
                                    setMapCenter([res.lat, res.lng]);
                                    setActivePoint(res.id);
                                    setShowResultsList(false);
                                },
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Premium Header/Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-3 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    <div className="flex-1 bg-white rounded-full shadow-2xl flex items-center px-4 py-3 border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-sky-500/50">
                        <MapIcon className="text-sky-500 mr-3" size={20} />
                        <input
                            type="text"
                            placeholder="전국 저수지 및 포인트 검색"
                            className="flex-1 bg-transparent border-none outline-none text-slate-800 text-[15px] font-medium placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <div className="flex items-center gap-3 border-l border-slate-100 pl-3 ml-2">
                            <button onClick={handleSearch} className="text-slate-400 hover:text-sky-500">
                                <Search size={22} />
                            </button>
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Chips Layer */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
                    {[
                        { id: 'all', label: '전체', icon: <Layers size={14} /> },
                        { id: 'hot', label: '인기 포인트', icon: <Star size={14} /> },
                        { id: 'near', label: '내 주변', icon: <Navigation size={14} /> },
                        { id: 'weather', label: '날씨 추천', icon: <Cloud size={14} /> }
                    ].map(chip => (
                        <button key={chip.id} className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm whitespace-nowrap hover:bg-slate-50 transition-all active:scale-95">
                            {chip.icon}
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* DB Status integrated subtly */}
                <div className={`w-fit px-2 py-0.5 rounded-full border text-[9px] font-black tracking-widest uppercase pointer-events-auto shadow-sm ${dbStatus === 'connected' ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600 animate-pulse'
                    }`}>
                    {dbStatus === 'connected' ? '● LIVE DB' : '○ OFFLINE'}
                </div>
            </div>

            {/* Left Floating Weather Widget */}
            <div className="absolute top-48 left-4 z-[500] animate-fade-in pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl flex flex-col items-center gap-1 border border-white/50 pointer-events-auto">
                    <Cloud className="text-sky-400" size={28} />
                    <div className="text-sm font-black text-slate-800 leading-none">22°</div>
                    <div className="text-[10px] font-bold text-slate-400">맑음</div>
                </div>
            </div>

            {/* Right Multi-Layer Controls */}
            <div className="absolute top-48 right-4 z-[500] flex flex-col gap-3">
                <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <button className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><Layers size={20} /></button>
                    <button className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><Navigation size={20} /></button>
                    <button className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><Crosshair size={20} /></button>
                </div>
                <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <button className="p-3 text-slate-600 font-bold hover:bg-slate-50 transition-colors">+</button>
                    <button className="p-3 text-slate-600 font-bold hover:bg-slate-50 transition-colors">-</button>
                </div>
            </div>

            {/* Results Sidebar (Optional Slide-in) */}
            {showResultsList && !activePoint && (
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white z-[600] shadow-2xl border-r border-slate-200 flex flex-col animate-slide-in-right">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800">검색 결과 ({reservoirs.length})</h2>
                        <button onClick={() => setShowResultsList(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {reservoirs.map((res: Reservoir) => (
                            <div
                                key={res.id}
                                onClick={() => { setActivePoint(res.id); setMapCenter([res.lat, res.lng]); setShowResultsList(false); }}
                                className="bg-slate-50 hover:bg-sky-50 p-4 rounded-2xl border border-slate-200 hover:border-sky-200 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-slate-800 group-hover:text-sky-600">{res.name}</h3>
                                    <div className="bg-sky-500 text-white text-[10px] px-2 py-0.5 rounded-full">{res.aiScore}점</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Cloud size={12} /> {res.weather} • <Wind size={12} /> {res.wind}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Point Detail Sheet */}
            {resSelected && (
                <div className="absolute bottom-0 left-0 right-0 z-[700] animate-slide-up">
                    <div className="w-12 h-1.5 bg-slate-300/50 rounded-full mx-auto mb-3"></div>
                    <div className="bg-white rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-white p-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {resSelected.name}
                                    {resSelected.aiScore >= 90 && <span className="bg-amber-400 text-amber-900 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-black uppercase"><Star size={10} fill="currentColor" /> Premium</span>}
                                </h2>
                                <div className="flex items-center gap-2 mt-2 text-slate-500">
                                    <div className="flex text-amber-400">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" stroke="none" />)}
                                    </div>
                                    <span className="text-sm font-bold">4.9 (240 reviews) • Fishing Spot</span>
                                </div>
                            </div>
                            <button onClick={() => setActivePoint(null)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all">✕</button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform">
                                <Cloud className="text-blue-500" size={24} />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">날씨</span>
                                <span className="text-lg font-black text-slate-800">{resSelected.weather}</span>
                            </div>
                            <div className="bg-cyan-50/50 rounded-3xl p-5 border border-cyan-100 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform">
                                <Wind className="text-cyan-500" size={24} />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">바람</span>
                                <span className="text-lg font-black text-slate-800">{resSelected.wind}</span>
                            </div>
                            <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform">
                                <Droplets className="text-indigo-500" size={24} />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">수위</span>
                                <span className="text-lg font-black text-slate-800">{resSelected.waterLevel}</span>
                            </div>
                        </div>

                        {/* AI Score Feature */}
                        <div className={`p-6 rounded-[32px] border-2 flex flex-col gap-1 ${resSelected.aiScore >= 80 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                            <div className="flex justify-between items-center">
                                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">AI Fishing Probability</div>
                                <Fish size={20} className="animate-bounce" />
                            </div>
                            <div className="text-4xl font-black">{resSelected.aiScore}%</div>
                            <div className="text-sm font-bold mt-1">AI Recommendation: {resSelected.aiLabel}! {resSelected.aiScore >= 85 ? '출조 강력 추천 드립니다.' : '무난한 조과가 예상됩니다.'}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button className="flex-1 bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-slate-400 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <Navigation size={20} fill="currentColor" />
                                <span>길찾기 시작</span>
                            </button>
                            <button className="w-16 bg-white border-2 border-slate-200 rounded-[24px] flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all">
                                <Star size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
