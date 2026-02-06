# Dynamic Schema Builder - Architecture & Design

## System Overview

The Dynamic Schema Builder is a Next.js full-stack application that allows users to create and manage data schemas dynamically without database migrations. The system is divided into three main layers:

```
┌─────────────────────────────────────────┐
│      Presentation Layer (UI)            │
│  React Components + Tailwind CSS         │
├─────────────────────────────────────────┤
│      API Layer (Next.js Routes)         │
│  RESTful API Endpoints                  │
├─────────────────────────────────────────┤
│      Data Layer (Supabase)              │
│  PostgreSQL Database                    │
└─────────────────────────────────────────┘
```

## Component Architecture

### 1. Pages

#### `/app/page.tsx` - Dashboard
- **Purpose**: Main entry point showing all collections
- **Features**: 
  - List all collections in a grid layout
  - "New Collection" button
  - Quick access to each collection
- **State**: Server-rendered with client-side fetching

#### `/app/collections/[id]/page.tsx` - Collection Detail
- **Purpose**: Manage fields within a collection
- **Features**:
  - Display collection info
  - List all fields in a table
  - "Add Field" button
  - Schema preview and export
- **State**: Client component with useParams and useRouter

### 2. UI Components

#### Collections Management
```
CreateCollectionDialog
├── Form inputs
│   ├── Name
│   ├── Display Name
│   ├── Description
│   ├── Icon
│   └── Color
└── Submit handler → POST /api/collections

CollectionsList
├── Fetches collections
├── Grid layout
└── Actions
    ├── Open → Link to detail page
    └── Delete → AlertDialog
```

#### Field Management
```
CreateFieldDialog
├── Form inputs
│   ├── Name
│   ├── Display Name
│   ├── Field Type Selector
│   └── Description
├── FieldRulesPanel
│   ├── Basic Rules (Required, Unique, Encrypted)
│   └── Custom Validation Rules
└── Submit handler → POST /api/fields

FieldsList
├── Table with field details
└── Actions
    ├── Edit (future implementation)
    └── Delete → AlertDialog
```

#### Supporting Components
```
FieldTypeSelector
├── Dropdown menu
├── Grouped field types
└── Type descriptions & icons

FieldRulesPanel
├── Tabs: Basic Rules | Validation
├── Checkboxes for basic rules
└── Dynamic validation rule editor

SchemaPreview
├── Tabs: TypeScript | JSON | SQL
├── Copy button
└── Download button
```

### 3. Type System

```typescript
// Core types
interface Collection {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  fields?: Field[];
}

interface Field {
  id: string;
  collection_id: string;
  name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
  is_required: boolean;
  is_unique: boolean;
  is_encrypted: boolean;
  validation_rules: ValidationRule[];
  default_value?: string;
  field_order: number;
  relation_to_collection?: string;
  created_at: string;
  updated_at: string;
}

type FieldType = 'Text' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 
                 'File' | 'Image' | 'JSON' | 'Relation';

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'length' | 'email' | 'url' | 'custom';
  value?: string | number;
  message?: string;
}
```

## API Layer Design

### API Endpoints Structure

```
/api
├── /collections
│   ├── GET    → List all collections
│   ├── POST   → Create collection
│   └── /[id]
│       ├── GET    → Get collection with fields
│       ├── PATCH  → Update collection
│       └── DELETE → Delete collection
└── /fields
    ├── GET    → List fields by collection_id
    ├── POST   → Create field
    ├── PUT    → Reorder fields
    └── /[id]
        ├── PATCH  → Update field
        └── DELETE → Delete field
```

### Request/Response Format

**Request:**
```json
{
  "name": "users",
  "display_name": "Users",
  "description": "User accounts",
  "icon": "👤",
  "color": "#3B82F6"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "users",
    ...
  },
  "message": "Collection created successfully"
}
```

## Validation Engine

### Validation Flow

```
Input Value
    ↓
TypeValidation (Check field_type)
    ↓
RequiredValidation (Check is_required)
    ↓
ConstraintValidation (Check is_unique, is_encrypted)
    ↓
RuleValidation (Apply validation_rules)
    ↓
ValidationResult {
  valid: boolean,
  errors: ValidationError[]
}
```

### Validation Rules

```typescript
// Text Validation
- length: exact length
- min: minimum length
- max: maximum length
- pattern: regex matching
- email: email format
- url: URL format

// Number Validation
- min: minimum value
- max: maximum value

// Date/DateTime
- ISO format validation
- Date object support

// JSON
- Valid JSON parsing

// Custom
- Extensible validation system
```

## Database Schema Design

