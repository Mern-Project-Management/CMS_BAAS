# Dynamic Schema Builder

A powerful Next.js application for creating and managing data schemas dynamically without database migrations. Built with TypeScript, MongoDB, and modern React patterns.

## Features

### Collections Management
- Create collections (tables) dynamically
- Organize collections with icons, colors, and descriptions
- View and manage all collections from a centralized dashboard
- Delete collections with confirmation dialogs

### Dynamic Field Definition
- Support for 9 field types:
  - **Text**: Single or multi-line text
  - **Number**: Integer or decimal numbers
  - **Boolean**: True/false values
  - **Date**: Date without time
  - **DateTime**: Date with time
  - **File**: File upload field
  - **Image**: Image upload field
  - **JSON**: Structured JSON data
  - **Relation**: Links to other collections

### Field Rules & Validation
- **Required**: Mark fields as mandatory
- **Unique**: Enforce unique constraints
- **Encrypted**: Mark sensitive fields for encryption
- **Custom Validation**: Add multiple validation rules:
  - Min/Max constraints
  - Pattern matching
  - Email/URL validation
  - Custom error messages

### Schema Export & Preview
- **TypeScript Interfaces**: Generate TypeScript types
- **JSON Schema**: Full JSON Schema validation format
- **SQL**: Generate CREATE TABLE statements
- **Copy & Download**: Export in multiple formats

### Validation Engine
- Client-side field validation
- Type checking
- Rule enforcement
- Comprehensive error messages

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (Atlas or local)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd schema-builder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up MongoDB**

   a. Create a MongoDB database (Atlas recommended) and a user with access
   
   b. Copy your connection string (URI)

4. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/CMS?retryWrites=true&w=majority
MONGODB_DB=CMS
```
 
Keep `MONGODB_URI` secret (do not commit it).

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard page
│   ├── api/
│   │   ├── collections/        # Collections API routes
│   │   └── fields/             # Fields API routes
│   └── collections/[id]/       # Collection detail page
├── components/
│   ├── create-collection-dialog.tsx
│   ├── collections-list.tsx
│   ├── create-field-dialog.tsx
│   ├── fields-list.tsx
│   ├── field-type-selector.tsx
│   ├── field-rules-panel.tsx
│   └── schema-preview.tsx
├── lib/
│   ├── db.ts                   # Database utilities
│   ├── types.ts                # TypeScript types
│   ├── field-utils.ts          # Field utilities
│   ├── validation-engine.ts    # Validation logic
│   └── utils.ts                # General utilities
└── scripts/
    └── setup-schema.sql        # Database schema
```

## Database Schema

### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Fields Table
```sql
CREATE TABLE fields (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  field_type field_type NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}',
  default_value TEXT,
  field_order INTEGER,
  relation_to_collection UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection_id, name)
);
```

## API Endpoints

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/[id]` - Get collection with fields
- `PATCH /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

### Fields
- `GET /api/fields?collection_id=...` - List fields for collection
- `POST /api/fields` - Create new field
- `PATCH /api/fields/[id]` - Update field
- `DELETE /api/fields/[id]` - Delete field
- `PUT /api/fields` - Reorder fields

## Usage Guide

### Creating a Collection
1. Click "New Collection" button on the dashboard
2. Enter collection name (lowercase, alphanumeric, underscores)
3. Add display name and optional description
4. Choose an icon and color (optional)
5. Click "Create Collection"

### Adding Fields
1. Open a collection by clicking on it
2. Click "Add Field" button
3. Enter field name and display name
4. Select field type from dropdown
5. Configure field rules (required, unique, encrypted)
6. Add validation rules if needed
7. Click "Create Field"

### Field Validation Rules

#### Text Fields
- **Min/Max Length**: Limit text length
- **Pattern**: Regex validation
- **Email**: Email format validation
- **URL**: URL format validation

#### Number Fields
- **Min/Max**: Set number boundaries

#### Custom Rules
- Add custom validation messages
- Create multiple rules per field

### Exporting Schemas

1. Navigate to a collection with fields
2. Scroll to "Schema Preview & Export" section
3. Choose format: TypeScript, JSON Schema, or SQL
4. Click "Copy" to copy to clipboard or "Download" to get file

## Validation Engine

The validation engine provides:

- **Type Checking**: Ensures values match field types
- **Required Validation**: Checks mandatory fields
- **Constraint Validation**: Enforces unique, min/max constraints
- **Format Validation**: Email, URL, pattern matching
- **Custom Messages**: User-friendly error messages

Example usage:
```typescript
import { validateRecord } from '@/lib/validation-engine';

const errors = validateRecord(data, fields);
if (!errors.valid) {
  console.log(errors.errors); // Array of validation errors
}
```

## Features Roadmap

- [ ] Dynamic data table viewer
- [ ] Data import/export (CSV, JSON)
- [ ] Advanced permissions system
- [ ] Webhook support for field changes
- [ ] Field versioning and history
- [ ] Bulk field operations
- [ ] Custom field types plugin system
- [ ] GraphQL API generation
- [ ] Real-time collaboration features

## Best Practices

1. **Naming Conventions**
   - Use snake_case for field and collection names
   - Use PascalCase for display names
   - Keep names short and descriptive

2. **Field Organization**
   - Order fields logically
   - Group related fields together
   - Use descriptions for clarity

3. **Validation**
   - Add required validation for mandatory fields
   - Use unique constraints for identifiers
   - Encrypt sensitive data fields

4. **Schema Design**
   - Plan your schema before creating fields
   - Consider future extensibility
   - Use relations for data normalization

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is set in `.env.local`
- If using Atlas, confirm your IP is allowed in Network Access
- Confirm the DB name (`MONGODB_DB`) matches the database you want to use

### Field Creation Errors
- Field names must be unique within a collection
- Use only alphanumeric characters and underscores
- Check field type is valid

### Validation Engine
- Ensure validation rules are properly formatted
- Check field types match validation rule types
- Test with sample data before deploying

## Performance Tips

- Keep collections focused on specific data types
- Limit validation rules to necessary constraints
- Use indexes on frequently queried fields
- Consider field pagination for large datasets

## Security Considerations

- Enable RLS (Row Level Security) in Supabase for multi-user support
- Use encrypted fields for sensitive data
- Validate all inputs server-side
- Store secrets in environment variables only

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT License - feel free to use in your projects.

## Support

For issues, questions, or suggestions:
1. Check existing documentation
2. Review the codebase comments
3. Open an issue on GitHub
4. Contact the development team

## Changelog

### v1.0.0 (Initial Release)
- Collections management
- Dynamic field creation
- 9 field types support
- Validation rules system
- Schema export (TypeScript, JSON, SQL)
- Comprehensive validation engine

---

Happy schema building! 🚀
#   C M S _ B A A S  
 #   O S T E C H _ A D M I N  
 