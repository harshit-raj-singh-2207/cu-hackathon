// Structured question bank categorized by topic/skill for Skill Benchmark Quizzes.
// Each quiz set contains exactly 3 multiple-choice questions with 4 options, 1 correct index, and explanations.

export const SKILL_QUESTION_BANK = {
  'Frontend': [
    {
      id: 'fe-q1',
      question: 'Which React hook is commonly used to perform side effects such as data fetching or subscriptions?',
      options: ['useState', 'useEffect', 'useMemo', 'useRef'],
      correctIndex: 1,
      explanation: 'useEffect is designed for handling asynchronous side effects, subscriptions, and DOM updates after rendering.'
    },
    {
      id: 'fe-q2',
      question: 'In CSS Layouts, what is the default value of the `position` property?',
      options: ['relative', 'absolute', 'static', 'fixed'],
      correctIndex: 2,
      explanation: 'HTML elements are positioned `static` by default according to the normal page flow.'
    },
    {
      id: 'fe-q3',
      question: 'What is the key mechanism behind JavaScript asynchronous execution handling microtasks?',
      options: ['Call Stack', 'Event Loop & Job Queue', 'Garbage Collector', 'DOM Engine'],
      correctIndex: 1,
      explanation: 'The Event Loop processes microtasks (Promises) before macrotasks (setTimeout) to maintain non-blocking UI execution.'
    }
  ],

  'HTML & CSS': [
    {
      id: 'html-q1',
      question: 'Which semantic HTML tag should be used for the primary top-level content landmark on a page?',
      options: ['<section>', '<article>', '<main>', '<div>'],
      correctIndex: 2,
      explanation: '<main> represents the dominant content unique to the document, vital for accessibility and SEO.'
    },
    {
      id: 'html-q2',
      question: 'In CSS Flexbox, which property aligns items along the cross-axis?',
      options: ['justify-content', 'align-items', 'flex-direction', 'align-content'],
      correctIndex: 1,
      explanation: '`align-items` defines how flex items are laid out along the cross axis in the current flex line.'
    },
    {
      id: 'html-q3',
      question: 'What does the CSS `box-sizing: border-box` declaration do?',
      options: [
        'Includes padding and border in the element total width/height',
        'Excludes padding from element dimensions',
        'Forces elements to take 100% width',
        'Removes outline borders from focused inputs'
      ],
      correctIndex: 0,
      explanation: '`border-box` ensures specified width/height includes content, padding, and borders, preventing layout overflows.'
    }
  ],

  'JavaScript': [
    {
      id: 'js-q1',
      question: 'What will `console.log(typeof null)` evaluate to in JavaScript?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctIndex: 2,
      explanation: 'In JavaScript, `typeof null` returns `"object"`, which is a legacy behavior since the initial version of JS.'
    },
    {
      id: 'js-q2',
      question: 'What is a JavaScript closure?',
      options: [
        'A function bundled together with references to its surrounding lexical environment',
        'A method to stop event propagation in DOM',
        'A technique to seal object properties',
        'An error handling try/catch block'
      ],
      correctIndex: 0,
      explanation: 'Closures allow inner functions to retain access to variables declared in an outer enclosing function even after outer execution completes.'
    },
    {
      id: 'js-q3',
      question: 'Which method creates a new array populated with results of calling a provided function on every element?',
      options: ['forEach()', 'map()', 'filter()', 'reduce()'],
      correctIndex: 1,
      explanation: '`Array.prototype.map()` creates and returns a transformed new array without mutating the original array.'
    }
  ],

  'React': [
    {
      id: 'react-q1',
      question: 'Why should key props be unique among sibling components in React list rendering?',
      options: [
        'To styling items with CSS selectors',
        'To help React identify which items have changed, been added, or removed during diffing',
        'To trigger immediate page reloads',
        'To bypass component re-rendering completely'
      ],
      correctIndex: 1,
      explanation: 'Unique keys enable React Virtual DOM reconciliation to match tree elements efficiently across render passes.'
    },
    {
      id: 'react-q2',
      question: 'Which Hook returns a memoized value that only recalculates when dependencies change?',
      options: ['useCallback', 'useMemo', 'useRef', 'useContext'],
      correctIndex: 1,
      explanation: '`useMemo` caches expensive computation results between renders until dependency variables update.'
    },
    {
      id: 'react-q3',
      question: 'What happens when state is updated via `setState` in React 18?',
      options: [
        'React schedules an asynchronous batch re-render of the component',
        'The DOM is destroyed immediately',
        'Page reloads completely',
        'Synchronous DOM mutations occur instantly'
      ],
      correctIndex: 0,
      explanation: 'React 18 batches state updates automatically to optimize performance and prevent unnecessary render cascades.'
    }
  ],

  'Backend': [
    {
      id: 'be-q1',
      question: 'Which HTTP method should be idempotent and used specifically to retrieve resources without side effects?',
      options: ['POST', 'GET', 'DELETE', 'PATCH'],
      correctIndex: 1,
      explanation: 'GET requests should be safe and idempotent, meaning making multiple identical requests has the same effect as a single request.'
    },
    {
      id: 'be-q2',
      question: 'What is the purpose of Middleware in Express.js backend applications?',
      options: [
        'To compile frontend JSX templates',
        'To execute logic, modify request/response objects, or end the request-response cycle',
        'To style HTML pages with CSS',
        'To replace database servers'
      ],
      correctIndex: 1,
      explanation: 'Middleware functions access request objects (`req`), response objects (`res`), and the `next` function in the application stack.'
    },
    {
      id: 'be-q3',
      question: 'What does JWT stand for in backend user authentication APIs?',
      options: ['Java Web Token', 'JSON Web Token', 'Joint Web Transit', 'JavaScript Workspace Transfer'],
      correctIndex: 1,
      explanation: 'JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting claims between parties as a compact JSON object.'
    }
  ],

  'DevOps': [
    {
      id: 'devops-q1',
      question: 'What is the main benefit of containerization using Docker over traditional Virtual Machines?',
      options: [
        'Containers share the host OS kernel, making them lightweight and fast to start',
        'Containers require separate full OS installations',
        'Containers bypass security sandboxing completely',
        'Containers run only on Windows machines'
      ],
      correctIndex: 0,
      explanation: 'Docker containers share the underlying host operating system kernel, resulting in significantly lower memory overhead and instant boot times.'
    },
    {
      id: 'devops-q2',
      question: 'What does a CI/CD pipeline stand for in continuous software engineering?',
      options: [
        'Code Integration / Code Deployment',
        'Continuous Integration / Continuous Deployment',
        'Central Infrastructure / Cloud Database',
        'Compiler Interface / Command Driver'
      ],
      correctIndex: 1,
      explanation: 'Continuous Integration / Continuous Deployment automates software building, testing, and deployment to staging/production.'
    },
    {
      id: 'devops-q3',
      question: 'In Kubernetes, what is the smallest deployable computing unit that can be created and managed?',
      options: ['Node', 'Pod', 'Cluster', 'Ingress'],
      correctIndex: 1,
      explanation: 'A Pod is the smallest execution unit in Kubernetes, representing a single instance of a running process in your cluster.'
    }
  ],

  'Data Science / AI': [
    {
      id: 'ai-q1',
      question: 'In Artificial Intelligence, what does RAG stand for in LLM document retrieval systems?',
      options: [
        'Random Access Generation',
        'Retrieval-Augmented Generation',
        'Recurrent Automated Grid',
        'Response Alignment Governance'
      ],
      correctIndex: 1,
      explanation: 'RAG (Retrieval-Augmented Generation) enhances Large Language Model responses by fetching relevant context from external vector databases.'
    },
    {
      id: 'ai-q2',
      question: 'What is a Vector Database primarily optimized for?',
      options: [
        'Storing relational tabular data with SQL JOINs',
        'Performing fast similarity search across high-dimensional vector embeddings',
        'Executing HTML5 DOM queries',
        'Compressing MP3 audio files'
      ],
      correctIndex: 1,
      explanation: 'Vector databases store numerical vector representations (embeddings) and perform fast nearest-neighbor distance searches (Cosine/Euclidean).'
    },
    {
      id: 'ai-q3',
      question: 'Which Python library is widely used for multidimensional array manipulation and numerical computing in AI?',
      options: ['Django', 'NumPy', 'Flask', 'BeautifulSoup'],
      correctIndex: 1,
      explanation: 'NumPy provides high-performance N-dimensional array objects and mathematical routines foundational to data science and ML.'
    }
  ]
};

// Fallback question lookup helper
export const getQuestionsForTopic = (topicName = '') => {
  const normalized = topicName.trim();
  if (SKILL_QUESTION_BANK[normalized]) {
    return SKILL_QUESTION_BANK[normalized];
  }

  // Substring match attempt
  const foundKey = Object.keys(SKILL_QUESTION_BANK).find(k => normalized.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(normalized.toLowerCase()));
  if (foundKey) {
    return SKILL_QUESTION_BANK[foundKey];
  }

  return null;
};
