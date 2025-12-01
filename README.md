# IPTV Dashboard - Next.js Version

A modern, high-performance IPTV Reseller Dashboard built with Next.js 14, React, and Material-UI.

## Features

- ⚡ **Next.js 14** with App Router for optimal performance
- 🎨 **Material-UI (MUI)** for beautiful, responsive components
- 🌓 **Dark/Light Mode** theme switching
- 📱 **Responsive Design** - works on all devices
- 🚀 **Server-Side Rendering** for enhanced performance
- 🎯 **Static Vertical Sidebar** layout
- 🔒 **TypeScript** for type safety
- 🔐 **JWT Authentication** with protected routes
- 📊 **Real-time Data** fetching from API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Backend API running (default: http://localhost:5000)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3030](http://localhost:3030) in your browser.

5. **Login** - You'll be redirected to `/auth/login` if not authenticated

## Project Structure

```
IPTV_Frontend_Next_v2/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
│   ├── layout/           # Layout components
│   └── nav-section/      # Navigation components
├── lib/                   # Library code
│   ├── contexts/        # React contexts
│   ├── navigation/      # Navigation config
│   └── theme/          # MUI theme configuration
└── public/              # Static assets
```

## Key Features

### Theme System
- Simplified theme with only **Dark** and **Light** modes
- Removed unnecessary theme presets
- Smooth theme transitions

### Layout
- **Static vertical sidebar** - always visible on desktop
- Responsive mobile drawer
- Clean, modern header

### Performance
- Server-side rendering for faster initial load
- Optimized bundle size
- Code splitting automatically handled by Next.js
- Direct database calls (no HTTP overhead)
- Request-level query caching
- Streaming SSR with Suspense boundaries

### Navigation Performance

- **First visit:** 3-30s (route compilation)
- **Cached visit:** 300ms-2.5s (instant navigation)
- **90% faster** on subsequent visits

📖 **See [NAVIGATION_CYCLE.md](./NAVIGATION_CYCLE.md) for complete navigation flow documentation**

## Building for Production

```bash
npm run build
npm start
```

## Technologies

- **Next.js 14** - React framework
- **Material-UI v5** - Component library
- **TypeScript** - Type safety
- **React 18** - UI library

## License

Private project - All rights reserved
