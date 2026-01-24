"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as React from "react";

export type HeatmapDatum = {
  date: string | Date;
  value: number;
  meta?: unknown;
};

export type HeatmapCell = {
  date: Date;
  key: string;
  value: number;
  level: number;
  label: string;
  disabled: boolean;
  meta?: unknown;
};

export type LegendConfig = {
  show?: boolean;
  /** Default: "Less" */
  lessText?: React.ReactNode;
  /** Default: "More" */
  moreText?: React.ReactNode;
  /** Default: true (shows the arrow) */
  showArrow?: boolean;
  /** Default: "right" */
  placement?: "right" | "bottom";
  /** Default: "row" */
  direction?: "row" | "column";
  /** Default: true */
  showText?: boolean;
  /** Default: uses cellSize */
  swatchSize?: number;
  /** Default: uses cellGap */
  swatchGap?: number;
  className?: string;
};

export type AxisLabelsConfig = {
  /** Default: true */
  show?: boolean;
  /** Show weekday labels on left. Default: true */
  showWeekdays?: boolean;
  /** Show month labels on top. Default: true */
  showMonths?: boolean;
  /**
   * Which weekday rows to label (0..6 in grid order top->bottom).
   * Default: [1,3,5] => Mon/Wed/Fri when weekStartsOn=1 (nice uncluttered)
   */
  weekdayIndices?: number[];
  /** Month label format. Default: "short" */
  monthFormat?: "short" | "long" | "numeric";
  /**
   * Minimum spacing in weeks between month labels to avoid crowding.
   * Default: 3
   */
  minWeekSpacing?: number;
  className?: string;
};

export type HeatmapCalendarProps = {
  title?: string;
  data: HeatmapDatum[];
  /** Number of days ending at endDate (default 365) */
  rangeDays?: number;
  endDate?: Date;
  weekStartsOn?: 0 | 1;

  /** Cell size in px (default 12) */
  cellSize?: number;
  /** Gap between cells in px (default 3) */
  cellGap?: number;

  /** Called when a cell is clicked */
  onCellClick?: (cell: HeatmapCell) => void;

  /** Tailwind class names for levels 0..N (used when palette is not provided) */
  levelClassNames?: string[];

  /**
   * Direct color palette for levels 0..N (e.g. ["#eee", "#bbf7d0", ...] or "hsl(var(--primary) / 0.35)").
   * If provided, it overrides levelClassNames for cell and legend coloring.
   */
  palette?: string[];

  /** Configure legend, or set to false to hide */
  legend?: boolean | LegendConfig;

  /** Add axis labels (weekday + month) */
  axisLabels?: boolean | AxisLabelsConfig;

  /** Full custom legend render (overrides legend config UI) */
  renderLegend?: (args: {
    levelCount: number;
    levelClassNames: string[];
    palette?: string[];
    cellSize: number;
    cellGap: number;
  }) => React.ReactNode;

  /** Tooltip content override */
  renderTooltip?: (cell: HeatmapCell) => React.ReactNode;

  className?: string;
};

/* ---------------- utilities ---------------- */

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toKey(d: Date) {
  // Using UTC ISO date key keeps things stable for demos.
  // If you want strict local timezone day mapping, swap this to local YYYY-MM-DD generation.
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date, weekStartsOn: 0 | 1) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

/** Default GitHub-ish buckets. */
function getLevel(value: number) {
  if (value <= 0) return 0;
  if (value <= 2) return 1;
  if (value <= 5) return 2;
  if (value <= 10) return 3;
  return 4;
}

function clampLevel(level: number, levelCount: number) {
  return Math.max(0, Math.min(levelCount - 1, level));
}

