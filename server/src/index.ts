import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SERVER_PORT } from '../../shared/constants.js';
import {
  CreateTaskInputSchema,
  SelectOptionInputSchema,
  ConfirmActionInputSchema,
  ClarifyTaskInputSchema,
  HandoffTaskInputSchema,
  AssistantMessageInputSchema,
} from '../../shared/schemas.js';
import { TaskManager } from './orchestrator/taskManager.js';
import { redactSensitiveText } from './policy/redaction.js';

dotenv.config();

export const app = express();
app.disable('x-powered-by');
const allowedWebOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedWebOrigins.has(origin)) {
    res.status(403).json({ error: 'This local app does not accept requests from this origin.' });
    return;
  }
  next();
});
app.use(
  cors({
    origin: [...allowedWebOrigins],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json({ limit: '32kb', strict: true }));

export const taskManager = new TaskManager();

const geminiRequestWindows = new Map<string, { startsAt: number; count: number }>();
const limitGeminiRequests = (req: Request, res: Response, next: express.NextFunction) => {
  if (!taskManager.getGeminiStatus().configured) {
    next();
    return;
  }
  const now = Date.now();
  const key = req.socket.remoteAddress || 'local';
  const current = geminiRequestWindows.get(key);
  const windowState =
    !current || now - current.startsAt >= 60_000 ? { startsAt: now, count: 0 } : current;
  if (windowState.count >= 30) {
    res
      .status(429)
      .json({ error: 'Too many AI requests in a short time. Wait a minute and try again.' });
    return;
  }
  windowState.count += 1;
  geminiRequestWindows.set(key, windowState);
  if (geminiRequestWindows.size > 64) {
    for (const [client, state] of geminiRequestWindows)
      if (now - state.startsAt >= 60_000) geminiRequestWindows.delete(client);
  }
  next();
};

// --- API ROUTES ---

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/providers', (_req: Request, res: Response) => {
  res.json(taskManager.getProviders());
});

app.get('/api/assistant/status', (_req: Request, res: Response) => {
  res.json(taskManager.getGeminiStatus());
});

app.post('/api/assistant/message', limitGeminiRequests, async (req: Request, res: Response) => {
  const parsed = AssistantMessageInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }
  if (!taskManager.getGeminiStatus().configured) {
    res.status(503).json({
      error: 'Gemini is not configured. Add GEMINI_API_KEY to the local server .env file.',
    });
    return;
  }
  try {
    const answer = await taskManager.answerAssistantMessage(parsed.data.message);
    res.json({ answer, model: taskManager.getGeminiStatus().model });
  } catch {
    res.status(502).json({
      error: 'Gemini could not answer right now. Try again shortly or use an example request.',
    });
  }
});

app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(taskManager.getAllTasks());
});

app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = taskManager.getTask(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

app.post('/api/tasks', limitGeminiRequests, async (req: Request, res: Response) => {
  const parsed = CreateTaskInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }

  try {
    const task = await taskManager.createTask(parsed.data.rawInput, parsed.data.inputMode, {
      providerId: parsed.data.providerId,
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/handoff', (req: Request, res: Response) => {
  const parsed = HandoffTaskInputSchema.safeParse({ taskId: req.params.id, ...req.body });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }
  try {
    const task = taskManager.recordOfficialHandoff(parsed.data.taskId, parsed.data.providerId);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/clarify', limitGeminiRequests, async (req: Request, res: Response) => {
  const parsed = ClarifyTaskInputSchema.safeParse({ taskId: req.params.id, ...req.body });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }
  try {
    const task = await taskManager.clarifyTask(parsed.data.taskId, parsed.data.answers);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/select', (req: Request, res: Response) => {
  const parsed = SelectOptionInputSchema.safeParse({ taskId: req.params.id, ...req.body });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }

  try {
    const task = taskManager.selectOption(req.params.id, parsed.data.selectedOptionId);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/confirm', async (req: Request, res: Response) => {
  const parsed = ConfirmActionInputSchema.safeParse({ taskId: req.params.id, ...req.body });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.format() });
    return;
  }

  try {
    const task = await taskManager.confirmAndExecute(req.params.id, parsed.data.confirmed);
    res.json(task);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: redactSensitiveText(String(err?.message || 'Task creation failed.')) });
  }
});

app.post('/api/tasks/:id/cancel', (req: Request, res: Response) => {
  try {
    const task = taskManager.cancelTask(req.params.id);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Start listening on loopback only (127.0.0.1) if run directly
const port = Number(process.env.PORT || SERVER_PORT);
const host = process.env.HOST || '127.0.0.1';
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`🚀 ActionDesk Server active on http://${host}:${port} (loopback only)`);
  });
}
