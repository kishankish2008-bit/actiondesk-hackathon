import { randomUUID } from 'crypto';
import { TaskState, ActionLogEvent, ProviderDescriptor } from '../../../shared/types.js';
import { ServerLlmParserAdapter } from '../parser/llmAdapter.js';
import { InfoAdapter } from '../adapters/infoAdapter.js';
import { ProviderRegistry, LiveSearchClient } from '../adapters/providerRegistry.js';
import { OfficialProductApis } from '../adapters/officialProductApis.js';
import { redactSensitiveText } from '../policy/redaction.js';

function redactLogValue(value: unknown, key = ''): unknown {
  if (
    /password|passwd|secret|token|cookie|authorization|card|cvv|otp|phone|email|address/i.test(key)
  ) {
    return '[REDACTED]';
  }
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map((item) => redactLogValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        redactLogValue(childValue, childKey),
      ]),
    );
  }
  return value;
}

export interface CreateTaskOptions {
  providerId?: string;
}

export class TaskManager {
  private tasks = new Map<string, TaskState>();
  private llmParser = new ServerLlmParserAdapter();
  private infoAdapter = new InfoAdapter();
  private providerRegistry: ProviderRegistry;
  constructor(providerRegistry?: ProviderRegistry, liveClient?: LiveSearchClient) {
    const productApis = liveClient || new OfficialProductApis(process.env);
    this.providerRegistry = providerRegistry || new ProviderRegistry(process.env, productApis);
  }

  getProviders(): ProviderDescriptor[] {
    return this.providerRegistry.getProviders();
  }

  getGeminiStatus() {
    return this.llmParser.getStatus();
  }

  async answerAssistantMessage(message: string): Promise<string> {
    return this.llmParser.answerHelper(message);
  }

