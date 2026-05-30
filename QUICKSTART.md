# Quick Start Guide - Dynamic Schema Builder

Get your Dynamic Schema Builder up and running in 5 minutes!

## Step 1: Set Up MongoDB (2 minutes)

1. Create a MongoDB database (MongoDB Atlas is easiest)
2. Create a database user with read/write access
3. Copy the connection string (URI)

## Step 2: Configure Environment (1 minute)

1. Create `.env.local` in your project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/jayshree_blogs?retryWrites=true&w=majority
MONGODB_DB=jayshree_blogs
```

## Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [https://branduntold.vercel.app](https://branduntold.vercel.app) in your browser.

## First Steps

### 1. Create a Collection
- Click **"New Collection"** button
- Enter name: `users` (lowercase, underscores)
- Display name: `Users`
- Add a description (optional)
- Click **"Create Collection"**

### 2. Add Fields
- Click on the `Users` collection card
- Click **"Add Field"** button
- Create these fields:

| Field Name | Display Name | Type | Rules |
|------------|-------------|------|-------|
| email | Email | Text | Required, Unique |
| full_name | Full Name | Text | Required |
| age | Age | Number | (optional) |
| is_active | Active | Boolean | (optional) |
| created_at | Created At | DateTime | (optional) |

### 3. View Schema
- Scroll down to **"Schema Preview & Export"**
- View your schema in TypeScript, JSON, or SQL
- Click **"Download"** to get the schema file

## Common Tasks

### Export Schema as TypeScript
```
1. Open a collection
2. Scroll to "Schema Preview & Export"
3. Click TypeScript tab
4. Click "Download"
5. Use in your project!
```

### Add Validation Rule
```
1. Click "Add Field"
2. Select field type
3. Go to "Validation" tab
4. Click "Add Rule"
5. Choose rule type and add message
```

### Delete a Field
```
1. Open collection
2. Find the field in the table
3. Click the trash icon
4. Confirm deletion
```

## Next: Connect to Your App

### Using in React/Next.js

1. Download the schema as TypeScript
2. Create a file: `types/schema.ts`
3. Paste the downloaded TypeScript interface
4. Use in your components:

```typescript
import type { Users } from '@/types/schema';

export function UserProfile() {
  const user: Users = {
    email: 'user@example.com',
    full_name: 'John Doe',
  };
  
  return <div>{user.full_name}</div>;
}
```

### Using SQL Export

1. Download the schema as SQL
2. Run in your database to create tables
3. Use with any SQL client or ORM

## Troubleshooting

### "Supabase credentials not configured"
- Make sure `.env.local` has correct values
- Restart dev server: `npm run dev`
- Check environment variables are set

### Can't create collection
- Ensure database is initialized (run SQL script)
- Check browser console for error details
- Verify Supabase credentials are correct

### Fields not showing
- Refresh the page
- Check collection ID in URL
- Verify fields were saved (check console)

## Demo Collections

Try creating these example schemas:

### Blog Schema
- **Collections**: `posts`, `categories`, `comments`
- **Fields**: title, content, author, published_date, category_id

### E-commerce Schema
- **Collections**: `products`, `categories`, `orders`, `customers`
- **Fields**: name, price, description, stock, category_id

### Social Media Schema
- **Collections**: `users`, `posts`, `likes`, `comments`, `follows`
- **Fields**: username, bio, content, timestamp, user_id

## Key Features to Explore

1. **Field Types** - 9 different types (Text, Number, Boolean, Date, DateTime, File, Image, JSON, Relation)
2. **Validation Rules** - Min/max, patterns, email, URL, custom messages
3. **Field Rules** - Required, Unique, Encrypted
4. **Schema Export** - TypeScript, JSON Schema, SQL
5. **Dynamic Creation** - No migrations needed!

## Performance Tips

- Keep collections under 50 fields each
- Use meaningful names for easy filtering
- Add descriptions to complex fields
- Organize fields logically

## Security Notes

- Use `NEXT_PUBLIC_` prefix only for public info
- Store secret keys in `.env.local` (never commit!)
- Enable RLS in Supabase for multi-user apps
- Encrypt sensitive fields

## Need Help?

- Check the main [README.md](./README.md) for detailed docs
- Review the source code comments
- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Open an issue on GitHub

## What's Next?

After setting up, you can:

1. **Integrate with your app** - Use exported TypeScript interfaces
2. **Create more collections** - Build complex data models
3. **Add validation** - Ensure data quality
4. **Export schemas** - Generate SQL or TypeScript
5. **Collaborate** - Share collections with team

Happy building! 🚀
