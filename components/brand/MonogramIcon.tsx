export function MonogramIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="-130 -130 260 260" 
      className={className}
    >
      <style>
        {`
          .monogram-text { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 102px; fill: #FFFFFF; letter-spacing: -2px; }
        `}
      </style>
      <g>
        <circle cx="0" cy="0" r="110" fill="none" stroke="#E5C158" strokeWidth="1" opacity="0.15"/>
        <circle cx="0" cy="0" r="120" fill="none" stroke="#E5C158" strokeWidth="2" strokeDasharray="6,4" opacity="0.4"/>
        <text x="0" y="35" textAnchor="middle" className="monogram-text">AT</text>
        <path d="M-60,-40 L0,-100 L60,-40" fill="none" stroke="#E5C158" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="0" cy="-115" r="4" fill="#E5C158"/>
      </g>
    </svg>
  );
}
