# SakalSense Content Model — Dynamic & Interconnected

> Everything is learnable. Everything is connected.

---

## Core Philosophy

SakalSense content is **not flat**. Every piece of content can:

1. **Exist standalone** — A single article, blog, or cheatsheet
2. **Be grouped** — Into series, courses, or collections
3. **Link to others** — Sequential navigation (prev/next)
4. **Embed media** — Videos within articles, not separate
5. **Attach assessments** — Quizzes at the end of any content

---

## Content Types

### 1. ARTICLE

> Written educational content (technical docs, guides)

- Standalone or part of a **Series**
- Can contain **embedded videos** (not separate video posts)
- Can have **attached Quiz** at the end
- Sequential navigation within series (prev/next)

```
Example: "JavaScript Basics" Article
├── Part of Series: "JavaScript Fundamentals"
├── Contains: Embedded video explaining concepts
├── Ends with: Quiz (5 questions)
└── Navigation: ← Previous Article | Next Article →
```

---

### 2. BLOG

> Personal insights, opinions, stories from any Admin

- Any Admin can publish anytime
- Standalone content with views, likes, comments
- Sequential navigation by date or filters
- Shareable link for external sharing
- Sorted by: Date / Views / Likes

```
Example: "My Journey Learning React"
├── Author: Admin XYZ
├── Views: 1,234 | Likes: 89 | Comments: 12
├── Shareable: sakalsense.com/blog/my-journey-react
└── Navigation: ← Newer Posts | Older Posts →
```

---

### 3. VIDEO (Embedded Only)

> Videos exist WITHIN content, not as standalone posts

- Embedded in Articles, Blogs, Lessons, Tutorials
- Hosted: YouTube embed or uploaded
- Duration tracking for progress
- **NO separate video feed like YouTube**

```
Example: Article "React Hooks Explained"
├── Section 1: Text explaining useState
├── Section 2: [EMBEDDED VIDEO] - useState demo
├── Section 3: Text explaining useEffect
└── Section 4: [EMBEDDED VIDEO] - useEffect demo
```

---

### 4. COURSE

> Multi-lesson structured learning

**Two ways to create:**

1. **From scratch** — Admin creates new lessons
2. **From existing content** — Link existing articles/series

**Structure:**

```
Course: "Complete Web Development"
├── Section 1: HTML Fundamentals
│   ├── Lesson 1.1: Introduction to HTML
│   ├── Lesson 1.2: HTML Tags & Elements
│   └── Lesson 1.3: Forms & Inputs
├── Section 2: CSS Styling
│   ├── Lesson 2.1: CSS Basics
│   ├── Lesson 2.2: Flexbox & Grid
│   └── Lesson 2.3: Responsive Design
├── Section 3: JavaScript
│   └── [LINKED SERIES]: "JavaScript Fundamentals" (existing)
└── Final Quiz: Course Assessment
```

**Key Features:**

- Sections divide the course
- Lessons within sections (ordered)
- Can link existing articles/series as lessons
- Quiz at section end or course end
- Progress tracking per lesson

---

### 5. LESSON

> Single unit within a Course

- Always belongs to a Course Section
- Can be newly created OR linked from existing Article
- Has embedded video option
- Can have attached Quiz

---

### 6. TUTORIAL

> Step-by-step practical guides

**Can be grouped into Tutorial Collection:**

```
Tutorial Collection: "Build a REST API with Node.js"
├── Section 1: Setup
│   ├── Tutorial 1.1: Project Setup
│   └── Tutorial 1.2: Express Installation
├── Section 2: Routes
│   ├── Tutorial 2.1: GET Routes
│   ├── Tutorial 2.2: POST Routes
│   └── Tutorial 2.3: PUT/DELETE Routes
└── Section 3: Database
    ├── Tutorial 3.1: PostgreSQL Setup
    └── Tutorial 3.2: Prisma Integration
```

**Navigation:** ← Previous Tutorial | Next Tutorial →

---

### 7. CHEATSHEET

> Concise reference sheets

**Standalone OR Grouped:**

```
Cheatsheet Collection: "JavaScript Reference"
├── Section 1: Syntax
│   ├── Cheatsheet: Variables & Types
│   └── Cheatsheet: Operators
├── Section 2: Functions
│   ├── Cheatsheet: Arrow Functions
│   └── Cheatsheet: Callbacks & Promises
└── Section 3: DOM
    └── Cheatsheet: DOM Manipulation
```

---

### 8. NOTE

> Quick reference notes (simple, no grouping)

- Standalone only
- Short-form content
- Quick lookup reference

---

### 9. SERIES

> Collection of related content of the same type

- Groups Articles, Tutorials, Cheatsheets, Projects
- Ordered sequence with prev/next navigation
- Can be linked into a Course

```
Series: "React Deep Dive"
├── Order 1: Article - React Basics
├── Order 2: Article - Components & Props
├── Order 3: Article - State Management
├── Order 4: Article - Hooks
└── Order 5: Article - Performance
```

