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
import { FramerLazyConfig, M } from "@/components/framer-wrapper"; // ✅ Import Lazy Wrapper
import { MapPageSkeleton } from "@/components/map-skeleton"; // ✅ Import Skeleton

// ✅ OPTIMASI: Pindahkan dynamic import ke luar component
// loading: tampilkan skeleton penuh, bukan cuma teks
const WasteBankMap = dynamic(() => import("@/components/waste-bank-map"), {
    ssr: false,
    loading: () => <div className="w-full h-[600px] bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Memuat Peta...</div>,
});

export default function MapPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBank, setSelectedBank] = useState<WasteBank | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const filters = useMemo(() => ({
        search: debouncedSearchQuery,
    }), [debouncedSearchQuery]);

    const { wasteBanks, loading, error } = useWasteBanks(filters);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
    }, []);

    const handleMarkerClick = useCallback((bank: WasteBank) => {
        setSelectedBank(bank);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedBank(null);
    }, []);

    const filteredBanks = useMemo(() => {
        return wasteBanks.filter(bank => {
            if (activeFilter === "all") return true;
            if (!bank.typesAccepted) return false;
            return bank.typesAccepted.includes(activeFilter);
        });
    }, [wasteBanks, activeFilter]);

    const uniqueTypes = useMemo(() => {
        const allTypes = wasteBanks.flatMap(bank => bank.typesAccepted || []);
        return Array.from(new Set(allTypes)).slice(0, 5);
    }, [wasteBanks]);

    // ✅ Render Skeleton saat data awal sedang dimuat
    // Ini mencegah layout shift drastis
    if (loading && wasteBanks.length === 0) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Peta Bank Sampah</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Mencari lokasi terdekat...
                    </p>
                </div>
                <MapPageSkeleton />
            </div>
        );
    }

    return (
        <FramerLazyConfig>
            <div className="container mx-auto py-8 px-4 min-h-screen">
                {/* Header dengan Lazy Motion */}
                <M.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Peta Bank Sampah</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Temukan bank sampah terdekat di sekitar lokasi Anda.
                        Dukung lingkungan dengan mendaur ulang sampah dengan benar.
                    </p>
                </M.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar */}
                    <M.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="lg:col-span-1 space-y-4 h-fit" // h-fit agar sticky bisa jalan jika perlu
                    >
                        {/* Search Card */}
                        <Card className="shadow-sm">
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
                                            placeholder="Cari nama / alamat..."
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
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Filter className="h-4 w-4" />
                                            Filter Jenis Sampah
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant={activeFilter === "all" ? "default" : "outline"}
                                                className="cursor-pointer hover:bg-primary/90"
                                                onClick={() => setActiveFilter("all")}
                                            >
                                                Semua
                                            </Badge>
                                            {uniqueTypes.map((type) => (
                                                <Badge
                                                    key={type}
                                                    variant={activeFilter === type ? "default" : "outline"}
                                                    className="cursor-pointer hover:bg-primary/90"
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
                        <M.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={filteredBanks.length} // Animate when number changes
                        >
                            <Card className="shadow-sm border-l-4 border-l-green-500">
                                <CardContent className="pt-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ditemukan</p>
                                        <p className="text-2xl font-bold text-green-600">{filteredBanks.length}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Bank Sampah</p>
                                        {activeFilter !== "all" && (
                                            <p className="text-xs font-medium text-green-600">Filter: {activeFilter}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </M.div>

                        {/* Selected Bank Details */}
                        {selectedBank ? (
                            <M.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="sticky top-4"
                            >
                                <Card className="border-green-200 bg-green-50/30">
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg text-green-800">{selectedBank.name}</CardTitle>
                                            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">×</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-3">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                                            <p className="text-sm">{selectedBank.address}</p>
                                        </div>
                                        {selectedBank.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-green-600" />
                                                <a href={`tel:${selectedBank.phone}`} className="text-sm hover:underline">{selectedBank.phone}</a>
                                            </div>
                                        )}
                                        {selectedBank.openingHours && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-green-600" />
                                                <p className="text-sm">{selectedBank.openingHours}</p>
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedBank.latitude},${selectedBank.longitude}`, '_blank')}
                                            >
                                                <Navigation className="h-4 w-4 mr-2" />
                                                Petunjuk Arah
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </M.div>
                        ) : (
                            /* Bank List (Scrollable) */
                            filteredBanks.length > 0 && (
                                <Card className="overflow-hidden shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Daftar Lokasi</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 scrollbar-thin">
                                            {filteredBanks.map((bank) => (
                                                <div
                                                    key={bank.id}
                                                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-all hover:border-green-300 group"
                                                    onClick={() => {
                                                        setSelectedBank(bank);
                                                        // Scroll to top on mobile
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-green-100 p-1.5 rounded group-hover:bg-green-200 transition-colors">
                                                            <MapPin className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm group-hover:text-green-700">{bank.name}</h3>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{bank.address}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </M.div>

                    {/* Map Area */}
                    <M.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="shadow-md overflow-hidden h-full border-0">
                            <CardContent className="p-0 h-[600px] relative">
                                <WasteBankMap
                                    wasteBanks={filteredBanks}
                                    onMarkerClick={handleMarkerClick}
                                    height="100%"
                                    showUserLocation={true}
                                />
                            </CardContent>
                        </Card>
                    </M.div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-8">
                        <p className="text-destructive mb-2">{error}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>Muat Ulang</Button>
                    </div>
                )}
            </div>
        </FramerLazyConfig>
    );
}