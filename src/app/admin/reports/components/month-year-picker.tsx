
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getYear, getMonth, setYear, setMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthYearPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export function MonthYearPicker({ date, onDateChange, disabled }: MonthYearPickerProps) {
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: es.localize?.month(i, { width: 'wide' }),
  }));

  const handleYearChange = (yearValue: string) => {
    const newDate = setYear(date, parseInt(yearValue, 10));
    onDateChange(newDate);
  };

  const handleMonthChange = (monthValue: string) => {
    const newDate = setMonth(date, parseInt(monthValue, 10));
    onDateChange(newDate);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={String(getMonth(date))}
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar mes" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={String(month.value)}>
              <span className="capitalize">{month.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(getYear(date))}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Seleccionar año" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
