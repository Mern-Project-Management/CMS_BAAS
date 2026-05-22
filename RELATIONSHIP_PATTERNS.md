# 🔗 Relationship Patterns Reference

Visual guide showing different relationship patterns and when to use each.

## Pattern 1: One-to-Many (Parent-Child)

### Visual
```
┌─────────────┐
│ Category    │ (1)
├─────────────┤
│ id: 1       │
│ name: Tech  │
└──────┬──────┘
       │
       │ has many
       │
       ├─────────────────┬─────────────────┬──────────────────┐
       │                 │                 │                  │
       ▼                 ▼                 ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│ Product     │  │ Product     │  │ Product     │  │ Product      │
├─────────────┤  ├─────────────┤  ├─────────────┤  ├──────────────┤
│ id: 101     │  │ id: 102     │  │ id: 103     │  │ id: 104      │
│ cat_id: 1   │  │ cat_id: 1   │  │ cat_id: 1   │  │ cat_id: 1    │
│ name: Phone │  │ name: Laptop│  │ name: Tablet│  │ name: Headset│
└─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘
```

### Implementation
```javascript
// MongoDB - CATEGORIES collection
{ _id: 1, name: "Tech", parent_id: null }

// MongoDB - PRODUCTS collection
{ _id: 101, name: "Phone", category_id: 1 }
{ _id: 102, name: "Laptop", category_id: 1 }
{ _id: 103, name: "Tablet", category_id: 1 }
```

### Query
```javascript
// Get all products in category
db.products.find({ category_id: 1 })

// Get category with all products
const cat = db.categories.findOne({ _id: 1 })
const products = db.products.find({ category_id: cat._id })
```

### When to Use
✅ Blog posts → Categories  
✅ Products → Categories  
✅ Comments → Posts  
✅ Orders → Users  
✅ **USE THIS PATTERN** for most relationships

---

## Pattern 2: Many-to-One

### Visual
```
Many Products pointing to One Category

Product 1 ──┐
Product 2 ──┼──→ Category (Tech)
Product 3 ──┤
Product 4 ──┘

(Same as Pattern 1, just different perspective)
```

### When to Use
✅ Multiple users working on one project  
✅ Multiple comments on one post  
✅ Multiple votes on one item  

---

## Pattern 3: Self-Referencing Hierarchy

### Visual
```
                Electronics (id: 1, parent_id: null)
                        │
                ┌───────┼───────┐
                │               │
        Smartphones (id: 2)  Laptops (id: 3)
        (parent_id: 1)       (parent_id: 1)
                │
            Android (id: 4)
            (parent_id: 2)
```

### Implementation
```javascript
// MongoDB - CATEGORIES collection
{ _id: 1, name: "Electronics", parent_id: null }
{ _id: 2, name: "Smartphones", parent_id: 1 }
{ _id: 3, name: "Laptops", parent_id: 1 }
{ _id: 4, name: "Android", parent_id: 2 }
```

### Queries
```javascript
// Get direct children of Smartphones
db.categories.find({ parent_id: 2 })

// Get all levels - use recursion/tree algorithm
// See RELATIONSHIP_SCHEMAS_GUIDE.md for implementation

// Get ancestors (path to root)
// Start at Android (id: 4)
// parent: Smartphones (id: 2)
// parent: Electronics (id: 1)
// Result: [Electronics, Smartphones, Android]
```

### When to Use
✅ **CATEGORY HIERARCHIES** - Main use case  
✅ Organizational structures (Company > Dept > Team)  
✅ File systems (Folder > Subfolder > File)  
✅ Product categories with 3+ levels  

---

## Pattern 4: Many-to-Many (Using Junction Table)

### Visual
```
Students ─┐
          ├──→ Enrollment ←──┐
          │   (Junction)      │
Students ─┤                   ├── Courses
          │                   │
Students ─┘                   ├── Courses
                           ←──┘
```

### Implementation
```javascript
// Option A: Array of IDs in one collection
// STUDENTS collection
{ _id: 1, name: "Alice", course_ids: [101, 102, 103] }

// Option B: Separate collection for relationships
// ENROLLMENTS collection (Junction table)
{ student_id: 1, course_id: 101 }
{ student_id: 1, course_id: 102 }
{ student_id: 2, course_id: 101 }
```

### Queries
```javascript
// Get all courses for student 1
db.enrollments.find({ student_id: 1 })

// Get all students in course 101
db.enrollments.find({ course_id: 101 })

// Find students taking both course 101 AND 102
// (More complex, needs aggregation)
```

### When to Use
✅ Students taking multiple courses  
✅ Users with multiple roles  
✅ Products with multiple tags  
✅ Complex many-to-many relationships  

⚠️ **More complex to implement** - Use if you really need it

---

## Pattern 5: Nested/Embedded Documents

### Visual
```
Post Document (all data in one place)
{
  _id: 1,
  title: "Post Title",
  category: {
    id: 101,
    name: "Tech",
    subcategory: {
      id: 201,
      name: "JavaScript"
    }
  },
  comments: [
    { id: 1, text: "Comment 1" },
    { id: 2, text: "Comment 2" }
  ]
}
```

### Implementation
```javascript
// All data in one document
db.posts.insertOne({
  _id: 1,
  title: "How to use JS",
  category: {
    id: 101,
    name: "Tech",
    subcategory: {
      id: 201,
      name: "JavaScript"
    }
  },
  author: {
    id: 1,
    name: "John"
  },
  comments: [
    { _id: 1, text: "Great post!", author: "Jane" },
    { _id: 2, text: "Thanks!", author: "Bob" }
  ]
})
```

