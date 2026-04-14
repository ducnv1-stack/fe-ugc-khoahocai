'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, addHours, differenceInMinutes, startOfDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';

interface WeeklyCalendarProps {
  schedules: any[];
  onEventClick: (schedule: any) => void;
  onTimeUpdate: (id: string, start: Date, end: Date) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM
const DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun to Sat
const CELL_HEIGHT = 60; // 60px per hour

export function WeeklyCalendar({ schedules, onEventClick, onTimeUpdate }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getPosition = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutesSince7AM = (hours - 7) * 60 + minutes;
    return (totalMinutesSince7AM / 60) * CELL_HEIGHT;
  };

  const getDurationHeight = (start: Date, end: Date) => {
    const duration = differenceInMinutes(end, start);
    return (duration / 60) * CELL_HEIGHT;
  };

  // Filter schedules for the current week
  const visibleSchedules = useMemo(() => {
    return schedules.filter(s => {
      const start = new Date(s.startTime);
      return start >= weekStart && start < addDays(weekStart, 7);
    });
  }, [schedules, weekStart]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="w-16 border-r border-slate-200" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, i) => (
            <div key={i} className={cn(
              "p-2 text-center border-r border-slate-100 last:border-r-0",
              format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "bg-indigo-50/50"
            )}>
              <p className="text-[10px] uppercase font-bold text-slate-500">{format(day, 'EEEE', { locale: vi })}</p>
              <p className={cn(
                "text-lg font-bold",
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "text-indigo-600" : "text-slate-800"
              )}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex">
          {/* Time Gutter */}
          <div className="w-16 shrink-0 bg-slate-50/50">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b border-slate-100 pr-2 text-right">
                <span className="text-[10px] font-medium text-slate-400 leading-[20px]">{hour}:00</span>
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {DAYS.map(dayIdx => (
              <div key={dayIdx} className="border-r border-slate-100 last:border-r-0 h-[960px] relative">
                {HOURS.map(hour => (
                  <div key={hour} className="h-[60px] border-b border-slate-50" />
                ))}
                
                {/* Events for this day */}
                {visibleSchedules
                  .filter(s => new Date(s.startTime).getDay() === (dayIdx + 1) % 7) // Adjusted for Monday start
                  .map(schedule => {
                    const start = new Date(schedule.startTime);
                    const end = new Date(schedule.endTime);
                    const top = getPosition(start);
                    const height = getDurationHeight(start, end);
                    const registered = schedule._count?.students || 0;
                    const capacity = schedule.maxCapacity || 10;
                    const isFull = registered >= capacity;

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => onEventClick(schedule)}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        className={cn(
                          "absolute left-1 right-1 rounded-lg p-2 shadow-sm border-l-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md z-10 overflow-hidden group",
                          isFull 
                            ? "bg-rose-50 border-rose-500 hover:bg-rose-100" 
                            : "bg-indigo-50 border-indigo-500 hover:bg-indigo-100"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-wider truncate",
                            isFull ? "text-rose-700" : "text-indigo-700"
                          )}>
                            {schedule.course?.code}
                          </p>
                          <span className="text-[9px] font-bold opacity-70">
                            {format(start, 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">
                          {schedule.course?.name}
                        </p>
                        <div className="mt-auto flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                            <Users className="w-2.5 h-2.5" />
                            {registered}/{capacity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
            
            {/* Current Time Indicator */}
            {format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
               <div 
                className="absolute left-0 right-0 border-t-2 border-rose-500 z-20 pointer-events-none"
                style={{ top: `${getPosition(new Date())}px` }}
               >
                 <div className="w-3 h-3 bg-rose-500 rounded-full -mt-[7px] -ml-[6px]" />
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
