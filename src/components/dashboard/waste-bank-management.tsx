"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useWasteBanks } from "@/hooks/use-waste-banks";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteWasteBank } from "@/lib/api/waste-banks";
import { toast } from "sonner";
import type { WasteBank } from "@/types/waste-bank";
import { WasteBankForm } from "@/components/dashboard/waste-bank-form";

export function WasteBankManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingBank, setEditingBank] = useState<WasteBank | null>(null);

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Memoize filters
    const filters = useMemo(() => ({
        search: debouncedSearchQuery,
    }), [debouncedSearchQuery]);

    const { wasteBanks, loading, error, refetch } = useWasteBanks(filters);

    const handleCreate = useCallback(() => {
        setEditingBank(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((bank: WasteBank) => {
        setEditingBank(bank);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (bank: WasteBank) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus bank sampah "${bank.name}"?`)) {
            return;
        }

        try {
            await deleteWasteBank(bank.id);
            toast.success("Bank sampah berhasil dihapus");
            refetch();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Gagal menghapus bank sampah");
        }
    }, [refetch]);

    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingBank(null);
        refetch();
        toast.success(editingBank ? "Bank sampah berhasil diperbarui" : "Bank sampah berhasil dibuat");
    }, [editingBank, refetch]);

    const handleFormCancel = useCallback(() => {
        setShowForm(false);
        setEditingBank(null);
    }, []);

    // Memoize bank list items untuk prevent unnecessary re-renders
    const bankListItems = useMemo(() => {
        return wasteBanks.map((bank) => (
            <div key={bank.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-lg">{bank.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {bank.address}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={bank.isActive ? "default" : "secondary"}>
                                            {bank.isActive ? "Aktif" : "Nonaktif"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    {bank.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            <span>{bank.phone}</span>
                                        </div>
                                    )}
                                    {bank.email && (
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            <span>{bank.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{bank.latitude}, {bank.longitude}</span>
                                    </div>
                                </div>

                                {bank.openingHours && (
                                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{bank.openingHours}</span>
                                    </div>
                                )}

                                {bank.typesAccepted && bank.typesAccepted.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {bank.typesAccepted.map((type, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(bank)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(bank)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        ));
    }, [handleDelete, handleEdit, wasteBanks]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Daftar Bank Sampah</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Kelola data bank sampah yang ditampilkan di peta
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Bank Sampah
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari bank sampah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <p>Memuat data bank sampah...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={refetch} variant="outline">
                                Coba Lagi
                            </Button>
                        </div>
                    ) : wasteBanks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg text-muted-foreground mb-4">
                                    {searchQuery ? "Tidak ada bank sampah yang sesuai dengan pencarian" : "Belum ada bank sampah"}
                                </p>
                                <Button onClick={handleCreate}>
                                    Tambah Bank Sampah Pertama
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {bankListItems}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Modal */}
            {showForm && (
                <WasteBankForm
                    bank={editingBank}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            )}
        </div>
    );
}