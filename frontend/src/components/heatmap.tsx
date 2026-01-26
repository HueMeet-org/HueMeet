import { useMemo } from 'react'
import { HeatmapCalendar } from './heatmap-calendar'

function makeData(days = 365) {
    return Array.from({ length: days }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return {
            date: d.toISOString().slice(0, 10), // "YYYY-MM-DD"
            value: i % 7 === 0 ? 0 : i % 13,
        }
    })
}

export const HeatMap = () => {
    const data = useMemo(() => makeData(365), [])
    
    // Custom color palette matching the image - green gradient from light to dark
    const customPalette = [
        '#28322a',      // Level 0 - dark background
        '#0e4429',      // Level 1 - dark green
        '#006d32',      // Level 2 - medium-dark green
        '#26a641',      // Level 3 - medium green
        '#39d353',      // Level 4 - bright green
    ]
    
    return (
        <HeatmapCalendar
            title="Activity"
            data={data}
            weekStartsOn={1}
            palette={customPalette}
            cellSize={14}
            cellGap={3}
            legend={{ 
                placement: "bottom",
                showText: true,
                lessText: "Less",
                moreText: "More"
            }}
            axisLabels={{
                showMonths: true,
                showWeekdays: true,
                weekdayIndices: [1, 3, 5], // Mon, Wed, Fri
                monthFormat: "short",
                minWeekSpacing: 2,
            }}
            className="w-full"
        />
    )
}
