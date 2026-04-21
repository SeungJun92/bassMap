import { Anchor, Crown } from 'lucide-react';
import MyPoints from './components/MyPoints';
import RegisterPoint from './components/RegisterPoint';
import RecommendPoint from './components/RecommendPoint';
import WaterLevel from './components/WaterLevel';
import LandingPage from './components/LandingPage';
import Chat from './components/Chat';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

type Tab = 'my-points' | 'register' | 'recommend' | 'water-level' | 'landing' | 'chat';

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('landing');
    const [isPremium, setIsPremium] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Check if there are unread messages since last visit
        const checkUnreadMessages = async () => {
            const lastRead = localStorage.getItem('lastChatReadTime');
            if (!lastRead) {
                setHasNewMessage(true);
                return;
            }

            const { count, error } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastRead);

            if (!error && count && count > 0) {
                setHasNewMessage(true);
            }
        };

        checkUnreadMessages();

        // Listen for new chat messages for notification badge
        const chatChannel = supabase
            .channel('chat-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                () => {
                    if (window.location.hash !== '#chat' && activeTab !== 'chat') {
                        setHasNewMessage(true);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(chatChannel);
        };
    }, []); // Run only on mount

    useEffect(() => {
        if (activeTab === 'chat') {
            setHasNewMessage(false);
            localStorage.setItem('lastChatReadTime', new Date().toISOString());
        }
    }, [activeTab]);

    if (activeTab === 'landing') {
        return <LandingPage onGetStarted={() => setActiveTab('water-level')} session={session} hasNewMessage={hasNewMessage} />;
    }

    const header = (
        <header className="flex-none z-50 glass-panel !rounded-none !border-x-0 !border-t-0 p-3 border-b border-white/20 bg-slate-800/80">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
                    <Anchor className="text-sky-400" size={22} />
                    <h1 className="text-lg font-extrabold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent tracking-tight">
                        BassMap
                    </h1>
                </div>
                <button
                    onClick={() => setIsPremium(!isPremium)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${isPremium
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600'
                        }`}
                >
                    <Crown size={12} fill={isPremium ? "currentColor" : "none"} />
                    {isPremium ? '프리미엄' : '일반'}
                </button>
            </div>

            <nav className="flex gap-1.5 p-1 bg-slate-700/40 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('my-points')}
                    className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my-points'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    내 포인트
                </button>
                <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'register'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    포인트 등록
                </button>
                <button
                    onClick={() => setActiveTab('recommend')}
                    className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'recommend'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    포인트 추천
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all relative ${activeTab === 'chat'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    커뮤니티
                    {hasNewMessage && activeTab !== 'chat' && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900 animate-pulse" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('water-level')}
                    className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'water-level'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    수위 정보
                </button>
            </nav>
        </header>
    );

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
            {header}
            <main className="flex-1 relative overflow-hidden">
                {(activeTab === 'my-points' || activeTab === 'register' || activeTab === 'chat') && !session ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 animate-fade-in">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                            <Anchor className="text-sky-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">로그인이 필요합니다</h2>
                        <p className="text-slate-400 mb-8 max-w-xs text-sm leading-relaxed">
                            나만의 낚시 포인트를 안전하게 관리하려면 <br />
                            구글 계정으로 로그인해주세요.
                        </p>
                        <button
                            onClick={() => setActiveTab('landing')}
                            className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-400 transition-all active:scale-95"
                        >
                            로그인하러 가기
                        </button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'my-points' && (
                            <div className="h-full overflow-y-auto">
                                <MyPoints />
                            </div>
                        )}
                        {activeTab === 'register' && (
                            <div className="h-full overflow-y-auto">
                                <RegisterPoint isPremium={isPremium} />
                            </div>
                        )}
                        {activeTab === 'chat' && (
                            <div className="h-full">
                                <Chat />
                            </div>
                        )}
                        {activeTab === 'recommend' && (
                            <div className="h-full overflow-y-auto">
                                <RecommendPoint isPremium={isPremium} />
                            </div>
                        )}
                        {activeTab === 'water-level' && (
                            <div className="h-full overflow-y-auto">
                                <WaterLevel />
                            </div>
                        )}
                    </>
                )}
            </main>

            {activeTab !== 'water-level' && activeTab !== 'chat' && (
                <footer className="footer-content p-4 text-center text-xs text-slate-600 flex-none">
                    <p>&copy; 2024 BassMap. {isPremium ? 'Premium Features Unlocked' : 'Upgrade for AI Analysis'}</p>
                </footer>
            )}
        </div>
    );
}

export default App;
