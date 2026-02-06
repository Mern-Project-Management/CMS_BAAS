# File Index - Dynamic Schema Builder

Quick reference guide to all project files and their purposes.

## Documentation Files

### 📖 Main Documentation
- **README.md** - Complete project documentation, features, setup, and troubleshooting
- **QUICKSTART.md** - 5-minute quick start guide for getting up and running
- **ARCHITECTURE.md** - Detailed system architecture, design patterns, and data flows
- **PROJECT_SUMMARY.md** - High-level overview of what was built and features included
- **SETUP_CHECKLIST.md** - Step-by-step setup checklist with testing procedures
- **FILE_INDEX.md** - This file - index of all project files
- **.env.example** - Template for environment variables

## Configuration Files

### ⚙️ Build & Package Configuration
- **package.json** - Project dependencies and scripts
- **tsconfig.json** - TypeScript compiler configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **next.config.mjs** - Next.js configuration
- **.gitignore** - Git ignore patterns
- **postcss.config.mjs** - PostCSS configuration

## Source Code Structure

### 🎨 UI Components (`/components`)

#### Collection Management
- **create-collection-dialog.tsx** - Dialog for creating new collections
  - Form inputs for name, display_name, description, icon, color
  - Form validation
  - API submission handler

- **collections-list.tsx** - Grid display of all collections
  - Fetches collections from API
  - Displays in responsive grid
  - Delete with confirmation
  - Link to collection detail

#### Field Management
- **create-field-dialog.tsx** - Dialog for creating new fields
  - Field name and display name inputs
  - Field type selector
  - Rules panel integration
  - Validation rule configuration
  - API submission handler

- **fields-list.tsx** - Table display of collection fields
  - Shows all fields for a collection
  - Displays field type with icon
  - Shows applied rules as badges
  - Delete functionality
  - Expandable row details

- **field-type-selector.tsx** - Dropdown for selecting field types
  - Organized into groups (Basic, Date & Time, Media, Advanced)
  - Shows field type icons and descriptions
  - Keyboard accessible

- **field-rules-panel.tsx** - Configuration panel for field rules
  - Basic rules checkboxes (Required, Unique, Encrypted)
  - Validation rules management
  - Dynamic rule addition/removal
  - Rule type, value, and message inputs
  - Tabs for Basic Rules vs Validation

#### Schema & Preview
- **schema-preview.tsx** - Schema export in multiple formats
  - TypeScript interface generator
  - JSON Schema generator
  - SQL CREATE TABLE generator
  - Copy to clipboard
  - Download as file

### 📄 Pages (`/app`)

#### Main Pages
- **layout.tsx** - Root layout component
  - Metadata configuration
  - Font imports and setup
  - Global styling application

- **page.tsx** - Dashboard / Collections page
  - Header with title and description
  - Collections grid display
  - "New Collection" button
  - Server metadata setup

#### API Routes (`/app/api`)

##### Collections API (`/api/collections`)
- **route.ts** - Collections list and create
  - `GET /api/collections` - List all collections
  - `POST /api/collections` - Create new collection
  - Request validation
  - Error handling

- **[id]/route.ts** - Collection detail operations
  - `GET /api/collections/[id]` - Get collection with fields
  - `PATCH /api/collections/[id]` - Update collection
  - `DELETE /api/collections/[id]` - Delete collection
  - Request validation
  - Error handling

##### Fields API (`/api/fields`)
- **route.ts** - Fields list, create, and reorder
  - `GET /api/fields?collection_id=...` - List fields
  - `POST /api/fields` - Create new field
  - `PUT /api/fields` - Reorder fields
  - Request validation
  - Error handling

- **[id]/route.ts** - Field detail operations
  - `PATCH /api/fields/[id]` - Update field
  - `DELETE /api/fields/[id]` - Delete field
  - Request validation
  - Error handling

#### Collection Pages (`/app/collections/[id]`)
- **page.tsx** - Collection detail page
  - Collection header with icon and description
  - Fields table display
  - "Add Field" button
  - Collection information card
  - Schema preview section
  - Loading states and error handling
  - Client component with server side data fetch

### 📚 Library Files (`/lib`)

#### Database & Types
- **types.ts** - TypeScript type definitions
  - `Collection` interface
  - `Field` interface
  - `FieldType` union type
  - `ValidationRule` interface
  - Request/Response types
  - API Response wrapper type

- **db.ts** - Database client and utilities
  - Supabase client initialization
  - `getCollections()` - Fetch all collections
  - `getCollection(id)` - Fetch single collection with fields
  - `createCollection(data)` - Create new collection
  - `updateCollection(id, updates)` - Update collection
  - `deleteCollection(id)` - Delete collection
  - `getCollectionFields(collectionId)` - Fetch fields for collection
  - `createField(data)` - Create new field
  - `updateField(id, updates)` - Update field
  - `deleteField(id)` - Delete field
  - `reorderFields(fields)` - Batch update field ordering

#### Utilities
- **field-utils.ts** - Field helper functions and constants
  - `FIELD_TYPES` - Mapping of field types to labels and descriptions
  - `getFieldTypeIcon()` - Returns icon component for field type
  - `validateFieldName()` - Validates field name format
  - `validateCollectionName()` - Validates collection name format
  - `getValidationRuleLabel()` - Returns label for validation rule type
  - `formatCollectionName()` - Formats collection name for display
  - `formatFieldName()` - Formats field name for display

- **validation-engine.ts** - Comprehensive validation system
  - `validateFieldValue()` - Validate single field value
  - `validateRecord()` - Validate multiple fields at once
  - Type-specific validators:
    - `validateText()` - Text field validation
    - `validateNumber()` - Number field validation
    - `validateDate()` - Date field validation
    - `validateDateTime()` - DateTime field validation
    - `validateJSON()` - JSON field validation
    - `validateBoolean()` - Boolean field validation
    - `validateCustomRules()` - Custom rule validation
  - `validateUniqueConstraint()` - Check unique constraint
  - `ValidationResult` interface with errors array
  - `ValidationError` interface for error details

