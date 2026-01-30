'use client';
// =============================================
// ActivityCalendar - GitHub-style yearly activity heatmap
// Proper month-wise grid layout with accurate week positioning
// =============================================

import { useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight, Flame, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Cell size and gap
const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

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
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getContributionText = (count: number): string => {
    if (count === 0) return 'No contributions';
    return `${count} contribution${count === 1 ? '' : 's'}`;
};

// =============================================
// Generate Calendar Data - GitHub Style
// =============================================

interface IDayCell {
    date: string;
    dayOfMonth: number;
    month: number;
    year: number;
    isToday: boolean;
}

interface IWeekColumn {
    days: (IDayCell | null)[];
    weekIndex: number;
}

interface IMonthLabel {
    name: string;
    startWeek: number;
    colSpan: number;
}

const generateGitHubCalendar = (year: number) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Start from the first day of the year
    const jan1 = new Date(year, 0, 1);
    // Find the Sunday of the week containing Jan 1
    const startDate = new Date(jan1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at December 31
    const dec31 = new Date(year, 11, 31);
    // Find the Saturday of the week containing Dec 31
    const endDate = new Date(dec31);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const weeks: IWeekColumn[] = [];
    const monthLabels: IMonthLabel[] = [];
    
    let currentDate = new Date(startDate);
    let weekIndex = 0;
    let currentMonthInYear = -1;

    while (currentDate <= endDate) {
        const week: (IDayCell | null)[] = [];
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const dateStr = currentDate.toISOString().split('T')[0] ?? '';
            const cellYear = currentDate.getFullYear();
            const cellMonth = currentDate.getMonth();
            
            // Only include days from the target year
            if (cellYear === year) {
                // Track month changes for labels
                if (cellMonth !== currentMonthInYear) {
                    // If we're on day 1-7 of a new month AND it's a Sunday (start of week)
                    // OR if we're at the beginning of the calendar
                    if (currentMonthInYear === -1 || dayOfWeek === 0 || currentDate.getDate() <= 7) {
                        monthLabels.push({
                            name: MONTHS[cellMonth] ?? '',
                            startWeek: weekIndex,
                            colSpan: 0, // Will calculate later
                        });
                    }
                    currentMonthInYear = cellMonth;
                }

                week.push({
                    date: dateStr,
                    dayOfMonth: currentDate.getDate(),
                    month: cellMonth,
                    year: cellYear,
                    isToday: dateStr === todayStr,
                });
            } else {
                week.push(null);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        weeks.push({ days: week, weekIndex });
        weekIndex++;
    }

    // Calculate colSpan for each month label
    for (let i = 0; i < monthLabels.length; i++) {
        const current = monthLabels[i];
        const next = monthLabels[i + 1];
        if (current) {
            current.colSpan = next ? next.startWeek - current.startWeek : weeks.length - current.startWeek;
        }
    }

    // Remove month labels that have less than 2 weeks (too narrow to show)
    const filteredMonthLabels = monthLabels.filter(m => m.colSpan >= 2);

    return { weeks, monthLabels: filteredMonthLabels };
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
    const { weeks, monthLabels } = useMemo(() => generateGitHubCalendar(year), [year]);

    // Calculate stats
    const stats = useMemo(() => {
        let total = 0;
        let activeDays = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        // Get all dates in the year sorted
        const yearDates: Array<{ date: string; count: number }> = [];
        
        weeks.forEach(week => {
            week.days.forEach(day => {
                if (day && day.year === year) {
                    const count = activityMap.get(day.date) ?? 0;
                    yearDates.push({ date: day.date, count });
                }
            });
        });

        yearDates.sort((a, b) => a.date.localeCompare(b.date));

        let prevDate: string | null = null;
        yearDates.forEach(({ date, count }) => {
            if (count > 0) {
                total += count;
                activeDays++;

                // Check for streak
                if (prevDate) {
                    const prev = new Date(prevDate + 'T00:00:00');
                    const curr = new Date(date + 'T00:00:00');
                    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (dayDiff === 1) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                prevDate = date;
            }
        });

        return { total, activeDays, maxStreak };
    }, [activityMap, weeks, year]);

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        onYearChange?.(newYear);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[130px] animate-pulse rounded bg-muted" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            {/* Header with Stats */}
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">contributions in {year}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-emerald-500" />
                                <span>{stats.activeDays} days</span>
                            </div>
                            {stats.maxStreak > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span>{stats.maxStreak} day streak</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleYearChange(year - 1)}
                            disabled={year <= currentYear - 10}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[4rem] text-center text-sm font-semibold">{year}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleYearChange(year + 1)}
                            disabled={year >= currentYear}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Calendar Grid */}
            <CardContent className="pt-0">
                <div className="overflow-x-auto pb-2">
                    <TooltipProvider delayDuration={0}>
                        <div className="inline-block">
                            {/* Month Labels Row */}
                            <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
                                {monthLabels.map((month, idx) => (
                                    <div
                                        key={`${month.name}-${idx}`}
                                        className="text-xs text-muted-foreground font-medium"
                                        style={{
                                            width: `${month.colSpan * WEEK_WIDTH}px`,
                                        }}
                                    >
                                        {month.name}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid with Day Labels */}
                            <div className="flex">
                                {/* Day Labels (Mon, Wed, Fri) */}
                                <div className="flex flex-col gap-[3px] pr-1">
                                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className="flex items-center justify-end text-[10px] text-muted-foreground"
                                            style={{ height: `${CELL_SIZE}px`, width: '24px' }}
                                        >
                                            {dayIndex % 2 === 1 ? DAYS_SHORT[dayIndex]?.slice(0, 3) : ''}
                                        </div>
                                    ))}
                                </div>

                                {/* Week Columns */}
                                <div className="flex gap-[3px]">
                                    {weeks.map((week) => (
                                        <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                                            {week.days.map((day, dayIndex) => {
                                                if (!day) {
                                                    return (
                                                        <div
                                                            key={`empty-${week.weekIndex}-${dayIndex}`}
                                                            style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
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
                                                                    'rounded-sm cursor-pointer transition-all',
                                                                    'hover:ring-2 hover:ring-foreground/20 hover:ring-offset-1',
                                                                    level === 0 && 'bg-muted/50 dark:bg-muted/30',
                                                                    level === 1 && 'bg-emerald-200 dark:bg-emerald-900',
                                                                    level === 2 && 'bg-emerald-400 dark:bg-emerald-700',
                                                                    level === 3 && 'bg-emerald-500 dark:bg-emerald-500',
                                                                    level === 4 && 'bg-emerald-600 dark:bg-emerald-400',
                                                                    day.isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                                                                )}
                                                                style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="top"
                                                            className="text-xs font-medium"
                                                            sideOffset={5}
                                                        >
                                                            <p>{getContributionText(count)}</p>
                                                            <p className="text-muted-foreground font-normal">
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
                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                <a 
                                    href="#" 
                                    className="hover:text-foreground transition-colors"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    Learn how we count contributions
                                </a>
                                <div className="flex items-center gap-1.5">
                                    <span>Less</span>
                                    <div className="flex gap-[2px]">
                                        {[0, 1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={cn(
                                                    'rounded-sm',
                                                    level === 0 && 'bg-muted/50 dark:bg-muted/30',
                                                    level === 1 && 'bg-emerald-200 dark:bg-emerald-900',
                                                    level === 2 && 'bg-emerald-400 dark:bg-emerald-700',
                                                    level === 3 && 'bg-emerald-500 dark:bg-emerald-500',
                                                    level === 4 && 'bg-emerald-600 dark:bg-emerald-400'
                                                )}
                                                style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                                            />
                                        ))}
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </TooltipProvider>
                </div>

                {/* Mobile Stats */}
                <div className="flex sm:hidden items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-emerald-500" />
                        <span>{stats.activeDays} active days</span>
                    </div>
                    {stats.maxStreak > 1 && (
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span>{stats.maxStreak} day streak</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// =============================================
// Compact Month View Calendar
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
            <Card>
                <CardContent className="p-4">
                    <div className="h-[220px] animate-pulse rounded bg-muted" />
                </CardContent>
            </Card>
        );
    }

    const todayStr = today.toISOString().split('T')[0];

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">
                            {MONTHS[month]} {year}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {monthStats} contributions
                        </p>
                    </div>
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
            </CardHeader>
            <CardContent className="pt-0">
                <TooltipProvider delayDuration={0}>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div
                                key={i}
                                className="text-center text-xs font-medium text-muted-foreground py-1"
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
                                                'aspect-square flex items-center justify-center rounded-md text-xs font-medium cursor-pointer transition-all',
                                                'hover:ring-2 hover:ring-foreground/20',
                                                level === 0 && 'bg-muted/40 text-muted-foreground hover:bg-muted/60',
                                                level === 1 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
                                                level === 2 && 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/70 dark:text-emerald-200',
                                                level === 3 && 'bg-emerald-400 text-white dark:bg-emerald-600',
                                                level === 4 && 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950',
                                                isToday && 'ring-2 ring-primary'
                                            )}
                                        >
                                            {day.day}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-medium">{getContributionText(count)}</p>
                                        <p className="text-muted-foreground">
                                            {formatDateForDisplay(day.date)}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};
