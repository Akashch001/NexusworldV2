export interface Capability {
  id: string;
  title: string;
  subtitle: string;
  category: 'Strategy' | 'Design' | 'Engineering' | 'Intelligence';
  deliverables: string[];
  description: string;
  highlightMetric?: string;
}

export interface ProcessStage {
  id: string;
  step: string;
  title: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  philosophy: string;
}

export interface PhilosophyPillar {
  id: string;
  title: string;
  axiom: string;
  explanation: string;
  codeSnippet: string;
}

export interface ClientChallenge {
  id: string;
  problem: string;
  symptom: string;
  nexusSolution: string;
  impact: string;
}

export const COMPANY_INFO = {
  brand: "NEXUSWORLD",
  legalName: "NexusWorld Digital Systems",
  domain: "nexusworld.in",
  founder: "Andy Watson",
  role: "Co-Founder",
  year: 2026,
  email: "connect@nexusworld.in",
  phone: "+91 9748888478",
  headline: "WE BUILD DIGITAL WORLDS.",
  primaryMessage: "Building digital experiences that move businesses forward.",
  positioning: "NexusWorld is a boutique digital product design and development agency focused on creating sophisticated digital products, experiences, and systems.",
  formula: [
    { label: "STRATEGY", desc: "Clarity of purpose & market viability" },
    { label: "DESIGN", desc: "Architectural visual systems & intuitive flows" },
    { label: "TECHNOLOGY", desc: "Purpose-driven stacks & modern primitives" },
    { label: "ENGINEERING", desc: "Rigorous frontend performance & precision" },
    { label: "INTELLIGENCE", desc: "Intelligent workflows & cognitive interfaces" },
  ],
  coreThesis: "NexusWorld helps ambitious companies transform complex ideas into digital products that are clear, useful, technically strong and visually exceptional.",
};

export const CAPABILITIES: Capability[] = [
  {
    id: "product-strategy",
    title: "Product Strategy",
    subtitle: "From Ambiguity to Roadmap",
    category: "Strategy",
    deliverables: ["Market & User Needs Definition", "Opportunity Mapping", "Product Direction", "Scalable Digital Roadmaps", "Feature Prioritization Architecture"],
    description: "Aligning business viability with end-user desire. We distill nebulous concepts into structured roadmaps that derisk engineering investments.",
  },
  {
    id: "ui-ux-design",
    title: "UI/UX Design",
    subtitle: "High-Craft Digital Interfaces",
    category: "Design",
    deliverables: ["User Journey Flows", "Information Architecture", "Wireframing & Prototyping", "Design System Implementations", "Micro-Interactions"],
    description: "Interfaces engineered around human cognition. We eliminate cognitive friction, ensuring every screen has a deliberate purpose and measurable flow.",
  },
  {
    id: "design-systems",
    title: "Design Systems",
    subtitle: "Scalable Foundational Systems",
    category: "Design",
    deliverables: ["Design Tokens Architecture", "Component Libraries", "Scalable Visual Systems", "Multi-Brand Variables", "Living Documentation"],
    description: "Creating unified visual and functional languages. We build maintainable product foundations that allow product teams to ship 10x faster with zero divergence.",
  },
  {
    id: "frontend-development",
    title: "Frontend Engineering",
    subtitle: "Pixel-Accurate High-Performance Code",
    category: "Engineering",
    deliverables: ["60fps Web Applications", "Responsive Layout Engines", "Modern Web Primitives", "State Architecture", "Accessible Semantic DOM"],
    description: "Transforming design files into responsive, instant interfaces. Zero bloat, optimal Core Web Vitals, and resilient code built to scale seamlessly.",
  },
  {
    id: "ai-experiences",
    title: "AI Experiences",
    subtitle: "Intelligent Interfaces & Automation",
    category: "Intelligence",
    deliverables: ["Cognitive User Interfaces", "AI-Powered Workflows", "Intelligent Document Analysis", "State-Machine Automation", "Agentic Pipelines"],
    description: "Integrating intelligence meaningfully. We craft AI workflows that elevate human leverage rather than inserting novelty chatbots for fashion.",
  },
  {
    id: "branding-digital-identity",
    title: "Branding & Digital Identity",
    subtitle: "Visual Language Built for Technology",
    category: "Design",
    deliverables: ["Digital Identity Systems", "Typography Architecture", "Visual Language Guidelines", "Iconography Systems", "Digital Brand Presence"],
    description: "A brand expressed through technology. We create unmistakable, modern visual identities tailored to digital screen environments and products.",
  },
  {
    id: "mobile-applications",
    title: "Mobile Applications",
    subtitle: "Native-Caliber Mobile Products",
    category: "Engineering",
    deliverables: ["Mobile Product Architecture", "Touch Interaction Models", "Offline State Systems", "Responsive Mobile Web & PWA", "Cross-Platform Precision"],
    description: "Designing and developing mobile digital products that leverage device ergonomics, fluid gestures, and instant feedback loops.",
  },
  {
    id: "saas-products",
    title: "SaaS Products",
    subtitle: "End-to-End Software Architecture",
    category: "Strategy",
    deliverables: ["Multi-Tenant Product UX", "Onboarding Flow Optimization", "Analytics & Data Visualization", "Billing & Permissions UX", "Scalable UI Patterns"],
    description: "Transforming enterprise ideas into scalable software products. We structure complex multi-user permissions, analytics dashboards, and retention-oriented flows.",
  },
  {
    id: "interactive-experiences",
    title: "Interactive Digital Experiences",
    subtitle: "Purposeful Motion & Spatial Design",
    category: "Engineering",
    deliverables: ["Intentional Scroll Storytelling", "Micro-Motion Systems", "Spatial UI Topographies", "Interactive Data Systems", "Performance Containment"],
    description: "Using interaction and motion strictly when they enhance comprehension. Technology serves the product, never the other way around.",
  },
];

