"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(
  (
    {
      className,
      children,
      value: controlledValue,
      onChange,
      defaultValue,
      disabled,
      id,
      ...rest
    },
    forwardRef,
  ) => {
    const registerRef = (rest as Record<string, unknown>).ref as
      | React.RefCallback<HTMLSelectElement>
      | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ref: _registerRef, ...restProps } = rest as Record<string, unknown>;

    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const nativeSelectRef = React.useRef<HTMLSelectElement | null>(null);
    const listRef = React.useRef<HTMLUListElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const isControlled = controlledValue !== undefined;

    const [internalValue, setInternalValue] = React.useState<string>(
      isControlled ? String(controlledValue) : "",
    );
    const listboxId = React.useId();
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);

    const options = React.useMemo(() => {
      const result: {
        value: string;
        label: string;
        disabled?: boolean;
      }[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === "option") {
          const props = child.props as Record<string, unknown>;
          result.push({
            value: String(props.value ?? ""),
            label: String(props.children ?? ""),
            disabled: Boolean(props.disabled),
          });
        }
      });
      return result;
    }, [children]);

    const currentValue = isControlled
      ? String(controlledValue)
      : String(internalValue ?? "");

    const selectedLabel =
      options.find((opt) => opt.value === currentValue)?.label;

    const mergedRef = React.useCallback(
      (node: HTMLSelectElement | null) => {
        nativeSelectRef.current = node;
        if (typeof forwardRef === "function") {
          forwardRef(node);
        } else if (forwardRef) {
          (
            forwardRef as React.MutableRefObject<HTMLSelectElement | null>
          ).current = node;
        }
        if (typeof registerRef === "function") {
          registerRef(node);
        }
      },
      [forwardRef, registerRef],
    );

    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(String(controlledValue));
      }
    }, [controlledValue, isControlled]);

    React.useEffect(() => {
      if (!isControlled && nativeSelectRef.current) {
        setInternalValue(nativeSelectRef.current.value);
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dispatchNativeChange = React.useCallback(
      (newValue: string) => {
        const el = nativeSelectRef.current;
        if (!el) return;
        el.value = newValue;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [],
    );

    const handleSelect = React.useCallback(
      (optionValue: string) => {
        setInternalValue(optionValue);
        dispatchNativeChange(optionValue);
        setOpen(false);
        triggerRef.current?.focus();
      },
      [dispatchNativeChange],
    );

    const handleTriggerKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (
          e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "Enter" ||
          e.key === " "
        ) {
          e.preventDefault();
          if (!open) {
            setOpen(true);
            setHighlightedIndex(
              e.key === "ArrowUp" ? options.length - 1 : 0,
            );
          }
          return;
        }
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      },
      [open, options.length],
    );

    React.useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    React.useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          triggerRef.current?.focus();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) next++;
            return Math.min(next, options.length - 1);
          });
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) next--;
            return Math.max(next, 0);
          });
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const opt = options[highlightedIndex];
          if (opt && !opt.disabled) {
            handleSelect(opt.value);
          }
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open, options, highlightedIndex, handleSelect]);

    React.useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[highlightedIndex] as
          | HTMLElement
          | undefined;
        if (item) item.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex]);

    const isEmpty = currentValue === "";

    return (
      <div ref={containerRef} className="relative">
        <select
          ref={mergedRef}
          value={isControlled ? currentValue : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          onChange={onChange}
          disabled={disabled}
          id={id}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...(restProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {children}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "min-h-[46px] w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-left outline-none transition flex items-center justify-between gap-2",
            "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground",
            open && "border-foreground ring-2 ring-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            isEmpty && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedLabel || "Pilih..."}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>

        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-1 rounded-2xl border border-border bg-white py-1 shadow-panel origin-top transition-all duration-200 ease-out",
            open
              ? "visible opacity-100 translate-y-0 scale-100"
              : "invisible opacity-0 -translate-y-1 scale-95 pointer-events-none",
          )}
        >
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-60 overflow-auto rounded-2xl"
          >
            {options.map((option, index) => {
              const isSelected = option.value === currentValue;
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) handleSelect(option.value);
                  }}
                  onMouseEnter={() =>
                    !option.disabled && setHighlightedIndex(index)
                  }
                  className={cn(
                    "cursor-pointer px-4 py-2.5 text-sm transition-colors select-none",
                    option.disabled && "opacity-40 cursor-not-allowed",
                    isSelected &&
                      "font-semibold bg-primary/8 text-primary",
                    !isSelected && isHighlighted && "bg-muted",
                    !isSelected &&
                      !isHighlighted &&
                      !option.disabled &&
                      "hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-between">
                    {option.label}
                    {isSelected && (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";
