/// <reference types="vite/client" />

// Add custom environment variables
interface ImportMetaEnv {
  readonly VITE_VPS_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add React JSX definitions
declare namespace React {
  interface JSX {
    // TypeScript JSX specific stuff here
    IntrinsicElements: any;
  }
}

// Declare modules that don't have type definitions
declare module 'lucide-react' {
  export const ChartBar: any;
  export const LayoutDashboard: any;
  export const Search: any;
  export const Menu: any;
  export const X: any;
  export const Filter: any;
  export const Construction: any;
  export const BarChart3: any;
  export const Database: any;
  export const Layers: any;
  export const LineChart: any;
  export const Lock: any;
  export const ActivitySquare: any;
  export const Moon: any;
  export const Sun: any;
  export const TrendingUp: any;
  export const Calendar: any;
  export const Bookmark: any;
}
