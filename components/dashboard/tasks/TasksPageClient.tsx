'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import TaskForm from '@/components/TaskForm';
import NotificationPermission from '@/components/NotificationPermission';
import { createTask } from '@/lib/services/taskService';
import { registerAlarm, registerServiceWorker } from '@/lib/utils/notifications';

type TaskFormData = {
  title: string;
  description: string;
  dueDate: Date | null;
};

export default function TasksPageClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!data.description || data.description.trim().length === 0) {
        throw new Error('Description is required and cannot be empty');
      }

      const task = await createTask(data);
      setSuccess(true);

      if (data.dueDate) {
        await registerAlarm({
          id: task.id || Date.now().toString(),
          title: data.title,
          description: data.description,
          dueDate: data.dueDate.toISOString(),
        });
      }

      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create task. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Create Task
      </Typography>

      <Box sx={{ mb: 3 }}>
        <NotificationPermission />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Task created successfully! You will receive a notification at the scheduled time.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <TaskForm onSubmit={handleSubmit} />
    </Box>
  );
}

