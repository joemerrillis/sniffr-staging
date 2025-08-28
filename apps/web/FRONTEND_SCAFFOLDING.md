# Sniffr Frontend Scaffolding

This document outlines the complete frontend scaffolding structure created for the Sniffr dog-walking SaaS platform.

## 🏗️ Architecture Overview

The frontend is built with **Next.js 15** and follows a modern component-based architecture with:

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom component library with Headless UI
- **State Management**: React Context + Custom hooks
- **Authentication**: JWT-based with protected routes

## 📁 Project Structure

```
apps/web/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (redirects to dashboard)
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── dogs/page.tsx           # Dog management
│   ├── walks/page.tsx          # Walk scheduling & tracking
│   ├── calendar/page.tsx       # Calendar view
│   ├── chat/page.tsx           # Messaging interface
│   ├── reports/page.tsx        # Analytics & reports
│   ├── settings/page.tsx       # Account settings
│   ├── login/page.tsx          # Authentication
│   └── signup/page.tsx         # Registration
├── components/                  # Reusable components
│   ├── ui/                     # Base UI components
│   │   ├── Button.tsx          # Configurable button with variants
│   │   ├── Input.tsx           # Form input with validation
│   │   ├── Card.tsx            # Content containers
│   │   ├── Modal.tsx           # Modal dialogs
│   │   └── index.ts            # Component exports
│   ├── layout/                 # Layout components
│   │   ├── AppLayout.tsx       # Main application layout
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── TopNav.tsx          # Top navigation bar
│   ├── features/               # Feature-specific components
│   │   ├── DashboardStats.tsx  # Dashboard statistics cards
│   │   ├── WalkScheduler.tsx   # Walk scheduling modal
│   │   └── DogProfile.tsx      # Dog profile management
│   ├── forms/                  # Form components
│   │   └── DogForm.tsx         # Dog creation/editing form
│   ├── common/                 # Common utilities
│   │   ├── ErrorBoundary.tsx   # Error handling
│   │   ├── LoadingSpinner.tsx  # Loading indicators
│   │   ├── ProtectedRoute.tsx  # Route protection
│   │   └── index.ts            # Exports
│   └── providers/              # Context providers
│       └── AppProvider.tsx     # Main app providers
├── contexts/                   # React contexts
│   └── AuthContext.tsx         # Authentication state
├── hooks/                      # Custom React hooks
│   ├── useTenant.ts           # Tenant management
│   └── useApi.ts              # API request handling
└── lib/                       # Utility libraries
    ├── utils.ts               # General utilities
    └── api.ts                 # API client
```

## 🎨 Design System

### UI Components

All components are built with **class-variance-authority** for consistent styling:

- **Button**: 5 variants (primary, secondary, outline, ghost, danger) × 3 sizes
- **Input**: Includes labels, errors, helper text, and validation states
- **Card**: Modular card system with header, content, and footer sections
- **Modal**: Responsive modals with size variants and animations

### Color System

- **Primary**: Blue-600 (#2563EB)
- **Secondary**: Gray-200 (#E5E7EB)
- **Success**: Green-600 (#16A34A)
- **Warning**: Orange-600 (#EA580C)
- **Error**: Red-600 (#DC2626)

## 🔐 Authentication Flow

1. **Public Routes**: `/login`, `/signup`
2. **Protected Routes**: All dashboard routes require authentication
3. **Role-based Access**: Admin, Walker, Client roles with different permissions
4. **Token Management**: JWT tokens stored in localStorage with auto-refresh

## 🏠 Multi-tenancy

- **Tenant Detection**: Automatic detection via middleware
- **Theme Customization**: Per-tenant branding and colors
- **Data Isolation**: All API calls include tenant context

## 📱 Key Features

### Dashboard
- Statistics overview cards
- Recent activity feeds
- Quick action buttons
- Responsive grid layout

### Dog Management
- Dog profiles with photos
- Owner information tracking
- Health and preference notes
- Status management (active/boarding/inactive)

### Walk Scheduling
- Multi-dog walk scheduling
- Time and location management
- Walker assignment
- Duration and pricing tracking

### Communication
- Real-time messaging interface
- Client-walker communication
- Team notifications
- Message history

### Reports & Analytics
- Revenue tracking
- Walk statistics
- Client growth metrics
- Performance dashboards

## 🛠️ Development Setup

### Prerequisites
- Node.js 20.x
- npm 10.x

### Installation
```bash
cd apps/web
npm install
```

### Development
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### TypeScript Configuration
- Strict mode enabled
- Path mapping configured (`@/` → `./src/`)
- Next.js plugin configured

### Tailwind CSS
- Custom component classes
- Responsive design utilities
- Dark mode support ready

## 📦 Dependencies

### Core
- `next`: 15.4.6
- `react`: 19.1.0
- `typescript`: ^5

### UI & Styling
- `tailwindcss`: ^4
- `@headlessui/react`: ^2.2.0
- `@heroicons/react`: ^2.1.5
- `class-variance-authority`: ^0.7.1
- `clsx`: ^2.1.1
- `tailwind-merge`: ^2.6.0

## 🚀 Deployment Ready

The scaffolding is fully configured for:
- **Vercel**: Zero-config deployment
- **Production builds**: Optimized for performance
- **Error handling**: Comprehensive error boundaries
- **Loading states**: Smooth user experience
- **SEO**: Meta tags and structured data ready

## 🔄 Next Steps

1. **API Integration**: Connect to backend endpoints
2. **Real-time Features**: WebSocket integration for live updates
3. **Testing**: Add unit and integration tests
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Performance**: Implement code splitting and lazy loading
6. **PWA**: Add offline capabilities and push notifications

---

This scaffolding provides a solid foundation for building a production-ready dog-walking SaaS platform with modern React patterns and best practices.