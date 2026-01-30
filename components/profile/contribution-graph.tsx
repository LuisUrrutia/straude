'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/utils/format';

interface ContributionData {
  date: string;
  cost_usd: number;
}

interface ContributionGraphProps {
  data: ContributionData[];
  referenceDate?: string;
}

function getColor(cost: number): string {
  if (cost === 0) return 'bg-sand';
  if (cost <= 10) return 'bg-coral-light';
  if (cost <= 50) return 'bg-coral-medium';
  if (cost <= 100) return 'bg-coral';
  return 'bg-coral-dark';
}

const CELL_SIZE = 12;
const GAP = 4;
const WEEK_WIDTH = CELL_SIZE + GAP;

export function ContributionGraph({ data, referenceDate }: ContributionGraphProps) {
  const [hoveredCell, setHoveredCell] = useState<ContributionData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { grid, monthLabels } = useMemo(() => {
    const costMap = new Map(data.map((d) => [d.date, d.cost_usd]));
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const grid: Array<Array<{ date: string; cost: number }>> = [];

    // Start from 52 weeks ago, align to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 52 * 7);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Build grid oldest to newest (left to right in data)
    for (let week = 0; week < 53; week++) {
      const weekData: Array<{ date: string; cost: number }> = [];
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + week * 7 + day);
        const dateStr = cellDate.toISOString().split('T')[0];
        const cost = cellDate <= today ? costMap.get(dateStr) || 0 : -1;
        weekData.push({ date: dateStr, cost });
      }
      grid.push(weekData);
    }

    // Calculate month labels - only show when there's 4+ weeks spacing
    const monthLabels: Array<{ name: string; week: number }> = [];
    let lastLabelWeek = -5;

    for (let week = 0; week < grid.length; week++) {
      const firstDayOfWeek = new Date(grid[week][0].date);
      // Show label if it's the first week of a month and far enough from last label
      if (firstDayOfWeek.getDate() <= 7 && week - lastLabelWeek >= 4) {
        monthLabels.push({
          name: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
          week,
        });
        lastLabelWeek = week;
      }
    }

    return { grid, monthLabels };
  }, [data, referenceDate]);

  // Scroll to the right (today) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    cell: { date: string; cost: number }
  ) => {
    if (cell.cost >= 0) {
      setHoveredCell({ date: cell.date, cost_usd: cell.cost });
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="relative">
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2"
      >
        {/* Month labels - positioned relative to grid */}
        <div className="flex text-xs text-gray mb-2 ml-8" style={{ minWidth: `${grid.length * WEEK_WIDTH + 32}px` }}>
          {monthLabels.map((month, idx) => (
            <span
              key={idx}
              className="absolute"
              style={{ marginLeft: `${month.week * WEEK_WIDTH}px` }}
            >
              {month.name}
            </span>
          ))}
        </div>

        {/* Graph */}
        <div className="flex gap-1 mt-1" style={{ minWidth: `${grid.length * WEEK_WIDTH + 32}px` }}>
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-gray pr-1 flex-shrink-0 sticky left-0 bg-light z-10">
            <span className="h-3"></span>
            <span className="h-3 leading-3">Mon</span>
            <span className="h-3"></span>
            <span className="h-3 leading-3">Wed</span>
            <span className="h-3"></span>
            <span className="h-3 leading-3">Fri</span>
            <span className="h-3"></span>
          </div>

          {/* Cells */}
          {grid.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((cell, dayIdx) => (
                <div
                  key={dayIdx}
                  className={clsx(
                    'w-3 h-3 rounded-none transition-transform hover:scale-125 cursor-pointer',
                    cell.cost < 0 ? 'bg-transparent' : getColor(cell.cost)
                  )}
                  onMouseEnter={(e) => handleMouseEnter(e, cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray">
        <span>Less</span>
        <div className="w-3 h-3 rounded-none bg-sand" />
        <div className="w-3 h-3 rounded-none bg-coral-light" />
        <div className="w-3 h-3 rounded-none bg-coral-medium" />
        <div className="w-3 h-3 rounded-none bg-coral" />
        <div className="w-3 h-3 rounded-none bg-coral-dark" />
        <span>More</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 bg-dark text-light px-3 py-2 text-sm shadow-lg pointer-events-none border border-dark"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 40,
          }}
        >
          <div className="font-body">
            {new Date(hoveredCell.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="font-mono text-accent">
            {formatCurrency(hoveredCell.cost_usd)}
          </div>
        </div>
      )}
    </div>
  );
}
