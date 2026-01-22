import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        kakao: any;
    }
}

interface KakaoMapProps {
    center: { lat: number; lng: number };
    level?: number;
    style?: React.CSSProperties;
    markers?: Array<{ lat: number; lng: number; title?: string; onClick?: () => void }>;
    onMapClick?: (lat: number, lng: number) => void;
}

export default function KakaoMap({ center, level = 8, style, markers = [], onMapClick }: KakaoMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    // Wait for Kakao SDK to load
    useEffect(() => {
        const checkKakaoLoaded = setInterval(() => {
            if (window.kakao && window.kakao.maps) {
                setIsLoaded(true);
                clearInterval(checkKakaoLoaded);
            }
        }, 100);

        return () => clearInterval(checkKakaoLoaded);
    }, []);

    useEffect(() => {
        if (!mapContainer.current || !window.kakao || !isLoaded) return;

        const { kakao } = window;

        kakao.maps.load(() => {
            if (!mapContainer.current) return;

            const options = {
                center: new kakao.maps.LatLng(center.lat, center.lng),
                level: level
            };

            const map = new kakao.maps.Map(mapContainer.current, options);
            mapRef.current = map;
            setIsMapReady(true);

            // Add click event
            if (onMapClick) {
                kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
                    const latlng = mouseEvent.latLng;
                    onMapClick(latlng.getLat(), latlng.getLng());
                });
            }

            // Force layout update after a short delay to handle rendering race conditions
            setTimeout(() => {
                map.relayout();
            }, 100);
        });

        const handleResize = () => {
            if (mapRef.current) {
                mapRef.current.relayout();
                const moveLatLon = new kakao.maps.LatLng(center.lat, center.lng);
                mapRef.current.setCenter(moveLatLon);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isLoaded]);

    // Update center when it changes
    useEffect(() => {
        if (mapRef.current && window.kakao) {
            const { kakao } = window;
            const moveLatLon = new kakao.maps.LatLng(center.lat, center.lng);
            mapRef.current.panTo(moveLatLon);
        }
    }, [center.lat, center.lng]);

    // Update markers
    useEffect(() => {
        if (!mapRef.current || !window.kakao) return;

        const { kakao } = window;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach(markerData => {
            const markerPosition = new kakao.maps.LatLng(markerData.lat, markerData.lng);
            const marker = new kakao.maps.Marker({
                position: markerPosition,
                title: markerData.title || ''
            });

            marker.setMap(mapRef.current);

            if (markerData.onClick) {
                kakao.maps.event.addListener(marker, 'click', markerData.onClick);
            }

            markersRef.current.push(marker);
        });
    }, [markers, isMapReady]);

    return <div ref={mapContainer} style={{ width: '100%', height: '100%', ...style }} />;
}
