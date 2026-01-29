'use client';

import { useMemo, useState } from 'react';
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

export function ContributionGraph({ data, referenceDate }: ContributionGraphProps) {
  const [hoveredCell, setHoveredCell] = useState<ContributionData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { grid, months } = useMemo(() => {
    // Create a map of date -> cost
    const costMap = new Map(data.map((d) => [d.date, d.cost_usd]));

    // Generate 52 weeks of data
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const grid: Array<Array<{ date: string; cost: number }>> = [];
    const months: Array<{ name: string; week: number }> = [];

    // Start from 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 52 * 7);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentMonth = -1;

    for (let week = 0; week < 52; week++) {
      const weekData: Array<{ date: string; cost: number }> = [];

      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + week * 7 + day);
        const dateStr = cellDate.toISOString().split('T')[0];
        const cost = cellDate <= today ? costMap.get(dateStr) || 0 : -1; // -1 for future dates

        weekData.push({ date: dateStr, cost });

        // Track months
        if (day === 0 && cellDate.getMonth() !== currentMonth) {
          currentMonth = cellDate.getMonth();
          months.push({
            name: cellDate.toLocaleDateString('en-US', { month: 'short' }),
            week,
          });
        }
      }

      grid.push(weekData);
    }

    return { grid, months };
  }, [data, referenceDate]);

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
      {/* Month labels */}
      <div className="flex text-xs text-gray mb-1 pl-6">
        {months.map((month, idx) => (
          <span
            key={idx}
            className="absolute"
            style={{ left: `${month.week * 15 + 24}px` }}
          >
            {month.name}
          </span>
        ))}
      </div>

      {/* Graph */}
      <div className="flex gap-1 mt-4 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-gray pr-1">
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
                  'size-3 rounded-none transition-transform hover:scale-125 cursor-pointer',
                  cell.cost < 0 ? 'bg-transparent' : getColor(cell.cost)
                )}
                onMouseEnter={(e) => handleMouseEnter(e, cell)}
                onMouseLeave={() => setHoveredCell(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray">
        <span>Less</span>
        <div className="size-3 rounded-none bg-sand" />
        <div className="size-3 rounded-none bg-coral-light" />
        <div className="size-3 rounded-none bg-coral-medium" />
        <div className="size-3 rounded-none bg-coral" />
        <div className="size-3 rounded-none bg-coral-dark" />
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
