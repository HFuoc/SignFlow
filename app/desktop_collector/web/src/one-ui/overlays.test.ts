import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./overlays.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./overlays.css", import.meta.url), "utf8");

describe("immediate sheet structural safeguards (browser behavior is covered by Playwright)", () => {
  it("requests sheet presence during render, not after a data await", () => {
    expect(source).toContain("useOverlayPresence(open, true)");
    expect(source).toContain("if (immediate && previousOpen !== open)");
    expect(source).toContain("if (open) setRendered(true)");
    expect(source).not.toMatch(/\bawait\b/);
  });
  it("assigns modal focus in the commit layout effect without a frame wait", () => {
    const modalHook = source.slice(source.indexOf("function useModalLayer"), source.indexOf("export function OneUISideSheet"));
    expect(modalHook).toContain("useLayoutEffect");
    expect(modalHook).toContain("focusFirst();");
    expect(modalHook).not.toMatch(/requestAnimationFrame|setTimeout/);
    expect(modalHook).toContain('document.removeEventListener("keydown", onKeyDown, true)');
  });
  it("starts opaque and removes the settle under reduced motion", () => {
    const surface = css.slice(css.indexOf(".one-ui-side-sheet {"), css.indexOf('.one-ui-side-sheet[data-state="opening"]'));
    expect(surface).toContain("opacity: 1");
    expect(css).toContain('.one-ui-side-sheet[data-state="opening"] { animation: none; }');
    expect(css).toContain('.one-ui-side-sheet[data-state="closing"] { opacity: 0;');
  });
});