### Collections Table
- **Purpose**: Store collection definitions
- **Keys**: id (UUID), name (unique), display_name
- **Relationships**: One-to-many with fields

### Fields Table
- **Purpose**: Store field definitions
- **Keys**: id (UUID), collection_id (FK), name (unique per collection)
- **Relationships**: Many-to-one with collections

### Field Validations Table
- **Purpose**: Store validation rules
- **Keys**: id (UUID), field_id (FK)
- **Relationships**: Many-to-one with fields

### Indexes
```sql
-- Query performance optimization
CREATE INDEX idx_fields_collection_id ON fields(collection_id);
CREATE INDEX idx_field_validations_field_id ON field_validations(field_id);
CREATE INDEX idx_collections_name ON collections(name);
```

## Data Flow Diagrams

### Creating a Collection
```
User Input (CreateCollectionDialog)
    ↓
Form Validation (Client-side)
    ↓
POST /api/collections
    ↓
Server Validation
    ↓
Supabase Insert (collections table)
    ↓
Response with New Collection ID
    ↓
Update UI (CollectionsList)
    ↓
Navigate to Collection Detail
```

### Adding a Field
```
User Input (CreateFieldDialog)
    ↓
Form Validation (Client-side)
    ↓
FieldRulesPanel Configuration
    ↓
POST /api/fields
    ↓
Server Validation
    ↓
Supabase Insert (fields + field_validations tables)
    ↓
Response with New Field
    ↓
Refresh FieldsList
    ↓
Update SchemaPreview
```

### Schema Export
```
User clicks "Download"
    ↓
Generate based on tab:
├─ TypeScript: Map field_type → TS type
├─ JSON: Create JSON Schema document
└─ SQL: Generate CREATE TABLE statement
    ↓
Create Blob from content
    ↓
Download or Copy to Clipboard
```

## State Management Strategy

### Global State (if needed)
- Could use React Context for:
  - Current collection
  - Current fields
  - Toast notifications (via custom hook)

### Component State
- Form inputs: useState
- Loading states: useState
- Modals: useState(open)
- Lists: useState with fetch on mount

### Server State
- Supabase client handles caching
- SWR could be added for optimized fetching
- Revalidation on mutations

## Error Handling

### Client-Side
```typescript
try {
  const response = await fetch(...);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error);
  }
  
  // Success handling
} catch (error) {
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive'
  });
}
```

### Server-Side
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.required_field) {
      return NextResponse.json(
        { success: false, error: 'Required field missing' },
        { status: 400 }
      );
    }
    
    // Database operation
    const { data, error } = await supabase.from('table').insert(body);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Performance Considerations

### Frontend
- **Code Splitting**: Each page/component is lazy-loaded
- **Image Optimization**: Lucide icons are SVG (no images)
- **CSS-in-JS**: Tailwind for optimal bundle size
- **API Caching**: Supabase client provides caching

### Backend
- **Database Indexes**: Optimized queries with indexes
- **Query Optimization**: Select only needed columns
- **N+1 Prevention**: Use single queries with relations
- **Connection Pooling**: Supabase handles automatically

### Optimization Opportunities
- Implement SWR for better caching
- Add pagination for large datasets
- Use debouncing for search/filter
- Implement virtual scrolling for large lists

## Security Architecture

### Row Level Security (RLS)
```sql
-- Current: Public access (for demo)
-- Production: Implement user-based RLS
CREATE POLICY "Users can view their own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);
```

### Data Protection
- **Encrypted Fields**: Mark with `is_encrypted` flag
- **Unique Constraints**: Database-level enforcement
- **Type Validation**: Client and server validation
- **Input Sanitization**: Automatic with Supabase

### API Security
- **Rate Limiting**: Can be added with middleware
- **CORS**: Next.js handles by default
- **HTTPS Only**: Enforced in production

## Testing Strategy

### Unit Tests
- Validation engine functions
- Field utility functions
- Type conversions

### Integration Tests
- API endpoints
- Database operations
- Supabase interactions

### E2E Tests
- Create collection flow
- Add field flow
- Export schema flow

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] RLS policies configured for security
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] CDN cache configured
- [ ] Logging and monitoring setup

## Future Architecture Enhancements

1. **Multi-tenancy**: Add organization/workspace support
2. **Caching**: Implement Redis for performance
3. **Event System**: WebSocket for real-time updates
4. **Plugin System**: Allow custom field types
5. **GraphQL**: Add GraphQL API alongside REST
6. **Audit Trail**: Track all schema changes
7. **Versioning**: Support schema versions
8. **Collaboration**: Real-time editing features

---

This architecture provides a scalable, maintainable foundation for the Dynamic Schema Builder with room for growth and enhancement.
