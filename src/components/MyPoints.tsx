import { useState, useEffect } from 'react';
import { MapPin, Trash2, Edit2, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '../supabase';

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
                        <div key={point.id} className="group glass-panel p-4 bg-slate-800/40 border-white/5 hover:border-sky-500/30 transition-all duration-300 rounded-2xl relative overflow-hidden active:scale-[0.98]">
                            {/* Decorative background accent */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 blur-3xl group-hover:bg-sky-500/10 transition-all"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors flex items-center gap-2">
                                        {point.name}
                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-900/50 px-2 py-0.5 rounded-md border border-white/5">
                                            <MapPin size={10} className="text-sky-500" />
                                            {point.address || '주소 정보 없음'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                            <Calendar size={10} />
                                            {new Date(point.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {point.notes && (
                                        <p className="text-xs text-slate-500 mt-3 line-clamp-1 italic">
                                            "{point.notes}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {/* TODO: Implement Edit Modal */ }}
                                        className="p-2.5 bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600 transition-all rounded-xl border border-white/5 shadow-inner"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deletePoint(point.id)}
                                        className="p-2.5 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 transition-all rounded-xl border border-red-500/20 shadow-lg shadow-red-500/5"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
