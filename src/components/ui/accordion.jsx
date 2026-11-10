import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";

// SiBS Chat's folder navigation uses a controlled, multi-open accordion.
// This lightweight implementation keeps the existing component API without
// requiring @base-ui/react to be present in node_modules.
const AccordionContext = createContext(null);
const AccordionItemContext = createContext(null);

function Accordion({ className, multiple = false, value, defaultValue, onValueChange, children, ...props }) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue ?? (multiple ? [] : ""),
  );
  const selected = value === undefined ? uncontrolledValue : value;
  const selectedValues = useMemo(
    () => new Set(
      (Array.isArray(selected) ? selected : [selected])
        .filter((item) => item !== null && item !== undefined && item !== "")
        .map(String),
    ),
    [selected],
  );

  const context = useMemo(() => ({
    multiple,
    selectedValues,
    toggle(itemValue) {
      const key = String(itemValue);
      const next = new Set(selectedValues);
      if (next.has(key)) next.delete(key);
      else if (multiple) next.add(key);
      else {
        next.clear();
        next.add(key);
      }
      const nextValue = multiple ? [...next] : ([...next][0] ?? "");
      if (value === undefined) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
  }), [multiple, selectedValues, value, onValueChange]);

  return (
    <AccordionContext.Provider value={context}>
      <div data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ className, value, disabled = false, children, ...props }) {
  const root = useContext(AccordionContext);
  const key = String(value ?? "");
  const isOpen = Boolean(root?.selectedValues.has(key));
  const id = useId();
  const itemContext = useMemo(() => ({
    value: key,
    isOpen,
    disabled,
    triggerId: `${id}-trigger`,
    panelId: `${id}-panel`,
    toggle: () => root?.toggle(key),
  }), [key, isOpen, disabled, id, root]);

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div
        data-slot="accordion-item"
        data-state={isOpen ? "open" : "closed"}
        className={cn("border-b border-sibs-border last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({ className, children, indicator, onClick, disabled, ...props }) {
  const item = useContext(AccordionItemContext);
  const isDisabled = Boolean(disabled || item?.disabled);

  return (
    <div className="flex">
      <button
        type="button"
        id={item?.triggerId}
        data-slot="accordion-trigger"
        data-state={item?.isOpen ? "open" : "closed"}
        aria-expanded={Boolean(item?.isOpen)}
        aria-controls={item?.panelId}
        disabled={isDisabled}
        className={cn(
          "group/accordion-trigger flex w-full cursor-pointer items-center justify-between gap-3 rounded-md py-3 text-left text-sm font-semibold text-sibs-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-navy disabled:cursor-default disabled:opacity-50",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !isDisabled) item?.toggle();
        }}
        {...props}
      >
        {children}
        {indicator ?? (
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none"
          />
        )}
      </button>
    </div>
  );
}

function AccordionContent({ className, panelClassName, children, ...props }) {
  const item = useContext(AccordionItemContext);
  const isOpen = Boolean(item?.isOpen);

  return (
    <div
      id={item?.panelId}
      role="region"
      aria-labelledby={item?.triggerId}
      aria-hidden={!isOpen}
      inert={!isOpen}
      data-slot="accordion-content"
      data-state={isOpen ? "open" : "closed"}
      data-open={isOpen ? "" : undefined}
      data-closed={!isOpen ? "" : undefined}
      className={cn(
        "grid text-sm transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        panelClassName,
      )}
      {...props}
    >
      <div className={cn("min-h-0", isOpen ? "overflow-visible" : "overflow-hidden")}>
        <div className={cn("pb-3", className)}>{children}</div>
      </div>
    </div>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
