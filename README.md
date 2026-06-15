# 🩺 ArogyaAI

**ArogyaAI** is an AI-powered personal health intelligence platform that helps users track daily wellness, organize medical records, and generate actionable health insights through a unified dashboard.

> **Note:** ArogyaAI provides educational wellness insights only and is **not** a substitute for professional medical advice or diagnosis.

---

## ✨ Features

* 🔐 Secure JWT authentication with refresh token support
* 👤 Personalized health profile and onboarding
* 🍽️ Nutrition and meal tracking
* 💊 Medicine management with reminders
* 💧 Water intake tracking
* 😴 Sleep tracking
* 🏃 Activity tracking
* 📊 Health dashboard with analytics and trends
* 📁 Digital health record vault for reports and prescriptions
* 🤖 AI-powered wellness insights
* 📄 Doctor summary and weekly health report generation

---

## 🧠 AI Capabilities

* Food recognition and nutrition estimation from meal images
* OCR extraction from prescriptions and medical reports
* Structured biomarker extraction
* Personalized wellness summaries based on tracked health data
* Educational recommendations generated using LLMs

All AI outputs are validated before persistence and are intended for informational purposes only.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication

### AI & Cloud

* Gemini API
* Cloudinary
* OCR Processing

---

## 📂 Project Structure

```
arogyaai/
├── arogyaai-backend/
│   ├── prisma/
│   ├── src/
│   └── ...
│
└── arogyaai-frontend/
    ├── src/
    ├── components/
    ├── pages/
    ├── services/
    └── ...
```

---

## 🚀 Getting Started

### Backend

```bash
cd arogyaai-backend
npm install
npm run dev
```

### Frontend

```bash
cd arogyaai-frontend
npm install
npm run dev
```

Configure the required environment variables before running the application.

---

## 🎯 Roadmap

* AI Meal Scanner
* Enhanced OCR pipeline
* Weekly health reports
* Doctor summary PDFs
* AI wellness recommendations
* Health trend analytics
* Mobile optimization

---

## ⚠️ Disclaimer

ArogyaAI is designed for **health tracking and educational wellness insights** only. It does **not** diagnose medical conditions, prescribe treatments, or replace consultation with qualified healthcare professionals.

---

## 📜 License

This project is intended for educational and portfolio purposes unless otherwise specified.
