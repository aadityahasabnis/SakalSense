'use client';
// =============================================
// ActivityCalendar - GitHub/LeetCode-style yearly activity heatmap
// Professional design with accurate month-wise day placement
// =============================================

import { useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =============================================
// Types
// =============================================

interface IActivityDay {
    date: string; // YYYY-MM-DD
    count: number;
}

interface IActivityCalendarProps {
    activityData: IActivityDay[];
    year?: number;
    onYearChange?: (year: number) => void;
    loading?: boolean;
}

// =============================================
// Constants
// =============================================

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// =============================================
// Utilities
// =============================================

const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
};

const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// =============================================
// Generate Calendar Data Structure
// =============================================

interface ICalendarWeek {
    days: Array<{
        date: string;
        dayOfMonth: number;
        month: number;
        isCurrentYear: boolean;
        isToday: boolean;
    } | null>;
}

interface IMonthData {
    name: string;
    weeks: ICalendarWeek[];
    startWeekIndex: number;
    weekCount: number;
}

const generateCalendarData = (year: number): { weeks: ICalendarWeek[]; months: IMonthData[] } => {
    const weeks: ICalendarWeek[] = [];
    const months: IMonthData[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find the first day to display (Sunday of the week containing Jan 1)
    const jan1 = new Date(year, 0, 1);
    const startDate = new Date(jan1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Find the last day to display (Saturday of the week containing Dec 31)
    const dec31 = new Date(year, 11, 31);
    const endDate = new Date(dec31);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    let currentDate = new Date(startDate);
    let currentWeek: ICalendarWeek['days'] = [];
    let currentMonth = -1;

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0] ?? '';
        const month = currentDate.getMonth();
        const isCurrentYear = currentDate.getFullYear() === year;

        // Track month changes for the current year
        if (isCurrentYear && month !== currentMonth) {
            if (currentMonth !== -1 && months.length > 0) {
                const lastMonth = months[months.length - 1];
                if (lastMonth) {
                    lastMonth.weekCount = weeks.length - lastMonth.startWeekIndex;
                }
            }
            months.push({
                name: MONTHS[month] ?? '',
                weeks: [],
                startWeekIndex: weeks.length,
                weekCount: 0,
            });
            currentMonth = month;
        }

        currentWeek.push({
            date: dateStr,
            dayOfMonth: currentDate.getDate(),
            month: month,
            isCurrentYear,
            isToday: dateStr === todayStr,
        });

        // If we've filled a week (7 days)
        if (currentWeek.length === 7) {
            weeks.push({ days: currentWeek });
            currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push any remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push({ days: currentWeek });
    }

    // Set the week count for the last month
    if (months.length > 0) {
        const lastMonth = months[months.length - 1];
        if (lastMonth) {
            lastMonth.weekCount = weeks.length - lastMonth.startWeekIndex;
        }
    }

    return { weeks, months };
};

// =============================================
// Main Component
// =============================================

export const ActivityCalendar = ({
    activityData,
    year: initialYear,
    onYearChange,
    loading = false,
}: IActivityCalendarProps) => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(initialYear ?? currentYear);

    // Create a map for quick lookup
    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        activityData.forEach((item) => {
            map.set(item.date, item.count);
        });
        return map;
    }, [activityData]);

    // Generate calendar structure
    const { weeks, months } = useMemo(() => generateCalendarData(year), [year]);

    // Calculate stats
    const stats = useMemo(() => {
        let total = 0;
        let activeDays = 0;
        let maxStreak = 0;
        let currentStreak = 0;
        let lastActiveDate: Date | null = null;

        // Sort dates and calculate
        const sortedDates = Array.from(activityMap.entries())
            .filter(([date]) => {
                const d = new Date(date);
                return d.getFullYear() === year;
            })
            .sort(([a], [b]) => a.localeCompare(b));

        sortedDates.forEach(([date, count]) => {
            if (count > 0) {
                total += count;
                activeDays++;

                const currentDate = new Date(date);
                if (lastActiveDate) {
                    const dayDiff = Math.floor((currentDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayDiff === 1) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                lastActiveDate = currentDate;
            }
        });

        return { total, activeDays, maxStreak };
    }, [activityMap, year]);

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        onYearChange?.(newYear);
    };

    if (loading) {
        return (
            <div className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-[120px] animate-pulse rounded bg-muted" />
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-medium">
                        {stats.total} contributions in {year}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {stats.activeDays} active days
                        {stats.maxStreak > 1 && ` · ${stats.maxStreak} day max streak`}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleYearChange(year - 1)}
                        disabled={year <= currentYear - 5}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[3.5rem] text-center text-sm font-medium">{year}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleYearChange(year + 1)}
                        disabled={year >= currentYear}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar */}
            <div className="overflow-x-auto p-4">
                <TooltipProvider delayDuration={50}>
                    <div className="inline-block min-w-full">
                        {/* Month Labels */}
                        <div className="mb-1 flex pl-7">
                            {months.map((month, idx) => (
                                <div
                                    key={`${month.name}-${idx}`}
                                    className="text-xs text-muted-foreground"
                                    style={{
                                        width: `${month.weekCount * 12}px`,
                                        minWidth: `${month.weekCount * 12}px`,
                                    }}
                                >
                                    {month.weekCount >= 3 ? month.name : ''}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex">
                            {/* Day Labels */}
                            <div className="mr-1 flex flex-col gap-[2px]">
                                {DAYS_SHORT.map((day, i) => (
                                    <div
                                        key={i}
                                        className="flex h-[10px] w-6 items-center justify-end pr-1 text-[10px] text-muted-foreground"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Weeks */}
                            <div className="flex gap-[2px]">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                                        {week.days.map((day, dayIndex) => {
                                            if (!day || !day.isCurrentYear) {
                                                return (
                                                    <div
                                                        key={`empty-${weekIndex}-${dayIndex}`}
                                                        className="h-[10px] w-[10px]"
                                                    />
                                                );
                                            }

                                            const count = activityMap.get(day.date) ?? 0;
                                            const level = getIntensityLevel(count);

                                            return (
                                                <Tooltip key={day.date}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                'h-[10px] w-[10px] rounded-[2px] transition-colors',
                                                                level === 0 && 'bg-muted/60 hover:bg-muted',
                                                                level === 1 && 'bg-emerald-200 dark:bg-emerald-900/80 hover:bg-emerald-300 dark:hover:bg-emerald-800',
                                                                level === 2 && 'bg-emerald-400 dark:bg-emerald-700/90 hover:bg-emerald-500 dark:hover:bg-emerald-600',
                                                                level === 3 && 'bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500',
                                                                level === 4 && 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400',
                                                                day.isToday && 'ring-1 ring-foreground ring-offset-1 ring-offset-background'
                                                            )}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        className="text-xs"
                                                    >
                                                        <p className="font-medium">
                                                            {count === 0
                                                                ? 'No activity'
                                                                : `${count} ${count === 1 ? 'contribution' : 'contributions'}`}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {formatDateForDisplay(day.date)}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                            <span>Less</span>
                            <div className="flex gap-[2px]">
                                {[0, 1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={cn(
                                            'h-[10px] w-[10px] rounded-[2px]',
                                            level === 0 && 'bg-muted/60',
                                            level === 1 && 'bg-emerald-200 dark:bg-emerald-900/80',
                                            level === 2 && 'bg-emerald-400 dark:bg-emerald-700/90',
                                            level === 3 && 'bg-emerald-500 dark:bg-emerald-600',
                                            level === 4 && 'bg-emerald-600 dark:bg-emerald-500'
                                        )}
                                    />
                                ))}
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </TooltipProvider>
            </div>
        </div>
    );
};

// =============================================
// Month View Calendar (Alternative compact view)
// =============================================

interface IMonthCalendarProps {
    activityData: IActivityDay[];
    month?: number; // 0-11
    year?: number;
    loading?: boolean;
}

export const MonthCalendar = ({
    activityData,
    month: initialMonth,
    year: initialYear,
    loading = false,
}: IMonthCalendarProps) => {
    const today = new Date();
    const [month, setMonth] = useState(initialMonth ?? today.getMonth());
    const [year, setYear] = useState(initialYear ?? today.getFullYear());

    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        activityData.forEach((item) => {
            map.set(item.date, item.count);
        });
        return map;
    }, [activityData]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: Array<{ date: string; day: number } | null> = [];

        // Add empty slots for days before the 1st
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date: date.toISOString().split('T')[0] ?? '',
                day,
            });
        }

        return days;
    }, [month, year]);

    const goToPrevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const goToNextMonth = () => {
        const now = new Date();
        const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
        if (isCurrentMonth) return;

        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const monthStats = useMemo(() => {
        let total = 0;
        calendarDays.forEach((day) => {
            if (day) {
                total += activityMap.get(day.date) ?? 0;
            }
        });
        return total;
    }, [calendarDays, activityMap]);

    if (loading) {
        return (
            <div className="rounded-lg border bg-card p-4">
                <div className="h-[200px] animate-pulse rounded bg-muted" />
            </div>
        );
    }

    const todayStr = today.toISOString().split('T')[0];

    return (
        <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-medium">
                    {MONTHS[month]} {year}
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={goToPrevMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={goToNextMonth}
                        disabled={month === today.getMonth() && year === today.getFullYear()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="p-4">
                <TooltipProvider delayDuration={50}>
                    {/* Weekday headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div
                                key={i}
                                className="text-center text-xs text-muted-foreground"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (!day) {
                                return <div key={`empty-${i}`} className="aspect-square" />;
                            }

                            const count = activityMap.get(day.date) ?? 0;
                            const level = getIntensityLevel(count);
                            const isToday = day.date === todayStr;

                            return (
                                <Tooltip key={day.date}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                'aspect-square flex items-center justify-center rounded text-xs transition-colors',
                                                level === 0 && 'bg-muted/40 text-muted-foreground',
                                                level === 1 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
                                                level === 2 && 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200',
                                                level === 3 && 'bg-emerald-400 text-white dark:bg-emerald-600',
                                                level === 4 && 'bg-emerald-600 text-white dark:bg-emerald-500',
                                                isToday && 'ring-1 ring-foreground'
                                            )}
                                        >
                                            {day.day}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-medium">
                                            {count === 0
                                                ? 'No activity'
                                                : `${count} ${count === 1 ? 'contribution' : 'contributions'}`}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {formatDateForDisplay(day.date)}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>

                {/* Monthly stats */}
                <div className="mt-3 text-center text-xs text-muted-foreground">
                    {monthStats} contributions this month
                </div>
            </div>
        </div>
    );
};
