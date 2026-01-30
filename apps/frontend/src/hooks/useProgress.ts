'use client';
// =============================================
// useContentProgress - Hook for tracking content reading progress
// Handles scroll tracking, time tracking, and automatic progress updates
// =============================================

import { useCallback, useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    getContentProgress,
    updateContentProgress,
} from '@/server/actions/progress/progressActions';

// =============================================
// Types
// =============================================

interface IUseContentProgressOptions {
    contentId: string;
    enabled?: boolean;
    debounceMs?: number;
    onComplete?: () => void;
}

interface IUseContentProgressReturn {
    progress: number;
    timeSpent: number;
    isCompleted: boolean;
    isLoading: boolean;
    isSaving: boolean;
    startTracking: () => void;
    stopTracking: () => void;
    updateProgress: (progress: number, position?: number) => void;
    markComplete: () => void;
}

// =============================================
// Custom Hook: useContentProgress
// =============================================

export const useContentProgress = ({
    contentId,
    enabled = true,
    debounceMs = 5000,
    onComplete,
}: IUseContentProgressOptions): IUseContentProgressReturn => {
    const queryClient = useQueryClient();

    // State
    const [localProgress, setLocalProgress] = useState(0);
    const [localTimeSpent, setLocalTimeSpent] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    // Refs for tracking
    const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedProgressRef = useRef(0);
    const sessionTimeRef = useRef(0);

    // Fetch existing progress
    const { data: progressData, isLoading } = useQuery({
        queryKey: ['content-progress', contentId],
        queryFn: () => getContentProgress(contentId),
        enabled: enabled && !!contentId,
        staleTime: 60000,
    });

    // Update progress mutation
    const saveMutation = useMutation({
        mutationFn: (data: { progress: number; lastPosition?: number; timeSpent?: number }) =>
            updateContentProgress(contentId, data),
        onSuccess: (result) => {
            if (result.success && result.data) {
                lastSavedProgressRef.current = result.data.progress;
                sessionTimeRef.current = 0; // Reset session time after save

                // Check for completion
                if (result.data.progress >= 100 && !isCompleted) {
                    setIsCompleted(true);
                    onComplete?.();
                }

                // Invalidate queries
                void queryClient.invalidateQueries({ queryKey: ['user-stats'] });
                void queryClient.invalidateQueries({ queryKey: ['user-yearly-activity'] });
            }
        },
    });

    // Initialize from server data
    useEffect(() => {
        if (progressData?.success && progressData.data) {
            setLocalProgress(progressData.data.progress);
            setLocalTimeSpent(progressData.data.timeSpent);
            setIsCompleted(progressData.data.completedAt !== null);
            lastSavedProgressRef.current = progressData.data.progress;
        }
    }, [progressData]);

    // Time tracking
    useEffect(() => {
        if (isTracking) {
            timeIntervalRef.current = setInterval(() => {
                setLocalTimeSpent((prev) => prev + 1);
                sessionTimeRef.current += 1;
            }, 1000);
        } else if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
            timeIntervalRef.current = null;
        }

        return () => {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, [isTracking]);

    // Debounced save
    const debouncedSave = useCallback(
        (progress: number, position?: number) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                // Only save if progress changed significantly or time accumulated
                const progressDiff = progress - lastSavedProgressRef.current;
                if (progressDiff >= 5 || sessionTimeRef.current >= 30) {
                    saveMutation.mutate({
                        progress,
                        lastPosition: position,
                        timeSpent: sessionTimeRef.current,
                    });
                }
            }, debounceMs);
        },
        [debounceMs, saveMutation]
    );

    // Update progress
    const updateProgress = useCallback(
        (progress: number, position?: number) => {
            const clampedProgress = Math.min(100, Math.max(0, progress));
            setLocalProgress(clampedProgress);

            if (!isCompleted) {
                debouncedSave(clampedProgress, position);
            }
        },
        [isCompleted, debouncedSave]
    );

    // Mark as complete
    const markComplete = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveMutation.mutate({
            progress: 100,
            timeSpent: sessionTimeRef.current,
        });
    }, [saveMutation]);

    // Start/stop tracking
    const startTracking = useCallback(() => {
        setIsTracking(true);
    }, []);

    const stopTracking = useCallback(() => {
        setIsTracking(false);

        // Save on stop if there's unsaved progress
        if (sessionTimeRef.current > 0 || localProgress > lastSavedProgressRef.current) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveMutation.mutate({
                progress: localProgress,
                timeSpent: sessionTimeRef.current,
            });
        }
    }, [localProgress, saveMutation]);

    // Cleanup on unmount - save final progress
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, []);

    // Save on page visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && sessionTimeRef.current > 0) {
                saveMutation.mutate({
                    progress: localProgress,
                    timeSpent: sessionTimeRef.current,
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [localProgress, saveMutation]);

    return {
        progress: localProgress,
        timeSpent: localTimeSpent,
        isCompleted,
        isLoading,
        isSaving: saveMutation.isPending,
        startTracking,
        stopTracking,
        updateProgress,
        markComplete,
    };
};