- **utils.ts** - General utility functions
  - `cn()` - Class name utility (already provided)

### 🪝 Hooks (`/hooks`)

- **use-toast.ts** - Toast notification hook
  - Already provided in starter template
  - Used for user feedback across app

- **use-mobile.tsx** - Mobile detection hook
  - Already provided in starter template
  - Can be used for responsive behaviors

### 🗄️ Database (`/scripts`)

- **setup-schema.sql** - Database initialization script
  - Creates `collections` table
  - Creates `fields` table
  - Creates `field_validations` table
  - Defines `field_type` enum with 9 types
  - Defines `field_rule` enum
  - Creates indexes for performance
  - Sets up RLS policies (public access for demo)
  - Total: ~120 lines of SQL

## Public Assets (`/public`)

- (Default Next.js public directory)
- Ready for images, icons, and static files

## Component Library (`/components/ui`)

Pre-installed shadcn/ui components:

- **Dialogs & Modals**
  - `dialog.tsx` - Modal component
  - `alert-dialog.tsx` - Confirmation dialog
  - `popover.tsx` - Popover component
  - `hover-card.tsx` - Hover card

- **Forms & Input**
  - `input.tsx` - Text input
  - `textarea.tsx` - Text area
  - `label.tsx` - Form label
  - `form.tsx` - Form wrapper
  - `checkbox.tsx` - Checkbox input
  - `radio-group.tsx` - Radio button group
  - `select.tsx` - Select dropdown
  - `toggle.tsx` - Toggle button
  - `toggle-group.tsx` - Group of toggles
  - `slider.tsx` - Range slider

- **Display & Layout**
  - `card.tsx` - Card container
  - `table.tsx` - Data table
  - `tabs.tsx` - Tab navigation
  - `accordion.tsx` - Accordion
  - `collapsible.tsx` - Collapsible section
  - `separator.tsx` - Visual separator
  - `badge.tsx` - Badge/label component
  - `avatar.tsx` - Avatar component

- **Navigation & Menus**
  - `button.tsx` - Button component
  - `dropdown-menu.tsx` - Dropdown menu
  - `navigation-menu.tsx` - Navigation menu
  - `menubar.tsx` - Menu bar
  - `breadcrumb.tsx` - Breadcrumb navigation
  - `pagination.tsx` - Pagination controls

- **Feedback & Status**
  - `alert.tsx` - Alert component
  - `progress.tsx` - Progress bar
  - `toast.tsx` - Toast notification
  - `toaster.tsx` - Toast container
  - `skeleton.tsx` - Loading skeleton

- **Utilities**
  - `command.tsx` - Command palette
  - `context-menu.tsx` - Right-click menu
  - `drawer.tsx` - Side drawer
  - `input-otp.tsx` - OTP input
  - `scroll-area.tsx` - Scrollable area
  - `sheet.tsx` - Side sheet
  - `tooltip.tsx` - Tooltip
  - `chart.tsx` - Chart components
  - `carousel.tsx` - Image carousel
  - `resizable.tsx` - Resizable panels
  - `aspect-ratio.tsx` - Aspect ratio container

## Project Statistics

### Lines of Code
- Components: ~2,000+ lines
- Pages: ~250+ lines
- API Routes: ~180+ lines
- Database Utilities: ~250+ lines
- Validation Engine: ~330+ lines
- Type Definitions: ~100+ lines
- **Total Application Code: ~3,100+ lines**

### Features Implemented
- Collections: 5 operations (CRUD + list)
- Fields: 5 operations (CRUD + list + reorder)
- Field Types: 9 types
- Validation Rules: 7+ types
- Export Formats: 3 formats (TS, JSON, SQL)
- UI Components: 7 custom components

### Database Tables
- collections: 1
- fields: 1
- field_validations: 1
- **Total Tables: 3**

## File Organization Best Practices

### Component Files
- One component per file
- Logical grouping by feature
- Clear, descriptive names
- Proper TypeScript types

### API Routes
- One endpoint per file
- Clear HTTP method handling
- Input validation
- Error responses with status codes

### Library Files
- Grouped by functionality
- Pure functions where possible
- Comprehensive exports
- Well-documented functions

### Types
- Centralized in `lib/types.ts`
- Reused across components
- Proper TypeScript interfaces
- Clear naming conventions

## Dependencies Overview

### Core Dependencies
- next@16.0.7
- react@^19
- react-dom@^19
- typescript@5.7.3

### UI & Styling
- tailwindcss@^3.4.17
- @tailwindcss/postcss@^4.1.13
- class-variance-authority@^0.7.1
- lucide-react@^0.544.0

### Database
- @supabase/supabase-js@^2.45.0

### Forms & Validation
- react-hook-form@^7.54.1
- @hookform/resolvers@^3.9.1
- zod@^3.24.1

### Utilities
- clsx@^2.1.1
- tailwind-merge@^2.5.5
- date-fns@4.1.0

### Notifications
- sonner@^1.7.1

### UI Component Libraries
- @radix-ui/* (30+ components)

## Total Files Count

- **Documentation**: 6 files
- **Configuration**: 6 files
- **Components**: 7 custom + 44 UI = 51 files
- **Pages**: 3 files
- **API Routes**: 4 files
- **Library**: 4 files
- **Hooks**: 2 files
- **Scripts**: 1 file
- **Total**: ~80+ files

---

This index provides a complete roadmap of the Dynamic Schema Builder project. For detailed information about any file or component, refer to the documentation files and inline code comments.
