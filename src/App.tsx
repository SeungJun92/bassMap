import { useState } from 'react';
import { Anchor, Crown } from 'lucide-react';
import MyPoints from './components/MyPoints';
import RegisterPoint from './components/RegisterPoint';
import SearchPoints from './components/SearchPoints';

type Tab = 'my-points' | 'register' | 'search';

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('search');
    const [isPremium, setIsPremium] = useState(true);

    const header = (
        <header className="flex-none z-50 glass-panel !rounded-none !border-x-0 !border-t-0 p-3 border-b border-white/20 bg-slate-800/80">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
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

            <nav className="flex gap-1.5 p-1 bg-slate-700/40 rounded-xl border border-white/5">
                <button
                    onClick={() => setActiveTab('my-points')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'my-points'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    내 포인트
                </button>
                <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'register'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    포인트 등록
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'search'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                >
                    검색
                </button>
            </nav>
        </header>
    );

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
            {header}
            <main className="flex-1 relative overflow-hidden">
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
                {activeTab === 'search' && (
                    <div className="absolute inset-0">
                        <SearchPoints />
                        {/* Floating back button to return to categories/menu if needed */}
                        <button
                            onClick={() => setActiveTab('my-points')}
                            className="absolute top-24 left-4 z-[600] bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <Anchor size={20} />
                        </button>
                    </div>
                )}
            </main>

            {activeTab !== 'search' && (
                <footer className="footer-content p-4 text-center text-xs text-slate-600 flex-none">
                    <p>&copy; 2024 BassMap. {isPremium ? 'Premium Features Unlocked' : 'Upgrade for AI Analysis'}</p>
                </footer>
            )}
        </div>
    );
}

export default App;
