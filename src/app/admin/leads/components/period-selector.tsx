'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface PeriodSelectorProps {
  onDateChange: (range: DateRange | undefined) => void;
  onSingleDateChange?: (date: Date) => void;
  initialDate?: Date;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  onDateChange,
  onSingleDateChange,
  initialDate,
}) => {
  const [range, setRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>(initialDate);
  const [mode, setMode] = useState<'single' | 'range'>(onSingleDateChange ? 'single' : 'range');

  useEffect(() => {
    if (initialDate && !singleDate) {
        setSingleDate(initialDate);
    }
  }, [initialDate, singleDate]);

  useEffect(() => {
    if (mode === 'range') {
      onDateChange(range);
    } else {
        if(singleDate && onSingleDateChange) {
            onSingleDateChange(startOfDay(singleDate));
        }
    }
  }, [range, singleDate, mode, onDateChange, onSingleDateChange]);

  const showSingleDateSelector = !!onSingleDateChange;

  return (
    <div className="flex items-end gap-2 p-2 border rounded-lg bg-card">
      <div className="grid gap-1">
        <div className="flex items-center gap-1">
            {showSingleDateSelector && (
                <Button
                    variant={mode === 'single' ? 'secondary' : 'ghost'}
                    onClick={() => setMode('single')}
                    className="h-8 px-3"
                >
                    Día
                </Button>
            )}
          <Button
            variant={mode === 'range' ? 'secondary' : 'ghost'}
            onClick={() => setMode('range')}
            className="h-8 px-3"
          >
            Cerrar Período
          </Button>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[260px] justify-start text-left font-normal',
                !range && !singleDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {mode === 'single' && singleDate ? (
                format(singleDate, 'PPP', { locale: es })
              ) : mode === 'range' && range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, 'LLL dd, y', { locale: es })} -{' '}
                    {format(range.to, 'LLL dd, y', { locale: es })}
                  </>
                ) : (
                  format(range.from, 'LLL dd, y', { locale: es })
                )
              ) : (
                <span>
                    {mode === 'single' ? 'Elige un día' : 'Elige un rango'}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode={mode}
              defaultMonth={
                mode === 'single' ? singleDate : range?.from
              }
              selected={mode === 'single' ? singleDate : range}
              onSelect={
                mode === 'single'
                  ? (day) => {
                      if (day instanceof Date) {
                        setSingleDate(startOfDay(day));
                      }
                    }
                  : setRange
              }
              numberOfMonths={mode === 'range' ? 2 : 1}
              locale={es}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={new Date().getFullYear() + 5}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
