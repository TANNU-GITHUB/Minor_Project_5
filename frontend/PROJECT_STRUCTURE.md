# Project Structure & Documentation

## Project Overview

**Project Name:** Atlas Dance Show (TanStack Start TypeScript)  
**Type:** Full-Stack React Application with Server-Side Rendering (SSR)  
**Framework:** TanStack Start + React 19  
**Package Manager:** Bun  
**Runtime:** Cloudflare Workers (Nitro)  
**Build Tool:** Vite 7  
**Styling:** Tailwind CSS 4 + shadcn UI components  

---

## Technology Stack

### Frontend
- **React:** 19.2.0
- **React DOM:** 19.2.0
- **TanStack React Router:** 1.168.25 (Routing)
- **TanStack React Query:** 5.83.0 (Data fetching & caching)
- **TanStack React Start:** 1.167.50 (SSR Framework)
- **Vite:** 7.3.1 (Build tool)

### Styling & UI
- **Tailwind CSS:** 4.2.1
- **shadcn UI Components:** Complete library (accordion, alerts, buttons, cards, dialogs, forms, tables, etc.)
- **Tailwind Merge:** 3.5.0 (Utility class merging)
- **Radix UI:** Multiple components (for accessible primitives)
- **Lucide React:** 0.575.0 (Icon library)
- **Framer Motion:** 12.40.0 (Animation library)

### Form & Validation
- **React Hook Form:** 7.71.2
- **@hookform/resolvers:** 5.2.2
- **Zod:** 3.24.2 (Schema validation)

### Data Visualization & Charts
- **Recharts:** 2.15.4 (React charts library)
- **Three.js:** 0.184.0 (3D graphics)
- **TopoJSON Client:** 3.1.0 (Geospatial data visualization)

### Additional Libraries
- **Input OTP:** 1.4.2 (OTP input handling)
- **Embla Carousel:** 8.6.0 (Carousel component)
- **React Day Picker:** 9.14.0 (Date picker)
- **React Resizable Panels:** 4.6.5 (Resizable layouts)
- **Vaul:** 1.1.2 (Drawer component)
- **Sonner:** 2.0.7 (Toast notifications)
- **CMDk:** 1.1.1 (Command palette)
- **Date FNS:** 4.1.0 (Date utilities)
- **class-variance-authority:** 0.7.1 (CSS class generation)
- **CLSX:** 2.1.1 (Conditional classnames)

### Development & Build
- **TypeScript:** 5.8.3
- **ESLint:** 9.32.0
- **Prettier:** 3.7.3
- **Vite TsConfig Paths:** 6.0.2
- **Nitro:** 3.0.260429-beta (Server runtime)
- **@lovable.dev/vite-tanstack-config:** 2.1.1 (TanStack config preset)

### Type Definitions
- **@types/react:** 19.2.0
- **@types/react-dom:** 19.2.0
- **@types/node:** 22.16.5
- **@types/three:** 0.184.1
- **@types/topojson-client:** 3.1.5

---

## Project Structure

