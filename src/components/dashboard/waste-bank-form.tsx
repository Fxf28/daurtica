"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, MapPin } from "lucide-react";
import { createWasteBank, updateWasteBank } from "@/lib/api/waste-banks";
import { toast } from "sonner";
import type { WasteBank, CreateWasteBank, UpdateWasteBank } from "@/types/waste-bank";

interface WasteBankFormProps {
    bank: WasteBank | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const DEFAULT_TYPES = [
    "Plastik",
    "Kertas",
    "Kaca",
    "Logam",
    "Elektronik",
    "Baterai",
    "Organik",
    "Tekstil",
];

export function WasteBankForm({ bank, onSuccess, onCancel }: WasteBankFormProps) {
    const [formData, setFormData] = useState<CreateWasteBank | UpdateWasteBank>({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        phone: "",
        email: "",
        website: "",
        openingHours: "",
        description: "",
        typesAccepted: [],
    });
    const [customType, setCustomType] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (bank) {
            setFormData({
                name: bank.name,
                address: bank.address,
                latitude: bank.latitude,
                longitude: bank.longitude,
                phone: bank.phone || "",
                email: bank.email || "",
                website: bank.website || "",
                openingHours: bank.openingHours || "",
                description: bank.description || "",
                typesAccepted: bank.typesAccepted || [],
            });
        }
    }, [bank]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (bank) {
                await updateWasteBank(bank.id, formData);
            } else {
                await createWasteBank(formData as CreateWasteBank);
            }
            onSuccess();
        } catch (error) {
            console.error("Form submission failed:", error);
            toast.error(`Gagal ${bank ? "memperbarui" : "membuat"} bank sampah`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = (type: string) => {
        if (!formData.typesAccepted?.includes(type)) {
            setFormData(prev => ({
                ...prev,
                typesAccepted: [...(prev.typesAccepted || []), type],
            }));
        }
    };

    const handleRemoveType = (typeToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            typesAccepted: prev.typesAccepted?.filter(type => type !== typeToRemove) || [],
        }));
    };

    const handleAddCustomType = () => {
        if (customType.trim() && !formData.typesAccepted?.includes(customType.trim())) {
            setFormData(prev => ({
                ...prev,
                typesAccepted: [...(prev.typesAccepted || []), customType.trim()],
            }));
            setCustomType("");
        }
    };

    const isFormValid = formData.name && formData.address && formData.latitude && formData.longitude;

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {bank ? "Edit Bank Sampah" : "Tambah Bank Sampah Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Bank Sampah *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Contoh: Bank Sampah Sejahtera"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telepon</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Contoh: 081234567890"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Alamat Lengkap *</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Masukkan alamat lengkap bank sampah"
                            required
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude *</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                placeholder="Contoh: -6.200000"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude *</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                placeholder="Contoh: 106.816666"
                                required
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Contoh: info@banksampah.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="Contoh: https://banksampah.com"
                            />
                        </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="space-y-2">
                        <Label htmlFor="openingHours">Jam Operasional</Label>
                        <Input
                            id="openingHours"
                            value={formData.openingHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                            placeholder="Contoh: Senin - Jumat: 08:00 - 17:00"
                        />
                    </div>

                    {/* Types Accepted */}
                    <div className="space-y-2">
                        <Label>Jenis Sampah yang Diterima</Label>

                        {/* Default Types */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {DEFAULT_TYPES.map((type) => (
                                <Badge
                                    key={type}
                                    variant={formData.typesAccepted?.includes(type) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        formData.typesAccepted?.includes(type)
                                            ? handleRemoveType(type)
                                            : handleAddType(type)
                                    }
                                >
                                    {type}
                                    {formData.typesAccepted?.includes(type) && (
                                        <X className="h-3 w-3 ml-1" />
                                    )}
                                </Badge>
                            ))}
                        </div>

                        {/* Custom Type */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Tambah jenis sampah lainnya..."
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomType();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddCustomType}
                                disabled={!customType.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Selected Types */}
                        {formData.typesAccepted && formData.typesAccepted.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-medium mb-2">Jenis yang dipilih:</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.typesAccepted.map((type) => (
                                        <Badge key={type} variant="secondary" className="flex items-center gap-1">
                                            {type}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveType(type)}
                                                className="hover:bg-muted rounded-full"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Deskripsi tambahan tentang bank sampah..."
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="flex-1"
                        >
                            {loading ? "Menyimpan..." : bank ? "Perbarui" : "Simpan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}