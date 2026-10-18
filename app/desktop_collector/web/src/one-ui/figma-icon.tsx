import type { CSSProperties } from "react";
import "./figma-icon.css";

/** Exact local Figma export as a monochrome mask; geometry is never redrawn. */
export function FigmaIcon({ src, className = "" }: { src: string; className?: string }) {
  return <span aria-hidden="true" className={`figma-icon ${className}`} style={{ "--figma-icon": `url("${src}")` } as CSSProperties} />;
}

/** Button Grid 1497:11799: exact glyph in a circular surface, adapted to desktop. */
export function FigmaIconBadge({ src, size = "regular", accent = false }: { src: string; size?: "small" | "regular" | "workflow"; accent?: boolean }) {
  return <span className="figma-icon-badge" data-size={size} data-accent={accent || undefined} aria-hidden="true"><FigmaIcon src={src} /></span>;
}