```
project/
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
├── .prettierignore                # Prettier ignore rules
├── .prettierrc                    # Prettier configuration
├── node_modules/                 # Installed dependencies (auto-generated)
├── bun.lock                       # Bun lock file (dependency management)
├── package-lock.json             # (Optional - can be removed if using Bun exclusively)
├── package.json                  # Project dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration (uses Lovable preset)
├── eslint.config.js              # ESLint configuration
├── bunfig.toml                   # Bun configuration (supply-chain guard)
├── components.json               # shadcn UI configuration
│
├── src/                          # Source code directory
│   ├── router.tsx                # TanStack Router setup & configuration
│   ├── routeTree.gen.ts          # Auto-generated route tree (DO NOT EDIT)
│   ├── server.ts                 # Server-side rendering entry point
│   ├── start.ts                  # Application entry point
│   ├── styles.css                # Global Tailwind CSS styles
│   │
│   ├── components/               # Reusable React components
│   │   ├── AppShell.tsx          # Main application shell/layout
│   │   ├── HolographicGlobe.tsx  # 3D globe visualization (Three.js)
│   │   ├── Logo.tsx              # Logo component
│   │   │
│   │   ├── landing/              # Landing page components
│   │   │   ├── DnaComparison.tsx # DNA comparison visualization
│   │   │   ├── Features.tsx      # Features section
│   │   │   ├── Footer.tsx        # Footer component
│   │   │   ├── Hero.tsx          # Hero section
│   │   │   ├── HowItWorks.tsx    # How it works section
│   │   │   ├── LanguagesShowcase.tsx  # Programming languages showcase
│   │   │   ├── Navbar.tsx        # Navigation bar
│   │   │   ├── Pricing.tsx       # Pricing section
│   │   │   └── Testimonials.tsx  # Testimonials section
│   │   │
│   │   └── ui/                   # shadcn UI component library (40+ components)
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx        # ⭐ Core UI component
│   │       ├── calendar.tsx
│   │       ├── card.tsx          # ⭐ Core UI component
│   │       ├── carousel.tsx
│   │       ├── chart.tsx         # Recharts wrapper
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx          # React Hook Form integration
│   │       ├── hover-card.tsx
│   │       ├── input.tsx         # ⭐ Form input
│   │       ├── input-otp.tsx     # OTP input
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx     # Resizable panels
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx       # ⭐ Layout component
│   │       ├── skeleton.tsx      # Loading placeholder
│   │       ├── slider.tsx
│   │       ├── sonner.tsx        # Toast notifications wrapper
│   │       ├── switch.tsx
│   │       ├── table.tsx         # ⭐ Data table
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle.tsx
│   │       ├── toggle-group.tsx
│   │       ├── tooltip.tsx
│   │       └── [40+ other UI components...]
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── use-mobile.tsx        # Mobile breakpoint detection hook
│   │
│   ├── lib/                      # Utility functions & helpers
│   │   ├── config.server.ts      # Server-only configuration (Cloudflare Workers env vars)
│   │   ├── error-capture.ts      # Error handling utilities
│   │   ├── error-page.ts         # Error page component
│   │   ├── mock-data.ts          # Mock/sample data
│   │   ├── utils.ts              # General utility functions
│   │   │
│   │   └── api/                  # Server functions & API handlers
│   │       └── example.functions.ts  # Example API function handlers
│   │
│   └── routes/                   # TanStack Router file-based routing
│       ├── README.md             # Routing documentation
│       ├── __root.tsx            # Root layout route
│       ├── index.tsx             # Home page (/)
│       ├── login.tsx             # Login page (/login)
│       ├── signup.tsx            # Sign up page (/signup)
│       ├── onboarding.tsx        # Onboarding page (/onboarding)
│       ├── conversation.tsx      # Conversation page (/conversation)
│       ├── dashboard.tsx         # Dashboard page (/dashboard)
│       ├── profile.tsx           # User profile page (/profile)
│       ├── progress.tsx          # Progress page (/progress)
│       ├── dna-results.tsx       # DNA results page (/dna-results)
│       ├── pricing.tsx           # Pricing page (/pricing)
│       └── lesson.$day.tsx       # Dynamic route (/lesson/:day)

```

---

## Key Configuration Files

### 1. **package.json**
- Manages all dependencies and dev dependencies
- Defines npm scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`

### 2. **vite.config.ts**
- Uses `@lovable.dev/vite-tanstack-config` preset
- Automatically includes: TanStack Start, React, Tailwind, TypeScript paths, Nitro, component tagger
- Server entry point: `src/server.ts`
- Redirects for SSR error handling

### 3. **tsconfig.json**
- Target: ES2022
- Strict mode enabled
- Path alias: `@/*` → `src/*`
- JSX: react-jsx

### 4. **components.json**
- shadcn UI configuration
- Style: new-york
- Tailwind CSS configuration with CSS variables
- Icon library: Lucide
- Base color: slate

### 5. **bunfig.toml**
- Bun configuration with supply-chain guard
- Minimum release age: 24 hours
- Bypasses for: `@lovable.dev/vite-tanstack-config`

---

## Important Development Notes

### 1. **Auto-Generated Files**
- `src/routeTree.gen.ts` - DO NOT EDIT (auto-generated from routes/)
- Regenerated on file changes in `src/routes/`

### 2. **Styling Approach**
- Utility-first with Tailwind CSS
- CSS variables for theming (configured in components.json)
- All components use Tailwind classes (no CSS files for component styles)

### 3. **Component Usage**
- shadcn UI components are copy-paste components in `src/components/ui/`
- Customizable by editing their files directly
- New components: Use shadcn CLI or manual copy-paste

### 4. **Routing**
- File-based routing in `src/routes/` directory
- TanStack Router v1 (modern, minimal config)
- Dynamic segments: Use `$` prefix (e.g., `lesson.$day.tsx`)
- Root layout: `__root.tsx` wraps all routes

### 5. **Data Fetching**
- Use React Query for server state management
- Client-side caching built-in
- Integration with TanStack Start for server functions

### 6. **Type Safety**
- Full TypeScript strict mode
- No `any` types unless necessary
- Zod for runtime schema validation

---

## Development Workflow

1. **Install Dependencies**
   ```bash
   bun install
   # or npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5173 (default)
   ```

3. **Make Changes**
   - Edit components in `src/components/`
   - Add new routes in `src/routes/`
   - Create API functions in `src/lib/api/`

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Deploy**
   - Push to GitHub
   - Deploy to Cloudflare Pages (via GitHub Actions)
   - Or deploy to any Node.js/Bun hosting

---

## Contact & Support

- **Framework:** TanStack Start Docs - https://tanstack.com/router/latest/docs/framework/start/overview
- **UI Components:** shadcn/ui - https://ui.shadcn.com
- **Styling:** Tailwind CSS - https://tailwindcss.com
- **Editor:** Lovable.dev (optional)

---
