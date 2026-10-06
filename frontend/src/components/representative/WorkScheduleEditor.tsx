import { useState } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { minutesToTime, timeToMinutes } from "../../utils/talonAvailability";
import type { Weekday } from "../../types/api/common";
import type { DoctorWorkSchedule } from "../../types/api/doctor";

const DAYS: { key: Weekday; label: string }[] = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

// The backend rejects talons that start outside 07:00-20:00, so the slider
// stays inside that window.
const MIN_MINUTES = 7 * 60;
const MAX_MINUTES = 20 * 60;
const STEP_MINUTES = 15;
const MIN_DISTANCE_MINUTES = 30;

const DEFAULT_DAY = { start: "09:00", finish: "17:00" };

const MARKS = [7, 10, 13, 16, 20].map((hour) => ({
  value: hour * 60,
  label: minutesToTime(hour * 60),
}));

interface WorkScheduleEditorProps {
  value: DoctorWorkSchedule;
  onChange: (schedule: DoctorWorkSchedule) => void;
  disabled?: boolean;
}

function WorkScheduleEditor({
  value,
  onChange,
  disabled = false,
}: WorkScheduleEditorProps) {
  const [selectedDay, setSelectedDay] = useState<Weekday>("monday");

  const dayRange = value[selectedDay];

  const handleToggleDay = (works: boolean) => {
    const next: DoctorWorkSchedule = { ...value };

    if (works) {
      next[selectedDay] = { ...DEFAULT_DAY };
    } else {
      delete next[selectedDay];
    }

    onChange(next);
  };

  const handleRangeChange = (
    _event: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!dayRange || !Array.isArray(newValue)) return;

    const start = timeToMinutes(dayRange.start);
    const finish = timeToMinutes(dayRange.finish);

    let nextStart = start;
    let nextFinish = finish;

    // Keep the thumbs apart so start can never reach or pass finish.
    if (activeThumb === 0) {
      nextStart = Math.min(newValue[0], finish - MIN_DISTANCE_MINUTES);
    } else {
      nextFinish = Math.max(newValue[1], start + MIN_DISTANCE_MINUTES);
    }

    onChange({
      ...value,
      [selectedDay]: {
        start: minutesToTime(nextStart),
        finish: minutesToTime(nextFinish),
      },
    });
  };

  return (
    <Stack spacing={2}>
      <Tabs
        value={selectedDay}
        onChange={(_event, day: Weekday) => setSelectedDay(day)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {DAYS.map(({ key, label }) => (
          <Tab
            key={key}
            value={key}
            label={label}
            sx={{ fontWeight: value[key] ? 700 : 400 }}
          />
        ))}
      </Tabs>

      <FormControlLabel
        control={
          <Switch
            checked={dayRange !== undefined}
            onChange={(event) => handleToggleDay(event.target.checked)}
            disabled={disabled}
          />
        }
        label="Works this day"
      />

      {dayRange ? (
        <Stack spacing={1} sx={{ px: 2 }}>
          <Typography variant="h6">
            {dayRange.start} – {dayRange.finish}
          </Typography>

          <Slider
            value={[
              timeToMinutes(dayRange.start),
              timeToMinutes(dayRange.finish),
            ]}
            onChange={handleRangeChange}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            step={STEP_MINUTES}
            marks={MARKS}
            disableSwap
            disabled={disabled}
            valueLabelDisplay="auto"
            valueLabelFormat={minutesToTime}
            getAriaLabel={(index) =>
              index === 0 ? "Start time" : "Finish time"
            }
            getAriaValueText={minutesToTime}
          />
        </Stack>
      ) : (
        <Typography color="text.secondary">Day off.</Typography>
      )}
    </Stack>
  );
}

export default WorkScheduleEditor;
