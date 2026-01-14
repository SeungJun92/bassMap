import React, { useState, useEffect } from 'react';
import { Star, Search, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icon fix using CDN to avoid build errors
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, setAddress }: { position: [number, number], setPosition: (pos: [number, number]) => void, setAddress: (addr: string) => void }) {
    useMapEvents({
        async click(e) {
            const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
            setPosition(newPos);

            // Reverse Geocoding using OSM Nominatim
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
                const data = await response.json();
                if (data && data.display_name) {
                    setAddress(data.display_name);
                }
            } catch (err) {
                console.error('Failed to fetch address:', err);
            }
        },
    });
    return <Marker position={position} />;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

export default function RegisterPoint({ isPremium }: { isPremium: boolean }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        lat: 37.5665,
        lng: 126.9780,
        cost: '',
        water_level: '',
        rig: '',
        action: '',
        parking: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mapPos, setMapPos] = useState<[number, number]>([37.5665, 126.9780]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setFormData(prev => ({ ...prev, lat: mapPos[0], lng: mapPos[1] }));
    }, [mapPos]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'lat' || name === 'lng') ? parseFloat(value) : value
        }));
        if (name === 'lat' || name === 'lng') {
            const val = parseFloat(value);
            if (!isNaN(val)) {
                setMapPos(name === 'lat' ? [val, mapPos[1]] : [mapPos[0], val]);
            }
        }
    };

    const handleReservoirSearch = async () => {
        if (!searchKeyword.trim()) return;
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('reservoirs')
                .select('*')
                .ilike('name', `%${searchKeyword}%`)
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                const res = data[0];
                setMapPos([parseFloat(res.lat), parseFloat(res.lng)]);
                setFormData(prev => ({ ...prev, address: res.name }));
            } else {
                alert('해당 이름의 저수지를 찾을 수 없습니다.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert('포인트 이름을 입력해주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('personal_points')
                .insert([formData]);

            if (error) throw error;

            alert('포인트가 등록되었습니다!');
            setFormData({
                name: '',
                address: '',
                lat: 37.5665,
                lng: 126.9780,
                cost: '',
                water_level: '',
                rig: '',
                action: '',
                parking: '',
                notes: ''
            });
        } catch (err: any) {
            console.error(err);
            alert(`등록에 실패했습니다: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 animate-fade-in pb-24 text-slate-200">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                포인트 등록 (Register)
            </h2>

            {/* Search Reservoir */}
            <div className="glass-panel mb-4 p-2 flex gap-2 bg-slate-800/40 border-white/5 rounded-xl">
                <input
                    type="text"
                    placeholder="저수지명 검색으로 위치 찾기"
                    className="bg-transparent border-none outline-none text-white w-full p-2 text-sm"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReservoirSearch()}
                />
                <button
                    onClick={handleReservoirSearch}
                    disabled={isSearching}
                    className="btn-primary rounded-lg px-4 py-1.5 flex items-center justify-center min-w-[80px]"
                >
                    {isSearching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                </button>
            </div>

            {/* Real Map */}
            <div className="mb-6 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl z-0 h-[250px]">
                <MapContainer
                    center={mapPos}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapUpdater center={mapPos} />
                    <LocationMarker
                        position={mapPos}
                        setPosition={setMapPos}
                        setAddress={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                    />
                </MapContainer>
                <div className="p-2 bg-slate-800/80 text-[10px] text-center text-slate-400 border-t border-slate-700">
                    지도를 클릭하여 핀의 위치를 지정할 수 있습니다.
                </div>
            </div>

            {/* Basic Info */}
            <div className="flex flex-col gap-4 mb-6">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">기본 정보 (Basic)</h3>
                <input
                    name="name"
                    placeholder="포인트 이름 (Point Name)"
                    className="glass-panel w-full text-white p-3 bg-slate-800/40 border-slate-700/50 focus:border-sky-500/50 transition-all outline-none rounded-xl"
                    value={formData.name}
                    onChange={handleChange}
                />
                <div className="relative group">
                    <input
                        name="address"
                        placeholder="주소 (Address)"
                        className="glass-panel w-full text-white p-3 pr-12 bg-slate-800/40 border-slate-700/50 focus:border-sky-500/50 transition-all outline-none rounded-xl"
                        value={formData.address}
                        onChange={handleChange}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 ml-1">위도 (Lat)</label>
                        <input
                            name="lat"
                            type="number"
                            step="0.000001"
                            className="glass-panel w-full text-white p-2.5 bg-slate-800/40 border-slate-700/50 outline-none rounded-xl text-sm"
                            value={formData.lat}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 ml-1">경도 (Lng)</label>
                        <input
                            name="lng"
                            type="number"
                            step="0.000001"
                            className="glass-panel w-full text-white p-2.5 bg-slate-800/40 border-slate-700/50 outline-none rounded-xl text-sm"
                            value={formData.lng}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <input
                    name="cost"
                    placeholder="입어료 (Admission Fee)"
                    className="glass-panel w-full text-white p-3 bg-slate-800/40 border-slate-700/50 outline-none rounded-xl"
                    value={formData.cost}
                    onChange={handleChange}
                />
            </div>

            {/* Premium Info */}
            <div className="flex flex-col gap-4 relative mb-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs uppercase tracking-widest text-amber-500 font-extrabold flex items-center gap-1.5">
                        <Star size={14} fill="currentColor" /> 프리미엄 정보 (Premium)
                    </h3>
                    {!isPremium && (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <span className="text-[10px] font-black italic">PRO</span>
                        </div>
                    )}
                </div>

                <div className={`space-y-4 p-4 rounded-2xl bg-slate-800/20 border border-white/5 ${!isPremium ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">수위 (Water Level)</label>
                            <input name="water_level" value={formData.water_level} onChange={handleChange} placeholder="75%" className="glass-panel w-full text-white p-2.5 bg-slate-900/50 border-white/5 outline-none rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">주차 (Parking)</label>
                            <input name="parking" value={formData.parking} onChange={handleChange} placeholder="가능" className="glass-panel w-full text-white p-2.5 bg-slate-900/50 border-white/5 outline-none rounded-xl text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">추천 채비 (Recommended Rig)</label>
                        <input name="rig" value={formData.rig} onChange={handleChange} placeholder="프리리그, 네꼬리그" className="glass-panel w-full text-white p-2.5 bg-slate-900/50 border-white/5 outline-none rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">액션 (Action)</label>
                        <input name="action" value={formData.action} onChange={handleChange} placeholder="슬로우 리트리브" className="glass-panel w-full text-white p-2.5 bg-slate-900/50 border-white/5 outline-none rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">비고 (Notes)</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="포인트 상세 설명..." className="glass-panel w-full text-white p-3 bg-slate-900/50 border-white/5 h-24 resize-none outline-none rounded-xl text-sm" />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : '포인트 등록 완료 (Save Point)'}
            </button>
        </div>
    );
}
