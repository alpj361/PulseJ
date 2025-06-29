declare module 'lucide-react' {
  import * as React from 'react';
  type Icon = React.FC<React.SVGProps<SVGSVGElement>>;
  export const X: Icon;
  export const BarChart3: Icon;
  export const MessageCircle: Icon;
  export const Bot: Icon;
  export const Send: Icon;
  export const Clock: Icon;
  export const Hash: Icon;
  export const Mic: Icon;
  export const MicOff: Icon;
  export const Volume2: Icon;
  export const VolumeX: Icon;
  export const Zap: Icon;
  // Fallback export for any other icon names to suppress TS errors
  const _default: { [key: string]: Icon };
  export default _default;
} 