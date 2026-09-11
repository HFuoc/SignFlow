import {
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

/**
 * Code equivalents of the One UI navigation primitives used by SmartGlove.
 * Figma source mapping:
 * - Top Navigation: 1549:2831
 * - In-App Navigation variants: 1495:9649
 * - App Dock: 1491:8142
 * - Floating Toolbar: 1495:11133
 *
 * These components intentionally keep product semantics/data outside the design
 * primitive so Devices, Monitor, Studio and future screens reuse the same anatomy.
 */

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type OneUITopNavigationItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  selectedIcon?: ReactNode;
  controls?: string;
};

export function OneUITopNavigation({
  items,
  activeId,
  onSelect,
  ariaLabel = "Context sections",
  className,
  showIcons = false,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "onSelect"> & {
  items: OneUITopNavigationItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  showIcons?: boolean;
}) {
  // SmartGlove contextual navigation follows the Galaxy Store text-tab grammar
  // by default. Icon mode remains available as an explicit opt-in for future
  // contexts where glyph-only destinations are genuinely self-explanatory.
  const textOnly = !showIcons || items.every((item) => !item.icon);
  const navRef = useRef<HTMLElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScrollLeft: 0, dragging: false });
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const nav = navRef.current;
    const selected = nav?.querySelector<HTMLElement>(".health-context-item.is-active");
    if (!nav || !selected) return;
    const inset = 12;
    const left = selected.offsetLeft;
    const right = left + selected.offsetWidth;
    const visibleLeft = nav.scrollLeft + inset;
    const visibleRight = nav.scrollLeft + nav.clientWidth - inset;
    if (left < visibleLeft) nav.scrollTo({ left: Math.max(0, left - inset), behavior: "auto" });
    else if (right > visibleRight) nav.scrollTo({ left: right - nav.clientWidth + inset, behavior: "auto" });
  }, [activeId]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: nav.scrollLeft,
      dragging: false,
    };
    suppressClickRef.current = false;
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const nav = navRef.current;
    const drag = dragRef.current;
    if (!nav || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.dragging && Math.abs(delta) >= 4) {
      drag.dragging = true;
      suppressClickRef.current = true;
      nav.dataset.dragging = "true";
      nav.setPointerCapture?.(event.pointerId);
    }
    if (!drag.dragging) return;
    nav.scrollLeft = drag.startScrollLeft - delta;
    event.preventDefault();
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const nav = navRef.current;
    const drag = dragRef.current;
    if (!nav || drag.pointerId !== event.pointerId) return;
    const wasDragging = drag.dragging;
    if (nav.hasPointerCapture?.(event.pointerId)) nav.releasePointerCapture(event.pointerId);
    delete nav.dataset.dragging;
    dragRef.current = { pointerId: -1, startX: 0, startScrollLeft: nav.scrollLeft, dragging: false };
    if (wasDragging) window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }

  return (
    <nav
      {...props}
      ref={navRef}
      className={classes("health-context-nav", className)}
      aria-label={ariaLabel}
      data-text-only={textOnly || undefined}
      data-items={items.length}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(event) => event.preventDefault()}
    >
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            className={classes("health-context-item", selected && "is-active")}
            type="button"
            aria-current={selected ? "location" : undefined}
            aria-controls={item.controls}
            onClick={(event) => {
              if (suppressClickRef.current) {
                event.preventDefault();
                return;
              }
              onSelect(item.id);
            }}
          >
            {showIcons && item.icon ? (
              <span className="health-context-item__icon" aria-hidden="true">
                {selected && item.selectedIcon ? item.selectedIcon : item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type OneUIAppDockItem<T extends string> = {
  id: T;
  label: ReactNode;
  icon: ReactNode;
  selectedIcon?: ReactNode;
};

export function OneUIAppDock<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel = "Application navigation",
  className,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "onSelect"> & {
  items: Array<OneUIAppDockItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <nav
      {...props}
      className={classes("compact-app-navigation", "health-bottom-dock", className)}
      data-destinations={items.length}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            className={selected ? "is-selected" : undefined}
            type="button"
            aria-current={selected ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            <span className="nav-destination__icon" aria-hidden="true">
              {selected && item.selectedIcon ? item.selectedIcon : item.icon}
            </span>
            <span className="nav-destination__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function OneUIUtilityToolbar({
  children,
  className,
  ariaLabel = "Quick utilities",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <div
      {...props}
      className={classes("health-utility-actions", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