### Queries
```javascript
// Get single document - all data included
db.posts.findOne({ _id: 1 })

// Filter by nested field
db.posts.find({ "category.name": "Tech" })

// Update nested field
db.posts.updateOne(
  { _id: 1 },
  { $set: { "category.name": "Programming" } }
)
```

### When to Use
✅ Small hierarchies (< 5 levels)  
✅ Comments on posts (small collection)  
✅ User profile with settings  
⚠️ **NOT recommended for**:
- ❌ Growing hierarchies
- ❌ Frequently updated nested data
- ❌ Large documents (> 16MB limit)

---

## Pattern 6: Materialized Path

### Visual
```
Document Path System
Electronics
├── Smartphones      (path: "1")
│   ├── Android      (path: "1,2")
│   └── iOS          (path: "1,3")
└── Laptops          (path: "2")
```

### Implementation
```javascript
// CATEGORIES collection
{ _id: 1, name: "Electronics", path: "", depth: 0 }
{ _id: 2, name: "Smartphones", path: "1", depth: 1 }
{ _id: 3, name: "Android", path: "1,2", depth: 2 }
{ _id: 4, name: "iOS", path: "1,3", depth: 2 }
{ _id: 5, name: "Laptops", path: "2", depth: 1 }
```

### Queries
```javascript
// Get all descendants of Smartphones (id: 2)
db.categories.find({ path: /^1,2(,|$)/ })

// Get all ancestors of Android
// path = "1,2" → split by comma → find each ID

// Find items at specific depth
db.categories.find({ depth: 2 })

// Get immediate children
db.categories.find({ depth: 3, path: /^1,2$/ })
```

### When to Use
✅ Need to query ancestors/descendants efficiently  
✅ Large hierarchies with frequent traversals  
✅ Sorting by depth  
⚠️ **Complex implementation**
- ❌ Requires path updates when moving nodes
- ❌ String parsing overhead

---

## Quick Comparison Table

| Pattern | Storage | Query Speed | Update Speed | Complexity | Best For |
|---------|---------|-------------|--------------|-----------|----------|
| One-to-Many | Foreign Key | 🟡 Medium | ⚡ Fast | 🟢 Simple | Most use cases |
| Self-Reference | Foreign Key | 🟡 Medium | ⚡ Fast | 🟡 Medium | Hierarchies |
| Many-to-Many | Junction Table | 🔴 Slow | 🟡 Medium | 🔴 Complex | Complex relations |
| Embedded | One Document | ⚡ Very Fast | 🔴 Slow | 🟢 Simple | Small data |
| Materialized Path | Path String | ⚡ Very Fast | 🔴 Very Slow | 🔴 Complex | Frequent queries |

---

## 🎯 Recommendation for Your jayshree_blogs

### ✅ USE THIS: One-to-Many + Self-Reference

**For Simple Relationships:**
```javascript
// posts collection
{ _id: 1, title: "...", category_id: 101 }

// categories collection  
{ _id: 101, name: "Tech", parent_id: null }
```

**Benefits:**
- Simple to understand
- Fast queries
- Easy to implement
- MongoDB-native
- Scales well

**When you're ready for advanced patterns:**
- Nested documents for small data
- Materialized path for huge hierarchies
- Junction tables for many-to-many

---

## Real-World Examples

### Example 1: E-Commerce Product Hierarchy
```
Categories (Self-reference)
├── Electronics (parent: null)
│   ├── Computers (parent: Electronics)
│   │   ├── Laptops (parent: Computers)
│   │   └── Desktops (parent: Computers)
│   └── Mobile (parent: Electronics)
│       ├── Smartphones (parent: Mobile)
│       └── Tablets (parent: Mobile)

Products (Many-to-One → Categories)
├── MacBook Pro (category: Laptops)
├── iPhone 15 (category: Smartphones)
└── iPad Air (category: Tablets)
```

### Example 2: Blog Platform
```
Blog Categories (Self-reference)
├── Technology (parent: null)
│   ├── Web Development (parent: Technology)
│   ├── Mobile Apps (parent: Technology)
│   └── AI/ML (parent: Technology)
└── Lifestyle (parent: null)
    ├── Health (parent: Lifestyle)
    └── Travel (parent: Lifestyle)

Blog Posts (Many-to-One → Blog Categories)
├── "React Best Practices" (category: Web Development)
├── "iOS Development Tips" (category: Mobile Apps)
└── "Meditation Guide" (category: Health)

Comments (Many-to-One → Blog Posts)
├── Comment on "React Best Practices"
├── Comment on "React Best Practices"
└── Comment on "iOS Development Tips"
```

### Example 3: Organizational Structure
```
Departments (Self-reference)
└── Engineering (parent: null)
    ├── Backend Team (parent: Engineering)
    │   ├── Database Team (parent: Backend)
    │   └── API Team (parent: Backend)
    └── Frontend Team (parent: Engineering)
        ├── Web (parent: Frontend)
        └── Mobile (parent: Frontend)

Employees (Many-to-One → Departments)
├── Alice (department: Database Team)
├── Bob (department: API Team)
└── Charlie (department: Web)
```

---

## Key Takeaways

1. **Most relationships are One-to-Many** - Use foreign keys (parent_id)
2. **Hierarchies use Self-Reference** - Collection references itself
3. **Start simple** - Add complexity only when needed
4. **MongoDB is document-oriented** - Can embed small related data
5. **Performance scales with indexes** - Add indexes on foreign key fields

## Implementation Checklist

- [ ] Choose your pattern (likely One-to-Many + Self-Reference)
- [ ] Design collection structure
- [ ] Add parent_id or relation_id fields
- [ ] Create test data
- [ ] Test queries (get children, ancestors, tree)
- [ ] Add indexes for performance
- [ ] Build UI components (selector, breadcrumb)
- [ ] Add validation (prevent orphans, circles)

