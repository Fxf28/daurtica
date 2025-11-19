"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { WasteBank } from "@/types/waste-bank";
import { useGeolocation } from "@/hooks/use-geolocation";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const wasteBankIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface WasteBankMapProps {
    wasteBanks: WasteBank[];
    onMarkerClick?: (bank: WasteBank) => void;
    height?: string;
    showUserLocation?: boolean;
}

// Component to handle map view updates
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);

    return null;
}

export default function WasteBankMap({
    wasteBanks,
    onMarkerClick,
    height = "500px",
    showUserLocation = true
}: WasteBankMapProps) {
    const { latitude, longitude, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2, 106.8]); // Default to Jakarta
    const [mapZoom, setMapZoom] = useState(10);
    const mapRef = useRef<L.Map | null>(null);

    // Update map center when user location is available
    useEffect(() => {
        if (latitude && longitude) {
            setMapCenter([latitude, longitude]);
            setMapZoom(13);
        }
    }, [latitude, longitude]);

    const handleLocationRefresh = () => {
        getCurrentLocation();
    };

    const handleMarkerClick = (bank: WasteBank) => {
        if (onMarkerClick) {
            onMarkerClick(bank);
        }
    };

    // Jika peta belum bisa di-load (karena SSR), tampilkan placeholder
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div
                className="w-full bg-muted rounded-lg flex items-center justify-center"
                style={{ height }}
            >
                <p>Memuat peta...</p>
            </div>
        );
    }

    return (
        <div className="w-full relative" style={{ height }}>
            {/* Location Status */}
            {locationLoading && (
                <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg border">
                    <p className="text-sm font-medium">Mendeteksi lokasi...</p>
                </div>
            )}

            {locationError && (
                <div className="absolute top-4 left-4 z-[1000] bg-yellow-50 border border-yellow-200 p-3 rounded-lg shadow-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-1">Tidak dapat mengakses lokasi</p>
                    <p className="text-xs text-yellow-600 mb-2">{locationError}</p>
                    <button
                        onClick={handleLocationRefresh}
                        className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                    >
                        Coba lagi
                    </button>
                </div>
            )}

            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                ref={mapRef}
            >
                <MapController center={mapCenter} zoom={mapZoom} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location Marker */}
                {showUserLocation && latitude && longitude && (
                    <Marker position={[latitude, longitude]} icon={userIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong>Lokasi Anda</strong>
                                <br />
                                <small className="text-gray-600">
                                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                                </small>
                                <br />
                                <button
                                    onClick={handleLocationRefresh}
                                    className="text-xs text-blue-600 underline mt-1"
                                >
                                    Perbarui lokasi
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Waste Bank Markers */}
                {wasteBanks.map((bank) => {
                    const bankLat = parseFloat(bank.latitude);
                    const bankLng = parseFloat(bank.longitude);

                    if (isNaN(bankLat) || isNaN(bankLng)) {
                        console.warn(`Invalid coordinates for bank ${bank.name}:`, bank.latitude, bank.longitude);
                        return null;
                    }

                    return (
                        <Marker
                            key={bank.id}
                            position={[bankLat, bankLng]}
                            icon={wasteBankIcon}
                            eventHandlers={{
                                click: () => handleMarkerClick(bank),
                            }}
                        >
                            <Popup>
                                <div className="min-w-[200px] max-w-[300px]">
                                    <h3 className="font-bold text-lg mb-2 text-green-700">{bank.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{bank.address}</p>

                                    {bank.phone && (
                                        <p className="text-sm mb-1">
                                            <strong className="text-gray-700">Telepon:</strong> {bank.phone}
                                        </p>
                                    )}

                                    {bank.openingHours && (
                                        <p className="text-sm mb-1">
                                            <strong className="text-gray-700">Jam Operasional:</strong> {bank.openingHours}
                                        </p>
                                    )}

                                    {bank.typesAccepted && bank.typesAccepted.length > 0 && (
                                        <div className="mt-3">
                                            <strong className="text-sm text-gray-700">Jenis Sampah Diterima:</strong>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {bank.typesAccepted.map((type, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                                                    >
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {onMarkerClick && (
                                        <button
                                            onClick={() => handleMarkerClick(bank)}
                                            className="mt-3 w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Lihat Detail
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}