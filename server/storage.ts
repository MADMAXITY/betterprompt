import { type User, type InsertUser, type Category, type InsertCategory, type Prompt, type InsertPrompt, type SavedPrompt, type InsertSavedPrompt, type PromptWithCategory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Prompt methods
  getPrompts(): Promise<PromptWithCategory[]>;
  getPromptById(id: string): Promise<PromptWithCategory | undefined>;
  getPromptsByCategory(categoryId: string): Promise<PromptWithCategory[]>;
  getFeaturedPrompts(): Promise<PromptWithCategory[]>;
  searchPrompts(query: string): Promise<PromptWithCategory[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: string, updates: Partial<InsertPrompt>): Promise<Prompt | undefined>;
  incrementPromptViews(id: string): Promise<void>;
  incrementPromptLikes(id: string): Promise<void>;

  // Saved prompts methods
  getSavedPrompts(userId: string): Promise<PromptWithCategory[]>;
  savePrompt(savedPrompt: InsertSavedPrompt): Promise<SavedPrompt>;
  unsavePrompt(promptId: string, userId: string): Promise<void>;
  isPromptSaved(promptId: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private prompts: Map<string, Prompt>;
  private savedPrompts: Map<string, SavedPrompt>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.prompts = new Map();
    this.savedPrompts = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default categories
    const defaultCategories: Category[] = [
      { id: randomUUID(), name: "Writing", icon: "fas fa-pen-nib", color: "primary", description: "Content creation and copywriting prompts" },
      { id: randomUUID(), name: "Coding", icon: "fas fa-code", color: "green-500", description: "Programming and development prompts" },
      { id: randomUUID(), name: "Marketing", icon: "fas fa-bullhorn", color: "blue-500", description: "Marketing and advertising prompts" },
      { id: randomUUID(), name: "Business", icon: "fas fa-briefcase", color: "orange-500", description: "Business strategy and analysis prompts" },
      { id: randomUUID(), name: "Education", icon: "fas fa-graduation-cap", color: "purple-500", description: "Learning and teaching prompts" },
      { id: randomUUID(), name: "Productivity", icon: "fas fa-tasks", color: "indigo-500", description: "Personal productivity and organization prompts" },
      { id: randomUUID(), name: "Creative", icon: "fas fa-palette", color: "pink-500", description: "Creative writing and storytelling prompts" }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });

    // Create default prompts
    const writingCategoryId = defaultCategories[0].id;
    const codingCategoryId = defaultCategories[1].id;
    const marketingCategoryId = defaultCategories[2].id;
    const businessCategoryId = defaultCategories[3].id;
    const educationCategoryId = defaultCategories[4].id;
    const productivityCategoryId = defaultCategories[5].id;
    const creativeCategoryId = defaultCategories[6].id;

    const defaultPrompts: Prompt[] = [
      {
        id: randomUUID(),
        title: "Blog Post Writer",
        description: "Create engaging blog posts with proper structure, SEO optimization, and compelling introductions that hook readers from the start.",
        content: `You are an expert blog writer specializing in creating engaging, SEO-optimized content. Write a comprehensive blog post about [TOPIC] that:

1. Starts with a compelling hook that grabs the reader's attention
2. Includes an informative introduction that clearly states what the reader will learn
3. Uses clear headings and subheadings (H2, H3) to structure the content
4. Incorporates relevant keywords naturally throughout the text
5. Provides actionable insights and practical examples
6. Ends with a strong conclusion that summarizes key points
7. Includes a call-to-action that encourages reader engagement

Target audience: [AUDIENCE]
Tone: [TONE - e.g., professional, conversational, authoritative]
Word count: [WORD_COUNT]
Keywords to include: [KEYWORDS]

Make sure the content is original, well-researched, and provides genuine value to readers.`,
        categoryId: writingCategoryId,
        isFeatured: true,
        views: 2400,
        likes: 324,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: randomUUID(),
        title: "Code Explainer",
        description: "Break down complex code snippets into easy-to-understand explanations with examples and best practices.",
        content: `You are an expert programmer and teacher. Analyze and explain the following code snippet in a clear, educational manner:

[CODE_SNIPPET]

Please provide:

1. **Overview**: Brief description of what this code does
2. **Line-by-line breakdown**: Explain each important line or block
3. **Key concepts**: Highlight important programming concepts used
4. **Best practices**: Point out good practices or suggest improvements
5. **Common pitfalls**: Mention potential issues or common mistakes
6. **Example usage**: Show how this code would be used in practice
7. **Further learning**: Suggest related topics to explore

Use simple language and provide examples where helpful. Structure your explanation for [SKILL_LEVEL] programmers.`,
        categoryId: codingCategoryId,
        isFeatured: true,
        views: 1800,
        likes: 245,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: randomUUID(),
        title: "Cold Email Generator",
        description: "Craft personalized cold emails that get responses with proven frameworks and persuasive copy techniques.",
        content: `You are a cold email specialist with expertise in B2B outreach. Create a compelling cold email for [PURPOSE] that follows this structure:

**Subject Line**: Create 3 attention-grabbing subject line options that:
- Are personalized and relevant
- Create curiosity without being clickbait
- Are under 50 characters

**Email Body**:

1. **Personal opener** (1-2 sentences)
   - Reference something specific about their company/role
   - Show you've done your research

2. **Value proposition** (2-3 sentences)
   - Clearly state what you offer
   - Focus on their benefit, not your features
   - Include a relevant case study or result

3. **Social proof** (1 sentence)
   - Brief credibility indicator
   - Relevant achievement or client mention

4. **Clear call-to-action** (1-2 sentences)
   - Specific, low-commitment ask
   - Make it easy to say yes

**Details to include**:
- Recipient: [RECIPIENT_NAME] at [COMPANY]
- Their role: [ROLE]
- Your offering: [PRODUCT/SERVICE]
- Goal: [SPECIFIC_GOAL]

Keep the email under 150 words and maintain a professional yet conversational tone.`,
        categoryId: marketingCategoryId,
        isFeatured: true,
        views: 3100,
        likes: 428,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        id: randomUUID(),
        title: "Meeting Summarizer",
        description: "Transform meeting transcripts into clear, actionable summaries with key decisions and next steps.",
        content: `You are an expert meeting facilitator and note-taker. Analyze the following meeting transcript and create a comprehensive summary:

[MEETING_TRANSCRIPT]

Please structure your summary as follows:

## Meeting Summary
**Date**: [DATE]
**Attendees**: [LIST_ATTENDEES]
**Duration**: [DURATION]
**Meeting Type**: [TYPE]

## Key Discussion Points
- [List main topics discussed with brief context]

## Decisions Made
- [List all concrete decisions with who is responsible]

## Action Items
- [ ] [Action item] - Assigned to: [PERSON] - Due: [DATE]
- [ ] [Action item] - Assigned to: [PERSON] - Due: [DATE]

## Follow-up Items
- [Items that need further discussion or clarification]

## Key Takeaways
- [Important insights or conclusions]

## Next Steps
- [What happens next, upcoming meetings, deadlines]

Focus on clarity and actionability. Ensure all action items have clear owners and deadlines.`,
        categoryId: businessCategoryId,
        isFeatured: false,
        views: 892,
        likes: 156,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: randomUUID(),
        title: "Study Guide Creator",
        description: "Generate comprehensive study guides from textbook chapters or lecture notes with key concepts highlighted.",
        content: `You are an educational specialist skilled at creating effective study materials. Transform the following content into a comprehensive study guide:

[SOURCE_MATERIAL]

Create a study guide with these sections:

## 📚 Chapter/Topic Overview
- Main theme and learning objectives
- How this connects to previous material

## 🔑 Key Concepts
- [List 5-8 most important concepts with brief definitions]

## 📝 Detailed Notes
- Organized breakdown of main topics
- Important formulas, dates, or facts highlighted
- Examples and applications

## 💡 Memory Aids
- Mnemonics for complex information
- Visual descriptions or diagrams (described in text)
- Analogies to aid understanding

## ❓ Self-Test Questions
- 10 review questions (mix of multiple choice, short answer, essay)
- Include answer key at the end

## 🎯 Study Tips
- Recommended study strategies for this material
- Time allocation suggestions
- Common mistakes to avoid

## 🔗 Connections
- How this material relates to other topics
- Real-world applications

Format for readability with clear headers, bullet points, and emphasis on key terms.`,
        categoryId: educationCategoryId,
        isFeatured: false,
        views: 1200,
        likes: 203,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },

      // NEW WRITING & CONTENT PROMPTS
      {
        id: randomUUID(),
        title: "Social Media Post Generator",
        description: "Create engaging social media posts optimized for different platforms with trending hashtags and compelling copy.",
        content: `You are a social media expert specializing in creating viral, engaging content. Generate a social media post about [TOPIC] for [PLATFORM] that:

**Platform-Specific Requirements:**
- Twitter/X: 280 characters maximum, witty and engaging
- LinkedIn: Professional tone, 1-3 paragraphs with business insights
- Instagram: Visual-focused with engaging caption and relevant hashtags
- Facebook: Conversational tone encouraging comments and shares
- TikTok: Fun, trendy language that appeals to younger audience

**Content Structure:**
1. **Hook** (First sentence that stops scrolling)
2. **Value/Story** (Main content that provides value or tells a story)
3. **Engagement** (Question or call-to-action to encourage interaction)
4. **Hashtags** (Platform-appropriate hashtags for discovery)

**Guidelines:**
- Target audience: [AUDIENCE]
- Tone: [TONE - e.g., professional, casual, witty, inspirational]
- Include trending hashtags: [TRENDING_HASHTAGS]
- Call-to-action: [CTA - e.g., like, share, comment, visit link]

**Additional Requirements:**
- Make it shareable and conversation-starting
- Include relevant emojis if appropriate for the platform
- Optimize for platform algorithm preferences
- Encourage genuine engagement over vanity metrics`,
        categoryId: writingCategoryId,
        isFeatured: false,
        views: 1540,
        likes: 287,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Ad Copy Generator",
        description: "Create compelling advertisement copy that converts with persuasive headlines and clear calls-to-action.",
        content: `You are a master copywriter specializing in high-converting advertisements. Create 3 compelling ad variations for [PRODUCT/SERVICE] that focus on [PRIMARY_BENEFIT].

**For Each Ad Variation, Provide:**

**1. Headline Options (3 for each variation):**
- Problem-focused: "Struggling with [PAIN_POINT]?"
- Benefit-focused: "Get [SPECIFIC_BENEFIT] in [TIMEFRAME]"
- Curiosity-driven: "The [ADJECTIVE] Secret [TARGET_AUDIENCE] Don't Want You to Know"

**2. Body Copy Structure:**
- **Problem Identification**: Acknowledge the pain point
- **Solution Introduction**: Present your product as the solution
- **Benefit Explanation**: Explain how it solves their problem
- **Social Proof**: Include testimonial or statistic
- **Urgency/Scarcity**: Create reason to act now
- **Clear CTA**: Direct action step

**3. Call-to-Action Options:**
- "Get Started Free Today"
- "Claim Your [DISCOUNT]% Discount"
- "Join [NUMBER] Happy Customers"

**Ad Details:**
- Target audience: [TARGET_AUDIENCE]
- Platform: [PLATFORM - Facebook, Google, Instagram, etc.]
- Budget considerations: [BUDGET_LEVEL]
- Campaign goal: [GOAL - awareness, conversions, traffic]

**Requirements:**
- Keep headlines under 60 characters for most platforms
- Focus on emotional triggers that motivate action
- Include specific numbers and results where possible
- Test different psychological approaches (fear, desire, curiosity)
- Ensure compliance with platform advertising policies`,
        categoryId: marketingCategoryId,
        isFeatured: false,
        views: 2100,
        likes: 398,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "YouTube Script Writer",
        description: "Create engaging YouTube video scripts with compelling hooks, structured content, and strong calls-to-action.",
        content: `You are a YouTube scriptwriting expert who creates engaging, retention-focused video content. Write a [VIDEO_LENGTH] minute script about [TOPIC] that maximizes viewer engagement and watch time.

**Script Structure:**

**1. Hook (First 15 seconds):**
- Start with a compelling question, surprising fact, or bold statement
- Preview the value viewers will get
- Create curiosity gap that requires watching to resolve
- Example: "In the next 3 minutes, I'll show you the [TECHNIQUE] that [SPECIFIC_RESULT]"

**2. Introduction (15-30 seconds):**
- Brief personal introduction if needed
- Set clear expectations for the video
- Ask viewers to subscribe and like (early engagement)

**3. Main Content (Bulk of video):**
- Break into 3-5 clear sections with smooth transitions
- Use the "Rule of 3" for easy retention
- Include relevant examples and stories
- Add "pattern interrupts" every 30-60 seconds to maintain attention
- Use visual cues: "As you can see on screen..."

**4. Engagement Boosts:**
- Ask questions throughout: "Have you experienced this?"
- Include polls or interactive elements
- Reference comments from previous videos
- Create "comment bait" - ask viewers to share experiences

**5. Conclusion & CTA:**
- Summarize key takeaways
- Strong call-to-action for next video or action
- Subscribe reminder with specific reason
- End screen optimization

**Video Details:**
- Target audience: [AUDIENCE]
- Channel niche: [NICHE]
- Video goal: [GOAL - educate, entertain, convert]
- Desired watch time: [PERCENTAGE]%

**Formatting Notes:**
- Mark timing cues: [0:30], [1:45], etc.
- Include [VISUAL] cues for editing
- Note [PAUSE] moments for emphasis
- Suggest [B-ROLL] opportunities

Focus on viewer retention and engagement throughout. Write conversationally as if speaking directly to one person.`,
        categoryId: writingCategoryId,
        isFeatured: true,
        views: 1890,
        likes: 312,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },

      // NEW BUSINESS & MARKETING PROMPTS
      {
        id: randomUUID(),
        title: "Product Description Optimizer",
        description: "Create compelling, SEO-optimized product descriptions that convert browsers into buyers with persuasive copy.",
        content: `You are an expert e-commerce copywriter specializing in high-converting product descriptions. Create an optimized product description for [PRODUCT_NAME] that maximizes conversions and search visibility.

**Product Description Structure:**

**1. Attention-Grabbing Headline:**
- Include primary keyword: [PRIMARY_KEYWORD]
- Highlight main benefit or unique selling proposition
- Keep under 60 characters for search results

**2. Opening Hook (First 160 characters):**
- This appears in search snippets - make it compelling
- Address primary customer need or desire
- Include emotional trigger or specific benefit

**3. Key Features & Benefits Section:**
Transform features into customer benefits:
- Feature: [TECHNICAL_SPEC] → Benefit: "This means you get [CUSTOMER_OUTCOME]"
- Use bullet points for easy scanning
- Focus on outcomes, not just specifications
- Include social proof where relevant

**4. Problem/Solution Narrative:**
- Identify customer pain point: "Tired of [PROBLEM]?"
- Position product as solution: "Our [PRODUCT] solves this by [SOLUTION]"
- Paint picture of life after purchase

**5. Trust & Credibility Elements:**
- Certifications, awards, or guarantees
- Customer testimonial or review snippet
- Return policy or warranty information
- "Risk-free" or "money-back" assurances

**6. Urgency/Scarcity (If applicable):**
- Limited stock warnings
- Special pricing end dates
- Exclusive offers for immediate purchase

**Product Information:**
- Product category: [CATEGORY]
- Target customer: [CUSTOMER_AVATAR]
- Price point: [PRICE_RANGE]
- Main competitors: [COMPETITORS]
- Unique selling points: [USPs]

**SEO Requirements:**
- Primary keyword: [KEYWORD] (use 2-3 times naturally)
- Secondary keywords: [RELATED_KEYWORDS]
- Include long-tail phrases customers might search
- Optimize for voice search queries

**Formatting:**
- Use subheadings for easy scanning
- Include relevant technical specifications
- Add compelling call-to-action button text
- Consider mobile readability (shorter paragraphs)

Focus on converting visitors who are ready to buy while also attracting organic search traffic.`,
        categoryId: marketingCategoryId,
        isFeatured: false,
        views: 1650,
        likes: 289,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Landing Page Copy Creator",
        description: "Write high-converting landing page copy that builds trust, addresses objections, and drives action.",
        content: `You are a conversion copywriting expert who creates landing pages that turn visitors into customers. Write persuasive copy for a [PRODUCT/SERVICE] landing page that maximizes conversions.

**Landing Page Structure:**

**1. Hero Section:**
- **Headline**: Clear value proposition in 10 words or less
  - Address specific outcome: "Get [RESULT] in [TIMEFRAME]"
  - Avoid jargon, focus on customer language
- **Subheadline**: Expand on the promise, explain how
- **Hero CTA**: Primary action button text (2-4 words)

**2. Problem Section:**
- Identify specific pain points your audience faces
- Use emotional language they would use
- Make them nod in recognition: "Yes, that's exactly my problem!"
- Agitate slightly to increase motivation to solve

**3. Solution Section:**
- Position your offering as the perfect solution
- Explain how it uniquely addresses their problems
- Focus on transformation and outcomes
- Include "how it works" in simple 3-step process

**4. Benefits Section:**
- Transform features into compelling benefits
- Use specific numbers and outcomes where possible
- Address different customer motivations (time, money, status, security)
- Include both rational and emotional benefits

**5. Social Proof Section:**
- Customer testimonials with photos and results
- Case studies with specific numbers
- Trust badges, certifications, or press mentions
- Number of satisfied customers or years in business

**6. Objection Handling:**
Address common concerns:
- "Is this right for me?" - Ideal customer description
- "Does this really work?" - Proof and guarantees
- "Is it worth the cost?" - ROI or cost comparison
- "What if it doesn't work?" - Risk reversal offer

**7. Urgency/Scarcity:**
- Limited-time bonuses
- Special pricing deadlines
- Limited availability
- Consequences of waiting/not acting

**8. Final CTA Section:**
- Restate primary benefit
- Address final objection
- Strong, action-oriented button text
- Risk reversal statement

**Campaign Details:**
- Target audience: [AUDIENCE_DESCRIPTION]
- Main competitor approach: [COMPETITOR_ANGLE]
- Traffic source: [TRAFFIC_SOURCE - ads, email, organic]
- Conversion goal: [GOAL - sales, signups, demos]
- Budget/price point: [PRICE_POINT]

**Tone Guidelines:**
- Conversational but professional
- Confident without being pushy
- Empathetic to customer struggles
- Excitement about the solution

Write for someone who's motivated but skeptical, ready to buy but needs reassurance.`,
        categoryId: marketingCategoryId,
        isFeatured: true,
        views: 2340,
        likes: 445,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Customer Persona Builder",
        description: "Create detailed buyer personas with demographics, psychographics, and behavioral insights for targeted marketing.",
        content: `You are a market research expert specializing in customer psychology and segmentation. Create a comprehensive buyer persona for [INDUSTRY/PRODUCT] based on the provided information.

**Customer Persona Profile:**

**1. Basic Demographics:**
- **Name**: [Give persona a realistic name]
- **Age Range**: [Specific age range]
- **Gender**: [If relevant to product]
- **Location**: [Geographic details]
- **Income Level**: [Annual household income range]
- **Education**: [Highest level completed]
- **Occupation**: [Job title and industry]
- **Family Status**: [Marital status, children, dependents]

**2. Psychographic Profile:**
- **Core Values**: What principles guide their decisions?
- **Lifestyle Interests**: Hobbies, activities, entertainment preferences
- **Personality Traits**: Introverted/extroverted, risk-averse/adventurous, etc.
- **Aspirations**: What do they want to achieve in life?
- **Fears/Concerns**: What keeps them up at night?

**3. Professional Life:**
- **Job Responsibilities**: Daily tasks and accountabilities
- **Career Goals**: Where they want to be professionally
- **Work Challenges**: Biggest professional pain points
- **Decision-Making Role**: Influence on purchases (decision maker, influencer, user)
- **Budget Authority**: Spending limits and approval processes

**4. Shopping & Media Behavior:**
- **Preferred Channels**: Where they spend time online/offline
- **Content Consumption**: Blogs, podcasts, social media platforms
- **Shopping Habits**: Online vs. in-store preferences, research behavior
- **Brand Loyalty**: Tendency to stick with known brands vs. try new ones
- **Purchase Triggers**: What motivates them to buy?

**5. Goals & Pain Points:**
**Primary Goals:**
- [List 3-5 main objectives they're trying to achieve]
- Include both professional and personal goals
- Connect to your product/service solution

**Major Pain Points:**
- [List 3-5 biggest challenges they face]
- Include both surface-level and deeper frustrations
- Highlight problems your product solves

**6. Communication Preferences:**
- **Tone**: Formal vs. casual, technical vs. simple
- **Message Channels**: Email, phone, text, social media
- **Content Format**: Long-form articles, videos, infographics
- **Frequency**: How often they want to hear from brands

**7. Technology Adoption:**
- **Tech Comfort Level**: Early adopter vs. late adopter
- **Device Usage**: Primary devices for research and purchasing
- **Software/Apps**: Tools they use regularly
- **Online Security Concerns**: Privacy and data protection attitudes

**8. Buying Journey Mapping:**
**Awareness Stage**: How do they first realize they have a problem?
**Consideration Stage**: How do they research solutions?
**Decision Stage**: What factors influence their final choice?
**Post-Purchase**: What do they expect after buying?

**9. Objections & Concerns:**
- **Budget Concerns**: "Is this worth the cost?"
- **Time Constraints**: "Do I have time to implement this?"
- **Trust Issues**: "Can I trust this company/solution?"
- **Compatibility**: "Will this work with my current setup?"

**10. Success Metrics:**
How would this persona measure success with your product/service?
- Quantitative measures: [Cost savings, time saved, revenue increased]
- Qualitative measures: [Reduced stress, improved confidence, better relationships]

**Research Sources Used:**
- Customer interviews: [NUMBER] conducted
- Survey responses: [NUMBER] collected
- Website analytics data
- Social media insights
- Competitor analysis

**Persona Quote:**
Include a quote that captures their mindset: "I need [SOLUTION] because [REASON], but I'm concerned about [OBJECTION]."

Use this persona to guide all marketing messages, content creation, and product development decisions.`,
        categoryId: businessCategoryId,
        isFeatured: false,
        views: 1320,
        likes: 234,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },

      // NEW CODING & TECHNICAL PROMPTS
      {
        id: randomUUID(),
        title: "Regex Pattern Builder",
        description: "Generate precise regular expressions for complex pattern matching with explanations and test cases.",
        content: `You are a regular expression expert who creates accurate, efficient regex patterns. Create a regex pattern that matches [PATTERN_DESCRIPTION] and provide comprehensive documentation.

**Regex Pattern Output:**

**1. Final Regex Pattern:**
\`\`\`regex
[YOUR_REGEX_PATTERN]
\`\`\`

**2. Pattern Breakdown:**
Explain each component of the regex:
- \`^\` - Start of string anchor
- \`[a-zA-Z0-9]\` - Character classes and ranges
- \`+\` - Quantifiers (*, +, ?, {n,m})
- \`(?:...)\` - Groups and captures
- \`$\` - End of string anchor

**3. Match Examples:**
**✅ Should Match:**
- Example 1: "sample text that should match"
- Example 2: "another valid example"
- Example 3: "third matching example"

**❌ Should NOT Match:**
- Example 1: "invalid example text"
- Example 2: "another non-match"
- Example 3: "third non-matching example"

**4. Language-Specific Versions:**
- **JavaScript**: \`const regex = /pattern/flags;\`
- **Python**: \`import re; pattern = r'pattern'\`
- **PHP**: \`$pattern = '/pattern/flags';\`
- **Java**: \`Pattern pattern = Pattern.compile("pattern");\`

**5. Common Variations:**
- **Case Insensitive**: Add \`i\` flag
- **Multiline**: Add \`m\` flag for ^ and $ anchors
- **Global**: Add \`g\` flag for all matches
- **Unicode**: Add \`u\` flag for Unicode support

**6. Test Cases (copy-paste ready):**
\`\`\`
Test String 1: [VALID_EXAMPLE]
Expected: Match
Result: [SHOULD_MATCH]

Test String 2: [INVALID_EXAMPLE]
Expected: No Match
Result: [SHOULD_NOT_MATCH]
\`\`\`

**7. Performance Notes:**
- Complexity: [O(n) or note any potential issues]
- Backtracking concerns: [Any catastrophic backtracking risks]
- Optimization suggestions: [How to make it more efficient]

**8. Alternative Approaches:**
If regex isn't the best solution:
- Simple string methods that might work better
- When to use parsing libraries instead
- Performance trade-offs to consider

**Pattern Requirements:**
- Match type: [EXACT_MATCH | CONTAINS | STARTS_WITH | ENDS_WITH]
- Case sensitivity: [SENSITIVE | INSENSITIVE]
- Multiline support: [YES | NO]
- Capture groups needed: [YES | NO - what to capture]
- Expected input size: [SMALL | MEDIUM | LARGE texts]

**Common Use Cases:**
- Email validation
- Phone number extraction
- URL matching
- Data parsing from logs
- Input sanitization
- Text cleanup and formatting

Include explanation suitable for [SKILL_LEVEL] developers.`,
        categoryId: codingCategoryId,
        isFeatured: false,
        views: 980,
        likes: 156,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Debug Assistant",
        description: "Identify and fix bugs in code with detailed analysis, root cause identification, and solution recommendations.",
        content: `You are an expert debugging specialist who can quickly identify and resolve programming issues. Analyze the following code and provide comprehensive debugging assistance:

**Code to Debug:**
\`\`\`[LANGUAGE]
[PASTE_CODE_HERE]
\`\`\`

**Error Message/Symptoms:**
[DESCRIBE_THE_PROBLEM]

**Debugging Analysis:**

**1. Initial Assessment:**
- **Language/Framework**: [Detected language and version]
- **Error Type**: [Syntax | Runtime | Logic | Performance | Security]
- **Severity Level**: [Critical | High | Medium | Low]
- **Estimated Fix Time**: [Simple | Moderate | Complex]

**2. Bug Identification:**
**🔍 Primary Issues Found:**
- **Line X**: [Description of the bug]
  - **Problem**: What exactly is wrong
  - **Why it happens**: Root cause explanation
  - **Impact**: How it affects the application

**🔍 Secondary Issues (if any):**
- **Line Y**: [Additional problems]
  - **Risk level**: [High | Medium | Low]
  - **Recommendation**: [Fix now | Fix later | Monitor]

**3. Root Cause Analysis:**
- **Immediate cause**: What triggered the error
- **Underlying issue**: Why the code was written this way
- **System factors**: Environment, dependencies, or configuration issues
- **Logic flow**: How the error propagates through the system

**4. Step-by-Step Fix:**
**Fix 1 - [ISSUE_DESCRIPTION]:**
\`\`\`[LANGUAGE]
// BEFORE (problematic code)
[ORIGINAL_CODE_SNIPPET]

// AFTER (fixed code)  
[CORRECTED_CODE_SNIPPET]
\`\`\`
**Explanation**: Why this fix works and what it prevents

**Fix 2 - [ADDITIONAL_ISSUE] (if applicable):**
[Same format as above]

**5. Complete Corrected Code:**
\`\`\`[LANGUAGE]
[FULL_CORRECTED_CODE]
\`\`\`

**6. Testing Strategy:**
**Test Cases to Run:**
- **Happy Path**: [Normal input that should work]
- **Edge Cases**: [Boundary conditions to test]
- **Error Cases**: [Invalid inputs to handle gracefully]
- **Performance Test**: [If relevant, load/stress testing]

**7. Prevention Strategies:**
- **Code Review Points**: What to check for in future
- **Best Practices**: Patterns to follow to avoid similar issues
- **Tools**: Linters, analyzers, or testing frameworks to help
- **Documentation**: Comments or docs to add for clarity

**8. Monitoring & Maintenance:**
- **Log Points**: Where to add logging for future debugging
- **Metrics**: What to monitor in production
- **Alerts**: When to notify developers of issues
- **Update Strategy**: How to safely deploy the fix

**9. Learning Opportunities:**
- **Concept Review**: Language/framework concepts to study
- **Similar Patterns**: Other places in codebase to check
- **Resources**: Documentation or tutorials for deeper understanding

**Environment Context:**
- **Runtime**: [Node.js | Browser | Server | Mobile]
- **Dependencies**: [List relevant packages/versions]
- **Configuration**: [Environment variables or settings]
- **Data State**: [Database or file system requirements]

**Confidence Level**: [High | Medium | Low] - How certain the fix will resolve the issue

Focus on providing actionable solutions with clear explanations for [DEVELOPER_EXPERIENCE_LEVEL] developers.`,
        categoryId: codingCategoryId,
        isFeatured: true,
        views: 2250,
        likes: 421,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "SQL Query Generator",
        description: "Create optimized SQL queries for complex database operations with explanations and performance tips.",
        content: `You are a database expert who writes efficient, secure SQL queries. Generate a SQL query to [QUERY_GOAL] from a database with the specified structure.

**Database Schema:**
Tables: [TABLE_NAMES]
Columns: [COLUMN_DETAILS]
Relationships: [FOREIGN_KEY_RELATIONSHIPS]

**Query Requirements:**
- Goal: [SPECIFIC_OPERATION]
- Data needed: [COLUMNS_TO_SELECT]
- Conditions: [WHERE_CONDITIONS]
- Sorting: [ORDER_BY_REQUIREMENTS]
- Grouping: [GROUP_BY_NEEDS]
- Limits: [RECORD_LIMITS]

**SQL Query Solution:**

**1. Main Query:**
\`\`\`sql
-- [QUERY_DESCRIPTION]
[GENERATED_SQL_QUERY]
\`\`\`

**2. Query Breakdown:**
**SELECT Clause:**
- \`SELECT column1, column2\`: [Explanation of selected fields]
- \`COUNT(*)\`, \`SUM()\`, etc.: [Explanation of aggregate functions]

**FROM & JOIN Clauses:**
- \`FROM table1\`: [Main table explanation]
- \`JOIN table2 ON condition\`: [Join logic and relationship]
- \`LEFT/RIGHT/INNER JOIN\`: [Why this join type was chosen]

**WHERE Clause:**
- \`WHERE condition1\`: [Filter logic explanation]
- \`AND/OR conditions\`: [Multiple condition logic]
- \`IN/EXISTS/LIKE\`: [Special operator explanations]

**GROUP BY & HAVING:**
- \`GROUP BY columns\`: [Grouping logic]
- \`HAVING conditions\`: [Post-grouping filters]

**ORDER BY & LIMIT:**
- \`ORDER BY column ASC/DESC\`: [Sorting rationale]
- \`LIMIT/OFFSET\`: [Pagination or result limiting]

**3. Alternative Approaches:**
**Option 1 - Subquery Approach:**
\`\`\`sql
[ALTERNATIVE_QUERY_WITH_SUBQUERY]
\`\`\`
*Use when*: [Scenarios where this might be better]

**Option 2 - CTE (Common Table Expression):**
\`\`\`sql
WITH cte_name AS (
  [CTE_QUERY]
)
[MAIN_QUERY_USING_CTE]
\`\`\`
*Use when*: [Complex queries needing better readability]

**4. Performance Optimization:**
**Indexes Recommended:**
- \`CREATE INDEX idx_name ON table(column)\`: [Why this index helps]
- \`CREATE COMPOSITE INDEX\`: [For multi-column conditions]

**Query Optimization Tips:**
- **Selective WHERE clauses**: Filter early and aggressively
- **Proper JOIN order**: [Smaller tables first, most selective conditions]
- **LIMIT usage**: [Avoid large result sets when possible]
- **Column selection**: [Select only needed columns, avoid SELECT *]

**5. Execution Plan Analysis:**
\`\`\`sql
-- Add EXPLAIN to see execution plan
EXPLAIN [YOUR_QUERY]
\`\`\`
**What to look for:**
- Table scans (should be minimized)
- Index usage (should be maximized)
- Join algorithms (nested loop vs hash join)
- Cost estimates (lower is better)

**6. Testing & Validation:**
**Test Data Setup:**
\`\`\`sql
-- Sample test data
INSERT INTO table VALUES [SAMPLE_DATA]
\`\`\`

**Expected Results:**
- Row count: [EXPECTED_NUMBER] rows
- Key values: [SAMPLE_EXPECTED_VALUES]
- Data types: [EXPECTED_COLUMN_TYPES]

**7. Security Considerations:**
- **SQL Injection Prevention**: Use parameterized queries
- **Permission Checks**: Ensure proper access controls
- **Data Exposure**: Limit sensitive information in results

**8. Database-Specific Versions:**
**MySQL Version:**
\`\`\`sql
[MYSQL_SPECIFIC_SYNTAX]
\`\`\`

**PostgreSQL Version:**
\`\`\`sql
[POSTGRESQL_SPECIFIC_SYNTAX]
\`\`\`

**SQL Server Version:**
\`\`\`sql
[SQLSERVER_SPECIFIC_SYNTAX]
\`\`\`

**9. Common Pitfalls:**
- **N+1 Query Problem**: [How to avoid with proper JOINs]
- **Cartesian Products**: [Unintended cross joins]
- **NULL Handling**: [IS NULL vs = NULL gotchas]
- **Date Comparisons**: [Timezone and format issues]

**Database Context:**
- Database System: [MySQL | PostgreSQL | SQL Server | Oracle]
- Version: [Specific version if relevant]
- Expected data volume: [Small | Medium | Large dataset]
- Performance requirements: [Response time expectations]

Optimize for [PERFORMANCE | READABILITY | MAINTAINABILITY] based on the use case.`,
        categoryId: codingCategoryId,
        isFeatured: false,
        views: 1720,
        likes: 298,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },

      // NEW EDUCATION & LEARNING PROMPTS
      {
        id: randomUUID(),
        title: "Language Learning Tutor",
        description: "Provide personalized language instruction with cultural context, practice exercises, and progressive learning.",
        content: `You are an expert language tutor with deep cultural knowledge and pedagogical expertise. Teach me how to say [PHRASE] in [TARGET_LANGUAGE], then provide comprehensive learning support.

**Language Learning Session:**

**1. Core Translation & Pronunciation:**
**Phrase**: [PHRASE_IN_TARGET_LANGUAGE]
**Romanization** (if needed): [PHONETIC_SPELLING]
**Pronunciation Guide**: [DETAILED_PRONUNCIATION_INSTRUCTIONS]
**Audio Guide**: "[Stress patterns and emphasis guidance]"

**2. Grammar Breakdown:**
**Sentence Structure**: [Subject-Verb-Object or relevant pattern]
**Key Grammar Points**:
- **Verb tense/form**: [Explanation of verb usage]
- **Articles/particles**: [Why specific articles were chosen]
- **Word order**: [How it differs from English]
- **Formal vs informal**: [When to use which level of politeness]

**3. Cultural Context:**
**When to Use**: [Appropriate situations and contexts]
**Cultural Notes**: [Important cultural considerations]
**Formality Level**: [Casual, polite, formal, very formal]
**Regional Variations**: [Different ways to say it in different regions]

**4. Related Vocabulary:**
**Key Words from the Phrase**:
- [WORD_1]: [Definition and usage notes]
- [WORD_2]: [Definition and alternative meanings]
- [WORD_3]: [Common collocations and phrases]

**Expansion Vocabulary** (related concepts):
- [RELATED_WORD_1]: [How it connects to the main phrase]
- [RELATED_WORD_2]: [Usage examples]
- [RELATED_WORD_3]: [Common combinations]

**5. Practice Exercises:**

**Exercise 1 - Repetition Practice:**
Repeat the phrase 5 times focusing on:
- Correct pronunciation
- Natural rhythm and intonation
- Stress patterns

**Exercise 2 - Substitution Drill:**
Replace key words to create variations:
- Original: [ORIGINAL_PHRASE]
- Variation 1: [MODIFIED_PHRASE_1]
- Variation 2: [MODIFIED_PHRASE_2]
- Variation 3: [MODIFIED_PHRASE_3]

**Exercise 3 - Contextual Usage:**
Create sentences using the phrase in different contexts:
- Scenario 1: [CONTEXT_1] - "[EXAMPLE_SENTENCE_1]"
- Scenario 2: [CONTEXT_2] - "[EXAMPLE_SENTENCE_2]"
- Scenario 3: [CONTEXT_3] - "[EXAMPLE_SENTENCE_3]"

**6. Common Mistakes to Avoid:**
- **Pronunciation**: [Typical errors native English speakers make]
- **Grammar**: [Common structural mistakes]
- **Usage**: [Inappropriate contexts or formality levels]
- **False friends**: [Similar-looking words with different meanings]

**7. Memory Techniques:**
**Visual Association**: [Create mental images to remember]
**Sound Patterns**: [Connect to familiar sounds or rhymes]
**Story Method**: [Create a memorable story using the phrase]
**Cognate Connections**: [Link to English or known words]

**8. Progressive Learning Path:**
**Beginner Level**: Focus on [BASIC_ELEMENTS]
**Intermediate Level**: Add [INTERMEDIATE_CONCEPTS]
**Advanced Level**: Master [ADVANCED_USAGE]

**Next Steps for Practice**:
- Daily repetition schedule: [RECOMMENDED_PRACTICE_ROUTINE]
- Related phrases to learn: [LOGICAL_NEXT_PHRASES]
- Grammar concepts to study: [RELATED_GRAMMAR_TOPICS]

**9. Quick Reference Card:**
\`\`\`
[TARGET_LANGUAGE]: [PHRASE]
English: [ENGLISH_MEANING]
Context: [WHEN_TO_USE]
Pronunciation: [SIMPLE_PRONUNCIATION_GUIDE]
\`\`\`

**10. Assessment Check:**
After practicing, can you:
- [ ] Pronounce it clearly?
- [ ] Use it in the right context?
- [ ] Explain the grammar structure?
- [ ] Create similar sentences?
- [ ] Understand cultural appropriateness?

**Learning Level**: Adjust explanations for [BEGINNER | INTERMEDIATE | ADVANCED] learner
**Learning Style**: Optimized for [VISUAL | AUDITORY | KINESTHETIC] learning preference

Focus on practical, immediate application while building foundational understanding.`,
        categoryId: educationCategoryId,
        isFeatured: false,
        views: 1430,
        likes: 267,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];

    defaultPrompts.forEach(prompt => {
      this.prompts.set(prompt.id, prompt);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, description: insertCategory.description || null };
    this.categories.set(id, category);
    return category;
  }

  // Prompt methods
  async getPrompts(): Promise<PromptWithCategory[]> {
    return Array.from(this.prompts.values()).map(prompt => ({
      ...prompt,
      category: this.categories.get(prompt.categoryId)!
    }));
  }

  async getPromptById(id: string): Promise<PromptWithCategory | undefined> {
    const prompt = this.prompts.get(id);
    if (!prompt) return undefined;
    
    const category = this.categories.get(prompt.categoryId);
    if (!category) return undefined;
    
    return { ...prompt, category };
  }

  async getPromptsByCategory(categoryId: string): Promise<PromptWithCategory[]> {
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.categoryId === categoryId)
      .map(prompt => ({
        ...prompt,
        category: this.categories.get(prompt.categoryId)!
      }));
  }

  async getFeaturedPrompts(): Promise<PromptWithCategory[]> {
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.isFeatured)
      .map(prompt => ({
        ...prompt,
        category: this.categories.get(prompt.categoryId)!
      }));
  }

  async searchPrompts(query: string): Promise<PromptWithCategory[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.prompts.values())
      .filter(prompt => 
        prompt.title.toLowerCase().includes(lowerQuery) ||
        prompt.description.toLowerCase().includes(lowerQuery) ||
        prompt.content.toLowerCase().includes(lowerQuery)
      )
      .map(prompt => ({
        ...prompt,
        category: this.categories.get(prompt.categoryId)!
      }));
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const id = randomUUID();
    const now = new Date();
    const prompt: Prompt = {
      ...insertPrompt,
      id,
      isFeatured: insertPrompt.isFeatured ?? false,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now
    };
    this.prompts.set(id, prompt);
    return prompt;
  }

  async updatePrompt(id: string, updates: Partial<InsertPrompt>): Promise<Prompt | undefined> {
    const prompt = this.prompts.get(id);
    if (!prompt) return undefined;
    
    const updatedPrompt: Prompt = {
      ...prompt,
      ...updates,
      updatedAt: new Date()
    };
    this.prompts.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async incrementPromptViews(id: string): Promise<void> {
    const prompt = this.prompts.get(id);
    if (prompt) {
      prompt.views = (prompt.views || 0) + 1;
      this.prompts.set(id, prompt);
    }
  }

  async incrementPromptLikes(id: string): Promise<void> {
    const prompt = this.prompts.get(id);
    if (prompt) {
      prompt.likes = (prompt.likes || 0) + 1;
      this.prompts.set(id, prompt);
    }
  }

  // Saved prompts methods
  async getSavedPrompts(userId: string): Promise<PromptWithCategory[]> {
    const userSavedPrompts = Array.from(this.savedPrompts.values())
      .filter(saved => saved.userId === userId);
    
    return userSavedPrompts
      .map(saved => this.prompts.get(saved.promptId))
      .filter(prompt => prompt !== undefined)
      .map(prompt => ({
        ...prompt!,
        category: this.categories.get(prompt!.categoryId)!
      }));
  }

  async savePrompt(insertSavedPrompt: InsertSavedPrompt): Promise<SavedPrompt> {
    const id = randomUUID();
    const savedPrompt: SavedPrompt = {
      ...insertSavedPrompt,
      id,
      createdAt: new Date()
    };
    this.savedPrompts.set(id, savedPrompt);
    return savedPrompt;
  }

  async unsavePrompt(promptId: string, userId: string): Promise<void> {
    const savedPrompt = Array.from(this.savedPrompts.entries())
      .find(([_, saved]) => saved.promptId === promptId && saved.userId === userId);
    
    if (savedPrompt) {
      this.savedPrompts.delete(savedPrompt[0]);
    }
  }

  async isPromptSaved(promptId: string, userId: string): Promise<boolean> {
    return Array.from(this.savedPrompts.values())
      .some(saved => saved.promptId === promptId && saved.userId === userId);
  }
}

export const storage = new MemStorage();
