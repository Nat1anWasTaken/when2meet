import { Time } from "@internationalized/date";
import { clsx, type ClassValue } from "clsx";
import { toast } from "svelte-sonner";
import { twMerge } from "tailwind-merge";

export const preservedEventNames = ["events", "about", "login"];

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Get the name of the day for a given date
 * TODO: i18n
 * @param date The date to get the day name for.
 * @returns The name of the day.
 */
export function getDayString(date: Date): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
}

/**
 * List time intervals within a day.
 * @param intervalInMinutes The interval in minutes.
 * @returns An array of Time objects representing the intervals.
 */
export function listTimesByInterval(intervalInMinutes: number): Time[] {
    if (intervalInMinutes <= 0 || intervalInMinutes > 1440) {
        throw new Error("Interval must be between 1 and 1440 minutes.");
    }

    const timeList: Time[] = [];

    for (let totalMinutes = 0; totalMinutes < 1440; totalMinutes += intervalInMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        timeList.push(new Time(hours, minutes));
    }

    return timeList;
}

/**
 * Generates a list of time strings within a day.
 * @param intervalInMinutes The interval in minutes.
 * @param use24h Whether to use 24-hour format.
 * @returns An array of time strings.
 */
export function generateTimeStrings(intervalInMinutes: number, use24h: boolean = false): string[] {
    if (intervalInMinutes <= 0 || intervalInMinutes > 1440) {
        throw new Error("Interval must be between 1 and 1440 minutes.");
    }

    const times: string[] = [];

    for (let totalMinutes = 0; totalMinutes < 1440; totalMinutes += intervalInMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (use24h) {
            const hh = String(hours).padStart(2, "0");
            const mm = String(minutes).padStart(2, "0");
            times.push(`${hh}:${mm}`);
        } else {
            const period = hours < 12 ? "AM" : "PM";
            const hour12 = hours % 12 === 0 ? 12 : hours % 12;
            const mm = String(minutes).padStart(2, "0");
            times.push(`${hour12}:${mm} ${period}`);
        }
    }

    return times;
}

export type Cell = [number, number];

export type AvailabilityColorMap = Map<number, string>;

/**
 * Get the cells in a rectangular area.
 * @param from The starting cell.
 * @param to The ending cell.
 * @returns An array of cells in the rectangular area.
 */
export function rectCellsArray(from: Cell, to: Cell): Cell[] {
    const minX = Math.min(from[0], to[0]);
    const maxX = Math.max(from[0], to[0]);
    const minY = Math.min(from[1], to[1]);
    const maxY = Math.max(from[1], to[1]);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const total = width * height;

    const out = new Array<[number, number]>(total);
    let i = 0;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            out[i++] = [x, y];
        }
    }
    return out;
}

/**
 * Formats a time object into a string.
 * @param time The time object to format.
 * @returns The formatted time string.
 */
export function formatTime(time: Time): string {
    return `${time.hour}:${time.minute.toString().padStart(2, "0")}`;
}

/**
 * Parses a time string in the format "HH:mm" or "H:mm" into a Time object.
 * @param timeString The time string to parse.
 * @returns The parsed Time object or null if the format is invalid.
 */
export function parseTime(timeString: string): Time | null {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return new Time(hours, minutes);
}

/**
 * Get the number of days between two dates.
 * @param date1 The first date.
 * @param date2 The second date.
 * @returns The number of days between the two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round(Math.abs(date2.getTime() - date1.getTime()) / msPerDay);
}

/**
 * Convert grid cells to time selections with actual dates.
 * @param cells The array of cell coordinates.
 * @param days The array of dates corresponding to columns.
 * @param intervalInMinutes The time interval per cell row.
 * @returns An array of time selection objects.
 */
