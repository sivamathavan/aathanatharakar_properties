"use client";

import { useEffect, useState, useRef } from "react";

export function AnimatedStats() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-navy-950 text-white py-5 border-b border-[#1E3278] shadow-md relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 text-center items-center divide-x divide-navy-800">
          <div className="px-1 transform transition-all duration-700 delay-100" style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)' }}>
            <p className="text-xl sm:text-3xl font-display font-bold text-gold-500">
              {inView ? <CountUp end={500} suffix="+" /> : "0"}
            </p>
            <p className="text-[9px] sm:text-xs opacity-75 font-sans uppercase tracking-wider mt-0.5">Properties</p>
          </div>
          <div className="px-1 transform transition-all duration-700 delay-300" style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)' }}>
            <p className="text-xl sm:text-3xl font-display font-bold text-gold-500">
              {inView ? <CountUp end={38} /> : "0"}
            </p>
            <p className="text-[9px] sm:text-xs opacity-75 font-sans uppercase tracking-wider mt-0.5">Districts</p>
          </div>
          <div className="px-1 transform transition-all duration-700 delay-500" style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)' }}>
            <p className="text-xl sm:text-3xl font-display font-bold text-gold-500">
              {inView ? <CountUp end={200} suffix="+" /> : "0"}
            </p>
            <p className="text-[9px] sm:text-xs opacity-75 font-sans uppercase tracking-wider mt-0.5">Happy Clients</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Simple CountUp hook component without external dependencies
function CountUp({ end, suffix = "", duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}
