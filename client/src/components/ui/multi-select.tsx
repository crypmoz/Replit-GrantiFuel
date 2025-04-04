import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  badgeClassName?: string;
  maxSelectedShown?: number;
  disabled?: boolean;
  maxHeight?: number;
  loading?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found",
  className,
  badgeClassName,
  maxSelectedShown = 3,
  disabled = false,
  maxHeight = 300,
  loading = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  // Filter options based on input value
  const filteredOptions = options.filter((option) => {
    const matchesSearch = option.label.toLowerCase().includes(inputValue.toLowerCase());
    const notSelected = !selected.includes(option.value);
    return matchesSearch && (notSelected || inputValue);
  });

  return (
    <div className={cn("relative", className)}>
      <Command
        className={cn(
          "overflow-visible bg-transparent",
          disabled && "opacity-70 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "group rounded-md border border-input px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring",
            "min-h-10",
            open && "ring-1 ring-ring"
          )}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.slice(0, maxSelectedShown).map((value) => {
                  const selectedOption = options.find((option) => option.value === value);
                  return (
                    <Badge
                      key={value}
                      className={cn(
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        "px-1.5 py-0.5",
                        badgeClassName
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                    >
                      {selectedOption?.label || value}
                      <button
                        className="ml-1 rounded-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(value);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnselect(value);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  );
                })}
                {selected.length > maxSelectedShown && (
                  <Badge className="bg-secondary text-secondary-foreground px-1.5 py-0.5">
                    +{selected.length - maxSelectedShown} more
                  </Badge>
                )}
              </div>
            )}
            <CommandPrimitive.Input
              className={cn(
                "placeholder:text-muted-foreground flex-1 bg-transparent outline-none disabled:cursor-not-allowed",
                "min-w-[120px]",
                !selected.length && "w-full"
              )}
              placeholder={selected.length ? undefined : placeholder}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="relative">
          {open && (
            <div
              className={cn(
                "absolute top-2 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              )}
              style={{ maxHeight: maxHeight }}
            >
              <CommandList className="max-h-[inherit] overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-primary" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandGroup>
                      {filteredOptions.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => {
                              if (isSelected) {
                                onChange(selected.filter((item) => item !== option.value));
                              } else {
                                onChange([...selected, option.value]);
                              }
                              setInputValue("");
                            }}
                            className={cn(
                              "cursor-pointer",
                              option.disabled && "opacity-50 pointer-events-none"
                            )}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn("h-3 w-3", isSelected ? "opacity-100" : "opacity-0")}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span>{option.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </div>
          )}
        </div>
      </Command>
    </div>
  );
}