export const PROCESS_STAGES: ProcessStage[] = [
  {
    id: "discover",
    step: "01",
    title: "DISCOVER",
    summary: "Uncovering core truths before committing a single pixel or line of code.",
    inputs: ["Business Goals", "User Pain Points", "Technical Constraints", "Market Gaps"],
    outputs: ["Problem Definition", "Opportunity Matrix", "Core User Personas"],
    philosophy: "Assumptions are the most expensive liability in product development.",
  },
  {
    id: "strategy",
    step: "02",
    title: "STRATEGY",
    summary: "Architecting the trajectory, priorities, and system boundaries.",
    inputs: ["Discovery Insights", "Technical Requirements", "Competitive Landscape"],
    outputs: ["Product Direction", "Information Architecture", "Milestone Roadmap"],
    philosophy: "Strategy is deciding what NOT to build just as much as what to build.",
  },
  {
    id: "design",
    step: "03",
    title: "DESIGN",
    summary: "Forging the visual hierarchy, interaction models, and interface craft.",
    inputs: ["Information Architecture", "Brand Assets", "User Flows"],
    outputs: ["Interactive Prototypes", "High-Fidelity Screens", "Motion Models"],
    philosophy: "Form is not decoration; form is the physical embodiment of clarity.",
  },
  {
    id: "system",
    step: "04",
    title: "SYSTEM",
    summary: "Standardizing tokens, component schemas, and scalable foundations.",
    inputs: ["Approved Screens", "Interaction Patterns", "Typography Hierarchy"],
    outputs: ["Design Token Architecture", "Component Library", "Usage Guidelines"],
    philosophy: "Consistency at scale requires rigorous mathematical and visual systems.",
  },
  {
    id: "engineer",
    step: "05",
    title: "ENGINEER",
    summary: "Transforming blueprints into fast, accessible, high-performance code.",
    inputs: ["Design Specifications", "Component Tokens", "API Contracts"],
    outputs: ["Production Frontend", "Integration Pipelines", "Performance Audits"],
    philosophy: "Great engineering is invisible. The user only experiences instant delight.",
  },
  {
    id: "launch",
    step: "06",
    title: "LAUNCH",
    summary: "Deploying the digital product to real users and initiating the feedback loop.",
    inputs: ["QA Verification", "Production Build", "Telemetry Setup"],
    outputs: ["Live Digital World", "Operational Telemetry", "Iteration Cadence"],
    philosophy: "Launch is not the finish line; it is the moment the product comes to life.",
  },
];

