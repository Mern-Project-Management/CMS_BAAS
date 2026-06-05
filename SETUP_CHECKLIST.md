# Setup Checklist - Dynamic Schema Builder

Follow this checklist to get your Dynamic Schema Builder running in minutes.

## Pre-Setup (5 minutes)

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] MongoDB ready (Atlas or local)
- [ ] Text editor or IDE ready (VS Code recommended)

## Step 1: MongoDB Setup (3 minutes)

- [ ] Create a MongoDB database (Atlas recommended)
- [ ] Create a DB user with read/write permissions
- [ ] Copy the connection string (URI)
- [ ] Ensure network access (allow your IP, or use local MongoDB)

## Step 2: Configure Environment (1 minute)

- [ ] Open project root in your editor
- [ ] Create file `.env.local` (if not exists)
- [ ] Paste these lines:
```env
MONGODB_URI=paste_your_mongodb_connection_string_here
MONGODB_DB=jayshree_blogs
```
- [ ] Replace values with your actual MongoDB connection string
- [ ] Save the file
- [ ] **IMPORTANT**: Never commit `.env.local` to git!

## Step 5: Install Dependencies (1 minute)

```bash
# Open terminal in project directory
npm install

# Or if using yarn
yarn install
```

- [ ] Dependencies installed successfully
- [ ] No error messages in output
- [ ] `node_modules` folder created

## Step 6: Run Development Server (1 minute)

```bash
npm run dev
```

- [ ] Server started successfully
- [ ] Output shows: "Local: https://branduntold.in"
- [ ] No red error messages

## Step 7: Access Application (1 minute)

- [ ] Open browser
- [ ] Go to `https://branduntold.in`
- [ ] Page loads without errors
- [ ] See "Dynamic Schema Builder" heading
- [ ] See "New Collection" button

## ✅ Initial Setup Complete!

Congratulations! Your Dynamic Schema Builder is running. Now test it:

## Test Basic Functionality

### Test 1: Create a Collection
- [ ] Click "New Collection" button
- [ ] Enter name: `users`
- [ ] Enter display name: `Users`
- [ ] Add description: `User accounts`
- [ ] Choose icon: 👤
- [ ] Choose color: Blue
- [ ] Click "Create Collection"
- [ ] See success toast
- [ ] Collection appears in grid

### Test 2: Open Collection
- [ ] Click on the "Users" collection card
- [ ] See collection detail page
- [ ] See "Add Field" button
- [ ] See collection info at bottom

### Test 3: Add a Field
- [ ] Click "Add Field"
- [ ] Enter name: `user_email`
- [ ] Enter display: `User Email`
- [ ] Select type: `Text`
- [ ] Go to "Basic Rules" tab
- [ ] Check "Required"
- [ ] Check "Unique"
- [ ] Click "Create Field"
- [ ] See success toast
- [ ] Field appears in table

### Test 4: Add Another Field
- [ ] Click "Add Field" again
- [ ] Name: `full_name`
- [ ] Display: `Full Name`
- [ ] Type: `Text`
- [ ] Check "Required"
- [ ] Click "Create Field"
- [ ] Field appears in table

### Test 5: Export Schema
- [ ] Scroll down to "Schema Preview & Export"
- [ ] Click "TypeScript" tab
- [ ] See TypeScript interface
- [ ] Click "Copy" button
- [ ] See "Copied" toast
- [ ] Try "Download" button
- [ ] File downloads to computer

### Test 6: Try SQL Export
- [ ] Click "SQL" tab
- [ ] See CREATE TABLE statement
- [ ] Click "Copy"
- [ ] See "Copied" toast

### Test 7: Delete Field
- [ ] Find field in table
- [ ] Click trash icon
- [ ] Click "Delete" in confirmation dialog
- [ ] See success toast
- [ ] Field removed from table

## Troubleshooting Checklist

### Issue: "Missing MONGODB_URI environment variable"
- [ ] `.env.local` file exists
- [ ] `MONGODB_URI` is set
- [ ] If using Atlas, your IP is allowed in Network Access
- [ ] Restarted dev server after changing `.env.local`

