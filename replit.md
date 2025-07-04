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