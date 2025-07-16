# MULTI CORBAN - Consulta de Benefícios INSS

## Overview

This is a modern full-stack web application for querying INSS (Brazilian Social Security) benefit information through the MULTI CORBAN API. The system allows users to search for benefits by CPF or benefit number and displays detailed information in a professional, responsive interface designed for banking correspondents.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store
- **API Integration**: External MULTI CORBAN API for benefit data

### Key Components

1. **Search Interface**
   - API key management with localStorage persistence
   - Toggle between CPF and benefit number search
   - Real-time validation and error handling
   - Loading states and user feedback

2. **Results Display**
   - Card-based layout for multiple benefits
   - Expandable accordion sections for detailed information
   - Responsive design for mobile and desktop
   - Professional styling with icons and badges

3. **Data Management**
   - Shared schema definitions with Zod validation
   - Type-safe API interactions
   - Error handling and user notifications
   - Caching with React Query

## Data Flow

1. **User Input**: User enters API key and search criteria
2. **Validation**: Client-side validation using Zod schemas
3. **API Request**: Direct calls to MULTI CORBAN API from frontend
4. **Data Processing**: Response data is validated and transformed
5. **UI Updates**: Results are displayed in organized card layouts
6. **State Management**: React Query handles caching and synchronization

## External Dependencies

### Core Dependencies
- **UI Components**: Radix UI primitives for accessibility
- **Styling**: Tailwind CSS for utility-first styling
- **Forms**: React Hook Form + Hookform Resolvers
- **Validation**: Zod for schema validation
- **Database**: Drizzle ORM + Neon Database
- **Date Handling**: date-fns for date formatting
- **Icons**: Lucide React for consistent iconography

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Vite plugins for Replit environment

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` with hot reload
- **Database**: Drizzle migrations with `npm run db:push`
- **Type Safety**: TypeScript checking with `npm run check`

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js
- **Database**: PostgreSQL with connection pooling
- **Environment**: Production-ready Express server

### Architecture Decisions

1. **Frontend-Only API Integration**: Direct API calls from browser instead of proxy through backend
   - **Rationale**: Simpler architecture, reduced latency
   - **Trade-offs**: API keys exposed to client, CORS dependency

2. **Card-Based UI Design**: Accordion and card layouts for information display
   - **Rationale**: Professional appearance, mobile-friendly, organized data presentation
   - **Benefits**: Easy scanning, progressive disclosure, responsive design

3. **Drizzle ORM with PostgreSQL**: Type-safe database operations
   - **Rationale**: Better TypeScript integration than other ORMs
   - **Benefits**: Compile-time query validation, excellent performance

4. **Shared Schema Definitions**: Common types between frontend and backend
   - **Rationale**: Consistency, type safety, reduced duplication
   - **Benefits**: Single source of truth, easier maintenance

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 04, 2025. Initial setup
- July 04, 2025. Fixed React render loop errors and configured fixed API key (4630e3b1ad52c0397c64c81e5a3fb8ec)
- July 04, 2025. Added example buttons for quick testing with real data (CPF: 15713132811, Benefits: 1272021804, 1697028109)
- July 04, 2025. Optimized query performance and error handling
- July 04, 2025. Fixed app startup errors by removing syntax errors and cleaning up storage interface
- July 04, 2025. Enhanced accordion behavior to allow multiple sections open simultaneously
- July 04, 2025. Added print functionality to loan contracts section with comprehensive PDF report generation
- July 04, 2025. Added RMC and RCC card information display sections with complete card details and bank information
- July 04, 2025. Added "Saldo Devedor" (outstanding balance) column to loan contracts table
- July 04, 2025. Implemented explicit legal representative warning system with prominent visual indicators and complete representative data display
- July 04, 2025. Added dark mode toggle with blue-themed design, fixed top-right positioning, and localStorage persistence
- July 04, 2025. Fixed dark mode contrast issues in table and accordion sections, improved text visibility and background colors
- July 04, 2025. Comprehensive dark mode contrast fixes: replaced all white backgrounds with theme-aware bg-card, added text-foreground classes for proper text visibility, fixed RMC/RCC sections, financial summary cards, and other information panels
- July 04, 2025. Final dark mode contrast fixes: updated benefit cards and green margin sections with proper dark mode variants (dark:bg-green-900/20, dark:text-green-400) and border styling
- July 04, 2025. Fixed contract text truncation in loan contracts table: removed truncation and increased column width to display full contract numbers
- July 05, 2025. Fixed user authentication display issues: corrected useAuth hook to properly show logged user information, added credentials to all API requests, and improved session management for user switching
- July 06, 2025. Comprehensive data expansion: Added complete beneficiary information (CEP, sex, RG, DIB, loan blocking status, legal representative info), enhanced banking data with magnetic card detection, implemented negative margin calculations for RMC/RCC cards with visual indicators, expanded loan contracts table with paid installments and interest rates columns
- July 06, 2025. Enhanced benefit species identification: Added complete mapping of 99 INSS benefit species codes to descriptive names, displaying species names in benefit cards, detail views, and PDF reports for better user understanding
- July 06, 2025. Security enhancement: Removed API configuration interface and default credentials display from login screen for professional security standards, keeping authentication internal to the system
- July 08, 2025. Bank icon system implementation: Replaced color indicators with professional circular icons featuring bank initials and brand colors, improved visual identification in loan contracts table with BankIcon component, enhanced user experience with recognizable bank branding (BB, Santander, Caixa, etc.)
- July 08, 2025. Bank icon system optimization: Implemented adaptive sizing where small icons (w-4 h-4) show colored dots for table display, larger icons show initials for detailed views, added support for additional banks (329, ZEMA CFI, Ficsa), improved colors to match brand identities
- July 11, 2025. Favicon implementation: Added professional favicon using RMJ logo (rmj_1751973121690.jpeg) with proper HTML meta tags, created PWA manifest.json for mobile support, configured theme color and multiple icon sizes for cross-browser compatibility
- July 11, 2025. Code cleanup and optimization: Removed 40+ unused image files and assets, deleted unused UI components (aspect-ratio, avatar, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, resizable, scroll-area, sidebar, slider, switch, tabs, textarea, toggle-group), removed unused hooks (use-mobile), cleaned up temporary files to optimize project size and performance
- July 11, 2025. Final code cleanup: Removed all unused attached assets (CSS files, HTML files, PNG images, MD files), kept only essential RMJ logo, cleaned up BankIcon component removing SVG custom system, optimized project structure for production deployment
- July 16, 2025. Enhanced Banrisul API simulation: Fixed duplicate prazo keys with unique key generation, removed prazo from payload to request all available options, implemented comprehensive options table showing all plano/prazo combinations with direct selection capability, improved dynamic prazo selection without additional API calls