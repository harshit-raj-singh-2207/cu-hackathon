import { calculateProgressMetrics } from '../utils/progressCalculator';
import { careerPlanStorage } from './careerPlanStorage';

export const aiInterviewService = {
  // Generate structured personalized interview questions based on learner roadmap skills & benchmark gaps
  generateQuestions: async ({
    role = 'Full Stack Developer',
    type = 'Technical',
    difficulty = 'Intermediate',
    questionCount = 5,
    isDemoMode = false
  }) => {
    // Retrieve real learner roadmap context
    const plans = careerPlanStorage.getPlans();
    const metrics = calculateProgressMetrics(plans, isDemoMode);
    const weakTopics = (metrics.weakAreas || []).map(w => w.topic);

    const QUESTION_BANK = {
      'Frontend Developer': {
        Technical: [
          {
            id: 'q-fe-1',
            question: 'Explain how React Virtual DOM diffing algorithm reconciles tree elements efficiently during state updates.',
            category: 'React & Virtual DOM',
            difficulty: 'Intermediate',
            expectedTopics: ['Virtual DOM', 'Reconciliation', 'Key prop', 'Batching'],
            idealAnswer: 'React creates an in-memory Virtual DOM tree representation. When state changes, a new Virtual DOM tree is created. React uses a heuristic O(n) diffing algorithm comparing root elements and keys to calculate minimal DOM operations required.'
          },
          {
            id: 'q-fe-2',
            question: 'What is the Event Loop in JavaScript, and how does it prioritize Microtasks over Macrotasks?',
            category: 'JavaScript Fundamentals',
            difficulty: 'Intermediate',
            expectedTopics: ['Event Loop', 'Call Stack', 'Microtasks (Promises)', 'Macrotasks (setTimeout)'],
            idealAnswer: 'The Event Loop monitors the Call Stack and Callback Queue. When the Call Stack clears, all pending Microtasks (Promise callbacks, queueMicrotask) execute completely before the next Macrotask (setTimeout, setInterval) is dequeued.'
          },
          {
            id: 'q-fe-3',
            question: 'Describe how CSS flexbox alignment parameters (`justify-content` vs `align-items`) behave when `flex-direction` is set to `column`.',
            category: 'HTML & CSS Layouts',
            difficulty: 'Beginner',
            expectedTopics: ['Flexbox', 'Main-axis', 'Cross-axis', 'Flex Direction'],
            idealAnswer: 'When `flex-direction: column` is set, the main-axis becomes vertical and cross-axis becomes horizontal. Thus `justify-content` aligns items vertically, and `align-items` aligns items horizontally.'
          },
          {
            id: 'q-fe-4',
            question: 'How do custom React Hooks promote code modularity and state reusability across components?',
            category: 'React Hooks',
            difficulty: 'Intermediate',
            expectedTopics: ['Custom Hooks', 'State Encapsulation', 'Reusability', 'Composition'],
            idealAnswer: 'Custom Hooks encapsulate stateful logic into isolated functions prefixed with `use`. They allow multiple components to share complex state mechanisms without modifying hierarchy trees or introducing higher-order component wrapping.'
          },
          {
            id: 'q-fe-5',
            question: 'What strategies do you employ to optimize web performance metrics such as LCP and CLS?',
            category: 'Performance & Web Vitals',
            difficulty: 'Advanced',
            expectedTopics: ['LCP', 'CLS', 'Lazy Loading', 'Image Optimization', 'Font Display'],
            idealAnswer: 'LCP is optimized by preloading critical Hero assets and deferring non-critical scripts. CLS is minimized by setting explicit width/height dimensions on images and dynamic ad slots.'
          }
        ],
        Behavioral: [
          {
            id: 'q-fe-beh-1',
            question: 'Describe a situation where you had to debug a complex UI rendering bug close to a production release. How did you resolve it under pressure?',
            category: 'Problem Solving & STAR',
            difficulty: 'Intermediate',
            expectedTopics: ['STAR method', 'Debugging', 'Team communication', 'Production hotfix'],
            idealAnswer: 'Use the STAR method: Describe the Situation (UI flicker before release), Task (isolated root cause), Action (profiled Chrome DevTools Performance tab to identify expensive re-render loop), and Result (merged fix 2 hours before release).'
          }
        ]
      },
      'Backend Developer': {
        Technical: [
          {
            id: 'q-be-1',
            question: 'Explain the architectural trade-offs between RESTful APIs and GraphQL endpoints for high-throughput client applications.',
            category: 'API Architecture',
            difficulty: 'Intermediate',
            expectedTopics: ['REST', 'GraphQL', 'Over-fetching', 'Caching', 'N+1 Problem'],
            idealAnswer: 'REST uses standardized HTTP verbs and URL paths with robust HTTP caching, but can suffer from over-fetching. GraphQL allows clients to request exact fields in a single query, but introduces complexity in caching and resolver N+1 query optimization.'
          },
          {
            id: 'q-be-2',
            question: 'How does database indexing work in PostgreSQL, and when might an index negatively affect write performance?',
            category: 'Databases & ORMs',
            difficulty: 'Intermediate',
            expectedTopics: ['B-Tree Index', 'Binary Search', 'Write Overhead', 'Query Execution Plan'],
            idealAnswer: 'Indexes create balanced B-Tree structures allowing O(log N) lookup. However, every `INSERT`, `UPDATE`, or `DELETE` requires updating the B-Tree index structure, incurring write performance overhead.'
          },
          {
            id: 'q-be-3',
            question: 'Describe how JWT access tokens and refresh tokens operate together in a secure OAuth2 authentication flow.',
            category: 'Security & Auth',
            difficulty: 'Intermediate',
            expectedTopics: ['JWT', 'Access Token', 'Refresh Token', 'HttpOnly Cookie'],
            idealAnswer: 'Short-lived access tokens (15 mins) are sent in Authorization headers for API access. Long-lived refresh tokens stored in HttpOnly secure cookies request new access tokens upon expiration.'
          }
        ]
      },
      'Full Stack Developer': {
        Technical: [
          {
            id: 'q-fs-1',
            question: 'How do you design a scalable web application handling real-time notification streams for 100k concurrent active users?',
            category: 'System Design & High Concurrency',
            difficulty: 'Advanced',
            expectedTopics: ['WebSockets', 'Redis Pub/Sub', 'Load Balancer', 'Message Queue'],
            idealAnswer: 'Use WebSocket connections behind NGINX load balancers, backed by a Redis Pub/Sub cluster or Kafka message broker to fan out real-time events across stateless server nodes.'
          },
          {
            id: 'q-fs-2',
            question: 'Walk through the execution sequence when a client sends an async fetch request to a Node.js Express endpoint connected to PostgreSQL.',
            category: 'Fullstack Lifecycle',
            difficulty: 'Intermediate',
            expectedTopics: ['Async/Await', 'Event Loop', 'Connection Pool', 'PRISMA / SQL'],
            idealAnswer: 'Express receives the HTTP socket event. The handler triggers an async query to PostgreSQL via a DB connection pool. While waiting for I/O, Node.js Event Loop yields execution to serve other incoming requests.'
          }
        ]
      }
    };

    // Pick domain questions or fallback to general technical set
    const roleQuestions = QUESTION_BANK[role] || QUESTION_BANK['Full Stack Developer'];
    const typeQuestions = roleQuestions[type] || roleQuestions['Technical'] || QUESTION_BANK['Full Stack Developer']['Technical'];

    // Prioritize questions matching learner weak topics
    const prioritized = [...typeQuestions].sort((a, b) => {
      const aIsWeak = weakTopics.some(w => a.category.toLowerCase().includes(w.toLowerCase()));
      const bIsWeak = weakTopics.some(w => b.category.toLowerCase().includes(w.toLowerCase()));
      if (aIsWeak && !bIsWeak) return -1;
      if (!aIsWeak && bIsWeak) return 1;
      return 0;
    });

    return prioritized.slice(0, Math.min(questionCount, prioritized.length));
  },

  // Evaluate candidate answer with structured scoring & subscores
  evaluateAnswer: async ({
    question = null,
    userAnswerText = '',
    speechMetrics = null,
    interviewerStyle = 'Professional'
  }) => {
    const text = userAnswerText.trim();
    if (!text) {
      return {
        overallScore: 0,
        subscores: { relevance: 0, correctness: 0, depth: 0, clarity: 0, completeness: 0 },
        strengths: ['N/A'],
        improvements: ['No response submitted. Please type or speak an answer.'],
        missingConcepts: question?.expectedTopics || [],
        idealAnswer: question?.idealAnswer || 'Comprehensive answer required.',
        followupQuestion: null
      };
    }

    const words = text.split(/\s+/);
    const wordCount = words.length;

    // Matching expected topics keyword density
    const expected = question?.expectedTopics || [];
    let matchedTopics = 0;
    expected.forEach(topic => {
      if (text.toLowerCase().includes(topic.toLowerCase())) {
        matchedTopics += 1;
      }
    });

    const topicCoverage = expected.length > 0 ? (matchedTopics / expected.length) : 0.7;

    // Calculate subscores out of 10
    const relevance = Math.min(10, Math.max(3, Math.round(topicCoverage * 8 + (wordCount > 30 ? 2 : 1))));
    const correctness = Math.min(10, Math.max(2, Math.round(topicCoverage * 9 + 1)));
    const depth = Math.min(10, Math.max(2, Math.round((wordCount / 60) * 5 + topicCoverage * 5)));
    const clarity = speechMetrics ? (speechMetrics.wpm >= 100 && speechMetrics.wpm <= 160 ? 9 : 7) : Math.min(10, Math.max(5, Math.round(wordCount > 20 ? 8 : 5)));
    const completeness = Math.min(10, Math.max(3, Math.round(topicCoverage * 7 + (wordCount > 40 ? 3 : 1))));

    const rawAverage = (relevance + correctness + depth + clarity + completeness) / 5;
    const overallScore = Math.round(rawAverage * 10) / 10; // e.g. 8.2

    // Strengths & Improvements
    const strengths = [];
    const improvements = [];

    if (overallScore >= 7.5) {
      strengths.push(`Solid technical explanation covering core concepts (${matchedTopics}/${expected.length} key topics).`);
    } else {
      strengths.push('Understood the basic core objective of the question.');
    }

    if (wordCount < 30) {
      improvements.push('Answer was brief. Expand further with concrete technical details or code examples.');
    }

    if (matchedTopics < expected.length) {
      const missing = expected.filter(t => !text.toLowerCase().includes(t.toLowerCase()));
      improvements.push(`Include references to: ${missing.slice(0, 2).join(', ')}.`);
    }

    // Follow-up question logic (If score is between 4.0 and 7.5)
    let followupQuestion = null;
    if (overallScore >= 4.5 && overallScore <= 7.5) {
      if (interviewerStyle === 'Challenging') {
        followupQuestion = `Good start. How would you handle this scenario in a high-concurrency production system with 100k users?`;
      } else {
        followupQuestion = `Can you elaborate on how you would test or monitor this implementation in production?`;
      }
    }

    return {
      overallScore,
      subscores: { relevance, correctness, depth, clarity, completeness },
      strengths,
      improvements,
      missingConcepts: expected.filter(t => !text.toLowerCase().includes(t.toLowerCase())),
      idealAnswer: question?.idealAnswer || 'Focus on explaining core concepts, production trade-offs, and architecture.',
      followupQuestion
    };
  }
};
