"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1.5", className)}
      classNames={{
        months: "flex flex-col gap-1",
        month: "flex flex-col gap-1.5",
        caption: "flex justify-center pt-0.5 relative items-center w-full mb-1",
        caption_label: "text-[0.65rem] font-medium",
        nav: "flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-4 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-0.5",
        nav_button_next: "absolute right-0.5",
        table: "w-full border-collapse",
        head_row: "flex gap-0.5 mb-0.5",
        head_cell:
          "text-muted-foreground w-5 font-normal text-[0.6rem]",
        row: "flex gap-0.5 mt-0.5",
        cell: cn(
          "relative p-0 text-center text-[0.65rem] focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-sm [&:has(>.day-range-start)]:rounded-l-sm"
            : "",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-5 p-0 text-[0.65rem] font-normal hover:bg-accent/50",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent/30 text-accent-foreground",
        day_outside:
          "text-muted-foreground/30 opacity-50",
        day_disabled: "text-muted-foreground/20 opacity-30",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-2.5", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-2.5", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
