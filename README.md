# ♻️ Daurtica: AI-Powered Waste Classification

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Framework](https://img.shields.io/badge/Next.js-14-black)
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

## 💻 Web Application (Next.js)

Aplikasi web ini dibangun menggunakan **Next.js** untuk performa frontend yang optimal.

### Prerequisites

Pastikan Anda sudah menginstal:

- Node.js (LTS version)
- npm / yarn / pnpm

### Installation

1. Clone repositori ini:

```bash
    git clone [https://github.com/Fxf28/daurtica.git](https://github.com/Fxf28/daurtica.git)
    cd daurtica
```

2. Install dependencies:

```bash
    npm install
    # atau
    yarn install
```

3. Jalankan development server:

```bash
    npm run dev
```

4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **AI/ML Core:** Python, TensorFlow, PyTorch (Ultralytics YOLO)
- **Model Deployment:** TensorFlow.js (Web Conversion)
- **Datasets:** RealWaste, Hazardous-Waste (Custom Aggregation)

---

## 📂 Project Structure

```text
daurtica/
├── public/              # Aset statis (termasuk model TFJS bin/json)
├── src/
│   ├── app/             # Next.js App Router
│   ├── components/      # React Components
│   └── utils/           # Helper functions (termasuk logika load model)
└── README.md            # Dokumentasi Proyek
```

## 👤 Author

**Faiz Fajar**

- Project: Tugas Akhir (Undergraduate Thesis)
- Focus: Machine Learning & Web Development
