"use client";
import { useEffect, useRef } from "react";
export function RevealWords({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 1, rootMargin: "0px 0px -12% 0px" },
    );
    ref.current?.querySelectorAll("span").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <h2 ref={ref} className="word-reveal">
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ transitionDelay: `${i * 45}ms` }}>
          {word}{" "}
        </span>
      ))}
    </h2>
  );
}
