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
- July 17, 2025. Navbar improvements and polish: Enhanced navbar layout with better theme toggle positioning, improved button spacing and transitions, added active page indicators for better navigation UX, reorganized desktop navigation for better visual hierarchy, integrated theme toggle into user actions section with proper grouping, improved mobile menu with consistent styling and backdrop blur effect
- July 18, 2025. Database system and user management implementation: Added complete PostgreSQL database integration with Drizzle ORM, implemented user management with optional email sending, password generation, and reset functionality, created consultation history storage, enhanced dashboard with database-backed metrics, added notification system, benefit monitoring, and favorite clients management
- July 18, 2025. Deployment login fix: Corrected session management issues in production deployment, updated cookie configuration for better compatibility, added explicit session saving, implemented debug logging for authentication troubleshooting, recreated admin user with proper password hashing (credentials: Vitor.admin / admin123)
- July 18, 2025. Hybrid authentication system: Implemented dual authentication (session + JWT) for maximum deployment compatibility, added JWT token generation and storage in localStorage, created requireAuthHybrid middleware for automatic fallback, configured Express trust proxy for Replit deployment, enhanced session configuration for production environment
- July 18, 2025. Custom favicon implementation: Replaced default earth icon with custom RMJ CALL CENTER logo, updated HTML meta tags and PWA manifest for consistent branding across browser tabs and mobile devices, added cache-busting parameter for immediate favicon updates
- July 18, 2025. Favicon optimization and project cleanup: Upgraded to professional .ico favicon format (rmjicon_1752844057051.ico), removed 40+ unused files including all PDFs, text files, and unused images, optimized project structure keeping only essential favicon assets for better performance and reduced storage
- July 18, 2025. Brevo email integration: Replaced SendGrid with Brevo email service, implemented professional HTML email templates, configured API authentication with environment variables for security, created branded email templates for password delivery, welcome messages, and password reset notifications
- July 18, 2025. Email management system fixes: Corrected wouter import errors in reset password and email management pages, fixed getUsersByIds function in storage to resolve SQL array issues, improved email management page navbar with professional layout, added proper authentication checks, successfully tested email sending functionality with Brevo service delivering emails to cavalcantisilvav@gmail.com
- July 18, 2025. Brevo API optimization: Tested official @getbrevo/brevo SDK but encountered authentication configuration issues, reverted to stable HTTP API implementation for maximum compatibility, confirmed email delivery functionality working correctly with message ID tracking and professional HTML templates
- July 18, 2025. Brevo sender configuration: Updated email sender to cavalcantisilvav@gmail.com (Vitor Cavalcanti) for proper authentication, enhanced email endpoint to accept both UUID and direct email addresses, successfully tested email delivery to janaina.nipocredito@gmail.com matching Python API example functionality
- July 18, 2025. User management system fixes: Fixed EditUser.tsx useParams hook usage for proper route parameter extraction, corrected email schema validation to accept both UUIDs and email addresses, added missing GET /api/users/:id endpoint for individual user retrieval, resolved storage.getUser function reference errors, successfully tested both user editing and email sending functionality
- July 21, 2025. Enhanced client marking system with assume sale functionality: Implemented comprehensive client marker history tracking with database schema and API endpoints, enhanced ClientMarkerBadge component to display marking history in tooltips, added assume sale functionality allowing operators to take over sales from other operadors, created silent notification system that only triggers for "em_negociacao" status, refined user permissions so operators who assume sales can update status and notes, enabling collaborative client management where multiple operators can work on the same client over time with complete historical tracking
- July 21, 2025. Comprehensive consultation history system: Maintained original benefit consultation interface with cards and user markings intact, completely rebuilt consultation history with detailed offline viewing capabilities, implemented individual benefit selection for clients with multiple benefits, added comprehensive PDF export with all client data (personal info, financial details, contracts, cards, contact data), enabled offline consultation functionality without additional API costs, enhanced data retrieval from stored resultData for complete information display, organized interface with accordion sections for different data types (beneficiary, benefit, financial, loans, cards, contact)
- July 21, 2025. Fixed loan blocking status consistency: Corrected BloqueadoEmprestimo field validation across all systems to use "SIM" consistently (instead of mixing "S", "1", and "SIM"), updated database saving logic in server routes, consultation history display, PDF generation, and benefit details to show accurate blocking status matching the API response format, ensuring dashboard statistics and history viewing display correct blocked/unblocked loan status
- July 21, 2025. Security and stability fixes: Removed exposed Brevo API key from source code and implemented secure environment variable usage, fixed login page crash by replacing missing logo import with styled RMJ placeholder, added proper API key validation in email service with graceful fallback when key is missing, resolved Git push protection issues for production deployment
- July 21, 2025. Email system fully operational: Successfully configured BREVO_API_KEY environment variable, tested email functionality via admin endpoint, confirmed email delivery working correctly with message ID tracking, fixed TypeScript type error in email service, validated complete email system including HTML and text messages
- July 21, 2025. Deployment optimization and bug fixes: Applied all suggested fixes for container image push failure including Dockerfile creation with Alpine optimization, .dockerignore configuration, NPM cache disabling, health check endpoint at /api/health, JWT_SECRET configuration, fixed missing logoPath import error in home.tsx preventing site crashes, verified project size (516MB) well under 8GB limit, implemented comprehensive deployment optimization for Replit cloud hosting
- July 21, 2025. Fixed "Ver Detalhes" button functionality: Resolved API key management issue where empty string was being passed instead of the fixed API key (4630e3b1ad52c0397c64c81e5a3fb8ec), corrected BankIcon component crash when bankCode is null by adding safety checks and fallback rendering, removed debug logs for cleaner production code, verified detail query functionality working correctly
- July 22, 2025. Favicon system implemented: Fixed favicon display by moving icon to client/public/ directory following Vite standards, updated HTML with proper /favicon.ico path, corrected manifest.json configuration, ensured proper browser compatibility with cache-busting parameters
- July 22, 2025. Email sender configuration updated: Changed default email sender from "Vitor Cavalcanti" to "Suporte RMJ" (suporte@rmjconsultas.com.br) for all system communications including password resets, welcome emails, and administrative notifications, ensuring consistent professional branding across all email communications
- July 22, 2025. Design reverted to original state: Removed responsive CSS utilities and fluid design system upon user request, restored original layout classes and spacing for home page, benefit-search component, and other interface elements to maintain the familiar appearance users prefer
- July 22, 2025. Custom domain successfully configured: Implemented https://rmjconsultas.com.br as primary domain through DirectAdmin redirection to Replit deployment URL (https://rmjcorban.replit.app), completed DNS propagation and SSL configuration, verified full application functionality on custom domain with proper authentication and API endpoints
- July 22, 2025. Domain URL preservation issue identified: User requests that rmjconsultas.com.br domain remains visible in browser address bar instead of redirecting to rmjcorban.replit.app, requires proxy reverse configuration instead of 301 redirect to maintain domain visibility
- July 25, 2025. C6 Bank simulation system implemented as action button (not navbar menu): Created comprehensive C6Simulation component with dual functionality - simulation and contract digitization, removed C6 Bank from navigation menu per user request, integrated simulation button in loan contracts table similar to Banrisul style, implemented contract selection for refinancing, added proposal digitization with automatic corban data pulling, manual field editing for null values, 15-attempt/5-minute retry loop for formalization links, error handling for reproval/pending status, multiple installment consolidation capability
- July 25, 2025. Enhanced C6 Bank contract validation system: Fixed critical issue where different contracts were used between simulation and digitization phases, implemented robust contract validation to prevent "Operation not found" errors, added backend validation to ensure selected contracts exist in beneficiary data and belong to C6 Bank, improved error handling with specific user-friendly messages for common validation failures (value limits, missing contracts, invalid data), established consistent contract flow from selection through simulation to final digitization
- July 25, 2025. C6 Bank digitization history system implemented: Created comprehensive digitization tracking system with new "Digitalizações" tab in navbar, complete database schema for c6_digitizations table, backend storage and API endpoints for creating and retrieving digitization records, frontend page with advanced filtering (search, status, date), automatic saving of all digitization data (contracts, insurance, amounts, proposal numbers) to history when C6 proposals are created, automatic status updates when formalization links are obtained, complete digitization lifecycle tracking from proposal creation to final approval with formalization links
- July 25, 2025. Enhanced digitization status system and proposal consultation: Added detailed status mapping (APROVADA, REJEITADA, CANCELADA, EM_ANALISE, PENDENTE) with proper badge variants and labels, implemented proposal consultation and movement tracking endpoints with C6 Bank API integration, added action buttons in digitization cards for consulting proposals and viewing movements, created real-time API endpoints for proposal status checking and movement history retrieval, enhanced user experience with toast notifications for API responses
- July 28, 2025. C6 Bank simulation fixes and UI improvements: Fixed enrollment field validation with 10-character padding using padStart, enhanced error logging with detailed C6 Bank API messages on both backend and frontend, improved dark mode styling for simulation interface including contracts, tables, and form inputs, added "Parcelas Pagas" display in contract selection showing paid installments inline with contract numbers, implemented comprehensive null-safe payload validation for simulation API calls
- July 28, 2025. Advanced C6 Bank error handling and contract eligibility system: Implemented comprehensive null value validation for all required fields (CPF, benefit number, birth date, income), added specific error messages for field validation failures, created intelligent error analysis for "Nullable object must have a value" errors indicating contract eligibility issues, enhanced user feedback with detailed explanations when contracts are not eligible for refinancing, added contract validation to filter invalid/empty contract numbers before API submission
- July 28, 2025. Enhanced C6 Bank dark mode interface and parcelas pagas display: Improved dark mode support across all C6 simulation sections with proper color schemes (gray-800 backgrounds, gray-600 borders), enhanced contract selection cards with better visual hierarchy and spacing, implemented professional badge display for "parcelas pagas" (installments paid) with green color scheme, improved form inputs and table styling for dark mode compatibility, ensured proper contrast and readability in all interface elements
- July 28, 2025. Fixed C6 Bank parcelas pagas data source and button styling: Corrected parcelas pagas display to fetch data from MultiCorban API using both ParcelasPagas and Parcelas_Pagas fields for maximum compatibility, updated "Simular" button styling to match design specifications with green color scheme (bg-green-600 hover:bg-green-700), added BarChart3 icon and compact size for professional appearance matching the reference design
- July 28, 2025. Comprehensive C6 Bank parcelas pagas and action button optimization: Implemented robust parcelas pagas detection using 9 different possible field names (ParcelasPagas, Parcelas_Pagas, ParcelasQuitadas, QtdParcelasPayas, etc.) for maximum API compatibility, enhanced "Digitar" action button with professional styling including FileText icon, smooth transitions, shadow effects, and proper dark mode support with active scale animation for better user feedback
- July 28, 2025. Complete "Simular" button standardization across all systems: Unified all simulation buttons (Banrisul, C6 Bank, C6 trigger) with identical green professional styling (bg-green-600 hover:bg-green-700), consistent sizing (min-w-[80px] h-8), professional animations with hover effects and active scale, dark mode compatibility, ensuring uniform user experience across all banking simulation interfaces
- July 28, 2025. Enhanced banking data display with validation: Implemented intelligent banking data detection in "Dados Credenciais de Recebimento" section, displaying "Não tem conta" when client has no valid banking information (empty Banco, Agencia, and ContaPagto fields), improved data validation with proper N/A fallbacks for individual missing fields, maintaining professional layout and user-friendly messaging for clients without banking credentials
- July 28, 2025. Fixed C6 Bank parcelas pagas calculation: Corrected the calculation to use the proper formula (Prazo Total - Parcelas Restantes) instead of searching for non-existent fields, now accurately displays the number of paid installments for each contract based on MultiCorban API data structure, removed debug logs and implemented clean calculation logic
- July 29, 2025. C6 Bank simulation interface enhancement: Created comprehensive "CONDIÇÕES DE CRÉDITO" section matching user-provided interface design with proper value display (Valor Solicitado, Valor Bruto using client_amount, Valor Líquido, Valor da Parcela, IOF, vencimentos, Tabela Utilizada), added detailed taxes section with CET calculations, implemented "Pacote SEGURO" display when insurance is selected, corrected value mappings to show accurate financial information based on API response structure instead of incorrect gross_amount field
- July 29, 2025. Fixed dashboard blocked loans counting: Corrected loan blocking status detection to recognize both "SIM" and "1" values from API (BloqueadoEmprestimo field), updated all three instances in server routes to properly identify blocked loans, ran database migration to fix existing consultation records that were incorrectly marked as unblocked, ensuring dashboard statistics now accurately count blocked (empréstimos bloqueados) and unblocked (empréstimos desbloqueados) loans
- July 29, 2025. Enhanced beneficiary data display with phone numbers: Updated schema to include Telefones array field from MULTI CORBAN API, implemented elegant phone number display in benefit details with formatted badges showing (XX) X XXXX-XXXX format, added Phone icon from lucide-react, ensured both CPF and benefit number queries display phone information consistently
- July 29, 2025. Fixed C6 Bank consultation timeout errors: Added 30-second timeout configuration to all C6 Bank API fetch requests to prevent connection timeout errors, improved error handling with specific messages for timeout situations, enhanced user feedback when API requests take longer than expected