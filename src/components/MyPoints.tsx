import { useState, useEffect } from 'react';
import { MapPin, Trash2, ChevronRight, ChevronDown, Calendar, Navigation, Info, Car, Droplets, Fish } from 'lucide-react';
import { supabase } from '../supabase';
import KakaoMap from './KakaoMap';

interface Point {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    cost: string;
    water_level: string;
    parking: string;
    rig: string;
    action: string;
    notes: string;
    created_at: string;
}

export default function MyPoints() {
    const [points, setPoints] = useState<Point[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPointId, setExpandedPointId] = useState<number | null>(null);
    const [navPoint, setNavPoint] = useState<Point | null>(null);

    const handleNavigation = (type: 'tmap' | 'kakao' | 'naver') => {
        if (!navPoint) return;

        const { lat, lng, name } = navPoint;
        let url = '';

        switch (type) {
            case 'tmap':
                // T Map URL Scheme
                url = `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
                break;
            case 'kakao':
                // Kakao Map Web/App Link
                url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
                break;
            case 'naver':
                // Naver Map URL Scheme
                url = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=bassmap`;
                // Fallback to web if needed implementation would be complex here, relying on scheme for now
                break;
        }

        window.open(url, '_blank');
        setNavPoint(null);
    };

    const fetchPoints = async () => {
        try {
            const { data, error } = await supabase
                .from('personal_points')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPoints(data || []);
        } catch (err) {
            console.error('Failed to fetch points:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const deletePoint = async (id: number) => {
        if (!confirm('정말로 이 포인트를 삭제하시겠습니까?')) return;
        try {
            const { error } = await supabase
                .from('personal_points')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setPoints(points.filter(p => p.id !== id));
            if (expandedPointId === id) setExpandedPointId(null);
        } catch (err) {
            console.error('Failed to delete point:', err);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Loading points...</div>;
    }

    return (
        <div className="p-4 animate-fade-in pb-24">
            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">내 포인트</h2>
                    <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">My Fishing Archives</p>
                </div>
                <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-white/10 shadow-lg">
                    <span className="text-xs font-black text-slate-300">{points.length} <span className="text-[9px] text-slate-500 ml-0.5">POINTS</span></span>
                </div>
            </div>

            {points.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center gap-4 bg-slate-800/20 border-dashed border-2 border-slate-700 rounded-3xl">
                    <div className="bg-slate-800 p-4 rounded-full text-slate-600">
                        <MapPin size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold">등록된 포인트가 없습니다.</p>
                        <p className="text-slate-600 text-xs mt-1">나만의 비밀 포인트를 등록해보세요!</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {points.map((point) => (
                        <div key={point.id} className={`group glass-panel border-white/5 transition-all duration-300 rounded-3xl relative overflow-hidden ${expandedPointId === point.id ? 'bg-slate-800/60 border-sky-500/30' : 'bg-slate-800/40 hover:border-white/10'}`}>

                            {/* Summary Header */}
                            <div
                                className="p-5 flex justify-between items-start cursor-pointer transition-all active:scale-[0.99]"
                                onClick={() => setExpandedPointId(expandedPointId === point.id ? null : point.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">
                                            {point.name}
                                        </h3>
                                        {expandedPointId === point.id ? <ChevronDown size={18} className="text-sky-500" /> : <ChevronRight size={18} className="text-slate-600" />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                            <MapPin size={10} className="text-sky-500" />
                                            {point.address || '주소 정보 없음'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                            <Calendar size={10} />
                                            {new Date(point.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => deletePoint(point.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500/60 hover:text-white hover:bg-red-500 transition-all rounded-xl border border-red-500/10"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedPointId === point.id && (
                                <div className="px-5 pb-5 animate-slide-up">
                                    <div className="h-[500px] rounded-2xl overflow-hidden border border-white/5 mb-5 shadow-inner">
                                        <KakaoMap
                                            center={{ lat: point.lat, lng: point.lng }}
                                            level={3}
                                            markers={[{ lat: point.lat, lng: point.lng }]}
                                        />
                                    </div>

                                    {/* Detailed Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 col-span-2">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <MapPin size={12} className="text-purple-400" /> 주소
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.address || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <Info size={12} className="text-yellow-400" /> 입어료
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.cost || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <Droplets size={12} className="text-sky-400" /> 수위
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.water_level || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <Car size={12} className="text-emerald-400" /> 주차
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.parking || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <Fish size={12} className="text-amber-400" /> 채비
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.rig || '-'}</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">
                                                <Navigation size={12} className="text-rose-400" /> 액션
                                            </div>
                                            <div className="text-sm font-bold text-slate-200">{point.action || '-'}</div>
                                        </div>
                                    </div>

                                    {point.notes && (
                                        <div className="bg-sky-500/5 p-4 rounded-2xl border border-sky-500/10 mb-4">
                                            <div className="flex items-center gap-2 text-[10px] text-sky-400 font-black uppercase tracking-wider mb-2">
                                                <Info size={12} /> 메모
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed italic">
                                                "{point.notes}"
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setNavPoint(point)}
                                        className="w-full py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-400 transition-all">
                                        <Navigation size={14} fill="currentColor" /> 길찾기 시작
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation Selection Modal */}
            {navPoint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setNavPoint(null)}>
                    <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-black text-white">길찾기 앱 선택</h3>
                            <p className="text-slate-400 text-xs mt-1">이동할 내비게이션 앱을 선택해주세요</p>
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
