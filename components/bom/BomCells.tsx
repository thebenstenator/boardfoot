"use client";

import { useState, useRef, useEffect } from "react";

// ─── EditableCell ─────────────────────────────────────────────────────────────

interface EditableCellProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  className?: string;
  tabIndex?: number;
}

export function EditableCell({
  value,
  onChange,
  type = "text",
  className = "",
  tabIndex,
}: EditableCellProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  function handleFocus() {
    setDraft(String(value));
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    onChange(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
  }

  return (
    <input
      type="text"
      inputMode={type === "number" ? "decimal" : "text"}
      value={focused ? draft : String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      className={`w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        focus:outline-none focus:border-ring focus:bg-background
        hover:border-border ${className}`}
    />
  );
}

// ─── CurrencyCell ─────────────────────────────────────────────────────────────

interface CurrencyCellProps {
  value: number;
  onChange: (value: string) => void;
  tabIndex?: number;
}

export function CurrencyCell({ value, onChange, tabIndex }: CurrencyCellProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  function handleFocus() {
    setDraft(String(value));
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    onChange(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
  }

  return (
    <div
      className="flex items-center border border-transparent rounded hover:border-border
      focus-within:border-ring focus-within:bg-background px-1 py-0.5 gap-0.5"
    >
      <span className="text-muted-foreground text-sm shrink-0">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={focused ? draft : String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        className="w-full bg-transparent text-sm focus:outline-none"
      />
    </div>
  );
}

// ─── DescriptionCell ─────────────────────────────────────────────────────────────

export function DescriptionCell({
  value,
  onChange,
  tabIndex,
}: {
  value: string;
  onChange: (value: string) => void;
  tabIndex?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      rows={1}
      className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        focus:outline-none focus:border-ring focus:bg-background
        hover:border-border resize-none leading-tight"
      style={{ height: "auto", overflow: "hidden" }}
    />
  );
}
