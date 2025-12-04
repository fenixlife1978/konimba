// This is a new file
'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDaysInMonth, getYear, getMonth } from 'date-fns';
import { Label } from '@/components/ui/label';
import type { DateRange } from 'react-day-picker';

interface PeriodSelectorProps {
  onDateChange: (range: DateRange | undefined) => void;
}

const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(0, i).toLocaleString('es-ES', { month: 'long' }),
}));

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  onDateChange,
}) => {
  const [startDate, setStartDate] = useState({
    year: getYear(new Date()),
    month: getMonth(new Date()),
    day: 1,
  });
  const [endDate, setEndDate] = useState({
    year: getYear(new Date()),
    month: getMonth(new Date()),
    day: getDaysInMonth(new Date()),
  });

  useEffect(() => {
    const from = new Date(startDate.year, startDate.month, startDate.day);
    const to = new Date(endDate.year, endDate.month, endDate.day);
    if (from <= to) {
      onDateChange({ from, to });
    } else {
      // If start date is after end date, maybe show a warning or reset
      onDateChange(undefined);
    }
  }, [startDate, endDate, onDateChange]);

  const getDaysForMonth = (year: number, month: number) => {
    return Array.from(
      { length: getDaysInMonth(new Date(year, month)) },
      (_, i) => i + 1
    );
  };

  return (
    <div className="flex items-end gap-4 p-4 border rounded-lg bg-card">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Inicio</Label>
        <div className="flex items-center gap-2">
          <Select
            value={startDate.day.toString()}
            onValueChange={(v) =>
              setStartDate((s) => ({ ...s, day: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {getDaysForMonth(startDate.year, startDate.month).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={startDate.month.toString()}
            onValueChange={(v) =>
              setStartDate((s) => ({ ...s, month: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={startDate.year.toString()}
            onValueChange={(v) =>
              setStartDate((s) => ({ ...s, year: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Fin</Label>
        <div className="flex items-center gap-2">
          <Select
            value={endDate.day.toString()}
            onValueChange={(v) =>
              setEndDate((s) => ({ ...s, day: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {getDaysForMonth(endDate.year, endDate.month).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={endDate.month.toString()}
            onValueChange={(v) =>
              setEndDate((s) => ({ ...s, month: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={endDate.year.toString()}
            onValueChange={(v) =>
              setEndDate((s) => ({ ...s, year: parseInt(v) }))
            }
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
