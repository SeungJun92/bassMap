import { useState } from 'react';
import { Anchor, Crown } from 'lucide-react';
import MyPoints from './components/MyPoints';
import RegisterPoint from './components/RegisterPoint';
import SearchPoints from './components/SearchPoints';

type Tab = 'my-points' | 'register' | 'search';

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('my-points');
    const [isPremium, setIsPremium] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 p-4 pb-2 border-b border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Anchor className="text-accent" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            BassMap
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsPremium(!isPremium)}
                        className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all ${isPremium
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                    >
                        <Crown size={12} fill={isPremium ? "currentColor" : "none"} />
                        {isPremium ? 'PREMIUM USER' : 'BASIC USER'}
                    </button>
                </div>

                {/* Top Tabs */}
                <nav className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('my-points')}
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-points' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        내 포인트
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'register' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        포인트 등록
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        검색
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto">
                {activeTab === 'my-points' && <MyPoints />}
                {activeTab === 'register' && <RegisterPoint isPremium={isPremium} />}
                {activeTab === 'search' && <SearchPoints isPremium={isPremium} />}
            </main>

            {/* Tab Context Info (Optional Footer for explanation) */}
            <footer className="p-4 text-center text-xs text-slate-600">
                <p>&copy; 2024 BassMap. {isPremium ? 'Premium Features Unlocked' : 'Upgrade for AI Analysis'}</p>
            </footer>
        </div>
    );
}

export default App;
