import React from 'react';
import { Anchor, Map, Navigation, Shield, Zap, ChevronRight, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '../supabase';
import { Session } from '@supabase/supabase-js';

interface LandingPageProps {
    onGetStarted: () => void;
    session: Session | null;
    hasNewMessage?: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, session, hasNewMessage }) => {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Ensure we redirect back to the GitHub Pages subdirectory
                redirectTo: window.location.origin + '/bassMap/',
            }
        });
        if (error) console.error('Error logging in:', error.message);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-sky-500/30 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl bg-slate-900/60 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Anchor className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            BassMap
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-400 mr-6">
                            <a href="#features" className="hover:text-white transition-colors">주요 기능</a>
                            <a href="#stats" className="hover:text-white transition-colors">통계</a>
                        </div>

                        {session ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-white/10">
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-sky-500 flex items-center justify-center">
                                        {session.user.user_metadata.avatar_url ? (
                                            <img src={session.user.user_metadata.avatar_url} alt="User" />
                                        ) : (
                                            <User size={14} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-200">{session.user.user_metadata.full_name || session.user.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                    title="로그아웃"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGoogleLogin}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-white/10 relative"
                            >
                                <LogIn size={18} />
                                구글 로그인
                                {hasNewMessage && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
                                )}
                            </button>
                        )}
                    </div>


                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -z-10" />
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-8 animate-fade-in">
                                <Zap size={14} className="fill-current" />
                                <span>NEW: AI 기반 낚시 분석 엔진 탑재</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8">
                                낚시의 모든 것 <br />
                                <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">
                                    BassMap으로 완성하다
                                </span>
                            </h1>

                            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                물속 지형을 파악하고, 날씨 패턴을 분석하여 최적의 포인트를 찾아보세요. 프로 앵글러들의 노하우가 담긴 데이터를 경험할 수 있습니다.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={session ? onGetStarted : handleGoogleLogin}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-sky-500/30 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group relative"
                                >
                                    {session ? '지금 시작하기' : '구글로 시작하기'}
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    {hasNewMessage && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse shadow-lg shadow-red-500/50" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative w-full max-w-[600px]">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3] group">
                                <img
                                    src="/bassMap/hero-bass.png"
                                    alt="Bass Fishing Hero"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                                {/* Floating Card */}
                                <div className="absolute bottom-6 left-6 right-6 p-6 glass-panel animate-slide-up">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/40">
                                                <Map className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">현재 활성 포인트</p>
                                                <p className="text-xl font-black">충주호 (Chungju Lake)</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-400">활성도 92%</p>
                                            <p className="text-xs text-slate-400">최적의 조건</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-6 italic">진지한 앵글러를 위한 설계</h2>
                        <div className="w-24 h-1.5 bg-sky-500 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Navigation className="text-sky-400" />,
                                title: "정밀 지도 매핑",
                                desc: "나만의 냉장고 포인트를 미터 단위 정확도로 기록하고 수몰 나무, 돌바닥 등 상세 지형을 관리하세요."
                            },
                            {
                                icon: <Zap className="text-emerald-400" />,
                                title: "AI 조과 분석",
                                desc: "기압, 수온, 바람 데이터를 머신러닝으로 분석하여 배스의 이동 경로와 활성도를 예측합니다."
                            },
                            {
                                icon: <Shield className="text-purple-400" />,
                                title: "철저한 프라이버시",
                                desc: "나만의 포인트는 소중하니까. 종단간 암호화 기술로 당신의 데이터는 오직 당신만 볼 수 있습니다."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-slate-800/50 border border-white/5 hover:border-sky-500/30 transition-all hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="glass-panel p-12 lg:p-20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Anchor size={200} />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                            <div>
                                <p className="text-4xl lg:text-6xl font-black text-sky-400 mb-2">50k+</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Active Anglers</p>
                            </div>
                            <div>
                                <p className="text-4xl lg:text-6xl font-black text-emerald-400 mb-2">1.2M</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Points Marked</p>
                            </div>
                            <div>
                                <p className="text-4xl lg:text-6xl font-black text-sky-400 mb-2">98%</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Catch Accuracy</p>
                            </div>
                            <div>
                                <p className="text-4xl lg:text-6xl font-black text-emerald-400 mb-2">24/7</p>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Weather Data</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-slate-900">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <Anchor className="text-sky-500" size={20} />
                        <span className="font-black text-lg">BassMap</span>
                    </div>
                    <p className="text-slate-500 text-sm italic">
                        &copy; 2024 BassMap Engineering. Precision Fishing Technologies.
                    </p>
                    <div className="flex gap-6 text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
