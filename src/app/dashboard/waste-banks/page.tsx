import { AdminGuard } from "@/components/admin-guard";
import { WasteBankManagement } from "@/components/dashboard/waste-bank-management";

export default function WasteBanksAdminPage() {
    return (
        <AdminGuard>
            <div className="container mx-auto py-6">
                <h1 className="text-3xl font-bold mb-2">Kelola Bank Sampah</h1>
                <p className="text-muted-foreground mb-6">
                    Tambah, edit, dan kelola data bank sampah
                </p>
                <WasteBankManagement />
            </div>
        </AdminGuard>
    );
}