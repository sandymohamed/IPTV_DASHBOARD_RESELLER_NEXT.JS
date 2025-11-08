'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import TaskForm from '@/components/TaskForm';
import NotificationPermission from '@/components/NotificationPermission';
import { createTask } from '@/lib/services/taskService';
import { registerAlarm, registerServiceWorker } from '@/lib/utils/notifications';

export default function TasksPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();
  }, []);

  const handleSubmit = async (data: { title: string; description: string; dueDate: Date | null }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Ensure description is not empty before sending
      if (!data.description || data.description.trim().length === 0) {
        throw new Error('Description is required and cannot be empty');
      }

      const task = await createTask(data);
      setSuccess(true);

      // Register alarm for background notification
      if (data.dueDate) {
        await registerAlarm({
          id: task.id || Date.now().toString(),
          title: data.title,
          description: data.description,
          dueDate: data.dueDate.toISOString(),
        });
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        setSuccess(false);
        // Optionally reload the page or reset form
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create task. Please try again.');
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