export const PHILOSOPHY_PILLARS: PhilosophyPillar[] = [
  {
    id: "interaction",
    title: "INTERACTION",
    axiom: "Every interaction must have a purpose.",
    explanation: "We reject superficial hover effects. When an element responds to touch or cursor, it must communicate state, affordance, or hierarchy.",
    codeSnippet: "onHover((state) => state.affordance ? clarifyIntent() : preserveSilence())",
  },
  {
    id: "purpose",
    title: "PURPOSE",
    axiom: "Technology serves the product. Not the other way around.",
    explanation: "We do not deploy 3D, WebGL, or AI simply because they are fashionable. We deploy them only when they compress time or eliminate user confusion.",
    codeSnippet: "if (technology.addsClarity(userGoal)) deploy(); else simplify();",
  },
  {
    id: "motion",
    title: "MOTION",
    axiom: "Motion communicates change of state and spatial continuity.",
    explanation: "Animation should never be a distraction. It should bridge mental models, guiding the eye smoothly across transitions without cognitive disruption.",
    codeSnippet: "transition.transform({ spatialContinuity: true, duration: '200ms' })",
  },
  {
    id: "system",
    title: "SYSTEM",
    axiom: "Components are interconnected organs of a larger digital world.",
    explanation: "We think in modular ecosystems. When one component evolves, the global tokens and downstream interfaces adapt cohesively.",
    codeSnippet: "designTokens.sync({ typography, color, spacing, radius })",
  },
  {
    id: "code",
    title: "CODE",
    axiom: "The underlying engineering is an integral part of the craft.",
    explanation: "Clean semantic HTML, zero layout shifts, sub-100ms response times, and accessible keyboard navigation are fundamental design decisions.",
    codeSnippet: "const INP = '<50ms'; const LCP = '<0.8s'; const CLS = 0;",
  },
];

export const CLIENT_CHALLENGES: ClientChallenge[] = [
  {
    id: "c1",
    problem: "Difficult-to-Understand Product Concepts",
    symptom: "Users abandon onboarding because the value proposition is buried in technical jargon.",
    nexusSolution: "We deconstruct the core value into interactive visual workflows and progressive disclosure.",
    impact: "Instant user comprehension and reduced time-to-value.",
  },
  {
    id: "c2",
    problem: "Fragmented Interfaces & Technical Debt",
    symptom: "Different product modules look like they were built by 5 separate disconnected teams.",
    nexusSolution: "We engineer a centralized design system and tokenized component architecture.",
    impact: "Harmonized user experience and 3x faster engineering velocity.",
  },
  {
    id: "c3",
    problem: "Outdated Digital Experience",
    symptom: "Competitors with inferior products look more trustworthy due to modern interfaces.",
    nexusSolution: "We execute an architectural redesign combining modern typography, crisp contrast, and fluid micro-motion.",
    impact: "Immediate restoration of market credibility and enterprise trust.",
  },
  {
    id: "c4",
    problem: "Unrealized SaaS & AI Ambitions",
    symptom: "Great backend algorithm or model, but no usable human interface or workflow.",
    nexusSolution: "We design cognitive UI layers and intelligent workflows around user intent.",
    impact: "Transforming raw technology into an indispensable daily tool.",
  },
];
