import { ExternalLink, Droplets, Info, ShieldCheck, Map } from 'lucide-react';

export default function WaterLevel() {
    const handleOpenSite = () => {
        window.open('https://rawris-am.ekr.or.kr/wrms/', '_blank');
    };

    return (
        <div className="p-4 animate-fade-in pb-24 h-full flex flex-col">
            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">실시간 수위 정보</h2>
                    <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">RAWRIS Water Resources</p>
                </div>
                <div className="bg-sky-500/20 px-3 py-1 rounded-full border border-sky-500/30">
                    <span className="text-[10px] font-black text-sky-400 uppercase">OFFICIAL DATA</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {/* Info Card */}
                <div className="glass-panel p-6 bg-slate-800/40 border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <Droplets size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-sky-400 mb-4">
                            <Info size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">안내 사항</span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                            한국농어촌공사 <br />
                            농어촌용수종합정보시스템 (RAWRIS)
                        </h3>

                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            전국 저수지의 실시간 수위, 저수율 및 강수량 데이터를 제공하는 공식 포털입니다.
                            정확한 출조 계획을 위해 외부 시스템의 최신 데이터를 확인해 보세요.
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center text-sky-400">
                                    <Map size={12} />
                                </div>
                                전국 저수지 지도 기반 검색
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center text-emerald-400">
                                    <Droplets size={12} />
                                </div>
                                실시간 저수율 및 수위 변화량
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-300">
                                <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center text-purple-400">
                                    <ShieldCheck size={12} />
                                </div>
                                국가 공식 데이터를 통한 정확한 분석
                            </div>
                        </div>

                        <button
                            onClick={handleOpenSite}
                            className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-sky-500/20 hover:-translate-y-1 active:scale-95 transition-all"
                        >
                            공식 사이트 열기
                            <ExternalLink size={18} />
                        </button>
                    </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Safety Note</p>
                    <p className="text-xs text-amber-200/70 leading-relaxed italic">
                        "저수지 수위 정보는 안전한 낚시를 위한 중요한 지표입니다.
                        급격한 수위 변화가 예상될 때는 출조를 자제해 주세요."
                    </p>
                </div>
            </div>

            <div className="mt-auto pt-6 text-center">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                    Data provided by Korea Rural Community Corporation
                </p>
            </div>
        </div>
    );
}
