"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Navigation, Phone, Clock, MapPin, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import { useWasteBanks } from "@/hooks/use-waste-banks";
import { useDebounce } from "@/hooks/use-debounce";
import type { WasteBank } from "@/types/waste-bank";

// Dynamically import the map to avoid SSR issues
const WasteBankMap = dynamic(() => import("@/components/waste-bank-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center">
            <p>Memuat peta...</p>
        </div>
    ),
});

export default function MapPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBank, setSelectedBank] = useState<WasteBank | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    // Debounce search query to reduce API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Memoize filters to prevent unnecessary re-renders
    const filters = useMemo(() => ({
        search: debouncedSearchQuery,
    }), [debouncedSearchQuery]);

    const { wasteBanks, loading, error } = useWasteBanks(filters);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        // Search is handled automatically by the hook
    }, []);

    const handleMarkerClick = useCallback((bank: WasteBank) => {
        setSelectedBank(bank);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedBank(null);
    }, []);

    // Memoize filtered banks calculation
    const filteredBanks = useMemo(() => {
        return wasteBanks.filter(bank => {
            if (activeFilter === "all") return true;
            if (!bank.typesAccepted) return false;
            return bank.typesAccepted.includes(activeFilter);
        });
    }, [wasteBanks, activeFilter]);

    // Memoize unique types calculation
    const uniqueTypes = useMemo(() => {
        const allTypes = wasteBanks.flatMap(bank => bank.typesAccepted || []);
        return Array.from(new Set(allTypes)).slice(0, 5);
    }, [wasteBanks]);

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 text-green-800">Peta Bank Sampah</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Temukan bank sampah terdekat di sekitar lokasi Anda.
                    Dukung lingkungan dengan mendaur ulang sampah dengan benar.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Cari Bank Sampah
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleSearch} className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama atau alamat bank sampah..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Cari
                                </Button>
                            </form>

                            {/* Filters */}
                            {uniqueTypes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Filter className="h-4 w-4" />
                                        Filter Jenis Sampah
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant={activeFilter === "all" ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => setActiveFilter("all")}
                                        >
                                            Semua
                                        </Badge>
                                        {uniqueTypes.map((type) => (
                                            <Badge
                                                key={type}
                                                variant={activeFilter === type ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => setActiveFilter(type)}
                                            >
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Count */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{filteredBanks.length}</p>
                                <p className="text-sm text-muted-foreground">Bank Sampah Ditemukan</p>
                                {activeFilter !== "all" && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Filter: {activeFilter}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Bank Details */}
                    {selectedBank ? (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{selectedBank.name}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearSelection}
                                        className="h-8 w-8 p-0"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                    <p className="text-sm">{selectedBank.address}</p>
                                </div>

                                {selectedBank.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${selectedBank.phone}`}
                                            className="text-sm hover:text-green-600 transition-colors"
                                        >
                                            {selectedBank.phone}
                                        </a>
                                    </div>
                                )}

                                {selectedBank.openingHours && (
                                    <div className="flex items-start gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                        <p className="text-sm">{selectedBank.openingHours}</p>
                                    </div>
                                )}

                                {selectedBank.typesAccepted && selectedBank.typesAccepted.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Jenis Sampah Diterima:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedBank.typesAccepted.map((type, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {type}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedBank.description && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Deskripsi:</p>
                                        <p className="text-sm text-muted-foreground">{selectedBank.description}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            // Action untuk arahkan ke Google Maps
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBank.latitude},${selectedBank.longitude}`;
                                            window.open(url, '_blank');
                                        }}
                                    >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Dapatkan Petunjuk Arah
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Bank List */
                        filteredBanks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Daftar Bank Sampah</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {filteredBanks.map((bank) => (
                                            <div
                                                key={bank.id}
                                                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                                                onClick={() => setSelectedBank(bank)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                                                        <MapPin className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-sm mb-1 group-hover:text-green-700">
                                                            {bank.name}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {bank.address}
                                                        </p>
                                                        {bank.phone && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                📞 {bank.phone}
                                                            </p>
                                                        )}
                                                        {bank.typesAccepted && bank.typesAccepted.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {bank.typesAccepted.slice(0, 2).map((type, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="bg-green-50 text-green-700 text-xs px-1.5 py-0.5 rounded"
                                                                    >
                                                                        {type}
                                                                    </span>
                                                                ))}
                                                                {bank.typesAccepted.length > 2 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{bank.typesAccepted.length - 2} lainnya
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>

                {/* Map */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-0">
                            <WasteBankMap
                                wasteBanks={filteredBanks}
                                onMarkerClick={handleMarkerClick}
                                height="600px"
                                showUserLocation={true}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <p>Memuat data bank sampah...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-12">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
                        <p className="text-destructive font-medium mb-2">Error</p>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                            Coba Lagi
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredBanks.length === 0 && searchQuery && (
                <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                        <p className="text-lg text-muted-foreground mb-4">
                            Tidak ada bank sampah yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
                        </p>
                        <Button
                            onClick={() => setSearchQuery("")}
                            variant="outline"
                        >
                            Tampilkan Semua
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}