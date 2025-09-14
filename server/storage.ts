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
      },

      {
        id: randomUUID(),
        title: "Quiz Creator",
        description: "Generate comprehensive quizzes with multiple question types, answer keys, and educational explanations.",
        content: `You are an educational assessment expert who creates engaging, fair, and comprehensive quizzes. Create a quiz about [TOPIC] with [NUMBER_OF_QUESTIONS] questions that effectively tests knowledge and understanding.

**Quiz Requirements:**
- Subject: [SUBJECT_AREA]
- Difficulty Level: [BEGINNER | INTERMEDIATE | ADVANCED]
- Question Types: [MULTIPLE_CHOICE | TRUE/FALSE | SHORT_ANSWER | ESSAY | MIX]
- Time Limit: [SUGGESTED_DURATION]
- Target Audience: [GRADE_LEVEL or AUDIENCE_TYPE]

**Quiz Structure:**

**Quiz Title**: [ENGAGING_QUIZ_TITLE]
**Instructions**: [CLEAR_DIRECTIONS_FOR_STUDENTS]
**Time Limit**: [DURATION] minutes
**Total Points**: [POINT_DISTRIBUTION]

---

**SECTION A: Multiple Choice Questions**
*(Choose the best answer from the options provided)*

**Question 1** (2 points)
[QUESTION_TEXT]
a) [OPTION_A]
b) [OPTION_B] 
c) [OPTION_C]
d) [OPTION_D]

**Question 2** (2 points)
[NEXT_QUESTION]
[Continue pattern for remaining MC questions]

---

**SECTION B: True/False Questions**
*(Mark T for True, F for False)*

**Question [X]** (1 point)
[TRUE/FALSE_STATEMENT]

---

**SECTION C: Short Answer Questions**
*(Provide brief, accurate responses)*

**Question [Y]** (5 points)
[SHORT_ANSWER_QUESTION_REQUIRING_EXPLANATION]

---

**SECTION D: Essay/Extended Response** 
*(Choose ONE of the following)*

**Question [Z]** (15 points)
Option 1: [ESSAY_PROMPT_1]
Option 2: [ESSAY_PROMPT_2]

**Requirements for Essay:**
- Minimum [WORD_COUNT] words
- Include specific examples
- Demonstrate understanding of key concepts
- Use proper grammar and organization

---

**ANSWER KEY & EXPLANATIONS:**

**Section A - Multiple Choice:**
1. **Answer: [LETTER]** - [EXPLANATION_OF_WHY_CORRECT_AND_WHY_OTHERS_WRONG]
2. **Answer: [LETTER]** - [DETAILED_EXPLANATION]
[Continue for all MC questions]

**Section B - True/False:**
[X]. **Answer: [T/F]** - [EXPLANATION_OF_REASONING]

**Section C - Short Answer:**
**Sample Answer**: [MODEL_RESPONSE_WITH_KEY_POINTS]
**Grading Rubric**: 
- Full Credit (5 pts): [CRITERIA_FOR_FULL_POINTS]
- Partial Credit (3 pts): [CRITERIA_FOR_PARTIAL]
- Minimal Credit (1 pt): [MINIMUM_REQUIREMENTS]

**Section D - Essay Rubric:**
**Excellent (13-15 pts)**:
- [CRITERIA_FOR_EXCELLENT_WORK]

**Good (10-12 pts)**:
- [CRITERIA_FOR_GOOD_WORK]

**Satisfactory (7-9 pts)**:
- [CRITERIA_FOR_SATISFACTORY]

**Needs Improvement (0-6 pts)**:
- [CRITERIA_FOR_IMPROVEMENT_NEEDED]

**Additional Study Resources:**
- Key concepts to review: [CONCEPT_LIST]
- Suggested readings: [RESOURCE_RECOMMENDATIONS]
- Practice activities: [ADDITIONAL_PRACTICE_SUGGESTIONS]

**Differentiation Options:**
- **For Advanced Students**: [EXTENSION_ACTIVITIES]
- **For Struggling Students**: [SUPPORT_STRATEGIES]
- **Alternative Assessment**: [MODIFICATIONS_FOR_DIFFERENT_NEEDS]

Create questions that test multiple levels of Bloom's Taxonomy: knowledge, comprehension, application, analysis, synthesis, and evaluation.`,
        categoryId: educationCategoryId,
        isFeatured: false,
        views: 980,
        likes: 187,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Step-by-Step Explainer",
        description: "Break down complex processes into clear, sequential steps with examples and troubleshooting tips.",
        content: `You are an expert instructor who excels at breaking down complex processes into clear, manageable steps. Explain how to [PROCESS/TASK] in a way that anyone can follow successfully.

**Process Overview:**
**Goal**: [WHAT_WILL_BE_ACCOMPLISHED]
**Time Required**: [ESTIMATED_DURATION]
**Difficulty Level**: [BEGINNER | INTERMEDIATE | ADVANCED]
**Prerequisites**: [REQUIRED_KNOWLEDGE_OR_SKILLS]

**Materials/Tools Needed:**
- [ITEM_1]: [WHY_IT'S_NEEDED]
- [ITEM_2]: [PURPOSE_AND_ALTERNATIVES]
- [ITEM_3]: [SPECIFICATIONS_IF_IMPORTANT]

**Before You Begin:**
⚠️ **Safety Considerations**: [ANY_SAFETY_WARNINGS]
💡 **Pro Tips**: [HELPFUL_PREPARATION_ADVICE]
🔧 **Setup**: [WORKSPACE_OR_ENVIRONMENT_PREPARATION]

---

**Step-by-Step Instructions:**

**PHASE 1: [PHASE_NAME]**

**Step 1: [ACTION_DESCRIPTION]**
- **What to do**: [SPECIFIC_INSTRUCTIONS]
- **How to do it**: [DETAILED_METHOD]
- **What it should look like**: [EXPECTED_RESULT_OR_APPEARANCE]
- **Common mistakes**: [WHAT_TO_AVOID]
- **Time needed**: [DURATION_FOR_THIS_STEP]

**Step 2: [NEXT_ACTION]**
- **What to do**: [CLEAR_INSTRUCTIONS]
- **Key points**: [CRITICAL_DETAILS_TO_REMEMBER]
- **Visual cue**: [WHAT_TO_LOOK_FOR]
- **If problems occur**: [QUICK_TROUBLESHOOTING]

[Continue pattern for each step in Phase 1]

**✓ Phase 1 Checkpoint**: 
Before moving to Phase 2, verify:
- [ ] [CHECKPOINT_ITEM_1]
- [ ] [CHECKPOINT_ITEM_2]
- [ ] [CHECKPOINT_ITEM_3]

**PHASE 2: [NEXT_PHASE_NAME]**

**Step [X]: [ACTION_DESCRIPTION]**
[Continue same detailed format]

---

**Quality Check & Validation:**
**How to know you're successful:**
- [ ] [SUCCESS_INDICATOR_1]
- [ ] [SUCCESS_INDICATOR_2] 
- [ ] [SUCCESS_INDICATOR_3]
- [ ] [FINAL_RESULT_VERIFICATION]

**Testing/Verification Steps:**
1. [TEST_METHOD_1]: [EXPECTED_OUTCOME]
2. [TEST_METHOD_2]: [HOW_TO_INTERPRET_RESULTS]
3. [FINAL_VALIDATION]: [CONFIRM_SUCCESS]

---

**Troubleshooting Guide:**

**Problem**: [COMMON_ISSUE_1]
- **Possible Causes**: [WHY_THIS_HAPPENS]
- **Solutions**: [HOW_TO_FIX]
- **Prevention**: [HOW_TO_AVOID_NEXT_TIME]

**Problem**: [COMMON_ISSUE_2]
- **Symptoms**: [HOW_TO_IDENTIFY]
- **Quick Fix**: [IMMEDIATE_SOLUTION]
- **Long-term Solution**: [PERMANENT_FIX]

**Problem**: [COMMON_ISSUE_3]
- **Diagnosis**: [HOW_TO_CONFIRM_THE_PROBLEM]
- **Step-by-step Fix**: [DETAILED_REPAIR_PROCESS]

---

**Variations & Alternatives:**
- **Method 2**: [ALTERNATIVE_APPROACH] - *Best when [CONDITIONS]*
- **Shortcut Version**: [FASTER_METHOD] - *For experienced users*
- **Beginner-Friendly**: [SIMPLER_APPROACH] - *If you're just starting*

**Next Steps & Advanced Topics:**
- **Build on this**: [HOW_TO_EXTEND_OR_IMPROVE]
- **Related processes**: [CONNECTED_SKILLS_TO_LEARN]
- **Advanced techniques**: [EXPERT_LEVEL_CONCEPTS]

**Resources for Further Learning:**
- **Documentation**: [WHERE_TO_FIND_MORE_INFO]
- **Communities**: [WHERE_TO_GET_HELP]
- **Tools**: [HELPFUL_SOFTWARE_OR_RESOURCES]

**Summary Checklist:**
- [ ] [MAJOR_MILESTONE_1]
- [ ] [MAJOR_MILESTONE_2]
- [ ] [MAJOR_MILESTONE_3]
- [ ] [FINAL_COMPLETION_CONFIRMATION]

Focus on clarity, safety, and building confidence through successful completion of each step.`,
        categoryId: educationCategoryId,
        isFeatured: false,
        views: 1120,
        likes: 203,
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
      },

      // NEW PRODUCTIVITY PROMPTS
      {
        id: randomUUID(),
        title: "Daily Planner Assistant",
        description: "Create structured daily schedules that optimize productivity, balance tasks, and account for your energy levels.",
        content: `You are a productivity expert who helps people create realistic, effective daily plans. Create a detailed daily schedule for [DATE] that maximizes productivity and maintains work-life balance.

**Daily Planning Session:**

**Initial Assessment:**
- **Available Hours**: [TOTAL_WORK_HOURS] (e.g., 8 hours)
- **Energy Pattern**: [MORNING_PERSON | EVENING_PERSON | STEADY_THROUGHOUT]
- **Work Style**: [DEEP_FOCUS | MULTITASKER | COLLABORATIVE | FLEXIBLE]
- **Current Priorities**: [TOP_3_PRIORITIES_FOR_THE_DAY]

**Tasks to Schedule:**
**High Priority (Must Do Today):**
- [TASK_1]: [ESTIMATED_TIME] - [ENERGY_LEVEL_REQUIRED]
- [TASK_2]: [ESTIMATED_TIME] - [COMPLEXITY_NOTES]
- [TASK_3]: [ESTIMATED_TIME] - [DEADLINE_INFORMATION]

**Medium Priority (Should Do):**
- [TASK_4]: [TIME_ESTIMATE] - [FLEXIBLE_TIMING]
- [TASK_5]: [DURATION] - [CONTEXT_SWITCHING_NEEDS]

**Low Priority (Nice to Have):**
- [TASK_6]: [TIME_ESTIMATE] - [FILLER_TASK_NOTES]

**Fixed Commitments:**
- [MEETING_1]: [TIME_SLOT] - [PREPARATION_NEEDED]
- [APPOINTMENT]: [TIME_BLOCK] - [TRAVEL_TIME_CONSIDERATION]

---

**Optimized Daily Schedule:**

**6:00 AM - 7:00 AM: Morning Routine**
- ☀️ Wake up, hydration, light exercise/stretching
- 📱 Quick email check (5 min max)
- 🎯 Review today's priorities and mental preparation

**7:00 AM - 8:00 AM: Deep Focus Block 1**
- 🧠 **Task**: [HIGHEST_PRIORITY_TASK]
- **Why now**: Peak mental energy for complex work
- **Environment**: [IDEAL_SETTING_NOTES]
- **Success metric**: [HOW_TO_MEASURE_COMPLETION]

**8:00 AM - 8:30 AM: Transition & Fuel**
- ☕ Breakfast/coffee break
- 📧 Process urgent communications
- 🗂️ Quick workspace organization

**8:30 AM - 10:00 AM: Deep Focus Block 2**
- 🎯 **Task**: [SECOND_PRIORITY_TASK]
- **Approach**: [SPECIFIC_STRATEGY_OR_METHOD]
- **Checkpoints**: [PROGRESS_MILESTONES]

**10:00 AM - 10:15 AM: Energy Reset**
- 🚶 Movement break (walk, stretch)
- 💧 Hydration
- 🧘 Quick mindfulness/breathing

**10:15 AM - 11:45 AM: Collaborative/Communication Block**
- 💬 **Activities**: [MEETINGS_OR_TEAM_WORK]
- 📞 Return calls/messages
- 🤝 Collaborative tasks requiring interaction

**11:45 AM - 12:00 PM: Buffer & Transition**
- 📝 Quick notes from morning work
- 🎯 Afternoon priority adjustment
- 🍽️ Lunch preparation

**12:00 PM - 1:00 PM: Lunch & Recharge**
- 🍽️ Nourishing meal away from work
- 🌿 Outdoor time if possible
- 📚 Light reading or podcast (optional)

**1:00 PM - 2:30 PM: Administrative Block**
- 📧 Email processing and responses
- 📋 Task updates and project coordination
- 📊 Quick progress reviews

**2:30 PM - 2:45 PM: Afternoon Energy Boost**
- ☕ Light snack/beverage
- 🎵 Energizing music or brief walk
- 🔄 Quick workspace refresh

**2:45 PM - 4:15 PM: Creative/Problem-Solving Block**
- 💡 **Task**: [CREATIVE_OR_STRATEGIC_WORK]
- **Method**: [BRAINSTORMING_OR_ANALYSIS_APPROACH]
- **Tools**: [SPECIFIC_RESOURCES_NEEDED]

**4:15 PM - 5:00 PM: Completion & Planning**
- ✅ Finish pending tasks from today
- 📅 Tomorrow's priority setting
- 📧 Final communication wrap-up
- 🧹 Workspace organization

**5:00 PM - Evening: Personal Time**
- 🏠 Transition to personal activities
- 🏃 Exercise, hobbies, family time
- 📖 Learning or relaxation
- 🌙 Wind-down routine preparation

---

**Productivity Optimization Features:**

**Energy Management:**
- **High-energy tasks**: Scheduled during [PEAK_ENERGY_HOURS]
- **Low-energy tasks**: Placed during [NATURAL_DIPS]
- **Recovery periods**: Built in every [TIME_INTERVAL]

**Context Switching Minimization:**
- **Similar tasks grouped**: [BATCHING_STRATEGY]
- **Transition buffers**: [SWITCHING_TIME_ALLOWANCES]
- **Single-focus blocks**: [DEEP_WORK_PERIODS]

**Flexibility Buffers:**
- **15-minute buffers**: Between major blocks
- **30-minute flex time**: [LOCATION_IN_SCHEDULE]
- **Overflow tasks**: [BACKUP_ACTIVITIES]

**Success Tracking:**
- [ ] Completed all high-priority tasks
- [ ] Maintained energy throughout the day
- [ ] Stayed within time estimates
- [ ] Felt accomplished and balanced

**Contingency Plans:**
**If running behind**: [TASK_PRIORITIZATION_STRATEGY]
**If energy crashes**: [RECOVERY_PROTOCOL]
**If interruptions occur**: [REFOCUS_METHOD]

**Tomorrow's Preparation:**
- Evening review: [REFLECTION_QUESTIONS]
- Priority identification: [NEXT_DAY_SETUP]
- Environment preparation: [WORKSPACE_READINESS]

Customize this schedule based on your natural rhythms, work requirements, and personal preferences.`,
        categoryId: productivityCategoryId,
        isFeatured: true,
        views: 2890,
        likes: 498,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Brainstorming Facilitator",
        description: "Generate creative ideas and solutions through structured brainstorming sessions with various thinking techniques.",
        content: `You are a creativity expert who facilitates productive brainstorming sessions. Help generate innovative solutions for [CHALLENGE/OPPORTUNITY] using proven creative thinking techniques.

**Brainstorming Session Setup:**

**Challenge Definition:**
- **Core Problem**: [CLEAR_PROBLEM_STATEMENT]
- **Success Criteria**: [WHAT_GOOD_SOLUTION_LOOKS_LIKE]
- **Constraints**: [LIMITATIONS_OR_REQUIREMENTS]
- **Stakeholders**: [WHO_IS_AFFECTED_OR_INVOLVED]
- **Timeline**: [DEADLINE_OR_URGENCY_LEVEL]

**Session Parameters:**
- **Duration**: [TIME_ALLOCATED]
- **Participants**: [SOLO | SMALL_GROUP | LARGE_TEAM]
- **Goal**: [NUMBER_OF_IDEAS_TO_GENERATE]
- **Focus**: [QUANTITY | QUALITY | INNOVATION | PRACTICALITY]

---

**PHASE 1: DIVERGENT THINKING** *(Generate Many Ideas)*

**🧠 Classic Brainstorming** (10 minutes)
*Rules*: No judgment, build on others' ideas, quantity over quality, wild ideas welcome

**Ideas Generated:**
1. [TRADITIONAL_APPROACH_1]
2. [CONVENTIONAL_SOLUTION_2]
3. [OBVIOUS_OPTION_3]
4. [STANDARD_METHOD_4]
5. [TYPICAL_RESPONSE_5]

**💭 SCAMPER Technique** 
*(Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse)*

**Substitute**: What if we replaced [ELEMENT] with [ALTERNATIVE]?
- Idea: [SUBSTITUTION_BASED_SOLUTION]

**Combine**: What if we merged [CONCEPT_A] with [CONCEPT_B]?
- Idea: [COMBINATION_SOLUTION]

**Adapt**: How could we adapt [EXISTING_SOLUTION] from [OTHER_FIELD]?
- Idea: [ADAPTATION_BASED_APPROACH]

**Modify**: What if we amplified or minimized [ASPECT]?
- Idea: [MODIFICATION_SOLUTION]

**Put to Other Use**: How else could we use [RESOURCE/TOOL]?
- Idea: [REPURPOSING_SOLUTION]

**Eliminate**: What if we removed [COMPONENT] entirely?
- Idea: [ELIMINATION_BASED_APPROACH]

**Reverse**: What if we did the opposite of [CURRENT_APPROACH]?
- Idea: [REVERSAL_SOLUTION]

**🎯 "What If" Scenarios** (5 minutes)
- What if money was no object? → [UNLIMITED_RESOURCE_IDEA]
- What if we had to solve this in 24 hours? → [URGENT_SOLUTION]
- What if we were a [DIFFERENT_INDUSTRY]? → [CROSS_INDUSTRY_APPROACH]
- What if our customers were [DIFFERENT_DEMOGRAPHIC]? → [ALTERNATIVE_AUDIENCE_SOLUTION]
- What if technology didn't exist? → [LOW_TECH_APPROACH]
- What if we had unlimited technology? → [HIGH_TECH_SOLUTION]

**🔄 Random Word Association** (5 minutes)
*Random words*: [WORD_1], [WORD_2], [WORD_3]
- How does [WORD_1] relate to our challenge? → [ASSOCIATION_IDEA_1]
- What if our solution was like [WORD_2]? → [METAPHOR_BASED_SOLUTION]
- How could [WORD_3] inspire our approach? → [INSPIRATION_IDEA]

---

**PHASE 2: CONVERGENT THINKING** *(Refine and Select)*

**🎯 Idea Clustering**
**Category 1: [THEME_1]**
- [RELATED_IDEA_1]
- [RELATED_IDEA_2] 
- [RELATED_IDEA_3]

**Category 2: [THEME_2]**
- [GROUPED_IDEA_1]
- [GROUPED_IDEA_2]

**Category 3: [THEME_3]**
- [CLUSTER_IDEA_1]
- [CLUSTER_IDEA_2]

**⭐ Evaluation Matrix**
*Rate each top idea (1-5 scale)*

| Idea | Feasibility | Impact | Innovation | Cost | Speed | Total |
|------|------------|--------|------------|------|-------|-------|
| [IDEA_1] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [TOTAL] |
| [IDEA_2] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [TOTAL] |
| [IDEA_3] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [SCORE] | [TOTAL] |

**🏆 Top 3 Solutions:**

**Solution #1: [WINNING_IDEA]**
- **Description**: [DETAILED_EXPLANATION]
- **Why it works**: [SUCCESS_RATIONALE]
- **Implementation**: [NEXT_STEPS]
- **Resources needed**: [REQUIREMENTS]
- **Timeline**: [ESTIMATED_DURATION]
- **Risks**: [POTENTIAL_CHALLENGES]

**Solution #2: [RUNNER_UP_IDEA]**
- **Description**: [CLEAR_EXPLANATION]
- **Advantages**: [KEY_BENEFITS]
- **Quick win potential**: [IMMEDIATE_VALUE]

**Solution #3: [THIRD_CHOICE]**
- **Description**: [CONCEPT_OVERVIEW]
- **Innovation factor**: [CREATIVE_ELEMENTS]
- **Long-term potential**: [FUTURE_VALUE]

---

**PHASE 3: ACTION PLANNING**

**🚀 Implementation Strategy:**
**Immediate Actions (This Week):**
- [ ] [FIRST_STEP]
- [ ] [RESEARCH_REQUIREMENT]
- [ ] [RESOURCE_ALLOCATION]

**Short-term Goals (This Month):**
- [ ] [PROTOTYPE_OR_TEST]
- [ ] [STAKEHOLDER_ALIGNMENT]
- [ ] [INITIAL_IMPLEMENTATION]

**Long-term Vision (3-6 Months):**
- [ ] [FULL_ROLLOUT]
- [ ] [IMPACT_MEASUREMENT]
- [ ] [ITERATION_AND_IMPROVEMENT]

**💡 Hybrid Solutions:**
Could we combine elements from multiple ideas?
- [IDEA_A] + [IDEA_B] = [HYBRID_SOLUTION]
- Best of: [COMBINED_ADVANTAGES]

**🔄 Iteration Opportunities:**
- Version 1.0: [BASIC_IMPLEMENTATION]
- Version 2.0: [ENHANCED_VERSION]
- Version 3.0: [ADVANCED_FEATURES]

**Session Summary:**
- **Total Ideas Generated**: [COUNT]
- **Categories Explored**: [NUMBER_OF_THEMES]
- **Best Solution**: [WINNING_CONCEPT]
- **Confidence Level**: [HIGH | MEDIUM | LOW]
- **Next Brainstorming**: [FUTURE_SESSION_NEEDS]

Remember: The best solutions often come from combining multiple ideas or thinking beyond the first "obvious" answer.`,
        categoryId: productivityCategoryId,
        isFeatured: false,
        views: 1670,
        likes: 312,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Decision Helper",
        description: "Analyze complex decisions systematically using multiple frameworks to reach confident, well-reasoned conclusions.",
        content: `You are a decision analysis expert who helps people make confident, well-reasoned choices. Guide me through analyzing [DECISION_TO_MAKE] using systematic decision-making frameworks.

**Decision Overview:**
- **Decision**: [CLEAR_STATEMENT_OF_CHOICE]
- **Urgency**: [DEADLINE_OR_TIMELINE]
- **Importance**: [HIGH | MEDIUM | LOW stakes]
- **Reversibility**: [EASILY_REVERSIBLE | DIFFICULT_TO_UNDO | PERMANENT]
- **Decision Maker**: [INDIVIDUAL | TEAM | COMMITTEE]

**Current Situation Analysis:**
- **Context**: [BACKGROUND_INFORMATION]
- **Trigger**: [WHAT_PROMPTED_THIS_DECISION]
- **Constraints**: [LIMITATIONS_OR_REQUIREMENTS]
- **Resources Available**: [TIME | MONEY | PEOPLE | INFORMATION]

---

**FRAMEWORK 1: PROS & CONS ANALYSIS**

**Option A: [FIRST_OPTION]**
**Pros:**
✅ [ADVANTAGE_1] - *Weight: [HIGH/MED/LOW]*
✅ [ADVANTAGE_2] - *Impact: [DESCRIPTION]*
✅ [ADVANTAGE_3] - *Likelihood: [PROBABILITY]*

**Cons:**
❌ [DISADVANTAGE_1] - *Risk Level: [HIGH/MED/LOW]*
❌ [DISADVANTAGE_2] - *Mitigation: [POSSIBLE_SOLUTIONS]*
❌ [DISADVANTAGE_3] - *Permanence: [TEMPORARY/PERMANENT]*

**Option B: [SECOND_OPTION]**
[Same format as Option A]

**Option C: [THIRD_OPTION] (if applicable)**
[Same format]

---

**FRAMEWORK 2: DECISION MATRIX**

**Criteria Weighting:**
- [CRITERION_1]: [WEIGHT_%] (e.g., Cost: 25%)
- [CRITERION_2]: [WEIGHT_%] (e.g., Time: 15%)
- [CRITERION_3]: [WEIGHT_%] (e.g., Quality: 30%)
- [CRITERION_4]: [WEIGHT_%] (e.g., Risk: 20%)
- [CRITERION_5]: [WEIGHT_%] (e.g., Alignment: 10%)

**Scoring Matrix (1-10 scale):**

| Option | [CRIT_1] | [CRIT_2] | [CRIT_3] | [CRIT_4] | [CRIT_5] | Weighted Total |
|--------|----------|----------|----------|----------|----------|----------------|
| Option A | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [TOTAL_SCORE] |
| Option B | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [SCORE] × [WEIGHT] | [TOTAL_SCORE] |

**Matrix Winner**: [HIGHEST_SCORING_OPTION]

---

**FRAMEWORK 3: 10-10-10 RULE**

**How will I feel about each option...**

**In 10 Minutes:**
- Option A: [IMMEDIATE_REACTION_A]
- Option B: [IMMEDIATE_REACTION_B]
- Winner: [CHOICE_FOR_SHORT_TERM]

**In 10 Months:**
- Option A: [MEDIUM_TERM_IMPACT_A]
- Option B: [MEDIUM_TERM_IMPACT_B]
- Winner: [CHOICE_FOR_MEDIUM_TERM]

**In 10 Years:**
- Option A: [LONG_TERM_IMPACT_A]
- Option B: [LONG_TERM_IMPACT_B]
- Winner: [CHOICE_FOR_LONG_TERM]

**Temporal Analysis**: [WHICH_OPTION_WINS_ACROSS_TIME]

---

**FRAMEWORK 4: VALUES ALIGNMENT**

**Core Values Assessment:**
- **Value 1: [IMPORTANT_VALUE]** (e.g., Family time)
  - Option A alignment: [HIGH/MED/LOW] - [EXPLANATION]
  - Option B alignment: [HIGH/MED/LOW] - [EXPLANATION]
  
- **Value 2: [SECOND_VALUE]** (e.g., Financial security)
  - Option A alignment: [RATING] - [REASONING]
  - Option B alignment: [RATING] - [REASONING]

- **Value 3: [THIRD_VALUE]** (e.g., Personal growth)
  - Option A alignment: [ASSESSMENT]
  - Option B alignment: [ASSESSMENT]

**Values Winner**: [MOST_ALIGNED_OPTION]

---

**FRAMEWORK 5: SCENARIO PLANNING**

**Best Case Scenario:**
- **Option A**: [OPTIMAL_OUTCOME_A]
- **Option B**: [OPTIMAL_OUTCOME_B]
- **More compelling**: [CHOICE_AND_WHY]

**Most Likely Scenario:**
- **Option A**: [REALISTIC_OUTCOME_A]
- **Option B**: [REALISTIC_OUTCOME_B]
- **Better positioned**: [CHOICE_AND_REASONING]

**Worst Case Scenario:**
- **Option A**: [NEGATIVE_OUTCOME_A]
- **Option B**: [NEGATIVE_OUTCOME_B]
- **More manageable**: [SAFER_CHOICE]

**Risk Tolerance Analysis**: [RISK_COMFORT_ASSESSMENT]

---

**FRAMEWORK 6: STAKEHOLDER IMPACT**

**Who is affected and how:**
- **Stakeholder 1: [PRIMARY_AFFECTED_PARTY]**
  - Option A impact: [EFFECT_DESCRIPTION]
  - Option B impact: [ALTERNATIVE_EFFECT]
  - Preferred option: [THEIR_LIKELY_PREFERENCE]

- **Stakeholder 2: [SECONDARY_PARTY]**
  - Option A: [IMPACT_ANALYSIS]
  - Option B: [IMPACT_COMPARISON]

**Stakeholder Consensus**: [MOST_ACCEPTABLE_TO_OTHERS]

---

**DECISION SYNTHESIS:**

**Framework Results Summary:**
- Pros/Cons: [WINNER]
- Decision Matrix: [QUANTITATIVE_WINNER]
- 10-10-10 Rule: [TIME_PERSPECTIVE_WINNER]
- Values Alignment: [VALUES_WINNER]
- Scenario Planning: [RISK_ADJUSTED_WINNER]
- Stakeholder Analysis: [SOCIAL_WINNER]

**Gut Check**: [INTUITIVE_FEELING_ABOUT_CHOICE]

**🎯 RECOMMENDED DECISION: [FINAL_RECOMMENDATION]**

**Reasoning:**
1. [PRIMARY_REASON_FOR_CHOICE]
2. [SUPPORTING_RATIONALE_2]
3. [ADDITIONAL_FACTOR_3]

**Implementation Plan:**
- **Immediate next step**: [FIRST_ACTION]
- **Timeline**: [DECISION_EXECUTION_SCHEDULE]
- **Success metrics**: [HOW_TO_MEASURE_SUCCESS]
- **Review point**: [WHEN_TO_REASSESS]

**Contingency Planning:**
- **If it's not working**: [PIVOT_STRATEGY]
- **Early warning signs**: [WHAT_TO_WATCH_FOR]
- **Exit strategy**: [BACKUP_PLAN_IF_NEEDED]

**Decision Confidence Level**: [HIGH | MODERATE | LOW] - [EXPLANATION]

**Final Validation Questions:**
- [ ] Does this align with my long-term goals?
- [ ] Can I live with the worst-case outcome?
- [ ] Have I considered all key stakeholders?
- [ ] Am I making this decision from a clear headspace?
- [ ] Will I regret not taking this opportunity?

Trust your analysis, but also trust your instincts. The best decisions often feel both logical and right.`,
        categoryId: productivityCategoryId,
        isFeatured: false,
        views: 1450,
        likes: 278,
        createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
      },

      // NEW CREATIVE PROMPTS
      {
        id: randomUUID(),
        title: "Story Starter Generator",
        description: "Create compelling story openings with unique characters, intriguing situations, and hooks that draw readers in.",
        content: `You are a master storyteller who creates irresistible story openings. Generate a compelling story starter for [GENRE] that immediately hooks readers and establishes a vivid, engaging world.

**Story Parameters:**
- **Genre**: [SPECIFIED_GENRE] (e.g., Fantasy, Sci-Fi, Romance, Mystery, Thriller, Literary Fiction)
- **Target Audience**: [AGE_GROUP] (e.g., Young Adult, Adult, Middle Grade)
- **Length**: [SHORT_STORY | NOVELLA | NOVEL] 
- **Tone**: [DARK | LIGHT | MYSTERIOUS | HUMOROUS | DRAMATIC | WHIMSICAL]
- **Setting Era**: [CONTEMPORARY | HISTORICAL | FUTURISTIC | TIMELESS]

---

**STORY STARTER ELEMENTS:**

**🎭 MAIN CHARACTER**
**Name**: [CHARACTER_NAME]
**Age**: [CHARACTER_AGE] 
**Occupation/Role**: [WHAT_THEY_DO]
**Personality Trait**: [ONE_DEFINING_CHARACTERISTIC]
**Hidden Secret**: [SOMETHING_NOBODY_KNOWS]
**What They Want**: [PRIMARY_MOTIVATION]
**What They Fear**: [GREATEST_FEAR_OR_WEAKNESS]

*Character Voice*: [BRIEF_DIALOGUE_SAMPLE_SHOWING_PERSONALITY]

**🌍 SETTING & ATMOSPHERE**
**Primary Location**: [WHERE_STORY_BEGINS]
**Time Period**: [WHEN_IT_TAKES_PLACE]
**Mood/Atmosphere**: [EMOTIONAL_FEELING_OF_THE_SCENE]
**Unique Detail**: [SOMETHING_MEMORABLE_ABOUT_THIS_PLACE]
**Weather/Environment**: [ATMOSPHERIC_CONDITIONS]

*Setting Description*: [2-3_SENTENCES_PAINTING_THE_SCENE]

**⚡ INCITING INCIDENT**
**The Catalyst**: [EVENT_THAT_STARTS_EVERYTHING]
**Why Now?**: [WHAT_MAKES_THIS_MOMENT_SPECIAL]
**Stakes**: [WHAT_THE_CHARACTER_RISKS_LOSING]
**Conflict Type**: [INTERNAL | EXTERNAL | BOTH]
**Urgency Level**: [IMMEDIATE | BUILDING | SLOW_BURN]

---

**📖 STORY OPENING (First 300 words):**

[COMPELLING_OPENING_PARAGRAPH_THAT_HOOKS_THE_READER]

[SECOND_PARAGRAPH_INTRODUCING_CHARACTER_AND_SITUATION]

[THIRD_PARAGRAPH_WITH_DIALOGUE_OR_ACTION_THAT_REVEALS_CHARACTER]

[FOURTH_PARAGRAPH_BUILDING_TENSION_OR_MYSTERY]

[FINAL_PARAGRAPH_WITH_THE_INCITING_INCIDENT_OR_COMPELLING_CLIFFHANGER]

---

**🧩 STORY DEVELOPMENT SEEDS:**

**Plot Threads to Explore:**
- **Thread 1**: [MYSTERY_OR_QUESTION_TO_RESOLVE]
- **Thread 2**: [RELATIONSHIP_TO_DEVELOP]
- **Thread 3**: [INTERNAL_GROWTH_ARC]
- **Thread 4**: [EXTERNAL_CHALLENGE_TO_OVERCOME]

**Potential Supporting Characters:**
- **The Ally**: [HELPFUL_CHARACTER_DESCRIPTION]
- **The Antagonist**: [OPPOSING_FORCE_DESCRIPTION]
- **The Mentor**: [WISE_GUIDE_CHARACTER]
- **The Wildcard**: [UNPREDICTABLE_ELEMENT]

**Worldbuilding Details:**
- **Rules of this World**: [UNIQUE_ASPECTS_OR_LIMITATIONS]
- **Cultural Elements**: [TRADITIONS_CUSTOMS_OR_SOCIAL_NORMS]
- **Technology/Magic Level**: [WHAT_IS_POSSIBLE_IN_THIS_WORLD]
- **Historical Context**: [BACKGROUND_EVENTS_THAT_SHAPE_THE_STORY]

**Potential Plot Twists:**
- **Early Surprise**: [SOMETHING_TO_SUBVERT_EXPECTATIONS]
- **Midpoint Revelation**: [GAME_CHANGING_DISCOVERY]
- **Final Twist**: [ULTIMATE_SURPRISE_ENDING]

---

**🎯 GENRE-SPECIFIC ELEMENTS:**

**For [GENRE] Stories, Include:**
- **Key Trope**: [GENRE_CONVENTION_TO_USE_OR_SUBVERT]
- **Expected Elements**: [WHAT_READERS_WANT_FROM_THIS_GENRE]
- **Fresh Angle**: [UNIQUE_TWIST_ON_FAMILIAR_CONCEPTS]
- **Mood Markers**: [SPECIFIC_TONE_INDICATORS]

**Character Archetypes for [GENRE]:**
- [ARCHETYPE_1]: [HOW_TO_MAKE_IT_FRESH]
- [ARCHETYPE_2]: [SUBVERSION_OPPORTUNITY]

---

**💫 WRITING PROMPTS TO CONTINUE:**

**Next Scene Ideas:**
1. **Immediate Follow-up**: [WHAT_HAPPENS_IN_THE_NEXT_SCENE]
2. **Character Response**: [HOW_PROTAGONIST_REACTS_TO_INCITING_INCIDENT]
3. **Complication**: [NEW_PROBLEM_THAT_ARISES]
4. **Introduction**: [NEW_CHARACTER_TO_BRING_IN]
5. **Revelation**: [INFORMATION_TO_REVEAL_TO_READERS]

**Dialogue Starters:**
- "[INTRIGUING_FIRST_LINE_OF_DIALOGUE]"
- "[QUESTION_THAT_REVEALS_CONFLICT]"
- "[STATEMENT_THAT_RAISES_STAKES]"

**Sensory Details to Develop:**
- **Sight**: [VIVID_VISUAL_ELEMENT]
- **Sound**: [IMPORTANT_AUDIO_CUE]
- **Smell**: [MEMORABLE_SCENT]
- **Touch**: [PHYSICAL_SENSATION]
- **Taste**: [IF_RELEVANT_TO_SCENE]

---

**🔥 HOOK ANALYSIS:**
**Why This Opening Works:**
1. **Immediate Engagement**: [WHAT_GRABS_ATTENTION]
2. **Character Investment**: [WHY_READERS_CARE_ABOUT_PROTAGONIST]
3. **Question Raised**: [MYSTERY_THAT_DEMANDS_ANSWERS]
4. **Forward Momentum**: [WHY_READERS_MUST_CONTINUE]

**Potential Chapter Endings:**
- **Cliffhanger**: [SUSPENSEFUL_STOPPING_POINT]
- **Revelation**: [SURPRISE_DISCOVERY]
- **Escalation**: [PROBLEM_GETS_WORSE]
- **Decision Point**: [CHARACTER_MUST_CHOOSE]

**Story Themes to Explore:**
- **Primary Theme**: [MAIN_MESSAGE_OR_QUESTION]
- **Secondary Themes**: [SUPPORTING_IDEAS]
- **Universal Elements**: [WHAT_MAKES_THIS_RELATABLE]

This story starter provides multiple paths forward while maintaining strong reader engagement from the very first sentence.`,
        categoryId: creativeCategoryId,
        isFeatured: true,
        views: 2150,
        likes: 387,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Poem Generator",
        description: "Create beautiful, meaningful poetry in various styles with rich imagery, emotional depth, and memorable language.",
        content: `You are a skilled poet who creates evocative, meaningful verse. Write a [POEM_TYPE] poem about [SUBJECT] that captures deep emotion and uses vivid, memorable language.

**Poem Specifications:**
- **Type**: [SONNET | FREE_VERSE | HAIKU | BALLAD | LIMERICK | ACROSTIC | PROSE_POEM]
- **Theme**: [LOVE | NATURE | LOSS | HOPE | IDENTITY | TIME | CHANGE | BEAUTY | STRUGGLE]
- **Tone**: [MELANCHOLIC | JOYFUL | CONTEMPLATIVE | PASSIONATE | WHIMSICAL | DARK | UPLIFTING]
- **Length**: [SHORT | MEDIUM | LONG] ([APPROXIMATE_LINE_COUNT] lines)
- **Style**: [TRADITIONAL | MODERN | EXPERIMENTAL | NARRATIVE | LYRICAL]

**Poetic Elements to Include:**
- **Imagery Focus**: [VISUAL | AUDITORY | TACTILE | EMOTIONAL | SENSORY_MIX]
- **Metaphor Style**: [EXTENDED | SUBTLE | BOLD | NATURE_BASED | URBAN | ABSTRACT]
- **Rhythm**: [FLOWING | CHOPPY | MUSICAL | CONVERSATIONAL | DRAMATIC]
- **Voice**: [FIRST_PERSON | THIRD_PERSON | OMNISCIENT | INTIMATE | UNIVERSAL]

---

**🎭 POEM ANALYSIS & STRUCTURE:**

**For [POEM_TYPE]:**
**Traditional Structure**: [RHYME_SCHEME_IF_APPLICABLE]
**Syllable Count**: [IF_RELEVANT_TO_FORM]
**Stanza Pattern**: [ORGANIZATION_DESCRIPTION]
**Key Conventions**: [WHAT_MAKES_THIS_FORM_UNIQUE]

---

**📜 THE POEM:**

**Title**: "[EVOCATIVE_TITLE]"

[COMPLETE_POEM_TEXT_FORMATTED_WITH_PROPER_LINE_BREAKS_AND_STANZAS]

---

**🎨 POETIC CRAFT BREAKDOWN:**

**Imagery Analysis:**
- **Opening Image**: [FIRST_STRIKING_VISUAL_OR_CONCEPT]
  - *Effect*: [HOW_IT_HOOKS_THE_READER]
- **Central Metaphor**: [MAIN_COMPARISON_OR_SYMBOL]
  - *Meaning*: [WHAT_IT_REPRESENTS_OR_EXPLORES]
- **Closing Image**: [FINAL_MEMORABLE_PICTURE]
  - *Impact*: [HOW_IT_RESOLVES_OR_OPENS_THE_POEM]

**Sound Devices Used:**
- **Alliteration**: [EXAMPLES_FROM_THE_POEM]
- **Assonance**: [VOWEL_SOUND_REPETITIONS]
- **Rhythm**: [METER_OR_NATURAL_SPEECH_PATTERNS]
- **Rhyme** (if applicable): [RHYME_SCHEME_AND_EFFECT]

**Figurative Language:**
- **Metaphors**: [KEY_COMPARISONS_AND_THEIR_MEANINGS]
- **Personification**: [HUMAN_QUALITIES_GIVEN_TO_NON_HUMAN_ELEMENTS]
- **Symbolism**: [DEEPER_MEANINGS_AND_REPRESENTATIONS]

---

**🎯 EMOTIONAL JOURNEY:**

**Opening Emotion**: [HOW_THE_POEM_BEGINS_FEELING_WISE]
**Development**: [HOW_EMOTIONS_SHIFT_THROUGHOUT]
**Climax/Peak**: [MOMENT_OF_HIGHEST_INTENSITY]
**Resolution**: [WHERE_THE_EMOTIONS_LAND]

**Theme Exploration:**
- **Surface Level**: [WHAT_THE_POEM_IS_OBVIOUSLY_ABOUT]
- **Deeper Meaning**: [UNDERLYING_MESSAGES_OR_QUESTIONS]
- **Universal Connection**: [HOW_READERS_CAN_RELATE]

---

**✨ ALTERNATIVE VERSIONS:**

**Version 2 - Different Approach:**
*[SAME_THEME_BUT_DIFFERENT_ANGLE_OR_STYLE]*

[SHORTER_ALTERNATIVE_VERSION_OF_THE_POEM]

**Version 3 - Contrasting Mood:**
*[OPPOSITE_TONE_OR_PERSPECTIVE]*

[BRIEF_CONTRASTING_VERSION]

---

**🔄 REVISION SUGGESTIONS:**

**Strengthen Options:**
- **Line [X]**: Consider changing "[ORIGINAL_LINE]" to "[IMPROVED_OPTION]"
  - *Why*: [REASON_FOR_IMPROVEMENT]
- **Stanza [Y]**: Alternative approach for stronger impact
  - *Current*: [EXISTING_APPROACH]
  - *Alternative*: [SUGGESTED_CHANGE]

**Enhancement Ideas:**
- **Add Sensory Detail**: [SPECIFIC_SUGGESTION]
- **Strengthen Metaphor**: [HOW_TO_MAKE_COMPARISON_MORE_VIVID]
- **Improve Flow**: [RHYTHM_OR_TRANSITION_SUGGESTIONS]

---

**🎪 PERFORMANCE NOTES:**

**Reading Aloud:**
- **Pace**: [FAST | SLOW | VARIED | CONVERSATIONAL]
- **Emphasis Points**: [WHICH_WORDS_OR_LINES_TO_STRESS]
- **Pause Locations**: [WHERE_TO_BREAK_FOR_EFFECT]
- **Emotional Tone**: [HOW_TO_CONVEY_THE_FEELING]

**Memorization Tips:**
- **Key Phrases**: [MEMORABLE_LINES_THAT_ANCHOR_THE_POEM]
- **Image Sequence**: [VISUAL_PROGRESSION_TO_FOLLOW]
- **Emotional Arc**: [FEELING_JOURNEY_TO_TRACK]

---

**🌟 CREATIVE EXTENSIONS:**

**Related Poem Ideas:**
- **Companion Piece**: [POEM_FROM_DIFFERENT_PERSPECTIVE]
- **Series Potential**: [HOW_TO_EXPAND_INTO_MULTIPLE_POEMS]
- **Response Poem**: [ANSWERING_OR_CONTINUING_THE_CONVERSATION]

**Cross-Medium Adaptations:**
- **Song Lyrics**: [HOW_TO_ADAPT_FOR_MUSIC]
- **Visual Art**: [WHAT_IMAGES_THIS_POEM_INSPIRES]
- **Story Expansion**: [HOW_TO_TURN_INTO_NARRATIVE]

**Workshop Prompts:**
- Write about the same subject but from [DIFFERENT_PERSPECTIVE]
- Use the same opening line but take it in [OPPOSITE_DIRECTION]
- Create a poem that responds to this one from [OTHER_CHARACTER'S_VIEW]

**Publication Readiness:**
- **Strength**: [WHAT_MAKES_THIS_POEM_STAND_OUT]
- **Market**: [WHERE_THIS_TYPE_OF_POEM_MIGHT_BE_PUBLISHED]
- **Revision Notes**: [FINAL_POLISH_SUGGESTIONS]

Poetry is the art of saying the most important thing in the fewest, most beautiful words.`,
        categoryId: creativeCategoryId,
        isFeatured: false,
        views: 1540,
        likes: 276,
        createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Roleplay Character Creator",
        description: "Design compelling, three-dimensional characters for tabletop RPGs with detailed backgrounds, motivations, and personality traits.",
        content: `You are a master character designer who creates memorable, engaging roleplay characters. Design a detailed character for [GAME_SYSTEM] that is both mechanically effective and narratively compelling.

**Character Foundation:**
- **Game System**: [D&D_5E | PATHFINDER | CYBERPUNK | CALL_OF_CTHULHU | CUSTOM_SYSTEM]
- **Campaign Setting**: [FANTASY | SCI_FI | HORROR | MODERN | HISTORICAL | STEAMPUNK]
- **Character Level**: [STARTING_LEVEL] (e.g., Level 1, Level 5)
- **Campaign Tone**: [HEROIC | GRITTY | COMEDIC | DARK | POLITICAL | EXPLORATION]
- **Party Role**: [TANK | HEALER | DPS | SUPPORT | UTILITY | FACE | SCOUT]

---

**🎭 CHARACTER IDENTITY:**

**Basic Information:**
- **Name**: [CHARACTER_NAME] ([NICKNAME_IF_ANY])
- **Race/Species**: [CHARACTER_RACE] 
- **Class/Profession**: [CHARACTER_CLASS]
- **Age**: [AGE] ([YOUNG | MIDDLE_AGED | OLD] for their species)
- **Gender**: [GENDER_IDENTITY]
- **Physical Appearance**: [HEIGHT_WEIGHT_BUILD] with [DISTINCTIVE_FEATURES]

**Key Physical Traits:**
- **Hair**: [COLOR_STYLE_LENGTH]
- **Eyes**: [COLOR_AND_NOTABLE_CHARACTERISTICS]
- **Distinguishing Marks**: [SCARS_TATTOOS_BIRTHMARKS_JEWELRY]
- **Clothing Style**: [TYPICAL_ATTIRE_AND_WHY]
- **Voice/Speech**: [HOW_THEY_SOUND_AND_SPEAK]

**Personality Overview:**
- **Core Trait 1**: [DOMINANT_PERSONALITY_CHARACTERISTIC]
- **Core Trait 2**: [SECONDARY_STRONG_TRAIT]
- **Hidden Aspect**: [SOMETHING_NOT_OBVIOUS_ABOUT_THEM]
- **Fatal Flaw**: [CHARACTER_WEAKNESS_OR_BLIND_SPOT]
- **Greatest Strength**: [WHAT_THEY_EXCEL_AT_BEYOND_ABILITIES]

---

**📚 BACKGROUND & HISTORY:**

**Origin Story:**
[2-3_PARAGRAPHS_DESCRIBING_THEIR_BACKGROUND_CHILDHOOD_FORMATIVE_EXPERIENCES]

**Life-Changing Event:**
**What Happened**: [PIVOTAL_MOMENT_THAT_SHAPED_THEM]
**When**: [AGE_OR_TIME_PERIOD]
**Impact**: [HOW_IT_CHANGED_THEIR_WORLDVIEW_OR_DIRECTION]
**Lasting Effect**: [ONGOING_INFLUENCE_ON_THEIR_BEHAVIOR]

**Education/Training:**
- **Formal Learning**: [SCHOOLS_APPRENTICESHIPS_MENTORS]
- **Skills Acquired**: [BOTH_MECHANICAL_AND_NARRATIVE_ABILITIES]
- **Knowledge Areas**: [WHAT_THEY_KNOW_A_LOT_ABOUT]
- **Learning Style**: [HOW_THEY_PREFER_TO_GAIN_NEW_KNOWLEDGE]

**Previous Occupations:**
- **Job 1**: [EARLY_WORK_EXPERIENCE]
- **Job 2**: [CAREER_DEVELOPMENT]
- **Current Status**: [HOW_THEY_MAKE_MONEY_NOW]

---

**🎯 MOTIVATIONS & GOALS:**

**Primary Goal**: [MAIN_THING_THEY_WANT_TO_ACHIEVE]
- *Why*: [DEEP_REASON_BEHIND_THIS_DESIRE]
- *Obstacles*: [WHAT_STANDS_IN_THEIR_WAY]
- *Success Metric*: [HOW_THEY'LL_KNOW_THEY'VE_SUCCEEDED]

**Secondary Goals:**
- **Personal**: [INDIVIDUAL_ASPIRATION]
- **Professional**: [CAREER_OR_SKILL_ADVANCEMENT]
- **Social**: [RELATIONSHIP_OR_COMMUNITY_GOAL]

**Fears & Anxieties:**
- **Greatest Fear**: [WHAT_TERRIFIES_THEM_MOST]
- **Daily Worry**: [ONGOING_CONCERN]
- **Secret Shame**: [SOMETHING_THEY'RE_ASHAMED_OF]

**Moral Compass:**
- **Alignment** (if applicable): [LAWFUL_CHAOTIC_GOOD_EVIL_NEUTRAL]
- **Core Values**: [PRINCIPLES_THEY_WON'T_COMPROMISE]
- **Ethical Dilemmas**: [SITUATIONS_WHERE_VALUES_CONFLICT]
- **Lines They Won't Cross**: [ABSOLUTES_IN_THEIR_MORAL_CODE]

---

**👥 RELATIONSHIPS & CONNECTIONS:**

**Family:**
- **Parents**: [STATUS_RELATIONSHIP_INFLUENCE]
- **Siblings**: [NUMBER_DYNAMICS_CURRENT_CONTACT]
- **Other Family**: [SIGNIFICANT_RELATIVES]
- **Family Reputation**: [HOW_FAMILY_NAME_IS_VIEWED]

**Significant Relationships:**
- **Best Friend**: [NAME_RELATIONSHIP_STATUS]
- **Mentor**: [WHO_TAUGHT_THEM_IMPORTANT_LESSONS]
- **Rival**: [COMPETITIVE_OR_ANTAGONISTIC_RELATIONSHIP]
- **Love Interest**: [ROMANTIC_CONNECTION_IF_ANY]
- **Enemy**: [SOMEONE_WHO_OPPOSES_THEM]

**Professional Networks:**
- **Guild/Organization**: [FORMAL_MEMBERSHIPS]
- **Contacts**: [PEOPLE_WHO_CAN_HELP_OR_HINDER]
- **Reputation**: [HOW_THEY'RE_KNOWN_PROFESSIONALLY]

---

**⚔️ MECHANICAL BUILD:**

**Ability Scores** (adjust for system):
- **Strength**: [SCORE] - [MODIFIER]
- **Dexterity**: [SCORE] - [MODIFIER]  
- **Constitution**: [SCORE] - [MODIFIER]
- **Intelligence**: [SCORE] - [MODIFIER]
- **Wisdom**: [SCORE] - [MODIFIER]
- **Charisma**: [SCORE] - [MODIFIER]

**Key Skills** (top 5):
1. [SKILL_NAME]: [MODIFIER] - [NARRATIVE_REASON_FOR_PROFICIENCY]
2. [SKILL_NAME]: [MODIFIER] - [BACKGROUND_EXPLANATION]
3. [SKILL_NAME]: [MODIFIER] - [TRAINING_OR_NATURAL_APTITUDE]
4. [SKILL_NAME]: [MODIFIER] - [LEARNED_THROUGH_EXPERIENCE]
5. [SKILL_NAME]: [MODIFIER] - [DEVELOPED_OUT_OF_NECESSITY]

**Combat Role & Tactics:**
- **Preferred Position**: [FRONT_LINE | BACK_LINE | MOBILE | SUPPORT]
- **Combat Style**: [DESCRIPTION_OF_FIGHTING_APPROACH]
- **Signature Move**: [FAVORITE_ABILITY_OR_SPELL]
- **Emergency Plan**: [WHAT_THEY_DO_WHEN_THINGS_GO_WRONG]

**Equipment & Gear:**
- **Weapon of Choice**: [PRIMARY_WEAPON] - [WHY_THEY_CHOSE_IT]
- **Armor**: [PROTECTION_TYPE] - [PRACTICAL_OR_AESTHETIC_REASONS]
- **Important Items**: [SIGNIFICANT_POSSESSIONS_WITH_MEANING]
- **Always Carries**: [SMALL_ITEMS_THEY'RE_NEVER_WITHOUT]

---

**🎪 ROLEPLAY GUIDANCE:**

**Speaking Patterns:**
- **Vocabulary**: [EDUCATED | STREET_SMART | ARCHAIC | TECHNICAL | SIMPLE]
- **Common Phrases**: "[SIGNATURE_SAYING_1]" and "[SIGNATURE_SAYING_2]"
- **Speech Quirks**: [ACCENT_MANNERISMS_UNUSUAL_WORD_CHOICES]
- **Topics They Avoid**: [SUBJECTS_THEY_DEFLECT_FROM]

**Mannerisms & Habits:**
- **Physical Tics**: [NERVOUS_HABITS_OR_GESTURES]
- **Social Behavior**: [HOW_THEY_ACT_IN_GROUPS]
- **Alone Time Activities**: [WHAT_THEY_DO_WHEN_NO_ONE'S_WATCHING]
- **Stress Response**: [HOW_THEY_HANDLE_PRESSURE]

**Decision-Making Style:**
- **Analysis Approach**: [LOGICAL | EMOTIONAL | INTUITIVE | CONSENSUS_SEEKING]
- **Risk Tolerance**: [CAUTIOUS | BOLD | RECKLESS | CALCULATED]
- **Information Gathering**: [HOW_THEY_RESEARCH_DECISIONS]
- **Advice Seeking**: [WHO_THEY_TURN_TO_FOR_GUIDANCE]

**Party Dynamics:**
- **Leadership Style**: [HOW_THEY_LEAD_OR_FOLLOW]
- **Conflict Resolution**: [APPROACH_TO_DISAGREEMENTS]
- **Support Role**: [HOW_THEY_HELP_TEAMMATES]
- **Group Chemistry**: [WHAT_THEY_ADD_TO_PARTY_DYNAMICS]

---

**🎲 STORY HOOKS & PLOT THREADS:**

**Personal Quests:**
- **Immediate Hook**: [SOMETHING_URGENT_FROM_THEIR_PAST]
- **Long-term Arc**: [OVERARCHING_PERSONAL_STORY]
- **Family Mystery**: [UNRESOLVED_FAMILY_MATTER]
- **Professional Challenge**: [CAREER_RELATED_OBSTACLE]

**Campaign Integration:**
- **Connection to Setting**: [HOW_THEY_FIT_THE_WORLD]
- **Useful Contacts**: [NPCS_THEY_CAN_INTRODUCE]
- **Knowledge Areas**: [WHAT_PLOT_INFO_THEY_MIGHT_HAVE]
- **Potential Betrayals**: [WAYS_THEIR_PAST_COULD_COMPLICATE_THINGS]

**Character Development Opportunities:**
- **Growth Areas**: [ASPECTS_THAT_CAN_IMPROVE_OVER_TIME]
- **Potential Corruption**: [HOW_THEY_MIGHT_FALL_FROM_GRACE]
- **Redemption Paths**: [WAYS_TO_OVERCOME_THEIR_FLAWS]
- **Relationship Building**: [CONNECTIONS_TO_DEVELOP]

---

**💭 QUICK REFERENCE:**

**In Combat**: [ONE_SENTENCE_TACTICAL_SUMMARY]
**In Social**: [ONE_SENTENCE_INTERACTION_STYLE]
**In Exploration**: [ONE_SENTENCE_PROBLEM_SOLVING_APPROACH]
**Under Pressure**: [ONE_SENTENCE_STRESS_RESPONSE]

**Three Words That Define Them**: [WORD_1], [WORD_2], [WORD_3]

**Player Notes:**
- **Fun Factor**: [WHY_THIS_CHARACTER_IS_ENJOYABLE_TO_PLAY]
- **Challenge Level**: [COMPLEXITY_FOR_NEW_VS_EXPERIENCED_PLAYERS]
- **Table Fit**: [HOW_THEY_WORK_WITH_DIFFERENT_PARTY_COMPOSITIONS]

This character provides rich roleplay opportunities while being mechanically sound and campaign-ready.`,
        categoryId: creativeCategoryId,
        isFeatured: false,
        views: 1890,
        likes: 334,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },

      {
        id: randomUUID(),
        title: "Game Master Assistant",
        description: "Create immersive NPCs, compelling encounters, and rich world-building elements for tabletop RPG sessions.",
        content: `You are an experienced Game Master who creates memorable, engaging tabletop RPG experiences. Design [CONTENT_TYPE] for a [GAME_SYSTEM] campaign that will captivate players and enhance the story.

**Campaign Context:**
- **System**: [D&D_5E | PATHFINDER | CALL_OF_CTHULHU | VAMPIRE | CUSTOM_SYSTEM]
- **Setting**: [FANTASY | SCI_FI | HORROR | MODERN | HISTORICAL | CYBERPUNK]
- **Campaign Tone**: [HEROIC | GRITTY | COMEDIC | POLITICAL | MYSTERY | EXPLORATION]
- **Player Level**: [CHARACTER_LEVELS] (affects challenge and complexity)
- **Party Size**: [NUMBER_OF_PLAYERS]
- **Session Focus**: [COMBAT | ROLEPLAY | INVESTIGATION | EXPLORATION | MIXED]

**Content Type**: [NPC_CREATION | ENCOUNTER_DESIGN | WORLD_BUILDING | PLOT_HOOK | DUNGEON_DESIGN]

---

**🎭 NPC CREATION** (if selected):

**Basic Identity:**
- **Name**: [MEMORABLE_NAME]
- **Race/Species**: [APPROPRIATE_TO_SETTING]
- **Occupation**: [CURRENT_JOB_OR_ROLE]
- **Age**: [AGE_CATEGORY_AND_IMPLICATIONS]
- **Location**: [WHERE_PLAYERS_ENCOUNTER_THEM]

**Appearance & Mannerisms:**
- **Physical Description**: [DISTINCTIVE_VISUAL_FEATURES]
- **Clothing/Style**: [HOW_THEY_DRESS_AND_WHY]
- **Voice**: [ACCENT_TONE_SPEECH_PATTERNS]
- **Signature Gesture**: [MEMORABLE_PHYSICAL_HABIT]
- **First Impression**: [WHAT_PLAYERS_NOTICE_IMMEDIATELY]

**Personality & Motivation:**
- **Core Personality**: [2_3_DEFINING_TRAITS]
- **Primary Goal**: [WHAT_THEY_WANT_MOST]
- **Secondary Motivation**: [SUPPORTING_DESIRE]
- **Greatest Fear**: [WHAT_THEY_WANT_TO_AVOID]
- **Hidden Secret**: [SOMETHING_THEY'RE_CONCEALING]

**Roleplay Notes:**
- **Speech Pattern**: "[EXAMPLE_DIALOGUE_SHOWING_VOICE]"
- **Common Phrases**: [SIGNATURE_SAYINGS_OR_EXPRESSIONS]
- **Attitude Toward PCs**: [FRIENDLY | NEUTRAL | SUSPICIOUS | HOSTILE]
- **Information They Know**: [RELEVANT_PLOT_DETAILS_THEY_POSSESS]
- **Services/Resources**: [WHAT_THEY_CAN_OFFER_PLAYERS]

**Story Integration:**
- **Connection to Plot**: [HOW_THEY_ADVANCE_THE_STORY]
- **Potential Conflicts**: [WAYS_THEY_MIGHT_OPPOSE_PLAYERS]
- **Development Arc**: [HOW_RELATIONSHIP_WITH_PCS_MIGHT_EVOLVE]
- **Recurring Potential**: [REASONS_TO_BRING_THEM_BACK]

---

**⚔️ ENCOUNTER DESIGN** (if selected):

**Encounter Overview:**
- **Type**: [COMBAT | SOCIAL | EXPLORATION | PUZZLE | MIXED]
- **Difficulty**: [EASY | MEDIUM | HARD | DEADLY]
- **Duration**: [ESTIMATED_TIME_TO_COMPLETE]
- **Objective**: [WHAT_PLAYERS_NEED_TO_ACCOMPLISH]

**Setting & Environment:**
- **Location**: [WHERE_IT_TAKES_PLACE]
- **Terrain Features**: [OBSTACLES_COVER_ELEVATION_CHANGES]
- **Environmental Hazards**: [DANGERS_FROM_THE_SETTING]
- **Lighting**: [VISIBILITY_CONDITIONS]
- **Size**: [DIMENSIONS_AND_MOVEMENT_CONSIDERATIONS]

**Combat Encounter Details:**
- **Enemies**: [CREATURE_TYPES_AND_NUMBERS]
  - **Primary Threat**: [MAIN_OPPONENT] - [TACTICS_AND_ABILITIES]
  - **Supporting Units**: [ADDITIONAL_ENEMIES] - [ROLES_IN_COMBAT]
- **Initiative/Surprise**: [SPECIAL_START_CONDITIONS]
- **Victory Conditions**: [HOW_ENCOUNTER_ENDS]
- **Escalation**: [HOW_DIFFICULTY_MIGHT_INCREASE]

**Tactical Considerations:**
- **Enemy Strategy**: [HOW_OPPONENTS_FIGHT_INTELLIGENTLY]
- **Terrain Use**: [HOW_ENVIRONMENT_AFFECTS_TACTICS]
- **Retreat Conditions**: [WHEN_ENEMIES_FLEE_OR_SURRENDER]
- **Player Advantages**: [OPPORTUNITIES_FOR_CLEVER_TACTICS]

**Non-Combat Elements:**
- **Skill Challenges**: [REQUIRED_ABILITY_CHECKS]
- **Social Opportunities**: [CHANCES_FOR_NEGOTIATION_OR_INTIMIDATION]
- **Environmental Interaction**: [WAYS_TO_USE_SURROUNDINGS]
- **Information Gathering**: [CLUES_OR_KNOWLEDGE_AVAILABLE]

**Rewards & Consequences:**
- **XP Award**: [EXPERIENCE_POINTS_FOR_COMPLETION]
- **Treasure**: [MONETARY_REWARDS_AND_MAGIC_ITEMS]
- **Story Advancement**: [PLOT_PROGRESSION_RESULTS]
- **Reputation Changes**: [SOCIAL_CONSEQUENCES]

---

**🌍 WORLD-BUILDING** (if selected):

**Location Details:**
- **Name**: [PLACE_NAME]
- **Type**: [CITY | VILLAGE | DUNGEON | WILDERNESS | LANDMARK]
- **Population**: [SIZE_AND_DEMOGRAPHICS]
- **Government**: [RULING_STRUCTURE]
- **Economy**: [PRIMARY_TRADE_AND_RESOURCES]

**Unique Features:**
- **Defining Characteristic**: [WHAT_MAKES_THIS_PLACE_SPECIAL]
- **Notable Locations**: [3_5_IMPORTANT_SITES]
  - **Location 1**: [PLACE_NAME] - [PURPOSE_AND_SIGNIFICANCE]
  - **Location 2**: [PLACE_NAME] - [WHO_USES_IT_AND_WHY]
  - **Location 3**: [PLACE_NAME] - [INTERESTING_FEATURES]

**Culture & Society:**
- **Values**: [WHAT_THE_PEOPLE_CARE_ABOUT]
- **Traditions**: [CUSTOMS_AND_CELEBRATIONS]
- **Social Structure**: [CLASS_SYSTEM_OR_HIERARCHY]
- **Common Beliefs**: [RELIGION_SUPERSTITIONS_WORLDVIEW]

**Current Events:**
- **Recent Developments**: [WHAT'S_BEEN_HAPPENING_LATELY]
- **Ongoing Tensions**: [CONFLICTS_OR_PROBLEMS]
- **Opportunities**: [WAYS_FOR_PLAYERS_TO_GET_INVOLVED]
- **Threats**: [DANGERS_FACING_THE_LOCATION]

**Adventure Hooks:**
- **Immediate Concerns**: [URGENT_PROBLEMS_NEEDING_HEROES]
- **Mystery Elements**: [PUZZLES_OR_UNEXPLAINED_EVENTS]
- **Political Intrigue**: [POWER_STRUGGLES_OR_SCHEMES]
- **Long-term Implications**: [HOW_PLAYER_ACTIONS_MIGHT_AFFECT_FUTURE]

---

**📜 PLOT HOOKS** (if selected):

**Hook Overview:**
- **Title**: "[CATCHY_NAME_FOR_THE_ADVENTURE]"
- **Type**: [MYSTERY | RESCUE | EXPLORATION | POLITICAL | SUPERNATURAL]
- **Scope**: [LOCAL | REGIONAL | NATIONAL | WORLD_THREATENING]
- **Urgency**: [IMMEDIATE | MODERATE | LONG_TERM]

**The Setup:**
[2_3_SENTENCES_DESCRIBING_THE_INITIAL_SITUATION_OR_PROBLEM]

**Player Involvement:**
- **Why They Care**: [PERSONAL_STAKES_OR_MOTIVATIONS]
- **How They Learn**: [METHOD_OF_DISCOVERY_OR_RECRUITMENT]
- **Initial Contact**: [WHO_APPROACHES_THEM_OR_HOW_THEY_STUMBLE_INTO_IT]
- **Entry Point**: [FIRST_ACTIONABLE_STEP]

**Investigation/Development:**
- **Clue Trail**: [BREADCRUMB_PATH_FOR_PLAYERS_TO_FOLLOW]
  - **Clue 1**: [INITIAL_EVIDENCE] → Leads to [NEXT_LOCATION_OR_PERSON]
  - **Clue 2**: [SECONDARY_INFORMATION] → Reveals [PLOT_DEVELOPMENT]
  - **Clue 3**: [DEEPER_DISCOVERY] → Points toward [MAIN_REVELATION]

**Obstacles & Complications:**
- **Opposition**: [WHO_OR_WHAT_WORKS_AGAINST_THE_PLAYERS]
- **Red Herrings**: [FALSE_LEADS_TO_MAKE_MYSTERY_COMPLEX]
- **Time Pressure**: [DEADLINES_OR_ESCALATING_CONSEQUENCES]
- **Moral Dilemmas**: [DIFFICULT_CHOICES_PLAYERS_MUST_MAKE]

**Climax & Resolution:**
- **Final Confrontation**: [ULTIMATE_CHALLENGE_OR_REVELATION]
- **Success Outcomes**: [WHAT_HAPPENS_IF_PLAYERS_SUCCEED]
- **Failure Consequences**: [RESULTS_OF_UNSUCCESSFUL_MISSION]
- **Loose Threads**: [UNRESOLVED_ELEMENTS_FOR_FUTURE_ADVENTURES]

---

**🎲 GM RUNNING NOTES:**

**Preparation Checklist:**
- [ ] Key NPC voices and motivations practiced
- [ ] Battle maps and miniatures ready (if needed)
- [ ] Handouts or visual aids prepared
- [ ] Backup plans for unexpected player actions
- [ ] Session music or atmosphere elements selected

**Player Engagement Tips:**
- **Spotlight Moments**: [OPPORTUNITIES_FOR_EACH_PLAYER_TO_SHINE]
- **Decision Points**: [MEANINGFUL_CHOICES_WITH_CONSEQUENCES]
- **Emotional Beats**: [MOMENTS_DESIGNED_TO_CREATE_FEELINGS]
- **Interactive Elements**: [WAYS_TO_KEEP_PLAYERS_ACTIVELY_INVOLVED]

**Improvisation Support:**
- **Random Names**: [5_QUICK_NPC_NAMES_FOR_UNEXPECTED_CHARACTERS]
- **Skill Check DCs**: [DIFFICULTY_GUIDELINES_FOR_ON_THE_FLY_ROLLS]
- **Motivation Templates**: [QUICK_NPC_GOAL_GENERATORS]
- **Complication Options**: [WAYS_TO_ADD_CHALLENGE_IF_TOO_EASY]

**Session Flow:**
- **Opening**: [HOW_TO_START_STRONG]
- **Pacing**: [WHEN_TO_SPEED_UP_OR_SLOW_DOWN]
- **Transition**: [SMOOTH_SCENE_CHANGES]
- **Ending**: [HOW_TO_CONCLUDE_SATISFYINGLY]

**Contingency Plans:**
- **Player Absence**: [HOW_TO_HANDLE_MISSING_CHARACTERS]
- **Unexpected Deaths**: [BACKUP_CHARACTER_INTEGRATION]
- **Off-Script Actions**: [WHEN_PLAYERS_IGNORE_THE_PLANNED_CONTENT]
- **Time Management**: [WHAT_TO_CUT_IF_RUNNING_LONG]

Create memorable moments that make players excited for the next session while advancing the overarching story.`,
        categoryId: creativeCategoryId,
        isFeatured: false,
        views: 1680,
        likes: 298,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
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
