import { CategoryCount, KeywordCount, NewsItem } from '../types';

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Global Tech Giants Announce Joint AI Ethics Coalition',
    source: 'Tech Chronicle',
    date: '2025-05-12T14:30:00Z',
    excerpt: 'Major technology companies including Google, Microsoft, and OpenAI have formed a coalition to establish ethical guidelines for artificial intelligence development.',
    category: 'Technology',
    keywords: ['AI', 'ethics', 'technology', 'coalition', 'guidelines']
  },
  {
    id: '2',
    title: 'Climate Summit Produces Landmark Agreement on Emissions',
    source: 'Global News Network',
    date: '2025-05-11T09:15:00Z',
    excerpt: 'World leaders at the 2025 Climate Summit have reached a consensus on reducing carbon emissions by 40% before 2030, marking a significant step forward in climate action.',
    category: 'Environment',
    keywords: ['climate', 'emissions', 'agreement', 'summit', 'carbon']
  },
  {
    id: '3',
    title: 'New Study Links Meditation to Improved Cognitive Function',
    source: 'Health Today',
    date: '2025-05-10T16:45:00Z',
    excerpt: 'Researchers have found that daily meditation practice for just 15 minutes can significantly enhance memory, focus, and problem-solving abilities.',
    category: 'Health',
    keywords: ['meditation', 'cognitive', 'health', 'research', 'brain']
  },
  {
    id: '4',
    title: 'Stock Markets Reach Record Highs Following Fed Announcement',
    source: 'Financial Times',
    date: '2025-05-10T11:20:00Z',
    excerpt: 'Global markets surged after the Federal Reserve signaled a pause in interest rate hikes, with major indices breaking previous records.',
    category: 'Finance',
    keywords: ['stocks', 'markets', 'federal reserve', 'economy', 'interest rates']
  },
  {
    id: '5',
    title: 'Breakthrough in Quantum Computing Promises New Encryption Standards',
    source: 'Science Daily',
    date: '2025-05-09T13:40:00Z',
    excerpt: 'Scientists have achieved a quantum computing milestone that could revolutionize data security and lead to new encryption methods impervious to quantum attacks.',
    category: 'Technology',
    keywords: ['quantum', 'computing', 'encryption', 'security', 'technology']
  },
  {
    id: '6',
    title: 'Global Supply Chain Disruptions Continue to Impact Manufacturing',
    source: 'Industry Insider',
    date: '2025-05-09T08:50:00Z',
    excerpt: 'Ongoing logistics challenges and material shortages are causing production delays across multiple sectors, with electronics and automotive industries hit hardest.',
    category: 'Business',
    keywords: ['supply chain', 'manufacturing', 'logistics', 'shortages', 'production']
  },
  {
    id: '7',
    title: 'Marine Biologists Discover New Deep-Sea Species',
    source: 'Nature World',
    date: '2025-05-08T15:25:00Z',
    excerpt: 'An expedition to the Mariana Trench has identified several previously unknown marine organisms, including a luminescent fish species that lives at record depths.',
    category: 'Science',
    keywords: ['marine', 'biology', 'discovery', 'species', 'ocean']
  },
  {
    id: '8',
    title: 'Renewable Energy Investments Surpass Fossil Fuels for First Time',
    source: 'Energy Report',
    date: '2025-05-08T10:10:00Z',
    excerpt: 'Global capital investment in renewable energy projects has exceeded fossil fuel investments for the first time, signaling a major shift in energy markets.',
    category: 'Environment',
    keywords: ['renewable', 'energy', 'investment', 'fossil fuels', 'sustainability']
  },
  {
    id: '9',
    title: 'New Legislation Aims to Regulate Social Media Algorithms',
    source: 'Policy Post',
    date: '2025-05-07T14:00:00Z',
    excerpt: 'Lawmakers have introduced a bill that would require social media companies to disclose how their recommendation algorithms work and give users more control.',
    category: 'Politics',
    keywords: ['legislation', 'social media', 'algorithms', 'regulation', 'transparency']
  },
  {
    id: '10',
    title: 'Revolutionary Cancer Treatment Shows Promising Results in Clinical Trials',
    source: 'Medical Journal',
    date: '2025-05-07T09:30:00Z',
    excerpt: 'A new immunotherapy approach has demonstrated 85% efficacy in treating certain aggressive cancers, potentially offering new hope for patients with limited options.',
    category: 'Health',
    keywords: ['cancer', 'treatment', 'clinical trials', 'immunotherapy', 'medicine']
  },
  {
    id: '11',
    title: 'Tech Startup Raises Record Series A Funding for AI Personal Assistant',
    source: 'Venture Beat',
    date: '2025-05-06T16:15:00Z',
    excerpt: 'Horizon AI has secured $120 million in Series A funding for its revolutionary personal assistant technology, marking the largest early-stage investment in the sector.',
    category: 'Business',
    keywords: ['startup', 'funding', 'AI', 'venture capital', 'technology']
  },
  {
    id: '12',
    title: 'Archaeological Discovery Reveals Ancient Urban Planning Sophistication',
    source: 'History Today',
    date: '2025-05-06T11:45:00Z',
    excerpt: 'Excavations of a 4,000-year-old city have uncovered evidence of advanced urban planning, including complex water management systems and grid-like street layouts.',
    category: 'Science',
    keywords: ['archaeology', 'discovery', 'ancient', 'urban planning', 'history']
  }
];

export const topKeywords: KeywordCount[] = [
  { keyword: 'AI', count: 12 },
  { keyword: 'technology', count: 10 },
  { keyword: 'climate', count: 8 },
  { keyword: 'health', count: 8 },
  { keyword: 'economy', count: 7 },
  { keyword: 'renewable', count: 6 },
  { keyword: 'security', count: 6 },
  { keyword: 'discovery', count: 5 },
  { keyword: 'investment', count: 5 },
  { keyword: 'medicine', count: 4 },
  { keyword: 'regulation', count: 4 },
  { keyword: 'research', count: 4 },
  { keyword: 'quantum', count: 3 },
  { keyword: 'science', count: 3 },
  { keyword: 'sustainability', count: 3 },
  { keyword: 'biology', count: 2 },
  { keyword: 'emissions', count: 2 },
  { keyword: 'legislation', count: 2 },
  { keyword: 'marine', count: 2 },
  { keyword: 'markets', count: 2 }
];

export const categoryData: CategoryCount[] = [
  { category: 'Technology', count: 18 },
  { category: 'Environment', count: 14 },
  { category: 'Health', count: 12 },
  { category: 'Business', count: 10 },
  { category: 'Science', count: 9 },
  { category: 'Finance', count: 8 },
  { category: 'Politics', count: 5 }
];

// Generate word cloud data with different sizes based on frequency
export const wordCloudData = topKeywords.map(item => ({
  text: item.keyword,
  value: Math.min(Math.max(item.count * 10, 20), 100), // Scale for visual display
  color: getRandomColor(),
}));

function getRandomColor() {
  const colors = [
    '#3B82F6', // blue
    '#0EA5E9', // light blue
    '#14B8A6', // teal
    '#10B981', // green
    '#F97316', // orange
    '#8B5CF6', // purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}