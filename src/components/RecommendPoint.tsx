import { useState } from 'react';
import { Sparkles, Search, Loader2, MapPin, Navigation, Info, ExternalLink } from 'lucide-react';
import KakaoMap from './KakaoMap';
import { supabase } from '../supabase';
import { AI_RECOMMEND_CONFIG } from '../config/aiConfig';

interface RecommendedPoint {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    reason: string;
    score: number;
    tags: string[];
}

export default function RecommendPoint({ isPremium }: { isPremium: boolean }) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendedPoint[]>([]);
    const [mapPos, setMapPos] = useState({ lat: 37.5665, lng: 126.9780 });
    const [selectedPoint, setSelectedPoint] = useState<RecommendedPoint | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [navPoint, setNavPoint] = useState<RecommendedPoint | null>(null);
    const [noResultMsg, setNoResultMsg] = useState('');

    const handleNavigation = (type: 'tmap' | 'kakao' | 'naver') => {
        if (!navPoint) return;

        const { lat, lng, name } = navPoint;
        let url = '';

        switch (type) {
            case 'tmap':
                url = `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
                break;
            case 'kakao':
                url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
                break;
            case 'naver':
                url = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=bassmap`;
                break;
        }

        window.open(url, '_blank');
        setNavPoint(null);
    };

    const handleCurrentLocation = () => {
        if (!("geolocation" in navigator)) {
            alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapPos({ lat: latitude, lng: longitude });

                if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.coord2Address(longitude, latitude, (result: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK && result[0]) {
                            const fullAddr = result[0].road_address
                                ? result[0].road_address.address_name
                                : result[0].address.address_name;
                            setSearchKeyword(fullAddr);
                        }
                        setIsLocating(false);
                    });
                } else {
                    setIsLocating(false);
                }
            },
            () => setIsLocating(false),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleAIAnalyze = async () => {
        if (!searchKeyword.trim()) {
            alert('추천받고 싶은 지역이나 주소를 입력해주세요.');
            return;
        }

        setIsAnalyzing(true);
        setRecommendations([]);
        setSelectedPoint(null);
        setNoResultMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const projectUrl = (supabase as any).supabaseUrl;
            const anonKey = (supabase as any).supabaseKey;
            
            const response = await fetch(`${projectUrl}/functions/v1/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || anonKey}`,
                    'apikey': anonKey
                },
                body: JSON.stringify({ address: searchKeyword })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `서버 오류 (${response.status})`);
            }

            const results = result.recommendations || [];
            
            if (results.length > 0) {
                // [좌표 정밀 교정 로직 추가]
                // AI가 준 좌표를 그대로 믿지 않고, AI가 준 '주소'를 카카오 지도로 다시 검색하여 실제 좌표를 가져옵니다.
                const correctedResults = await Promise.all(results.map(async (point: RecommendedPoint) => {
                    return new Promise<RecommendedPoint>((resolve) => {
                        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                            const geocoder = new window.kakao.maps.services.Geocoder();
                            geocoder.addressSearch(point.address, (geoResult: any, status: any) => {
                                if (status === window.kakao.maps.services.Status.OK && geoResult[0]) {
                                    // 카카오 지도가 찾은 정확한 좌표로 갱신
                                    resolve({
                                        ...point,
                                        lat: parseFloat(geoResult[0].y),
                                        lng: parseFloat(geoResult[0].x)
                                    });
                                } else {
                                    // 주소 검색 실패 시 AI 좌표 유지
                                    resolve(point);
                                }
                            });
                        } else {
                            resolve(point);
                        }
                    });
                }));

                setRecommendations(correctedResults);
                setMapPos({ lat: correctedResults[0].lat, lng: correctedResults[0].lng });
                setSelectedPoint(correctedResults[0]);
            } else {
                setNoResultMsg(result.message || AI_RECOMMEND_CONFIG.noResultMsg);
            }
        } catch (err: any) {
            console.error('AI Recommend Error:', err);
            alert(`AI 추천 실패: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePointClick = (point: RecommendedPoint) => {
        setSelectedPoint(point);
        setMapPos({ lat: point.lat, lng: point.lng });
    };

    return (
        <div className="p-4 animate-fade-in pb-24 text-slate-200">
            {/* UI 부분은 동일하므로 생략하지 않고 그대로 유지 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Sparkles size={22} className="text-amber-400" />
                    AI 포인트 추천 (AI Recommend)
                </h2>
                {!isPremium && (
                    <div className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px] font-black italic">
                        PREMIUM
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                가고 싶은 지역의 주소를 입력하면 AI가 지형과 조과 데이터를 분석하여 <br />
                최적의 포인트 2곳을 추천해드립니다.
            </p>

            {/* Search Area */}
            <div className="glass-panel mb-6 p-2 flex gap-2 bg-slate-800/40 border-white/5 rounded-2xl shadow-xl">
                <div className="flex-1 flex items-center px-2">
                    <Search size={18} className="text-slate-500 mr-2" />
                    <input
                        type="text"
                        placeholder="주소 또는 지역 입력 (예: 용인시, 금광저수지)"
                        className="bg-transparent border-none outline-none text-white w-full py-2 text-sm"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAIAnalyze()}
                    />
                </div>
                <button
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600 transition-colors border border-white/10"
                >
                    {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} className="text-sky-400" />}
                </button>
            </div>

            <button
                onClick={handleAIAnalyze}
                disabled={isAnalyzing || !isPremium}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest mb-8 transition-all flex items-center justify-center gap-2 shadow-2xl ${
                    isPremium 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/20 active:scale-95' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        AI 분석 중...
                    </>
                ) : (
                    <>
                        <Sparkles size={18} />
                        AI 추천 시작하기
                    </>
                )}
            </button>

            {noResultMsg && (
                <div className="glass-panel p-8 text-center bg-slate-800/40 border-dashed border-2 border-slate-700 rounded-3xl animate-fade-in mb-8">
                    <Info className="text-slate-500 mx-auto mb-3" size={32} />
                    <p className="text-slate-300 font-bold mb-1">{noResultMsg}</p>
                    <p className="text-slate-500 text-xs">다른 지역이나 주소를 입력해보세요.</p>
                </div>
            )}

            {!isPremium && (
                <div className="glass-panel p-4 mb-8 bg-amber-500/5 border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <Info className="text-amber-500 shrink-0" size={20} />
                    <div>
                        <h4 className="text-amber-500 text-sm font-bold mb-1">프리미엄 전용 기능입니다</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            AI 추천 시스템은 프리미엄 회원에게만 제공됩니다. <br />
                            상단 프리미엄 버튼을 클릭하여 기능을 활성화해보세요.
                        </p>
                    </div>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="space-y-6 animate-slide-up">
                    <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl h-[300px]">
                        <KakaoMap
                            center={mapPos}
                            level={4}
                            markers={recommendations.map(p => ({ lat: p.lat, lng: p.lng }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {recommendations.map((point) => (
                            <div
                                key={point.id}
                                onClick={() => handlePointClick(point)}
                                className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer ${
                                    selectedPoint?.id === point.id
                                    ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                    : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white">{point.name}</h3>
                                            <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-bold">
                                                AI Score: {point.score}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} /> {point.address}
                                        </p>
                                    </div>
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => setNavPoint(point)}
                                            className="p-2 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-all border border-sky-500/20 flex items-center gap-1.5 px-3"
                                        >
                                            <Navigation size={14} fill="currentColor" />
                                            <span className="text-[11px] font-bold">길찾기</span>
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white transition-colors border border-white/5">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-900/50 rounded-xl mb-3">
                                    <p className="text-xs text-slate-300 leading-relaxed italic">
                                        "{point.reason}"
                                    </p>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {point.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded-lg border border-white/5">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Navigation Selection Modal */}
            {navPoint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setNavPoint(null)}>
                    <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-black text-white">길찾기 앱 선택</h3>
                            <p className="text-slate-400 text-xs mt-1">[{navPoint.name}] 포인트로 안내를 시작합니다</p>
                        </div>

                        <button onClick={() => handleNavigation('tmap')} className="w-full py-4 bg-[#000] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all border border-white/10">
                            <span className="text-red-500 font-black">T</span>
                            TMAP으로 안내
                        </button>

                        <button onClick={() => handleNavigation('kakao')} className="w-full py-4 bg-[#FEE500] text-[#191919] rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#FFE000] transition-all">
                            <Navigation size={18} fill="currentColor" />
                            카카오맵으로 안내
                        </button>

                        <button onClick={() => handleNavigation('naver')} className="w-full py-4 bg-[#2DB400] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#2abe00] transition-all">
                            <span className="font-black text-lg">N</span>
                            네이버지도로 안내
                        </button>

                        <button onClick={() => setNavPoint(null)} className="w-full py-3 text-slate-500 font-bold text-sm mt-2">
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
