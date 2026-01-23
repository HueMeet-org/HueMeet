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
    return (
        <HeatmapCalendar
            title="Activity"
            data={data}
            weekStartsOn={1}
            legend={{ placement: "bottom" }}
            axisLabels={{
                showMonths: true,
                showWeekdays: true,
                weekdayIndices: [0, 1, 2, 3, 4, 5, 6], // show all weekday labels
                monthFormat: "short",
                minWeekSpacing: 3,
            }}
        />
    )
}
