import React, { useState } from 'react';
import { MapPin, Camera, Star } from 'lucide-react';

export default function RegisterPoint({ isPremium }: { isPremium: boolean }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cost: '',
        waterLevel: '',
        rig: '',
        action: '',
        parking: '',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-4 animate-fade-in pb-24">
            <h2 className="text-xl font-bold mb-4">포인트 등록 (Register)</h2>

            {/* Search Reservoir */}
            <div className="glass-panel mb-4 p-2 flex gap-2">
                <input
                    type="text"
                    placeholder="저수지명 검색 (Search Reservoir)"
                    className="bg-transparent border-none outline-none text-white w-full p-2"
                />
                <button className="btn-primary rounded-lg px-4">Search</button>
            </div>

            {/* Map Placeholder */}
            <div className="glass-panel h-48 mb-6 flex items-center justify-center bg-slate-800/50 border-dashed border-2 border-slate-600 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/127.0,37.5,9,0/600x400?access_token=YOUR_TOKEN')] bg-cover opacity-50"></div>
                <div className="z-10 flex flex-col items-center text-slate-400 group-hover:text-sky-400 transition-colors cursor-pointer">
                    <MapPin size={32} />
                    <span className="text-sm">지도에서 핀으로 지정 (Pin on Map)</span>
                </div>
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-4 mb-6">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold">기본 정보 (Basic)</h3>
                <input name="address" placeholder="주소 (Address)" className="glass-panel w-full text-white" onChange={handleChange} />
                <input name="cost" placeholder="입어료 (Admission Fee)" className="glass-panel w-full text-white" onChange={handleChange} />
            </div>

            {/* Premium Info */}
            <div className="flex flex-col gap-4 relative">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm uppercase tracking-wider text-amber-500 font-bold flex items-center gap-2">
                        <Star size={16} fill="currentColor" /> 프리미엄 정보 (Premium)
                    </h3>
                    {!isPremium && <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">Locked</span>}
                </div>

                <div className={`flex flex-col gap-4 ${!isPremium ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="waterLevel" placeholder="수위 (Water Level)" className="glass-panel w-full text-white" />
                        <input name="parking" placeholder="주차 (Parking)" className="glass-panel w-full text-white" />
                    </div>
                    <input name="rig" placeholder="채비 (Rig / Lure)" className="glass-panel w-full text-white" />
                    <input name="action" placeholder="액션 (Action)" className="glass-panel w-full text-white" />
                    <textarea name="notes" placeholder="비고 (Notes)" className="glass-panel w-full text-white h-24 resize-none" />
                </div>
            </div>

            <button className="btn btn-primary w-full mt-8">등록하기 (Register)</button>
        </div>
    );
}