---

### 10. PROJECT

> Hands-on projects with code

**Structure similar to Tutorial Collection:**

```
Project: "Build a Todo App"
├── Section 1: Setup
│   ├── Step 1: Initialize Project
│   └── Step 2: Install Dependencies
├── Section 2: Frontend
│   ├── Step 3: Create Components
│   └── Step 4: Add Styling
├── Section 3: Backend
│   ├── Step 5: Create API
│   └── Step 6: Connect Database
└── Source Code: github.com/user/todo-app
```

**Features:**

- GitHub link for source code
- Step-by-step with code snippets
- Can have attached Quiz

---

### 11. QUIZ

> Assessment questions

**Two modes:**

#### Mode 1: Attached to Content

- Linked at the end of Article, Lesson, Tutorial, etc.
- Reinforces learning
- Contributes to content completion %

```
Article: "JavaScript Arrays"
├── Content...
└── Attached Quiz: "Arrays Quiz" (5 questions)
```

#### Mode 2: Standalone Quiz Collection

- Separate quiz series on a topic
- Divided into sections

```
Quiz Collection: "JavaScript Mastery Quiz"
├── Section 1: Basics (10 questions)
├── Section 2: Functions (8 questions)
├── Section 3: Objects (12 questions)
└── Section 4: Async (10 questions)
```

---

### 12. PRACTICE

> Coding practice problems

**Same as Quiz — two modes:**

1. **Attached to content** — Practice at end of lesson/tutorial
2. **Standalone collection** — Practice problem series

```
Practice Collection: "Data Structures"
├── Section 1: Arrays
│   ├── Problem: Two Sum
│   ├── Problem: Rotate Array
│   └── Problem: Max Subarray
├── Section 2: Linked Lists
│   ├── Problem: Reverse List
│   └── Problem: Merge Lists
└── Section 3: Trees
    └── Problem: Tree Traversal
```

---

## Linking & Relationships

### Content Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    CONTENT ENTITY                        │
│  (Article, Blog, Tutorial, Cheatsheet, Note, Project)   │
└─────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  SERIES  │         │  QUIZ    │         │ PRACTICE │
    │ (groups) │         │(attached)│         │(attached)│
    └──────────┘         └──────────┘         └──────────┘
           │
           ▼
    ┌──────────┐
    │  COURSE  │
    │(sections)│
    └──────────┘
           │
           ▼
    ┌──────────┐
    │  LESSON  │
    └──────────┘
```

### Database Relationship Model

```
Content (base entity)
├── Can belong to: Series (via ContentSeries)
├── Can have: Attached Quiz (via ContentQuiz)
├── Can have: Attached Practice (via ContentPractice)
├── Can be linked as: Course Lesson (via LessonContent)
└── Contains: Embedded videos (within body JSON)

Series
├── Has many: Content items (ordered)
├── Can be linked to: Course Section

Course
├── Has many: Sections (ordered)
├── Each Section has: Lessons (ordered)
└── Lessons can be: New OR linked existing content

Quiz / Practice
├── Can be: Standalone collection with sections
├── Can be: Attached to any content
└── Has many: Questions (ordered)
```

---

## Navigation System

### Sequential Navigation

Every grouped content supports:

- **Previous** — Go to previous item in sequence
- **Next** — Go to next item in sequence
- **Parent** — Back to series/collection view

### Navigation Context

```typescript
interface INavigationContext {
    current: IContent;
    previous?: IContent; // Previous in series/course
    next?: IContent; // Next in series/course
    parent?: ISeries | ICourse; // Container
    position: number; // Current position (1-based)
    total: number; // Total items
}
```

---

## Admin Content Creation Flow

### Create New Content

1. Choose type (Article, Blog, Tutorial, etc.)
2. Write content with embedded media
3. Optionally attach Quiz/Practice
4. Publish or save as Draft

### Create Series

1. Create new Series (title, description)
2. Add existing content OR create new
3. Order items with drag-drop
4. Publish series

### Create Course

1. Create Course (title, description, difficulty)
2. Add Sections
3. For each Section:
    - Create new Lessons
    - OR link existing Articles/Series
4. Add Section/Course Quiz
5. Publish course

---

## Key Design Decisions

1. **No standalone video posts** — Videos are embedded in content
2. **Flexible linking** — Use existing content anywhere
3. **Sections for organization** — Courses, Tutorials, Quizzes all use sections
4. **Two-mode assessments** — Quiz/Practice attached OR standalone
5. **Sequential navigation** — Every grouped content has prev/next
6. **Content reuse** — Same article can be in multiple series/courses

---

## Implementation Priority

1. **Base Content Entity** — Supports all 12 types
2. **Series** — Grouping with order
3. **Course + Section + Lesson** — Structured learning
4. **Quiz + Practice** — Both modes
5. **Navigation** — Prev/next logic
6. **Linking** — Content reuse across containers
