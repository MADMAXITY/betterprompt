# Better Prompt - AI Prompt Library & Builder

## Overview

Better Prompt is a full-stack web application that serves as a comprehensive library and builder for AI prompts. The platform allows users to discover, save, and create high-quality prompts for various AI applications. It features a modern React frontend with a Node.js/Express backend, providing both a curated prompt library and AI-powered prompt generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Data Persistence**: Local Storage for client-side data (saved prompts, user-created prompts)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with structured error handling
- **Storage Strategy**: In-memory storage implementation with interface-based design for easy database migration
- **AI Integration**: OpenAI API integration for prompt generation and refinement

### Component Structure
- **Pages**: Home (prompt library), AI Builder (prompt creation), My Prompts (saved/user prompts)
- **Builders**: Three prompt creation modes - Simple form, Wizard-guided, and Chat-based
- **Modals**: Prompt editor, AI editing capabilities
- **Navigation**: Responsive design with desktop navigation bar and mobile bottom navigation

### Data Models
- **Categories**: Organize prompts by type (Writing, Coding, Marketing, Business, Education)
- **Prompts**: Core content with metadata (title, description, content, category, views, likes)
- **Users**: Basic user system for future authentication
- **Saved Prompts**: User collections and favorites

### AI Service Features
- **Prompt Generation**: Create prompts based on user goals and context
- **Prompt Refinement**: AI-powered editing and improvement suggestions
- **Multi-mode Creation**: Support for different creation workflows (simple, wizard, conversational)

## External Dependencies

### Database & ORM
- **Drizzle ORM**: Type-safe database interactions with PostgreSQL dialect
- **PostgreSQL**: Primary database (configured but using in-memory storage initially)
- **Neon Database**: Serverless PostgreSQL provider integration

### AI Services
- **OpenAI API**: GPT models for prompt generation and refinement
- **API Integration**: Structured request/response handling for AI operations

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Component carousels and sliders

### Development Tools
- **Vite**: Fast development server and build tool with React plugin
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment plugins and error handling

### Form & Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation and type inference
- **Drizzle-Zod**: Integration between Drizzle schemas and Zod validation

### Utilities
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Type-safe CSS class variants
- **CLSX**: Conditional class name utility
- **Nanoid**: Unique ID generation