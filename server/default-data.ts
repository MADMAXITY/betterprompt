import { type Category, type Prompt } from "@shared/schema";

// Stable seeded data for serverless environments.
export const seededCategories: Category[] = [
  { id: "c-writing", name: "Writing", icon: "fas fa-pen", color: "primary", description: "Content creation and copywriting prompts" },
  { id: "c-coding", name: "Coding", icon: "fas fa-code", color: "green-500", description: "Programming and development prompts" },
  { id: "c-marketing", name: "Marketing", icon: "fas fa-bullhorn", color: "blue-500", description: "Marketing and advertising prompts" },
  { id: "c-business", name: "Business", icon: "fas fa-briefcase", color: "orange-500", description: "Business strategy and analysis prompts" },
  { id: "c-education", name: "Education", icon: "fas fa-graduation-cap", color: "purple-500", description: "Learning and teaching prompts" },
  { id: "c-creative", name: "Creative", icon: "fas fa-palette", color: "pink-500", description: "Creative prompts" },
];

export const seededPrompts: Prompt[] = [
  {
    id: "p-blog-writer",
    title: "Blog Post Writer",
    description: "SEO-optimized blog posts with clear structure and strong hooks.",
    content:
      "You are an expert blog writer. Write a post about [TOPIC] with headings, examples, and a clear CTA at the end.",
    categoryId: "c-writing",
    isFeatured: true,
    views: 2400,
    likes: 324,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "p-code-explainer",
    title: "Code Explainer",
    description: "Explain complex code snippets with examples and best practices.",
    content:
      "You are a senior engineer and teacher. Explain the following code: [CODE_SNIPPET]. Include overview, breakdown, pitfalls, and example.",
    categoryId: "c-coding",
    isFeatured: true,
    views: 1800,
    likes: 245,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "p-cold-email",
    title: "Cold Email Generator",
    description: "Personalized cold emails that get replies.",
    content:
      "You are a B2B email specialist. Create a concise cold email for [PURPOSE] with a strong subject, value prop, social proof, and low-friction CTA.",
    categoryId: "c-marketing",
    isFeatured: true,
    views: 3100,
    likes: 428,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "p-meeting-summary",
    title: "Meeting Summarizer",
    description: "Turn transcripts into summaries with decisions and next steps.",
    content:
      "Summarize the following meeting transcript [TRANSCRIPT] with key points, decisions, and action items (assignees + due dates).",
    categoryId: "c-business",
    isFeatured: false,
    views: 950,
    likes: 112,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: "p-lesson-plan",
    title: "Lesson Plan Builder",
    description: "Structured lesson plan for any topic and level.",
    content:
      "Create a lesson plan for [TOPIC] for [LEVEL] students. Include objectives, materials, activities, and assessments.",
    categoryId: "c-education",
    isFeatured: false,
    views: 700,
    likes: 88,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
  },
  {
    id: "p-story-starter",
    title: "Story Starter",
    description: "Creative story opening with character and conflict.",
    content:
      "Write a captivating story opening set in [SETTING] with a protagonist who wants [GOAL] but faces [OBSTACLE].",
    categoryId: "c-creative",
    isFeatured: false,
    views: 2150,
    likes: 387,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