function bgStyleForLevel(level: number, palette?: string[]) {
  if (!palette?.length) return undefined;
  const idx = clampLevel(level, palette.length);
  return { backgroundColor: palette[idx] };
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonth(d: Date, fmt: "short" | "long" | "numeric") {
  if (fmt === "numeric") {
    const yy = String(d.getFullYear()).slice(-2);
    return `${d.getMonth() + 1}/${yy}`;
  }
  return d.toLocaleDateString(undefined, { month: fmt });
}

function weekdayLabelForIndex(index: number, weekStartsOn: 0 | 1) {
  // index is 0..6 in grid row order (top->bottom).
  // actual weekday = weekStartsOn + index
  const actualDay = (weekStartsOn + index) % 7;
  // stable reference week (UTC)
  const base = new Date(Date.UTC(2024, 0, 7 + actualDay));
  return base.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
}

/* ---------------- component ---------------- */

export function HeatmapCalendar({
  title = "Activity",
  data,
  rangeDays = 365,
  endDate = new Date(),
  weekStartsOn = 1,
  cellSize = 12,
  cellGap = 3,
  onCellClick,
  levelClassNames,
  palette,
  legend = true,
  axisLabels = true,
  renderLegend,
  renderTooltip,
  className,
}: HeatmapCalendarProps) {
  // Default classes are semantic => good in light/dark
  const levels = levelClassNames ?? [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/35",
    "bg-primary/55",
    "bg-primary/75",
  ];

  const levelCount = palette?.length ? palette.length : levels.length;

  const legendCfg: LegendConfig =
    legend === true ? {} : legend === false ? { show: false } : legend;

  const axisCfg: AxisLabelsConfig =
    axisLabels === true ? {} : axisLabels === false ? { show: false } : axisLabels;

  const showAxis = axisCfg.show ?? true;
  const showWeekdays = axisCfg.showWeekdays ?? true;
  const showMonths = axisCfg.showMonths ?? true;
  const weekdayIndices = axisCfg.weekdayIndices ?? [1, 3, 5];
  const monthFormat = axisCfg.monthFormat ?? "short";
  const minWeekSpacing = axisCfg.minWeekSpacing ?? 3;

  const end = startOfDay(endDate);
  const start = addDays(end, -(rangeDays - 1));

  const valueMap = React.useMemo(() => {
    const map = new Map<string, { value: number; meta?: unknown }>();
    for (const item of data) {
      const d = typeof item.date === "string" ? new Date(item.date) : item.date;
      const key = toKey(d);

      const prev = map.get(key);
      const nextVal = (prev?.value ?? 0) + (item.value ?? 0); // sum merge
      map.set(key, { value: nextVal, meta: item.meta ?? prev?.meta });
    }
    return map;
  }, [data]);

  const firstWeek = startOfWeek(start, weekStartsOn);
  const totalDays = Math.ceil((end.getTime() - firstWeek.getTime()) / 86400000) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const columns = React.useMemo(() => {
    const cells: HeatmapCell[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = addDays(firstWeek, w * 7 + d);
        const inRange = date >= start && date <= end;
        const key = toKey(date);

        const v = inRange ? (valueMap.get(key)?.value ?? 0) : 0;
        const meta = inRange ? valueMap.get(key)?.meta : undefined;
        const lvl = inRange ? getLevel(v) : 0;

        cells.push({
          date,
          key,
          value: v,
          level: clampLevel(lvl, levelCount),
          disabled: !inRange,
          meta,
          label: date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        });
      }
    }

    const cols: HeatmapCell[][] = [];
    for (let i = 0; i < weeks; i++) {
      cols.push(cells.slice(i * 7, i * 7 + 7));
    }
    return cols;
  }, [weeks, firstWeek, start, end, valueMap, levelCount]);

  const monthLabels = React.useMemo(() => {
    if (!showAxis || !showMonths) return [] as { colIndex: number; text: string }[];

    const labels: { colIndex: number; text: string }[] = [];
    let lastLabeledWeek = -999;

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const firstInCol = col.find((c) => !c.disabled)?.date ?? col[0].date;

      const prevCol = i > 0 ? columns[i - 1] : null;
      const prevFirst = prevCol?.find((c) => !c.disabled)?.date ?? prevCol?.[0]?.date;

      const monthChanged = !prevFirst || !sameMonth(firstInCol, prevFirst);

      // Always show first month, then respect minWeekSpacing for others
      if (monthChanged && (labels.length === 0 || i - lastLabeledWeek >= minWeekSpacing)) {
        labels.push({ colIndex: i, text: formatMonth(firstInCol, monthFormat) });
        lastLabeledWeek = i;
      }
    }

    return labels;
  }, [columns, showAxis, showMonths, monthFormat, minWeekSpacing]);

  /* ---------------- legend ---------------- */

  const showLegend = legendCfg.show ?? true;
  const placement = legendCfg.placement ?? "right";
  const direction = legendCfg.direction ?? "row";
  const showText = legendCfg.showText ?? true;
  const showArrow = legendCfg.showArrow ?? true;
  const lessText = legendCfg.lessText ?? "Less";
  const moreText = legendCfg.moreText ?? "More";
  const swatchSize = legendCfg.swatchSize ?? cellSize;
  const swatchGap = legendCfg.swatchGap ?? cellGap;

  const LegendUI = renderLegend ? (
    renderLegend({
      levelCount,
      levelClassNames: levels,
      palette,
      cellSize,
      cellGap,
    })
  ) : !showLegend ? null : (
    <div className={cn("min-w-35", legendCfg.className)}>
      {showText ? (
        <div className="mb-2 text-xs text-muted-foreground">
          {lessText} {showArrow ? <span aria-hidden>→</span> : null} {moreText}
        </div>
      ) : null}

      <div
        className={cn("flex items-center", direction === "row" ? "flex-row" : "flex-col")}
        style={{ gap: `${swatchGap}px` }}
      >
        {Array.from({ length: levelCount }).map((_, i) => {
          const cls = levels[clampLevel(i, levels.length)];
          return (
            <div
              key={i}
              className={cn("rounded-[3px]", !palette?.length && cls)}
              style={{
                width: swatchSize,
                height: swatchSize,
                ...(bgStyleForLevel(i, palette) ?? {}),
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );

  /* ---------------- tooltip ---------------- */

  const tooltipNode = (cell: HeatmapCell) => {
    if (renderTooltip) return renderTooltip(cell);
    if (cell.disabled) return "Outside range";
    const unit = cell.value === 1 ? "event" : "events";
    return (
      <div className="text-sm">
        <div className="font-medium">
          {cell.value} {unit}
        </div>
        <div className="text-muted-foreground">{cell.label}</div>
      </div>
    );
  };

  const weekdayLabelWidth = showAxis && showWeekdays ? 48 : 0;
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const columnsCount = columns.length || 1;

    const setSizes = () => {
      // Get the actual container width
      const containerWidth = el.clientWidth;
      
      // Account for weekday label width if shown
      const labelWidth = showAxis && showWeekdays ? weekdayLabelWidth : 0;
      const availableWidth = containerWidth - labelWidth;
      
      // Calculate optimal gap based on container size
      const gap = Math.max(2, Math.min(4, Math.floor(availableWidth / (columnsCount * 15))));
      const totalGapWidth = (columnsCount - 1) * gap;
      const calculated = (availableWidth - totalGapWidth) / columnsCount;
      
      // Set minimum cell size for readability - will trigger horizontal scroll if needed
      const minCell = 10; // Don't shrink below this for readability
      const maxCell = 20;
      const cell = Math.max(minCell, Math.min(maxCell, Math.floor(calculated)));
      
      el.style.setProperty("--cell-size", `${cell}px`);
      el.style.setProperty("--cell-gap", `${gap}px`);
    };

    setSizes();
    const ro = new ResizeObserver(() => setSizes());
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [columns.length, cellGap, weekdayLabelWidth, showAxis, showWeekdays]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="w-full">
        <TooltipProvider delayDuration={80}>
          <div className={cn("flex gap-4", placement === "bottom" && "flex-col")}>
            {/* Labeled calendar area */}
              <div
                ref={containerRef}
                className={cn("w-full overflow-x-auto", axisCfg.className)}
                style={{
                  "--cell-size": `${cellSize}px`,
                  "--cell-gap": `${cellGap}px`,
                } as React.CSSProperties}
              >
              {/* Month labels row */}
              {showAxis && showMonths ? (
                <div className="flex items-end" style={{ paddingLeft: weekdayLabelWidth }}>
                    <div
                      className="relative"
                      style={{
                        height: 18,
                        width: `calc(${columns.length} * (var(--cell-size) + var(--cell-gap)) - var(--cell-gap))`,
                      }}
                    >
                    {monthLabels.map((m) => (
                      <div
                        key={m.colIndex}
                        className="absolute text-muted-foreground whitespace-nowrap"
                        style={{
                          left: `calc(${m.colIndex} * (var(--cell-size) + var(--cell-gap)))`,
                          top: 0,
                          fontSize: `clamp(9px, calc(var(--cell-size) * 0.85), 12px)`,
                        }}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

                  <div className="flex" style={{ minWidth: "max-content" }}>
                {/* Weekday labels column */}
                  {showAxis && showWeekdays ? (
                  <div
                    className="mr-2 flex flex-col flex-shrink-0"
                    style={{ gap: "var(--cell-gap)" }}
                    aria-hidden="true"
                  >
                    {Array.from({ length: 7 }).map((_, rowIdx) => (
                      <div
                        key={rowIdx}
                        className="flex items-center justify-end text-xs text-muted-foreground"
                        style={{ width: 42, height: "var(--cell-size)" }}
                      >
                        {weekdayIndices.includes(rowIdx)
                          ? weekdayLabelForIndex(rowIdx, weekStartsOn)
                          : ""}
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Heatmap grid */}
                <div className="flex flex-shrink-0 " style={{ gap: "var(--cell-gap)" }} role="grid" aria-label="Heatmap calendar">
                  {columns.map((col, i) => (
                    <div
                      key={i}
                      className="flex flex-col"
                      style={{ gap: "var(--cell-gap)" }}
                      role="rowgroup"
                    >
                      {col.map((cell) => {
                        const cls = levels[clampLevel(cell.level, levels.length)];
                        return (
                          <Tooltip key={`${cell.key}-${i}`}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled={cell.disabled}
                                onClick={() => !cell.disabled && onCellClick?.(cell)}
                                className={cn(
                                  "rounded-[3px] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                  // If palette is provided we rely on inline styles for color; only add opacity for non-palette mode
                                  !palette?.length && cls,
                                  cell.disabled && (palette?.length ? "cursor-default pointer-events-none" : "cursor-default opacity-30 pointer-events-none"),
                                )}
                                style={{
                                  width: "var(--cell-size)",
                                  height: "var(--cell-size)",
                                  ...(bgStyleForLevel(cell.level, palette) ?? {}),
                                }}
                                aria-label={
                                  cell.disabled ? "Outside range" : `${cell.label}: ${cell.value}`
                                }
                                role="gridcell"
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">{tooltipNode(cell)}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            {LegendUI}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}