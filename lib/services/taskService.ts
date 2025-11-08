import axiosInstance from '@/lib/utils/axios';

export interface CreateTaskData {
  title: string;
  description: string;
  dueDate: Date | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new task
 * Ensures description is not empty before sending to backend
 */
export async function createTask(data: CreateTaskData): Promise<TaskResponse> {
  // Validate and sanitize data before sending
  const sanitizedData = {
    title: data.title.trim(),
    description: data.description.trim() || 'No description provided',
    dueDate: data.dueDate ? data.dueDate.toISOString() : new Date().toISOString(),
  };

  // Double-check description is not empty
  if (!sanitizedData.description || sanitizedData.description.length === 0) {
    throw new Error('Description is required and cannot be empty');
  }

  const response = await axiosInstance.post<TaskResponse>('/tasks', sanitizedData);

  return response.data;
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, data: Partial<CreateTaskData>): Promise<TaskResponse> {
  const sanitizedData: any = {};

  if (data.title) sanitizedData.title = data.title.trim();
  if (data.description !== undefined) {
    sanitizedData.description = data.description.trim() || 'No description provided';
    if (sanitizedData.description.length === 0) {
      throw new Error('Description is required and cannot be empty');
    }
  }
  if (data.dueDate) sanitizedData.dueDate = data.dueDate.toISOString();

  const response = await axiosInstance.put<TaskResponse>(`/tasks/${id}`, sanitizedData);

  return response.data;
}

/**
 * Get all tasks
 */
export async function getTasks(): Promise<TaskResponse[]> {
  const response = await axiosInstance.get<TaskResponse[]>('/tasks');

  return response.data;
}

/**
 * Get a single task by ID
 */
export async function getTaskById(id: string): Promise<TaskResponse> {
  const response = await axiosInstance.get<TaskResponse>(`/tasks/${id}`);

  return response.data;
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  await axiosInstance.delete(`/tasks/${id}`);
}
