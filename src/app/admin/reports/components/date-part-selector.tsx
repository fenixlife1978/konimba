'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getYear, getMonth, getDate, setYear, setMonth, setDate, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatePartSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

export function DatePartSelector({ date, onDateChange, disabled }: DatePartSelectorProps) {
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: es.localize?.month(i, { width: 'wide' }),
  }));
  const daysInMonth = getDaysInMonth(date);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleYearChange = (yearValue: string) => {
    const newDate = setYear(date, parseInt(yearValue, 10));
    // Adjust day if it's out of bounds for the new month/year
    const newDaysInMonth = getDaysInMonth(newDate);
    if (getDate(newDate) > newDaysInMonth) {
        onDateChange(setDate(newDate, newDaysInMonth));
    } else {
        onDateChange(newDate);
    }
  };

  const handleMonthChange = (monthValue: string) => {
    const newDate = setMonth(date, parseInt(monthValue, 10));
    // Adjust day if it's out of bounds for the new month
    const newDaysInMonth = getDaysInMonth(newDate);
    if (getDate(newDate) > newDaysInMonth) {
        onDateChange(setDate(newDate, newDaysInMonth));
    } else {
        onDateChange(newDate);
    }
  };

  const handleDayChange = (dayValue: string) => {
    const newDate = setDate(date, parseInt(dayValue, 10));
    onDateChange(newDate);
  };
  
  return (
    <div className="flex gap-2">
       <Select
        value={String(getDate(date))}
        onValueChange={handleDayChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="Día" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={String(day)}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(getMonth(date))}
        onValueChange={handleMonthChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Mes" />
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
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Año" />
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
