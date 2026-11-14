import { TaskState, ProviderDescriptor } from '../../../shared/types.js';

const API_BASE = '/api';

export interface AssistantStatus {
  configured: boolean;
  model: string;
}

export async function getAssistantStatus(): Promise<AssistantStatus> {
  const response = await fetch(`${API_BASE}/assistant/status`);
  if (!response.ok) throw new Error('Could not check the assistant connection.');
  return response.json();
}

export async function askAssistant(message: string): Promise<string> {
  const response = await fetch(`${API_BASE}/assistant/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The assistant could not answer right now.');
  return payload.answer;
}

export async function getProviders(): Promise<ProviderDescriptor[]> {
  const res = await fetch(`${API_BASE}/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function getTasks(): Promise<TaskState[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(
  rawInput: string,
  inputMode: 'text' | 'voice',
  options?: { providerId?: string },
): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawInput,
      inputMode,
      providerId: options?.providerId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create task');
  }
  return res.json();
}

export async function getTask(id: string): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error('Task not found');
  return res.json();
}

export async function clarifyTask(id: string, answers: Record<string, any>): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${id}/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit clarification');
  return res.json();
}

export async function recordHandoff(taskId: string, providerId?: string): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId }),
  });
  if (!res.ok) throw new Error('Failed to record provider handoff');
  return res.json();
}

export async function selectOption(taskId: string, selectedOptionId: string): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedOptionId }),
  });
  if (!res.ok) throw new Error('Failed to select option');
  return res.json();
}

export async function confirmAction(taskId: string, confirmed: boolean): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed }),
  });
  if (!res.ok) throw new Error('Failed to confirm action');
  return res.json();
}

export async function cancelTask(taskId: string): Promise<TaskState> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel task');
  return res.json();
}
