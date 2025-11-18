import { Home, History, Camera, Upload, Sparkles, Book, LucideIcon } from "lucide-react";

export interface MenuItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact: boolean;
}

export const menuItems: MenuItem[] = [
  { href: "/dashboard", icon: Home, label: "Overview", exact: true },
  { href: "/dashboard/upload", icon: Upload, label: "Upload Gambar", exact: false },
  { href: "/dashboard/camera", icon: Camera, label: "Kamera Klasifikasi", exact: false },
  { href: "/dashboard/history", icon: History, label: "Riwayat Klasifikasi", exact: false },
  { href: "/dashboard/generate", icon: Sparkles, label: "Generate Edukasi", exact: false },
  { href: "/dashboard/education", icon: Book, label: "Edukasi Publik", exact: false },
];
