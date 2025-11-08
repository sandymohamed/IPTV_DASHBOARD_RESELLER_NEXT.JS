'use client';

import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Box, Button, TextField, Stack, Card, CardContent, Typography } from '@mui/material';
import DateTimePicker from '../DateTimePicker';
import { validateNotPastDateTime, normalizeDateTimeForToday } from '@/lib/utils/validation';

const taskSchema = yup.object().shape({
  title: yup.string().required('Task title is required'),
  description: yup
    .string()
    .required('Description is required')
    .min(1, 'Description cannot be empty')
    .trim()
    .test('not-empty', 'Description cannot be empty', (value) => {
      return value !== undefined && value !== null && value.trim().length > 0;
    }),
  dueDate: yup
    .date()
    .nullable()
    .required('Due date is required')
    .test('not-past', 'You can\'t add tasks to a time in the past!', (value) => {
      if (!value) return true; // Let required handle empty
      return validateNotPastDateTime(value) === undefined;
    }),
});

interface TaskFormData {
  title: string;
  description: string;
  dueDate: Date | null;
}

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  defaultValues?: Partial<TaskFormData>;
}

export default function TaskForm({ onSubmit, defaultValues }: TaskFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      dueDate: defaultValues?.dueDate
        ? normalizeDateTimeForToday(defaultValues.dueDate)
        : normalizeDateTimeForToday(new Date()), // Default to current time, not midnight
    },
  });

  const onFormSubmit = (data: TaskFormData) => {
    // Ensure date is normalized before submission
    // Ensure description is trimmed and not empty
    const normalizedData = {
      ...data,
      description: data.description.trim() || 'No description provided', // Fallback if somehow empty
      dueDate: normalizeDateTimeForToday(data.dueDate),
    };
    onSubmit(normalizedData);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Create Task
        </Typography>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Task Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  required
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message || 'Description is required'}
                />
              )}
            />

            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  label="Due Date & Time"
                  value={field.value}
                  onChange={(date) => {
                    field.onChange(date);
                    // Validate on change
                    const error = validateNotPastDateTime(date);
                    if (error && date) {
                      // If validation fails, set to current time
                      field.onChange(normalizeDateTimeForToday(new Date()));
                    }
                  }}
                  error={!!errors.dueDate}
                  helperText={errors.dueDate?.message || 'Select a date and time for this task'}
                  disablePast
                  defaultValue={normalizeDateTimeForToday(new Date())}
                />
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => setValue('dueDate', null)}>
                Clear
              </Button>
              <Button type="submit" variant="contained">
                Create Task
              </Button>
            </Box>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
