import { MapPin } from 'lucide-react';

export default function MyPoints() {
    // Mock data
    const points = [
        { id: 1, name: 'Best Bass Spot', address: '123 Lake Rd, Chungju', date: '2023-10-01' },
        { id: 2, name: 'Secret Cove', address: '456 River Side, Gapyeong', date: '2023-10-05' },
    ];

    return (
        <div className="flex flex-col gap-4 p-4 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">내 포인트 (My Points)</h2>
            <div className="flex flex-col gap-3">
                {points.map((point) => (
                    <div key={point.id} className="glass-panel flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold">{point.name}</h3>
                                <p className="text-sm text-slate-400">{point.address}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