### Issue: Can't create collections
- [ ] Supabase project is running
- [ ] Database tables created (check in Supabase)
- [ ] No network errors in browser console (F12)
- [ ] Credentials are correct

### Issue: Fields not saving
- [ ] Check browser console for errors (F12)
- [ ] Check Network tab to see API response
- [ ] Verify collection ID in URL is correct
- [ ] Try refreshing page

### Issue: Page shows blank/loading forever
- [ ] Check if dev server is running
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Try incognito/private window
- [ ] Check browser console for errors
- [ ] Restart dev server

### Issue: Form validation errors
- [ ] Collection names: lowercase, alphanumeric, underscores only
- [ ] Display names: can use spaces and capitals
- [ ] Field names: same as collection names
- [ ] Check for duplicate names in same collection

## Next Steps After Setup

### Option 1: Explore Features
- [ ] Create multiple collections
- [ ] Add various field types
- [ ] Experiment with validation rules
- [ ] Test all export formats

### Option 2: Read Documentation
- [ ] Read `QUICKSTART.md` for common tasks
- [ ] Read `ARCHITECTURE.md` for system design
- [ ] Read `README.md` for complete reference
- [ ] Review component comments in code

### Option 3: Build Your Schema
- [ ] Plan your data structure
- [ ] Create collections for your use case
- [ ] Add all necessary fields
- [ ] Export schema for your app
- [ ] Use TypeScript interface in your code

## Performance Tips

- [ ] Keep field count under 50 per collection
- [ ] Use meaningful field and collection names
- [ ] Add descriptions for clarity
- [ ] Test schema before using in production

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Don't share API keys in public
- [ ] Consider enabling RLS in Supabase for production
- [ ] Mark sensitive fields as "Encrypted"

## Production Deployment

When ready to deploy:

- [ ] Set environment variables in your hosting platform
- [ ] Enable Supabase RLS policies
- [ ] Test all features in production environment
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Test recovery process
- [ ] Document deployment steps

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build           # Create production build
npm start              # Start production server

# Linting
npm run lint           # Run ESLint

# Clean
rm -rf .next          # Clear Next.js cache
rm -rf node_modules   # Clear dependencies
npm install           # Reinstall dependencies
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Open command palette (if configured)
- `F12` - Open browser dev tools
- `Ctrl/Cmd + Shift + Delete` - Clear cache
- `Ctrl/Cmd + R` - Hard refresh

## Common Questions

**Q: Do I need to run migrations?**
A: No! The setup script handles everything.

**Q: Can I change field types after creation?**
A: Yes, edit the field (future feature) or delete and recreate.

**Q: How do I backup my schema?**
A: Download the TypeScript export or SQL export.

**Q: Can multiple users use this?**
A: Yes, with RLS enabled in Supabase (production setup).

**Q: Where do I store field data?**
A: You need to create your own data tables. This tool helps you design them.

**Q: Can I use this in production?**
A: Yes! Enable RLS and proper authentication.

## Support Resources

1. **Supabase Docs**: https://supabase.com/docs
2. **Next.js Docs**: https://nextjs.org/docs
3. **React Docs**: https://react.dev
4. **Tailwind Docs**: https://tailwindcss.com
5. **shadcn/ui**: https://ui.shadcn.com

## Success Indicators

You've successfully set up the Dynamic Schema Builder when:

✅ Development server runs without errors  
✅ Dashboard page loads at localhost:3000  
✅ Can create collections  
✅ Can add fields to collections  
✅ Can export schemas in multiple formats  
✅ No console errors (F12)  
✅ All toast notifications appear  

## You're All Set! 🎉

Your Dynamic Schema Builder is ready to use. Start creating your data schemas and exporting them to your projects!

For detailed usage instructions, see **QUICKSTART.md**.

---

**Need Help?**
- Check troubleshooting section above
- Review the documentation files
- Check browser console for error messages
- Verify Supabase credentials are correct
