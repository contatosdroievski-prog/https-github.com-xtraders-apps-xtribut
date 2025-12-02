# Recriar Plataforma de Tributação

## Overview
A tax calculation platform for the American market with Firebase authentication and real-time data from BCB (Brazilian Central Bank). This is a React + Vite application with a premium dark gold/black theme using Tailwind CSS.

## Project Structure
- **Frontend**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom glassmorphism theme
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **UI Components**: Radix UI primitives with custom styling
- **Charts**: Chart.js and Recharts
- **PDF Export**: jsPDF with auto-table support

## Key Features
- User authentication (login/register)
- Payment verification system
- Tax calculations for IR (Income Tax), Cambial, and Wrapped operations
- Interactive charts and data visualization
- Compact calendar component
- Export functionality (PDF)
- Guided tour for new users
- Terms and conditions modal

## Configuration
- **Dev Server**: Runs on port 5000
- **Firebase**: Pre-configured with project credentials
- **Build Output**: `build` directory

## Recent Changes (November 10, 2025)
- Initial setup in Replit environment
- Configured Vite to use port 5000 and allow all hosts for Replit proxy
- Added TypeScript configuration
- Fixed Tailwind CSS setup with proper directives
- Fixed date-fns version compatibility with react-day-picker
- Added module type to package.json
- Created .gitignore for Node.js project

### XTRADERS REPORT Feature (Latest Update)
- **7 Story-Style Cards**: Created carousel with 7 animated cards (540x800px each)
  - Card 1: XTRADERS Intro with black background (#0D0D0D), gold border, vertical layout with "XTRADERS" text at top, giant gold logo X (350px) in center with radial glow effect, and "REPORT" text at bottom - matches user's print reference
  - Card 2: Annual Overview (net result + total trades + active months)
  - Card 3: Performance metrics with golden background (win rate, trades, avg win/loss)
  - Card 4: Top 5 Assets ranking
  - Card 5: Monthly Evolution chart with best/worst months
  - Card 6: Month-by-Month grid showing best asset per month
  - Card 7: Final Summary with metrics and mini chart
- **Carousel Implementation**: Professional 3D circular carousel
  - 3-layer layout: header (title/subtitle) + main carousel stage + footer (export button)
  - **3D Circular Effect**: CSS perspective (1200px) with transform-style preserve-3d
  - **Infinite Loop**: Continuous navigation from last to first card
  - **Visual Effects**: rotateY, translateZ, scale, blur progressivo baseados em offset circular
  - **CSS Module Architecture**: CSS custom properties (--offset, --abs-offset, --direction, --opacity)
  - **useCarousel3dOffsets Hook**: RAF batching for performance, loop-aware offset calculation
  - Container widened to 1400px to show lateral cards without clipping
  - Z-index dynamic: `calc(100 - var(--abs-offset) * 10)` keeps active card on top
  - Centered progress dots with 6px spacing
  - Smooth transitions (300ms ease)
  - **Optimized PNG Export**: Hybrid neutralization system
    - Refs: cardRefs (3D effects) vs cardExportRefs (html2canvas targeting visual cards)
    - onclone: Injects CSS override + cleans ancestor transforms
    - Output: 1620x2400px high-quality PNG (scale 3x) matching app layout exactly
    - Fonts: Awaits document.fonts.ready before capture
- **Card Architecture**: Flexbox/Grid layouts (no absolute positioning)
  - All cards use flex/grid for responsive, maintainable layouts
  - Consistent 32px padding (p-8) across all cards
  - Golden borders (#D4AF37, border-2) with 43px radius
  - Proper spacing hierarchy with mb-auto and gap utilities
- **Data Integration**: All cards use real trade data from Firestore
  - Fields: `resultado_liquido_brl`, `ativo`, `mes_ano`, `data_iso`
  - Aggregated statistics: win rate, profit factor, best/worst assets and months
- **Visual Design**: Premium dark theme with gold accents
  - Sora font family with precise typography (16px-58px)
  - Colors: #D4AF37 (gold), #0D0D0D/#191919 (dark backgrounds)
  - Gradient backgrounds: from-[#0D0D0D] via-[#191919] to-[#0D0D0D]
  - All content properly contained within cards, no overflow

## Development
Run `npm run dev` to start the development server on port 5000.

## User Preferences
None documented yet.

## Architecture Notes
- Uses Firebase for authentication and user data storage
- Payment verification checks Firestore for paid status
- BCB API integration for currency/tax data
- Multi-tab interface for different calculation types
