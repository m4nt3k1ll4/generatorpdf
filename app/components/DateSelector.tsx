"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { es } from "date-fns/locale";

export default function DateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Date>(new Date(value));

  const handleSelect = (date: Date) => {
    setSelected(date);
    onChange(date.toISOString().slice(0, 10));
    setOpen(false);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <CalendarIcon className="h-4 w-4 opacity-70" />
            <span className="text-sm">
              {format(selected, "PPP", { locale: es })}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="z-50 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border w-auto"
        >
          <CalendarGrid selectedDate={selected} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* Mini calendario sencillo, inspirado en el de shadcn/ui */
function CalendarGrid({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const days = Array.from({ length: 31 }, (_, i) => i + 1).filter(
    (d) =>
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        d
      ).getMonth() === currentMonth.getMonth()
  );

  const handlePrev = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const handleNext = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={handlePrev}
          className="px-2 text-gray-500 hover:text-black"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          onClick={handleNext}
          className="px-2 text-gray-500 hover:text-black"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="font-semibold text-gray-500">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            d
          );
          const isSelected =
            date.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={d}
              onClick={() => onSelect(date)}
              className={`p-2 rounded-full text-sm ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
