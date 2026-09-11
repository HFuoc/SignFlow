import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import "./surfaces.css";

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function OneUICard({
  title,
  description,
  accessory,
  children,
  eyebrow,
  headingLevel = 2,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title: ReactNode;
  description?: ReactNode;
  accessory?: ReactNode;
  children: ReactNode;
  eyebrow?: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const titleId = useId();
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 3 ? "h3" : "h2";
  return (
    <section {...props} className={classes("one-ui-card", className)} aria-labelledby={props["aria-labelledby"] ?? titleId}>
      <header className="one-ui-card__header">
        <div className="one-ui-card__copy">
          {eyebrow != null ? <span className="one-ui-card__eyebrow">{eyebrow}</span> : null}
          <Heading id={titleId}>{title}</Heading>
          {description != null ? <p>{description}</p> : null}
        </div>
        {accessory != null ? <div className="one-ui-card__accessory">{accessory}</div> : null}
      </header>
      <div className="one-ui-card__body">{children}</div>
    </section>
  );
}

export function OneUIEmptyState({
  title,
  children,
  action,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div {...props} className={classes("one-ui-empty-state", className)}>
      <div className="one-ui-empty-state__copy">
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      {action != null ? <div className="one-ui-empty-state__action">{action}</div> : null}
    </div>
  );
}

export function OneUIKeyValueList({
  rows,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLDListElement>, "children"> & {
  rows: Array<[ReactNode, ReactNode]>;
}) {
  return (
    <dl {...props} className={classes("one-ui-key-value-list", className)}>
      {rows.map(([label, value], index) => (
        <div key={typeof label === "string" ? label : index}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const OneUISelectionMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement> & {
  menuTitle?: ReactNode;
}>(function OneUISelectionMenu({ children, className, menuTitle, ...props }, ref) {
  return (
    <ul {...props} ref={ref} className={classes("one-ui-selection-menu", className)} data-has-title={menuTitle != null || undefined}>
      {menuTitle != null ? <li className="one-ui-selection-menu__title" role="presentation">{menuTitle}</li> : null}
      {children}
    </ul>
  );
});

export const OneUISelectionMenuItem = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}>(function OneUISelectionMenuItem({
  title,
  description,
  meta,
  className,
  type = "button",
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      className={classes("one-ui-selection-menu__item", className)}
      data-rich={description != null || meta != null || undefined}
      type={type}
    >
      <span className="one-ui-selection-menu__copy">
        <strong>{title}</strong>
        {description != null ? <span>{description}</span> : null}
      </span>
      {meta != null ? <span className="one-ui-selection-menu__meta">{meta}</span> : null}
    </button>
  );
});
