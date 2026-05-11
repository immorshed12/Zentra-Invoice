# Zentra Invoice

A professional, multi-tenant invoicing platform built with React, TypeScript, and Supabase. Features native support for English, Arabic, and Bangla, complex team management, and a high-performance financial dashboard.

## 🚀 Key Features

- **Multi-Tenant Architecture**: Securely isolated company data.
- **Trilingual Support**: English, Arabic (RTL), and Bangla.
- **Smart Invoicing**: PDF-ready professional invoices with automated numbering.
- **Team Management**: RBAC (Role-Based Access Control) with Admin, Manager, and Staff roles.
- **Financial Analytics**: Real-time revenue tracking and aging invoice reports.
- **Onboarding**: Seamless setup flow for new companies.
- **Responsive Design**: Optimized for mobile and desktop.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage).
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **Internationalization**: i18next.

## ⚙️ Prerequisites

- Node.js (version 18 or later)
- A Supabase account and project

## 📦 Getting Started

### 1. Clone the repository
```bash
# This is a private repository, so ensure you have the correct permissions/SSH keys
git clone <your-repo-url>
cd zentra-invoice
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```
Refer to `.env.example` for more configuration options.

### 4. Database Setup
1. Go to your Supabase project's **SQL Editor**.
2. Open the `database_schema.md` file in this repository.
3. Copy the **MASTER PRODUCTION SETUP SCRIPT** content.
4. Paste it into the Supabase SQL Editor and click **Run**.
5. This will create all necessary tables, indexes, policies, and triggers.

### 5. Run the development server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 🔒 Security Notes

- **Private Repository**: This project contains business logic and should be kept private on GitHub.
- **Environment Variables**: Never commit `.env` files. They are excluded via `.gitignore`.
- **RLS Policies**: Access control is enforced at the database level using Supabase Row Level Security (RLS). Ensure policies are active as defined in `database_schema.md`.

## 📝 License

Internal Use Only. All rights reserved.
