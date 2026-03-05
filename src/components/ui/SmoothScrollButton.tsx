"use client";

interface Props {
  targetId: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scrolls to a page section by ID using JS — no hash is written to the URL.
 * Prevents the browser from restoring scroll position to that section on refresh.
 */
export default function SmoothScrollButton({
  targetId,
  className,
  children,
}: Props) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
