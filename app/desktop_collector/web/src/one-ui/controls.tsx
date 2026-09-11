import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import "./controls.css";
import { OneUIProgressIndicator } from "./feedback";
import { OneUISelectionMenu } from "./surfaces";

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  loadingText?: string;
  variant?: "primary" | "secondary" | "quiet" | "danger-quiet";
};

export const OneUIButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function OneUIButton({
    children,
    className,
    disabled,
    icon,
    loading = false,
    loadingLabel = "Working…",
    loadingText,
    type = "button",
    variant = "secondary",
    ...props
  }, ref) {
    return (
      <button
        {...props}
        ref={ref}
        className={classes("one-ui-button", className)}
        data-loading={loading || undefined}
        data-variant={variant}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={loading ? loadingLabel : props["aria-label"]}
      >
        <span className="one-ui-button__label" aria-hidden={loading || undefined}>
          {icon ? <span className="one-ui-button__icon" aria-hidden="true">{icon}</span> : null}
          <span>{children}</span>
        </span>
        {loading || loadingText != null || loadingLabel !== "Working…" ? (
          <span className="one-ui-button__pending" aria-hidden={!loading || undefined}>
            {loading ? <OneUIProgressIndicator label={loadingLabel} size="small" /> : <span className="one-ui-button__progress-slot" />}
            <span aria-hidden="true">{loadingText ?? loadingLabel}</span>
          </span>
        ) : null}
      </button>
    );
  },
);

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: ReactNode;
  label: string;
  loading?: boolean;
};

export const OneUIIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function OneUIIconButton({ className, disabled, icon, label, loading = false, type = "button", ...props }, ref) {
    return (
      <button
        {...props}
        ref={ref}
        className={classes("one-ui-icon-button", className)}
        aria-label={label}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        data-tooltip={label}
        disabled={disabled || loading}
        type={type}
      >
        {loading
          ? <OneUIProgressIndicator label={label} size="small" />
          : <span className="one-ui-icon-button__glyph" aria-hidden="true">{icon}</span>}
      </button>
    );
  },
);

type SegmentedValue = string | number;

type SegmentedOption<T extends SegmentedValue> = {
  disabled?: boolean;
  label: ReactNode;
  value: T;
};

type SegmentedControlProps<T extends SegmentedValue> = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  value: T;
};

export function OneUISegmentedControl<T extends SegmentedValue>({
  ariaLabel,
  className,
  disabled = false,
  onChange,
  options,
  value,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      {...props}
      className={classes("one-ui-segmented-control", className)}
      role="group"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            className="one-ui-segmented-control__item"
            type="button"
            aria-pressed={selected}
            data-selected={selected || undefined}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type StatusIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  emphasis?: "tonal" | "quiet";
  label: string;
  size?: "small" | "medium";
  tone: "positive" | "waiting" | "neutral" | "warning" | "negative";
};

export function OneUIStatusIndicator({
  className,
  emphasis = "tonal",
  label,
  size = "small",
  tone,
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      {...props}
      className={classes("one-ui-status-indicator", className)}
      data-emphasis={emphasis}
      data-size={size}
      data-tone={tone}
    >
      <span className="one-ui-status-indicator__mark" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
  invalid?: boolean;
  label: string;
  message?: string;
  suffix?: string;
};

export const OneUITextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function OneUITextField({
    className,
    disabled,
    invalid = false,
    label,
    message,
    suffix,
    type = "text",
    ...props
  }, ref) {
    const generatedMessageId = useId();
    const messageId = message ? `${generatedMessageId}-message` : undefined;
    return (
      <label className={classes("one-ui-text-field", className)} data-disabled={disabled || undefined} data-invalid={invalid || undefined}>
        <span className="one-ui-text-field__label">{label}</span>
        <span className="one-ui-text-field__container">
          <input
            {...props}
            ref={ref}
            type={type}
            disabled={disabled}
            aria-label={props["aria-label"] ?? label}
            aria-invalid={invalid || undefined}
            aria-describedby={props["aria-describedby"] ?? messageId}
          />
          {suffix ? <span className="one-ui-text-field__suffix" aria-hidden="true">{suffix}</span> : null}
        </span>
        {message ? <span id={messageId} className="one-ui-text-field__message" role={invalid ? "alert" : undefined}>{message}</span> : null}
      </label>
    );
  },
);

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type"> & {
  icon: ReactNode;
  label: string;
};

export const OneUISearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function OneUISearchField({ className, disabled, icon, label, ...props }, ref) {
    return (
      <label className={classes("one-ui-search-field", className)} data-disabled={disabled || undefined}>
        <span className="one-ui-search-field__label">{label}</span>
        <span className="one-ui-search-field__container">
          <span className="one-ui-search-field__icon" aria-hidden="true">{icon}</span>
          <input
            {...props}
            ref={ref}
            type="search"
            disabled={disabled}
            aria-label={props["aria-label"] ?? label}
          />
        </span>
      </label>
    );
  },
);

type SelectChangeEvent = {
  currentTarget: { value: string };
  target: { value: string };
};

type SelectFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> & {
  children: ReactNode;
  compact?: boolean;
  disabled?: boolean;
  label: string;
  name?: string;
  onChange?: (event: SelectChangeEvent) => void;
  value?: string;
};

type ParsedSelectOption = {
  disabled: boolean;
  label: ReactNode;
  value: string;
};

function optionText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "Option";
}

