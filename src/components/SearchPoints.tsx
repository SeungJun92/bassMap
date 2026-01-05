import { useState } from 'react';
import { Search, Wind, Droplets, Users, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Component to handle map flyTo
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, 13);
    return null;
}

export default function SearchPoints({ isPremium }: { isPremium: boolean }) {
    const [activePoint, setActivePoint] = useState<number | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([36.5, 127.8]); // Default center (Korea)
    const [searchQuery, setSearchQuery] = useState('');

    // Extended Mock Data with Coordinates
    const reservoirs = [
        { id: 1, name: '충주호 (제일钓)', lat: 37.0055, lng: 128.0261, weather: '흐림', wind: '2m/s', waterLevel: '72%', liveUsers: 12, aiScore: 92, aiColor: 'text-green-400', aiLabel: '매우 좋음' },
        { id: 2, name: '안동호 (주진교)', lat: 36.6366, lng: 128.8465, weather: '비', wind: '5m/s', waterLevel: '65%', liveUsers: 3, aiScore: 45, aiColor: 'text-red-400', aiLabel: '나쁨' },
        { id: 3, name: '대청호 (문의)', lat: 36.4674, lng: 127.4851, weather: '맑음', wind: '1m/s', waterLevel: '80%', liveUsers: 8, aiScore: 85, aiColor: 'text-green-400', aiLabel: '좋음' },
        { id: 4, name: '평택호 (당거리)', lat: 36.9537, lng: 126.9741, weather: '맑음', wind: '3m/s', waterLevel: '90%', liveUsers: 25, aiScore: 78, aiColor: 'text-yellow-400', aiLabel: '보통' },
        { id: 5, name: '삽교호 (운정)', lat: 36.8647, lng: 126.8378, weather: '흐림', wind: '4m/s', waterLevel: '88%', liveUsers: 15, aiScore: 60, aiColor: 'text-yellow-400', aiLabel: '보통' },
        { id: 6, name: '예당지 (대회장)', lat: 36.6578, lng: 126.7725, weather: '맑음', wind: '2m/s', waterLevel: '75%', liveUsers: 30, aiScore: 88, aiColor: 'text-green-400', aiLabel: '좋음' },
        { id: 7, name: '낙동강 (강정고령보)', lat: 35.8457, lng: 128.4687, weather: '구름많음', wind: '1m/s', waterLevel: '60%', liveUsers: 5, aiScore: 70, aiColor: 'text-yellow-400', aiLabel: '보통' },
        { id: 8, name: '춘천호 (고탄)', lat: 37.9739, lng: 127.6894, weather: '맑음', wind: '0m/s', waterLevel: '82%', liveUsers: 2, aiScore: 95, aiColor: 'text-green-400', aiLabel: '최고' },
        { id: 9, name: '장성호 (슬로프)', lat: 35.3585, lng: 126.7645, weather: '비', wind: '6m/s', waterLevel: '95%', liveUsers: 0, aiScore: 30, aiColor: 'text-red-400', aiLabel: '매우 나쁨' },
        { id: 10, name: '합천호 (봉산)', lat: 35.6173, lng: 128.0202, weather: '흐림', wind: '2m/s', waterLevel: '55%', liveUsers: 7, aiScore: 82, aiColor: 'text-green-400', aiLabel: '좋음' }
    ];

    const handleSearch = () => {
        const found = reservoirs.find(r => r.name.includes(searchQuery));
        if (found) {
            setMapCenter([found.lat, found.lng]);
            setActivePoint(found.id);
        } else {
            alert('검색 결과가 없습니다.');
        }
    };

    return (
        <div className="relative h-full w-full bg-slate-900">
            {/* Map Container */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} />
                    {reservoirs.map((res) => (
                        <Marker
                            key={res.id}
                            position={[res.lat, res.lng]}
                            eventHandlers={{
                                click: () => {
                                    setMapCenter([res.lat, res.lng]);
                                    setActivePoint(res.id);
                                },
                            }}
                        >
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Overlay Search Bar */}
            <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2">
                <div className="glass-panel flex-1 flex items-center gap-2 px-3 py-2 shadow-xl bg-slate-900/80 backdrop-blur-md">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="지역명 또는 저수지 검색 (예: 충주호)"
                        className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button onClick={handleSearch} className="glass-panel p-2 bg-accent text-slate-900 shadow-xl flex items-center justify-center rounded-xl">
                    <Navigation size={20} fill="currentColor" />
                </button>
            </div>

            {/* Bottom Sheet Detail */}
            {activePoint && (() => {
                const res = reservoirs.find(r => r.id === activePoint);
                if (!res) return null;
                return (
                    <div className="absolute bottom-4 left-4 right-4 z-[500] animate-fade-in">
                        <div className="glass-panel p-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl relative">
                            <button
                                onClick={() => setActivePoint(null)}
                                className="absolute top-2 right-2 text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        {res.name}
                                        {isPremium && res.liveUsers > 0 && (
                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                {res.liveUsers}명
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-400">GPS: {res.lat.toFixed(4)}, {res.lng.toFixed(4)}</p>
                                </div>
                                <div className="text-right">
                                    {isPremium ? (
                                        <div className={`font-black text-xl ${res.aiColor}`}>{res.aiScore}점</div>
                                    ) : (
                                        <div className="text-xs text-slate-500">? 점</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center">
                                    <span className="text-slate-400">날씨</span>
                                    <span className="font-bold mt-1">{res.weather}</span>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center">
                                    <span className="text-slate-400">바람</span>
                                    <span className="font-bold mt-1">{res.wind}</span>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded flex flex-col items-center">
                                    <span className="text-slate-400">수위</span>
                                    <span className="font-bold mt-1">{res.waterLevel}</span>
                                </div>
                            </div>

                            {isPremium ? (
                                <div className={`text-xs font-bold p-2 text-center rounded border ${res.aiScore >= 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                        res.aiScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                            'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                    AI 분석: {res.aiLabel} (출조 추천!)
                                </div>
                            ) : (
                                <button className="w-full py-2 text-xs bg-slate-800 text-slate-400 rounded border border-dashed border-slate-600">
                                    🔒 프리미엄: 상세 AI 분석 보기
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
