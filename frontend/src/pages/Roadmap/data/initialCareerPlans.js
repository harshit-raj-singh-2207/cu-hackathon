export const DEFAULT_CAREER_PLANS = [
  {
    id: 1,
    stepNum: 1,
    title: 'HTML & CSS Architecture',
    subtitle: 'Layout foundations & semantic web specifications',
    status: 'complete', // 'complete' | 'current' | 'locked'
    duration: '2 Weeks',
    topic: 'Frontend',
    difficulty: 'Beginner',
    deadline: 'Short-Term', // 'Short-Term' (1-2w), 'Medium-Term' (3-4w), 'Long-Term' (5w+)
    goal: 'Frontend Specialist',
    description: 'Master grid systems, flexbox alignment, responsive typography, and web accessibility standards.',
    attachment: {
      id: 'att-101',
      name: 'HTML5_CSS3_Certification.png',
      type: 'image', // 'image' | 'url' | 'document'
      url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      uploadedAt: '2026-07-15T10:30:00Z',
      notes: 'Passed Responsive Web Design certification with 98% score.'
    },
    resources: [
      { type: 'Doc', name: 'CSS Grid Layout specifications', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout' },
      { type: 'Video', name: 'Fluid Typography & layouts best practices', href: 'https://www.youtube.com' }
    ],
    checklist: [
      { id: 101, text: 'CSS Grid & Flexbox alignment parameters', checked: true },
      { id: 102, text: 'Fluid typography using rem & vh units', checked: true },
      { id: 103, text: 'Semantic HTML markup structures for SEO accessibility', checked: true }
    ]
  },
  {
    id: 2,
    stepNum: 2,
    title: 'JavaScript Core Principles & Async Logic',
    subtitle: 'Asynchronous syntax, closures, event loops, and DOM engines',
    status: 'current',
    duration: '3 Weeks',
    topic: 'Frontend',
    difficulty: 'Intermediate',
    deadline: 'Medium-Term',
    goal: 'Frontend Specialist',
    description: 'Deep dive into execution context, prototypes, ES6+ modules, Promises, and async/await routines.',
    attachment: {
      id: 'att-102',
      name: 'JS_Promises_Practice_Project',
      type: 'url',
      url: 'https://github.com/developer/js-async-patterns',
      uploadedAt: '2026-08-01T14:15:00Z',
      notes: 'Interactive JS compiler project repository demonstrating custom Promise wrappers.'
    },
    resources: [
      { type: 'Doc', name: 'Understanding ES6 closures & scoping rules', href: 'https://javascript.info/closure' },
      { type: 'Interactive', name: 'Practice JS Promises in compiler', href: '/coding' }
    ],
    checklist: [
      { id: 201, text: 'Write functional async await logic scripts', checked: true },
      { id: 202, text: 'Master closures, scopes, and context execution', checked: false },
      { id: 203, text: 'Understand event delegation & performance event loops', checked: false }
    ]
  },
  {
    id: 3,
    stepNum: 3,
    title: 'Frontend React Engineering & Hooks',
    subtitle: 'State metrics, render hooks, custom reducers, and context',
    status: 'locked',
    duration: '4 Weeks',
    topic: 'Frontend',
    difficulty: 'Intermediate',
    deadline: 'Medium-Term',
    goal: 'Frontend Specialist',
    description: 'Architect modular single-page applications with React 18 concurrent features, state reducers, and performant custom hooks.',
    attachment: {
      id: 'att-103',
      name: 'React_30Day_Certification.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
      uploadedAt: '2026-08-05T11:00:00Z',
      notes: 'Completed 30-Day React & Redux Toolkit Intensive Certification with 100% score.'
    },
    resources: [
      { type: 'Doc', name: 'React concurrent compiler specs', href: 'https://react.dev' },
      { type: 'Video', name: 'Optimizing render hooks & state reducers', href: 'https://youtube.com' }
    ],
    checklist: [
      { id: 301, text: 'Build modular state using custom React hooks', checked: false },
      { id: 302, text: 'Optimize render metrics utilizing useMemo & useCallback', checked: false },
      { id: 303, text: 'Deploy state using Redux Toolkit slices', checked: false }
    ]
  },
  {
    id: 4,
    stepNum: 4,
    title: 'Node.js & Microservices API Design',
    subtitle: 'REST, GraphQL, authentication streams, and database ORMs',
    status: 'locked',
    duration: '4 Weeks',
    topic: 'Backend',
    difficulty: 'Intermediate',
    deadline: 'Medium-Term',
    goal: 'Fullstack Engineer',
    description: 'Build backend microservices utilizing Express/Fastify, JWT auth, Postgres Prisma ORM, and Redis caching layers.',
    attachment: {
      id: 'att-104',
      name: 'API_Architecture_Diagram.png',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      uploadedAt: '2026-08-03T09:00:00Z',
      notes: 'Microservices schema blueprint and JWT flow diagram.'
    },
    resources: [
      { type: 'Doc', name: 'Express & Fastify benchmarking specs', href: 'https://nodejs.org' },
      { type: 'Doc', name: 'Prisma ORM database migration guides', href: 'https://prisma.io' }
    ],
    checklist: [
      { id: 401, text: 'Design RESTful API endpoints with Express & TypeScript', checked: false },
      { id: 402, text: 'Implement JWT refresh tokens & OAuth2 security', checked: false },
      { id: 403, text: 'Integrate PostgreSQL with Prisma schema migrations', checked: false }
    ]
  },
  {
    id: 5,
    stepNum: 5,
    title: 'DevOps & Container Orchestration',
    subtitle: 'Docker containers, Kubernetes clusters, and CI/CD pipelines',
    status: 'locked',
    duration: '3 Weeks',
    topic: 'DevOps',
    difficulty: 'Advanced',
    deadline: 'Long-Term',
    goal: 'Fullstack Engineer',
    description: 'Containerize complex web apps, configure GitHub Actions automated pipelines, and manage cloud infrastructure via Terraform.',
    attachment: null,
    resources: [
      { type: 'Doc', name: 'Dockerizing React & Node codebases', href: 'https://docker.com' },
      { type: 'Video', name: 'Automating pipelines with GitHub Actions', href: 'https://github.com' }
    ],
    checklist: [
      { id: 501, text: 'Compile multi-stage Docker build containers', checked: false },
      { id: 502, text: 'Write CI pipelines running automated Jest test suites', checked: false },
      { id: 503, text: 'Deploy containers to AWS ECS & Kubernetes clusters', checked: false }
    ]
  },
  {
    id: 6,
    stepNum: 6,
    title: 'Machine Learning & AI Integration',
    subtitle: 'Python, PyTorch, LLM APIs, and vector database indices',
    status: 'locked',
    duration: '5 Weeks',
    topic: 'Data Science / AI',
    difficulty: 'Advanced',
    deadline: 'Long-Term',
    goal: 'AI Developer',
    description: 'Build AI-augmented software by connecting OpenAI/Claude APIs, LangChain agents, and Pinecone vector database embeddings.',
    attachment: {
      id: 'att-106',
      name: 'RAG_Vector_Search_Notebook.ipynb',
      type: 'url',
      url: 'https://colab.research.google.com',
      uploadedAt: '2026-08-04T16:20:00Z',
      notes: 'Colab notebook implementing Retrieval-Augmented Generation (RAG) with OpenAI embeddings.'
    },
    resources: [
      { type: 'Doc', name: 'LangChain & Vector DB architecture guide', href: 'https://python.langchain.com' },
      { type: 'Interactive', name: 'Prompt Engineering Lab', href: '/twin' }
    ],
    checklist: [
      { id: 601, text: 'Master Python NumPy, Pandas & data prep pipelines', checked: false },
      { id: 602, text: 'Implement RAG pipelines with Pinecone vector databases', checked: false },
      { id: 603, text: 'Fine-tune local OpenSource models with HuggingFace', checked: false }
    ]
  },
  {
    id: 7,
    stepNum: 7,
    title: 'System Design & High-Scalability Systems',
    subtitle: 'Distributed systems, load balancing, sharding & fault tolerance',
    status: 'locked',
    duration: '4 Weeks',
    topic: 'Backend',
    difficulty: 'Advanced',
    deadline: 'Long-Term',
    goal: 'Fullstack Engineer',
    description: 'Learn high-level system design patterns, distributed caching with Redis, message queues (Kafka/RabbitMQ), and database sharding.',
    attachment: null,
    resources: [
      { type: 'Doc', name: 'System Design Primer Handbook', href: 'https://github.com/donnemartin/system-design-primer' }
    ],
    checklist: [
      { id: 701, text: 'Design high-concurrency URL shortener architecture', checked: false },
      { id: 702, text: 'Configure Kafka pub/sub streaming queues', checked: false },
      { id: 703, text: 'Implement database read-replicas & sharding strategies', checked: false }
    ]
  }
];

export const JUDGE_DEMO_ACTIVITY = [
  { id: 1, text: 'Uploaded HTML5 & CSS3 Certificate evidence for Step 1', timestamp: '2 hours ago', icon: '📎' },
  { id: 2, text: 'Completed checklist item: "Write functional async await logic scripts"', timestamp: 'Yesterday', icon: '✅' },
  { id: 3, text: 'Linked GitHub repository to JavaScript Core Principles', timestamp: '3 days ago', icon: '🔗' },
  { id: 4, text: 'AI Coach identified weak area in "JS Closures & Scope Execution"', timestamp: '4 days ago', icon: '💡' },
  { id: 5, text: 'Generated customized career trajectory path: Fullstack Engineer', timestamp: '1 week ago', icon: '✨' }
];