export const OneUISelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
  function OneUISelectField({ children, className, compact = false, disabled = false, label, name, onChange, value, ...props }, ref) {
    const generatedId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [menuStyle, setMenuStyle] = useState<Record<string, string | number>>({});

    const options = useMemo<ParsedSelectOption[]>(() => Children.toArray(children).flatMap((child) => {
      if (!isValidElement(child) || child.type !== "option") return [];
      const childProps = child.props as { children?: ReactNode; disabled?: boolean; value?: string | number };
      const childValue = childProps.value == null ? optionText(childProps.children) : String(childProps.value);
      return [{
        disabled: !!childProps.disabled,
        label: childProps.children,
        value: childValue,
      }];
    }), [children]);

    const selectedValue = value ?? options[0]?.value ?? "";
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
    const selected = options[selectedIndex] ?? options[0];

    function assignTrigger(node: HTMLButtonElement | null) {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }

    function positionMenu() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportGap = 12;
      const estimatedHeight = Math.min(320, Math.max(64, options.length * 56 + 12));
      const availableBelow = window.innerHeight - rect.bottom - viewportGap;
      const availableAbove = rect.top - viewportGap;
      const placeAbove = availableBelow < Math.min(180, estimatedHeight) && availableAbove > availableBelow;
      const width = Math.min(Math.max(rect.width, compact ? 190 : 240), window.innerWidth - viewportGap * 2);
      const left = Math.min(Math.max(viewportGap, rect.left), window.innerWidth - width - viewportGap);
      const top = placeAbove
        ? Math.max(viewportGap, rect.top - Math.min(estimatedHeight, availableAbove) - 8)
        : Math.min(window.innerHeight - viewportGap - Math.min(estimatedHeight, availableBelow), rect.bottom + 8);
      setMenuStyle({ left, top, width, maxHeight: Math.max(96, placeAbove ? availableAbove : availableBelow) });
    }

    useEffect(() => {
      if (!open) return;
      setActiveIndex(selectedIndex);
      positionMenu();
      const closeIfOutside = (event: PointerEvent) => {
        const target = event.target as Node | null;
        if (target && !rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
      };
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      };
      const reposition = () => positionMenu();
      document.addEventListener("pointerdown", closeIfOutside);
      document.addEventListener("keydown", closeOnEscape);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        document.removeEventListener("pointerdown", closeIfOutside);
        document.removeEventListener("keydown", closeOnEscape);
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }, [open, selectedIndex]);

    function commit(option: ParsedSelectOption) {
      if (option.disabled) return;
      setOpen(false);
      onChange?.({ currentTarget: { value: option.value }, target: { value: option.value } });
      requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function moveActive(direction: 1 | -1) {
      if (!options.length) return;
      let index = activeIndex;
      for (let step = 0; step < options.length; step += 1) {
        index = (index + direction + options.length) % options.length;
        if (!options[index]?.disabled) {
          setActiveIndex(index);
          break;
        }
      }
    }

    function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) setOpen(true);
        else moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && open) {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) commit(option);
      }
    }

    const menu = open && !disabled ? createPortal(
      <OneUISelectionMenu
        ref={menuRef}
        id={`${generatedId}-menu`}
        className="one-ui-select-menu"
        role="listbox"
        aria-label={label}
        style={menuStyle}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selectedValue;
          return (
            <li key={`${option.value}-${index}`} role="presentation">
              <button
                type="button"
                className="one-ui-select-menu__item"
                role="option"
                aria-selected={isSelected}
                data-active={index === activeIndex || undefined}
                data-selected={isSelected || undefined}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option)}
              >
                <span>{option.label}</span>
                <span className="one-ui-select-menu__check" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </OneUISelectionMenu>,
      document.body,
    ) : null;

    return (
      <div
        {...props}
        ref={rootRef}
        className={classes("one-ui-select-field", className)}
        data-compact={compact || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
      >
        <span id={`${generatedId}-label`} className="one-ui-select-field__label">{label}</span>
        <span className="one-ui-select-field__container">
          <button
            ref={assignTrigger}
            type="button"
            className="one-ui-select-field__trigger"
            disabled={disabled}
            role="combobox"
            aria-labelledby={`${generatedId}-label`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? `${generatedId}-menu` : undefined}
            data-placeholder={!selectedValue || undefined}
            onClick={() => setOpen((current) => !current)}
            onKeyDown={onTriggerKeyDown}
          >
            <span className="one-ui-select-field__value">{selected?.label ?? "Select"}</span>
            <span className="one-ui-select-field__chevron" aria-hidden="true" />
          </button>
          {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
        </span>
        {menu}
      </div>
    );
  },
);

type CheckboxRowProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type"> & {
  label: ReactNode;
  loading?: boolean;
  meta?: ReactNode;
};

export const OneUICheckboxRow = forwardRef<HTMLInputElement, CheckboxRowProps>(
  function OneUICheckboxRow({ checked, className, disabled, label, loading = false, meta, ...props }, ref) {
    return (
      <label
        className={classes("one-ui-checkbox-row", className)}
        data-disabled={disabled || loading || undefined}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
      >
        <input
          {...props}
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled || loading}
        />
        <span className="one-ui-checkbox-row__shape" aria-hidden="true">
          {loading ? <OneUIProgressIndicator label="Updating" size="small" /> : null}
        </span>
        <span className="one-ui-checkbox-row__label">{label}</span>
        {meta != null ? <span className="one-ui-checkbox-row__meta">{meta}</span> : null}
      </label>
    );
  },
);
