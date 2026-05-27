export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="-100 -100 200 200" 
      className={className}
    >
      <g>
        <path d="M-80,60 A100,100 0 0,1 80,60" fill="none" stroke="#E5C158" strokeWidth="2" opacity="0.2"/>
        <path d="M-60,50 L60,50" stroke="#E5C158" strokeWidth="4" strokeLinecap="round"/>
        <path d="M-40,75 L40,75" stroke="#E5C158" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
        <path d="M-45,35 L0,-10 L45,35" fill="none" stroke="#E5C158" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M-35,10 L0,-30 L35,10" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M-25,-15 L0,-50 L25,-15" fill="none" stroke="#E5C158" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M-15,-40 L0,-65 L15,-40" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="0" cy="-80" r="5" fill="#E5C158"/>
      </g>
    </svg>
  );
}
