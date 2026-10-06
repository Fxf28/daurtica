# ♻️ Daurtica: AI-Powered Waste Classification

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Framework](https://img.shields.io/badge/Next.js-15-black)
![ML Model](https://img.shields.io/badge/Model-TensorFlow.js%20%7C%20YOLOv8-blue)

**Daurtica** adalah aplikasi web cerdas yang dirancang untuk membantu klasifikasi sampah secara otomatis menggunakan _Deep Learning_. Sistem ini dapat mengenali dan memilah sampah ke dalam tiga kategori utama: **Organik**, **Anorganik**, dan **B3 (Bahan Berbahaya & Beracun)**.

Proyek ini merupakan bagian dari Tugas Akhir untuk mengembangkan solusi pengelolaan sampah berbasis teknologi Computer Vision.

---

## 🧠 Machine Learning Pipeline

Inti dari kecerdasan buatan Daurtica dikembangkan menggunakan Python di Google Colab. Seluruh proses mulai dari _Data Engineering_ hingga _Model Export_ terdokumentasi lengkap.

### 🚀 Central Hub (Navigasi Utama)

Akses seluruh eksperimen dan notebook melalui satu pintu navigasi di bawah ini:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1tHZqdcEu4C6Lx8ytFLQn9suCsvmYUux9?usp=sharing)

> **Klik badge di atas untuk membuka "Master Notebook" yang berisi tautan ke semua tahapan proyek.**

### Ringkasan Eksperimen

Kami membandingkan tiga arsitektur model untuk mendapatkan performa terbaik di web:

1. **YOLOv8n-cls** (Dipilih untuk deployment karena ringan & cepat)
2. **ResNet50** (Akurasi tinggi, beban komputasi berat)
3. **EfficientNetV2B0** (Efisien parameter)

Model terbaik dikonversi ke format **TensorFlow.js** agar dapat berjalan langsung di browser pengguna (Client-side inference) demi menjaga privasi dan kecepatan.

---

## 💻 Web Application Setup

Aplikasi web ini dibangun menggunakan **Next.js 14** (App Router). Ikuti langkah berikut untuk menjalankan proyek di lokal.

### 1. Prerequisites

Pastikan Anda sudah menginstal:

- Node.js (LTS version)
- Bun (https://bun.sh) — package manager yang digunakan proyek ini

### 2. Installation

Clone repositori dan install dependencies:

```bash
git clone https://github.com/Fxf28/daurtica.git
cd daurtica
bun install
```

### 3\. Environment Variables (.env)

Buat file bernama `.env.local` di root folder proyek, kemudian salin konfigurasi berikut dan isi dengan API Key Anda:

```bash
# Google Gemini AI (Generative Content)
GOOGLE_API_KEY=your_google_api_key_here

# Cloudinary (Image Storage)
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
VERCEL_URL=your_vercel_deployment_url
```

### 4\. Running the App

Jalankan development server:

```bash
bun run dev
```

Buka [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI
- **AI/ML Core:** Python, TensorFlow, PyTorch (Ultralytics YOLO)
- **Model Deployment:** TensorFlow.js (Client-side Inference)
- **Database/Storage:** Cloudinary (Images), Inngest (Event Driven)
- **Generative AI:** Google Gemini (Untuk konten edukasi sampah)

---

## 📂 Project Structure

Berikut adalah struktur direktori detail dari source code (`src/`):

```text
src/
├── app/                        # Next.js App Router
│   ├── (public)/               # Route Group: Halaman Publik
│   │   ├── about/              # Halaman Tentang Kami
│   │   ├── classify/           # Halaman Utama Klasifikasi (AI)
│   │   ├── education/          # Halaman Edukasi
│   │   ├── faq/                # Halaman Tanya Jawab
│   │   ├── map/                # Peta Persebaran Bank Sampah
│   │   └── terms/              # Syarat & Ketentuan
│   ├── api/                    # Backend API Routes
│   │   ├── classification/     # API History & Detail Klasifikasi
│   │   ├── education/          # API Generate Konten Edukasi (Gemini)
│   │   ├── inngest/            # Background Jobs
│   │   └── waste-banks/        # API Lokasi Bank Sampah
│   └── dashboard/              # Halaman Dashboard User (Protected)
│       ├── camera/             # Fitur Kamera Langsung
│       ├── education/          # Edukasi Personal
│       ├── generate/           # Generator Konten AI
│       ├── history/            # Riwayat Klasifikasi
│       └── waste-banks/        # Manajemen Bank Sampah
│
├── components/                 # React Components
│   ├── dashboard/              # Komponen khusus Dashboard
│   │   ├── dashboard-charts.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   └── waste-bank-map.tsx
│   ├── ui/                     # Reusable UI Components (Shadcn)
│   ├── camera-capture.tsx      # Komponen Kamera Web
│   ├── classification-card.tsx # Tampilan Hasil AI
│   └── progress-loader.tsx     # Indikator Loading Navigasi
│
├── db/                         # Database Schema
│   └── schema.ts
│
├── hooks/                      # Custom React Hooks
│   ├── use-classification.ts   # Logika Utama Klasifikasi
│   ├── use-geolocation.ts      # Akses Lokasi User
│   └── use-model-status.ts     # Cek Status Model TFJS
│
├── lib/                        # Utility Libraries
│   ├── classifier-browser.ts   # Logic Load Model TFJS di Browser
│   ├── gemini-ai.ts            # Integrasi Google Gemini API
│   ├── cloudinary.ts           # Integrasi Upload Gambar
│   └── inngest.ts              # Event Functions
│
└── types/                      # TypeScript Definitions
    ├── classification.ts
    └── waste-bank.ts
```

## 👤 Author

Faiz Fajar

- Project: Tugas Akhir (Undergraduate Thesis)
- Focus: Machine Learning & Web Development

---
