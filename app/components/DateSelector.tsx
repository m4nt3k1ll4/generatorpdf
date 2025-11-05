"use client";

import * as React from "react";
import {
  format,
  parse,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import * as Pop from "@radix-ui/react-popover";

export default function DateSelector({
  value, // "yyyy-MM-dd"
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  // Derivar fecha desde el prop
  const selected = React.useMemo(
    () => parse(value, "yyyy-MM-dd", new Date()),
    [value]
  );

  const handleSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd")); // Mantiene el día exacto
    setOpen(false);
  };

  return (
    <div className="relative">
      <Pop.Root open={open} onOpenChange={setOpen}>
        <Pop.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <CalendarIcon className="h-4 w-4 opacity-70" />
            <span className="text-sm">
              {format(selected, "PPP", { locale: es })}
            </span>
          </button>
        </Pop.Trigger>

        <Pop.Content
          side="bottom"
          align="start"
          className="z-50 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border w-auto"
        >
          <CalendarGrid selectedDate={selected} onSelect={handleSelect} />
        </Pop.Content>
      </Pop.Root>
    </div>
  );
}

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

  // Sincroniza el mes visible si cambia desde fuera
  React.useEffect(() => {
    setCurrentMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
  }, [selectedDate]);

  const weekStartsOn = 1; // Lunes

  // Rango completo de semanas que cubren el mes (incluye desbordes)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { locale: es, weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { locale: es, weekStartsOn });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handlePrev = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const handleNext = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  // Encabezados de la semana (L–D), claves únicas por índice
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) =>
    format(addDays(gridStart, i), "EEEEE", { locale: es }).toUpperCase()
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

      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {weekdayHeaders.map((d, i) => (
          <div key={`wd-${i}`} className="font-semibold text-gray-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((date) => {
          const inMonth = isSameMonth(date, currentMonth);
          const selected = isSameDay(date, selectedDate);
          const base =
            "p-2 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
          const cls = selected
            ? "bg-blue-600 text-white"
            : inMonth
              ? "hover:bg-slate-200 dark:hover:bg-slate-700"
              : "text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800";

          return (
            <button
              key={date.toISOString()} // única por día
              onClick={() => inMonth && onSelect(date)}
              disabled={!inMonth}
              className={`${base} ${cls}`}
              aria-label={format(date, "PPP", { locale: es })}
            >
              {format(date, "d", { locale: es })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
