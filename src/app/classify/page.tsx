"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadImage } from "@/components/upload-image";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ClassifyPage() {
    const [tabKey, setTabKey] = useState(0);

    const handleReset = () => {
        try {
            setTabKey((prev) => prev + 1);
            toast.success("Berhasil mereset klasifikasi");
        } catch (err) {
            console.error(err);
            toast.error("Gagal mereset, silakan coba lagi");
        }
    };


    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 md:px-20 py-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Klasifikasi Sampah</h1>
                <p className="my-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                    Mulai klasifikasi sekarang. Pilih upload gambar atau ambil gambar secara <i>real-time</i> dengan Camera. <b>Login dahulu jika ingin menyimpan riwayat klasifikasi.</b>
                </p>

                <Tabs defaultValue="upload" className="w-full max-w-2xl">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="camera">Kamera</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                        <UploadImage key={`upload-${tabKey}`} />
                    </TabsContent>

                    <TabsContent value="camera">
                        <CameraCapture key={`camera-${tabKey}`} />
                    </TabsContent>
                </Tabs>

                {/* Global Reset dengan konfirmasi */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="mt-6 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Reset</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin mereset semua hasil klasifikasi? Aksi ini
                                akan menghapus gambar dan hasil yang sudah ditampilkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset}>
                                Ya, Reset
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>


        </div>
    );
}
