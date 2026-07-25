import { describe, expect, it } from "vitest";
import {
    addDayCellRange,
    copyDayCells,
    getDayCellRanges,
    removeDayCellRange,
    replaceDayCellRange,
    type Cell
} from "./utils";

describe("mobile availability range helpers", () => {
    it("creates and merges single-hour, adjacent, and overlapping ranges", () => {
        let cells: Cell[] = [];

        cells = addDayCellRange(cells, 0, 9, 10);
        cells = addDayCellRange(cells, 0, 10, 12);
        cells = addDayCellRange(cells, 0, 8, 11);

        expect(getDayCellRanges(cells, 0)).toEqual([{ startRow: 8, endRow: 12 }]);
    });

    it("normalizes a reversed selection", () => {
        const cells = addDayCellRange([], 2, 15, 12);

        expect(getDayCellRanges(cells, 2)).toEqual([{ startRow: 12, endRow: 15 }]);
    });

    it("removes and replaces a range without touching another day", () => {
        const original = addDayCellRange(addDayCellRange([], 0, 9, 12), 1, 9, 12);
        const removed = removeDayCellRange(original, 0, 9, 12);
        const replaced = replaceDayCellRange(
            original,
            0,
            { startRow: 9, endRow: 12 },
            { startRow: 13, endRow: 15 }
        );

        expect(getDayCellRanges(removed, 0)).toEqual([]);
        expect(getDayCellRanges(removed, 1)).toEqual([{ startRow: 9, endRow: 12 }]);
        expect(getDayCellRanges(replaced, 0)).toEqual([{ startRow: 13, endRow: 15 }]);
        expect(getDayCellRanges(replaced, 1)).toEqual([{ startRow: 9, endRow: 12 }]);
    });

    it("copies a day by merging and de-duplicating target cells", () => {
        const source = addDayCellRange(addDayCellRange([], 0, 9, 12), 1, 11, 14);
        const copied = copyDayCells(source, 0, [1, 2]);

        expect(getDayCellRanges(copied, 1)).toEqual([{ startRow: 9, endRow: 14 }]);
        expect(getDayCellRanges(copied, 2)).toEqual([{ startRow: 9, endRow: 12 }]);
    });

    it("supports restoring the snapshot taken before a copy", () => {
        const beforeCopy = addDayCellRange([], 0, 9, 12);
        const snapshot = structuredClone(beforeCopy);
        const afterCopy = copyDayCells(beforeCopy, 0, [1, 2]);

        expect(afterCopy).not.toEqual(snapshot);
        expect(snapshot).toEqual([
            [0, 9],
            [0, 10],
            [0, 11]
        ]);
    });
});