  getTask(id: string): TaskState | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): TaskState[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  private addLog(
    task: TaskState,
    type: ActionLogEvent['type'],
    message: string,
    level: ActionLogEvent['level'] = 'info',
    metadata?: Record<string, unknown>,
  ): void {
    const event: ActionLogEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message: redactSensitiveText(message),
      level,
      metadata: metadata ? (redactLogValue(metadata) as Record<string, unknown>) : undefined,
    };
    task.actionLog.push(event);
  }

  async createTask(
    rawInput: string,
    inputMode: 'text' | 'voice' = 'text',
    options?: CreateTaskOptions,
  ): Promise<TaskState> {
    const id = randomUUID();
    const now = new Date().toISOString();
    // Only official live API search or official-site handoff is reachable from the application.

    const task: TaskState = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'received',
      rawInput: redactSensitiveText(rawInput),
      inputMode,
      plan: [],
      currentStepIndex: 0,
      options: [],
      actionLog: [],
    };

    this.addLog(task, 'system', `Request received (${inputMode} input): "${rawInput}"`);

    // Parse input
    const parsed = await this.llmParser.parse(rawInput);
    const parseResult = parsed.result;
    this.addLog(
      task,
      'plan',
      parsed.source === 'gemini'
        ? 'Gemini interpreted the request; structured output passed validation.'
        : 'Local request parser was used; Gemini is not configured or unavailable.',
    );
    task.taskType = parseResult.taskType;
    task.constraints = parseResult.constraints;

    const preferredProvider =
      options?.providerId ||
      (parseResult.constraints.type === 'train_search'
        ? parseResult.constraints.data.preferredProvider
        : parseResult.constraints.type === 'product_shopping'
          ? parseResult.constraints.data.preferredProvider
          : undefined);

    task.targetProvider = this.providerRegistry.resolveProvider(
      parseResult.taskType,
      preferredProvider,
    );

    // Create plan steps
    task.plan = parseResult.planTitles.map((title, idx) => ({
      id: `step-${idx + 1}`,
      title,
      status: 'pending' as const,
    }));

    if (parseResult.needsClarification) {
      task.status = 'needs_clarification';
      task.missingFields = parseResult.missingFields;
      task.clarificationPrompt = parseResult.clarificationPrompt;
      if (task.plan.length > 0) task.plan[0].status = 'in_progress';

      this.addLog(
        task,
        'clarify',
        `Clarification required for missing details: [${parseResult.missingFields?.join(', ')}]`,
        'warn',
      );
      this.tasks.set(id, task);
      return task;
    }

    // Advance to planned & searching
    task.status = 'planned';
    this.addLog(
      task,
      'plan',
      `Plan created with ${task.plan.length} steps. Target provider: ${task.targetProvider.name} (${task.targetProvider.capability}).`,
    );
    if (task.plan.length > 0) task.plan[0].status = 'completed';
    if (task.plan.length > 1) task.plan[1].status = 'in_progress';

    task.status = 'searching';
    this.tasks.set(id, task);

    // Execute search based on task type and provider capability
    await this.executeSearch(task);
    return task;
  }

  async clarifyTask(taskId: string, answers: Record<string, any>): Promise<TaskState> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task with id '${taskId}' not found.`);
    if (task.status !== 'needs_clarification') {
      throw new Error(
        'This task is not waiting for clarification. Start a new request to change its details.',
      );
    }

    this.addLog(task, 'clarify', 'Received clarification details.', 'info', {
      fields: Object.keys(answers),
    });

    const answersStr = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    const combinedInput = `${task.rawInput}. Clarification: ${answersStr}`;

    const parsed = await this.llmParser.parse(combinedInput);
    const parseResult = parsed.result;
    this.addLog(
      task,
      'plan',
      parsed.source === 'gemini'
        ? 'Gemini interpreted the clarified request; structured output passed validation.'
        : 'Local request parser handled the clarification.',
    );
    task.taskType = parseResult.taskType;
    task.constraints = parseResult.constraints;
    task.missingFields = undefined;
    task.clarificationPrompt = undefined;

    const preferredProvider =
      parseResult.constraints.type === 'train_search'
        ? parseResult.constraints.data.preferredProvider
        : parseResult.constraints.type === 'product_shopping'
          ? parseResult.constraints.data.preferredProvider
          : undefined;

    task.targetProvider = this.providerRegistry.resolveProvider(
      parseResult.taskType,
      preferredProvider,
    );

    task.plan = parseResult.planTitles.map((title, idx) => ({
      id: `step-${idx + 1}`,
      title,
      status: 'pending' as const,
    }));
    if (task.plan.length > 0) task.plan[0].status = 'completed';

    task.status = 'searching';
    await this.executeSearch(task);
    return task;
  }

  /**
   * Records that the user chose to open the official external provider website.
   * Never claims to have searched or booked on that provider.
   */
  recordOfficialHandoff(taskId: string, providerId?: string): TaskState {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task with id '${taskId}' not found.`);
    if (task.status === 'provider_handoff_ready' && task.providerHandoff) {
      if (providerId && task.providerHandoff.providerId !== providerId)
        throw new Error('That provider does not match the selected live listing.');
      task.status = 'handoff_complete';
      this.addLog(
        task,
        'handoff',
        `User opened the live listing at ${task.providerHandoff.url}. ActionDesk did not access the page, sign in, or complete checkout.`,
        'success',
      );
      task.updatedAt = new Date().toISOString();
      return task;
    }
    if (task.status !== 'provider_limitation' || !task.handoffInfo) {
      throw new Error('An official website handoff is only available when the task offers one.');
    }

    if (
      providerId &&
      !task.handoffInfo.availableHandoffs.some((handoff) => handoff.providerId === providerId)
    ) {
      throw new Error('That provider is not an available handoff for this task.');
    }

    const chosenHandoff =
      task.handoffInfo?.availableHandoffs.find((h) => h.providerId === providerId) ||
      (task.handoffInfo
        ? {
            providerId: task.handoffInfo.providerId,
            providerName: task.handoffInfo.providerName,
            officialUrl: task.handoffInfo.officialUrl,
            handoffUrl: task.handoffInfo.handoffUrl,
            capability: task.handoffInfo.capability,
            statusReason: task.handoffInfo.reason,
          }
        : undefined);

    const providerName =
      chosenHandoff?.providerName || task.targetProvider?.name || 'official website';
    const handoffUrl = chosenHandoff?.handoffUrl || task.targetProvider?.officialUrl || '';

    if (task.plan[2]) task.plan[2].status = 'completed';
    if (task.plan[3]) task.plan[3].status = 'skipped';
    if (task.plan[4]) {
      task.plan[4].status = 'completed';
      task.plan[4].detail = `Handed off to ${providerName} (${handoffUrl}). User continues on the official site.`;
    }

    task.status = 'handoff_complete';
    this.addLog(
      task,
      'handoff',
      `Opened official website handoff for ${providerName} (${handoffUrl}). ActionDesk did not automate the provider website or book; API search status is recorded separately. You will continue directly on the official site.`,
      'success',
    );
    task.updatedAt = new Date().toISOString();
    return task;
  }

  private async executeSearch(task: TaskState): Promise<void> {
    if (task.taskType === 'general_info' && task.constraints?.type === 'general_info') {
      const result = await this.infoAdapter.query(task.constraints.data);
      task.infoResult = { ...result, retrievedAt: new Date().toISOString() };
      task.handoffInfo = this.providerRegistry.buildHandoffInfo(
        task.targetProvider!,
        'general_info',
        task.constraints.data,
      );
      task.status = 'provider_limitation';
      this.addLog(
        task,
        'provider_status',
        'No approved live information source is configured; provided an external web search handoff without invented citations.',
        'warn',
      );
      task.updatedAt = new Date().toISOString();
      return;
    }

    const provider = task.targetProvider;
    if (!provider || !task.taskType)
      throw new Error('Could not resolve a provider for this request.');
    this.addLog(task, 'provider_status', `Checking ${provider.name}: ${provider.statusReason}`);
    if (task.plan[1]) task.plan[1].status = 'completed';
    if (task.plan[2]) task.plan[2].status = 'in_progress';

    if (task.taskType === 'product_shopping' && task.constraints?.type === 'product_shopping') {
      const productConstraints = task.constraints.data;
      const configuredProviders = this.providerRegistry
        .getProviders()
        .filter(
          (candidate) =>
            candidate.domain === 'product_shopping' &&
            candidate.connected &&
            candidate.capability === 'authorized_live_search' &&
            (!productConstraints.preferredProvider ||
              candidate.id === productConstraints.preferredProvider),
        );

      if (configuredProviders.length > 0) {
        const attempts = await Promise.allSettled(
          configuredProviders.map((candidate) =>
            this.providerRegistry.executeAuthorizedLiveProductSearch(candidate, productConstraints),
          ),
        );
        const successful = attempts.flatMap((attempt) =>
          attempt.status === 'fulfilled' ? [attempt.value] : [],
        );
        const listings = successful.flatMap((result) => result.options);
        if (listings.length > 0) {
          const terms = productConstraints.query
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((term) => term.length > 2);
          const seen = new Set<string>();
          const ranked = listings
            .map((item) => {
              const identity = `${item.providerId}:${item.title.trim().toLowerCase().replace(/\s+/g, ' ')}`;
              const score = terms.reduce(
                (total, term) =>
                  total +
                  (`${item.title} ${item.brand} ${item.features.join(' ')} ${item.description}`
                    .toLowerCase()
                    .includes(term)
                    ? 1
                    : 0),
                0,
              );
              return { item, identity, score };
            })
            .filter(({ identity }) => {
              if (seen.has(identity)) return false;
              seen.add(identity);
              return true;
            })
            .sort((a, b) => b.score - a.score || a.item.price - b.item.price)
            .map(({ item }) => item)
            .slice(0, 10);

          const selectedItem = ranked[0];
          task.options = ranked;
          task.recommendation = {
            selectedItem,
            reason: `Closest live matches across ${[...new Set(ranked.map((item) => item.providerName))].join(' and ')}. Check the seller, specifications, and final price on the retailer before continuing.`,
            highlights: selectedItem.features.slice(0, 3),
            tradeoffs: [
              selectedItem.uncertaintyNote ||
                'Retailer prices and stock can change before checkout.',
            ],
            alternatives: ranked.slice(1, 5),
          };
          task.selectedOptionId = selectedItem.id;
          if (task.plan[2]) task.plan[2].status = 'completed';
          if (task.plan[3]) task.plan[3].status = 'in_progress';
          task.status = 'awaiting_selection';
          const successfulProviders = [...new Set(ranked.map((item) => item.providerName))];
          this.addLog(
            task,
            'recommend',
            `Live partner search returned ${ranked.length} validated listing(s) from ${successfulProviders.join(', ')}.`,
            'success',
          );
          if (successful.length < configuredProviders.length)
            this.addLog(
              task,
              'provider_status',
              'One or more connected retailer APIs did not return usable results; listings from successful providers are shown.',
              'warn',
            );
          task.updatedAt = new Date().toISOString();
          return;
        }
        const failureDetails = [
          ...new Set(
            attempts.flatMap((attempt) => {
              if (attempt.status !== 'rejected') return [];
              return [
                attempt.reason instanceof Error
                  ? redactSensitiveText(attempt.reason.message).slice(0, 160)
                  : 'A retailer API request failed.',
              ];
            }),
          ),
        ];
        const noResultsReason = failureDetails.length
          ? `Connected retailer API search failed: ${failureDetails.join('; ')}. No substitute results were shown.`
          : 'Connected retailer APIs returned no eligible listings. No substitute results were shown.';
        task.handoffInfo = this.providerRegistry.buildHandoffInfo(
          provider,
          task.taskType,
          productConstraints,
          noResultsReason,
        );
        task.status = 'provider_limitation';
        this.addLog(
          task,
          'provider_status',
          'Connected retailer APIs did not return eligible results. Official provider search links are available.',
          'warn',
        );
        task.updatedAt = new Date().toISOString();
        return;
      }
    }

    const constraints =
      task.constraints?.type === 'train_search' || task.constraints?.type === 'product_shopping'
        ? task.constraints.data
        : undefined;
    task.options = [];
    task.recommendation = undefined;
    task.handoffInfo = this.providerRegistry.buildHandoffInfo(provider, task.taskType, constraints);
    task.status = 'provider_limitation';
    this.addLog(
      task,
      'provider_status',
      `${provider.name} cannot search through a connected partner API. No product or train results were invented; official-site handoff is available.`,
      'warn',
    );
    task.updatedAt = new Date().toISOString();
  }
  selectOption(taskId: string, optionId: string): TaskState {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task with id '${taskId}' not found.`);
    if (task.status !== 'awaiting_selection') {
      throw new Error('This task is not waiting for an option selection.');
    }

    const found = task.options.find((opt) => opt.id === optionId);
    if (!found) throw new Error(`Option '${optionId}' not found in task options.`);

    task.selectedOptionId = optionId;
    task.selectionConfirmed = true;
    this.addLog(
      task,
      'user_confirm',
      `User confirmed option choice: ${'carrier' in found ? found.carrier : found.title}`,
      'success',
    );
    task.updatedAt = new Date().toISOString();
    return task;
  }

  async confirmAndExecute(taskId: string, confirmed: boolean): Promise<TaskState> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task with id '${taskId}' not found.`);
    if (task.status !== 'awaiting_selection')
      throw new Error('This task is not waiting for your confirmation.');
    if (!confirmed) {
      task.status = 'cancelled';
      this.addLog(task, 'cancel', 'User declined to open the listing. Task stopped.', 'warn');
      task.plan.forEach((step) => {
        if (step.status === 'in_progress' || step.status === 'pending') step.status = 'skipped';
      });
      task.updatedAt = new Date().toISOString();
      return task;
    }
    const selectedItem =
      task.options.find((option) => option.id === task.selectedOptionId) || task.options[0];
    if (!selectedItem || selectedItem.dataOrigin !== 'live_provider' || !selectedItem.sourceUrl) {
      throw new Error('Only a validated live provider listing can be opened.');
    }
    task.selectionConfirmed = true;
    task.status = 'provider_handoff_ready';
    if (task.plan[3]) task.plan[3].status = 'completed';
    const lastPlanStep = task.plan[task.plan.length - 1];
    if (lastPlanStep) {
      lastPlanStep.status = 'completed';
      lastPlanStep.detail = `Official provider listing opened by the user: ${selectedItem.sourceUrl}. Sign-in and checkout remain on the provider site.`;
    }
    task.providerHandoff = {
      providerId: selectedItem.providerId!,
      url: selectedItem.sourceUrl,
      providerName: selectedItem.providerName || 'Official provider page',
      message:
        'The link came from the live partner API. ActionDesk did not access the provider page or perform checkout.',
    };
    this.addLog(
      task,
      'handoff',
      `Official provider listing ready: ${selectedItem.sourceUrl}. ActionDesk did not sign in, submit personal information, or pay.`,
      'success',
    );
    task.updatedAt = new Date().toISOString();
    return task;
  }
  cancelTask(taskId: string): TaskState {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task with id '${taskId}' not found.`);

    task.status = 'cancelled';
    task.plan.forEach((s) => {
      if (s.status === 'in_progress' || s.status === 'pending') s.status = 'skipped';
    });
    this.addLog(
      task,
      'cancel',
      'Task and active browser session were stopped and disconnected by the user.',
      'warn',
    );
    task.updatedAt = new Date().toISOString();
    return task;
  }
}