export function cellsToTimeSelections(
    cells: Cell[],
    days: Date[],
    intervalInMinutes: number
): { startTime: Date; endTime: Date }[] {
    const timeSelections: { startTime: Date; endTime: Date }[] = [];

    for (const [x, y] of cells) {
        const dayDate = new Date(days[x]);
        const minutesFromMidnight = y * intervalInMinutes;
        const startTime = new Date(dayDate);
        startTime.setHours(0, minutesFromMidnight, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + intervalInMinutes);

        timeSelections.push({ startTime, endTime });
    }

    return timeSelections;
}

export function generateDaysArray(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = structuredClone(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

export function timeSelectionsToCells(
    timeSelections: { startTime: Date; endTime: Date }[],
    days: Date[],
    intervalInMinutes: number
): Cell[] {
    const cells: Cell[] = [];

    for (const selection of timeSelections) {
        const startTime = new Date(selection.startTime);
        const endTime = new Date(selection.endTime);

        // Find which day this selection belongs to
        const dayIndex = days.findIndex(
            (day) =>
                day.getFullYear() === startTime.getFullYear() &&
                day.getMonth() === startTime.getMonth() &&
                day.getDate() === startTime.getDate()
        );

        if (dayIndex === -1) continue;

        // Calculate start and end cell indices
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        let endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

        if (endTime.getTime() > startTime.getTime() && endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        const startY = Math.floor(startMinutes / intervalInMinutes);
        const endY = Math.floor(endMinutes / intervalInMinutes);

        // Add all cells in this time range
        for (let y = startY; y < endY; y++) {
            cells.push([dayIndex, y]);
        }
    }

    return cells;
}

/**
 * Generate an availability color map for participant visualization.
 * @param totalParticipants The total number of participants.
 * @param primaryHue The hue value from the primary color (optional, defaults to 277).
 * @returns A color map for each participant count level (0 to totalParticipants).
 */
export function generateAvailabilityColorMap(
    totalParticipants: number,
    primaryHue: number = 277,
    mode: "light" | "dark" = "light"
): AvailabilityColorMap {
    const colorMap = new Map<number, string>();

    // Base color (no participants)
    colorMap.set(0, "oklch(var(--accent))");

    if (totalParticipants > 0) {
        // Generate colors for each participant count using OKLCH
        for (let count = 1; count <= totalParticipants; count++) {
            const ratio = count / totalParticipants;

            if (mode === "dark") {
                const lightness = Math.min(0.9, 0.35 + ratio * 0.55); // 0.35 to 0.9
                const chroma = Math.min(0.18, 0.08 + ratio * 0.08); // 0.08 to 0.16
                colorMap.set(count, `oklch(${lightness} ${chroma} ${primaryHue})`);
                continue;
            }

            const lightness = Math.max(0.3, 0.9 - ratio * 0.5); // 0.9 to 0.4
            const chroma = Math.min(0.18, 0.06 + ratio * 0.12); // 0.06 to 0.18
            colorMap.set(count, `oklch(${lightness} ${chroma} ${primaryHue})`);
        }
    }

    return colorMap;
}

/**
 * Extract the hue value from a CSS OKLCH color string.
 * This should be called client-side only.
 * @param element The element to get computed styles from (defaults to document.documentElement).
 * @param cssVariable The CSS variable name (defaults to '--primary').
 * @returns The hue value or null if not available.
 */
export function extractPrimaryHue(
    element?: Element,
    cssVariable: string = "--primary"
): number | null {
    if (typeof window === "undefined") return null;

    const targetElement = element || document.documentElement;
    const primaryValue = getComputedStyle(targetElement).getPropertyValue(cssVariable).trim();

    // Parse OKLCH values: oklch(lightness chroma hue)
    const oklchMatch = primaryValue.match(/oklch\(([^)]+)\)/);

    if (oklchMatch) {
        const [, values] = oklchMatch;
        const parts = values.split(/\s+/);
        if (parts.length >= 3) {
            return parseFloat(parts[2]) || null;
        }
    }

    return null;
}

export async function copyText(textToCopy: string) {
    try {
        await navigator.clipboard.writeText(textToCopy);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        toast.error("Failed to copy", error);
    }
}
