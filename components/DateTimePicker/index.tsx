'use client';

import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isPast } from 'date-fns';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  helperText?: string;
  minDateTime?: Date;
  disablePast?: boolean;
  defaultValue?: Date;
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  minDateTime,
  disablePast = false,
  defaultValue,
}: DateTimePickerProps) {
  const handleChange = (newValue: Date | null) => {
    if (!newValue) {
      onChange(null);
      return;
    }

    // If date is today and no time is set, default to current time instead of 12:00 AM
    const now = new Date();
    const selectedDate = new Date(newValue);
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Check if the time is exactly midnight (12:00 AM) and it's today
    if (isToday && selectedDate.getHours() === 0 && selectedDate.getMinutes() === 0) {
      // Set to current time instead
      selectedDate.setHours(now.getHours());
      selectedDate.setMinutes(now.getMinutes());
      selectedDate.setSeconds(now.getSeconds());
    }

    // Validate: Don't allow past times if disablePast is true
    if (disablePast && isPast(selectedDate)) {
      // If it's in the past, set to current time
      onChange(new Date());
      return;
    }

    onChange(selectedDate);
  };

  // Determine the minimum datetime
  const getMinDateTime = () => {
    if (minDateTime) return minDateTime;
    if (disablePast) {
      // Set minimum to current time, not start of day
      return new Date();
    }
    return undefined;
  };

  // Set default value - if it's today and no time set, use current time
  const getDefaultValue = () => {
    if (defaultValue) {
      const defaultDate = new Date(defaultValue);
      const now = new Date();
      const isToday = defaultDate.toDateString() === now.toDateString();
      
      // If it's today and time is midnight, set to current time
      if (isToday && defaultDate.getHours() === 0 && defaultDate.getMinutes() === 0) {
        defaultDate.setHours(now.getHours());
        defaultDate.setMinutes(now.getMinutes());
        defaultDate.setSeconds(now.getSeconds());
      }
      return defaultDate;
    }
    return undefined;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDateTimePicker
        label={label}
        value={value}
        onChange={handleChange}
        minDateTime={getMinDateTime()}
        defaultValue={getDefaultValue()}
        slotProps={{
          textField: {
            fullWidth: true,
            error: error,
            helperText: helperText,
          },
        }}
      />
    </LocalizationProvider>
  );
}