// =============================================
// Custom Hook: useScrollProgress
// Tracks scroll position and calculates reading progress
// =============================================

interface IUseScrollProgressOptions {
    containerRef: React.RefObject<HTMLElement | null>;
    onProgressChange?: (progress: number, position: number) => void;
    throttleMs?: number;
}

export const useScrollProgress = ({
    containerRef,
    onProgressChange,
    throttleMs = 200,
}: IUseScrollProgressOptions) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const now = Date.now();
            if (now - lastUpdateRef.current < throttleMs) return;
            lastUpdateRef.current = now;

            const container = containerRef.current;
            if (!container) {
                // Use window scroll
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollTop = window.scrollY;
                const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

                setScrollProgress(progress);
                onProgressChange?.(progress, scrollTop);
            } else {
                const { scrollHeight, clientHeight, scrollTop } = container;
                const maxScroll = scrollHeight - clientHeight;
                const progress = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

                setScrollProgress(progress);
                onProgressChange?.(progress, scrollTop);
            }
        };

        const container = containerRef.current;
        const target = container ?? window;

        target.addEventListener('scroll', handleScroll, { passive: true });

        // Initial calculation
        handleScroll();

        return () => {
            target.removeEventListener('scroll', handleScroll);
        };
    }, [containerRef, onProgressChange, throttleMs]);

    return scrollProgress;
};

// =============================================
// Custom Hook: useReadingProgress
// Combined hook for complete reading progress tracking
// =============================================

interface IUseReadingProgressOptions {
    contentId: string;
    containerRef: React.RefObject<HTMLElement | null>;
    enabled?: boolean;
    onComplete?: () => void;
}

export const useReadingProgress = ({
    contentId,
    containerRef,
    enabled = true,
    onComplete,
}: IUseReadingProgressOptions) => {
    const {
        progress: savedProgress,
        timeSpent,
        isCompleted,
        isLoading,
        isSaving,
        startTracking,
        stopTracking,
        updateProgress,
        markComplete,
    } = useContentProgress({
        contentId,
        enabled,
        onComplete,
    });

    // Track scroll progress
    const scrollProgress = useScrollProgress({
        containerRef,
        onProgressChange: (progress, position) => {
            // Only update if scroll progress is higher than saved progress
            if (progress > savedProgress) {
                updateProgress(progress, position);
            }
        },
    });

    // Auto-start tracking when component mounts
    // Note: Using refs to avoid dependency issues with stopTracking
    const stopTrackingRef = useRef(stopTracking);
    stopTrackingRef.current = stopTracking;

    useEffect(() => {
        if (enabled) {
            startTracking();
            return () => {
                stopTrackingRef.current();
            };
        }
    }, [enabled, startTracking]);

    // Auto-complete at 90%and on the
    useEffect(() => {
        if (scrollProgress >= 90 && !isCompleted) {
            markComplete();
        }
    }, [scrollProgress, isCompleted, markComplete]);

    return {
        scrollProgress,
        savedProgress,
        displayProgress: Math.max(scrollProgress, savedProgress),
        timeSpent,
        isCompleted,
        isLoading,
        isSaving,
        startTracking,
        stopTracking,
    };
};

// =============================================
// Format time helper
// =============================================

export const formatReadingTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};
