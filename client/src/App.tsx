import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  Clock3,
  ExternalLink,
  Plane,
  Search,
  ShieldCheck,
  ShoppingBag,
  TrainFront,
  WalletCards,
  ListChecks,
  ReceiptText,
  Database,
  Settings,
} from 'lucide-react';
import { WorkspaceSidebar, WorkspaceView } from './components/WorkspaceSidebar.js';
import { Header } from './components/Header.js';
import { PromptChips } from './components/PromptChips.js';
import { TaskInput } from './components/TaskInput.js';
import { PlanTracker } from './components/PlanTracker.js';
import { ClarificationCard } from './components/ClarificationCard.js';
import { ProviderLimitationCard } from './components/ProviderLimitationCard.js';
import { RecommendationCard } from './components/RecommendationCard.js';
import { ConfirmationGate } from './components/ConfirmationGate.js';
import { ProviderHandoffCard } from './components/ProviderHandoffCard.js';
import { SourcedInfoCard } from './components/SourcedInfoCard.js';
import { AuditLog } from './components/AuditLog.js';
import { Sidebar } from './components/Sidebar.js';
import { DeskBuddy } from './components/DeskBuddy.js';
import { ProviderLogo } from './components/ProviderLogo.js';
import {
  createTask,
  getProviders,
  getTasks,
  clarifyTask,
  recordHandoff,
  selectOption,
  confirmAction,
  cancelTask,
} from './services/api.js';
import { speechService } from './services/speech.js';
import { ProviderDescriptor, TaskState } from '../../shared/types.js';
import { formatBudgetTag, getPlainStatusLabel } from './utils/format.js';

const quickActions = [
  {
    icon: <ShoppingBag />,
    label: 'Product search',
    detail: 'Compare retailer listings',
    text: 'Find wireless headphones on Amazon under ₹8,000',
    tone: 'sage',
  },
  {
    icon: <TrainFront />,
    label: 'Train search',
    detail: 'Plan a route and open a rail provider',
    text: 'Find a morning train from Bengaluru to Goa on 24 May',
    tone: 'blue',
  },
  {
    icon: <BookOpen />,
    label: 'Web lookup',
    detail: 'Search when live sources are unavailable',
    text: 'Find the current baggage allowance for trains',
    tone: 'sand',
  },
];

export const App: React.FC = () => {
  const [view, setView] = useState<WorkspaceView>('home');
  const [currentTask, setCurrentTask] = useState<TaskState | null>(null);
  const [tasks, setTasks] = useState<TaskState[]>([]);
  const [providers, setProviders] = useState<ProviderDescriptor[]>([]);
  const [draftText, setDraftText] = useState('');
  const [partnerQuery, setPartnerQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startVoiceOnCreate, setStartVoiceOnCreate] = useState(false);

  useEffect(() => {
    getProviders()
      .then(setProviders)
      .catch(() =>
        setError(
          'Provider status is unavailable. Live search is paused until the server responds.',
        ),
      );
    getTasks()
      .then(setTasks)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (currentTask)
      setTasks((previous) => [
        currentTask,
        ...previous.filter((task) => task.id !== currentTask.id),
      ]);
  }, [currentTask]);

  const speakText = (text: string) => {
    setIsSpeaking(true);
    speechService.speak(text, () => setIsSpeaking(false));
  };
  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };
  const newTask = () => {
    stopSpeaking();
    setCurrentTask(null);
    setError(null);
    setDraftText('');
    setStartVoiceOnCreate(false);
    setView('create');
  };
  const fillPrompt = (text: string) => {
    setDraftText(text);
    setView('create');
  };
  const startVoiceRequest = () => {
    setCurrentTask(null);
    setDraftText('');
    setStartVoiceOnCreate(true);
    setView('create');
  };

  const handleCreateTask = async (text: string, mode: 'text' | 'voice') => {
    setIsLoading(true);
    setError(null);
    try {
      const task = await createTask(text, mode);
      setCurrentTask(task);
      setView('task');
      if (task.status === 'needs_clarification' && task.clarificationPrompt)
        speakText(task.clarificationPrompt);
      else if (task.status === 'provider_limitation' && task.handoffInfo)
        speakText(`${task.handoffInfo.providerName} is ready to open on its official website.`);
      else if (task.status === 'awaiting_selection' && task.recommendation)
        speakText(`I found live provider listings. Please review the selected option.`);
      else if (task.infoResult) speakText(task.infoResult.answer.slice(0, 140));
    } catch (e: any) {
      setError(e.message || 'Could not start the task.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarify = async (answers: Record<string, string>) => {
    if (!currentTask) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await clarifyTask(currentTask.id, answers);
      setCurrentTask(updated);
    } catch (e: any) {
      setError(e.message || 'Could not submit those details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOfficialSite = async (providerId?: string) => {
    if (!currentTask) return;
    try {
      setCurrentTask(await recordHandoff(currentTask.id, providerId));
    } catch (e: any) {
      setError(e.message || 'Could not record the provider handoff.');
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (!currentTask) return;
    try {
      setCurrentTask(await selectOption(currentTask.id, optionId));
    } catch (e: any) {
      setError(e.message || 'Could not select this option.');
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!currentTask) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await confirmAction(currentTask.id, confirmed);
      setCurrentTask(updated);
      if (confirmed)
        speakText(
          'The official listing is ready. Review and complete checkout on the provider site.',
        );
    } catch (e: any) {
      setError(e.message || 'Could not confirm this step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (!currentTask) return;
    stopSpeaking();
    try {
      setCurrentTask(await cancelTask(currentTask.id));
    } catch (e: any) {
      setError(e.message || 'Could not stop the task.');
    }
  };

  const filteredProviders = useMemo(
    () =>
      providers.filter((provider) =>
        `${provider.name} ${provider.domain} ${provider.statusReason}`
          .toLowerCase()
          .includes(partnerQuery.toLowerCase()),
      ),
    [providers, partnerQuery],
  );
  const pageTitle: Record<WorkspaceView, string> = {
    home: 'Home',
    create: 'Create a task',
    agents: 'Agents',
    partners: 'Partner search',
    tasks: 'Tasks',
    bookings: 'Bookings',
    history: 'History',
    sources: 'Sources',
    settings: 'Settings',
    task: 'Task details',
  };

  const taskView = () =>
    currentTask ? (
      <div className="task-workspace">
        <section className="task-summary panel">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
              {currentTask.inputMode === 'voice' ? <AudioLines size={15} /> : <Search size={15} />}{' '}
              Your request{' '}
              <span className={`status-pill status-${statusTone(currentTask.status)}`}>
                {getPlainStatusLabel(currentTask.status).label}
              </span>
            </div>
            {[
              'received',
              'needs_clarification',
              'planned',
              'searching',
              'provider_limitation',
              'awaiting_selection',
              'provider_handoff_ready',
            ].includes(currentTask.status) && (
              <button
                type="button"
                onClick={handleCancelTask}
                className="text-xs text-zinc-600 hover:text-red-700"
              >
                Stop task
              </button>
            )}
          </div>
          <p className="text-lg font-semibold text-zinc-950">“{currentTask.rawInput}”</p>
          {currentTask.constraints && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-200 text-xs">
              <span className="detail-tag">{currentTask.targetProvider?.name}</span>
              {currentTask.constraints.type === 'train_search' && (
                <>
                  <span className="detail-tag">From {currentTask.constraints.data.origin}</span>
                  <span className="detail-tag">To {currentTask.constraints.data.destination}</span>
                  <span className="detail-tag">{currentTask.constraints.data.date}</span>
                  <span className="detail-tag">
                    {currentTask.constraints.data.passengerCount} passenger(s)
                  </span>
                  {currentTask.constraints.data.budget && (
                    <span className="detail-tag">
                      {formatBudgetTag(
                        currentTask.constraints.data.budget,
                        currentTask.constraints.data.currency,
                      )}
                    </span>
                  )}
                </>
              )}
              {currentTask.constraints.type === 'product_shopping' && (
                <>
                  <span className="detail-tag">{currentTask.constraints.data.query}</span>
                  {currentTask.constraints.data.budget && (
                    <span className="detail-tag">
                      {formatBudgetTag(
                        currentTask.constraints.data.budget,
                        currentTask.constraints.data.currency,
                      )}
                    </span>
                  )}
                  {currentTask.constraints.data.constraints.map((tag) => (
                    <span className="detail-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </>
              )}
              {currentTask.constraints.type === 'general_info' && (
                <span className="detail-tag">Web lookup</span>
              )}
            </div>
          )}
        </section>
        <div className="task-columns">
          <div className="space-y-4">
            <PlanTracker plan={currentTask.plan} status={currentTask.status} />
            <div className="hidden lg:block">
              <Sidebar providers={providers} />
            </div>
          </div>
          <div className="min-w-0">
            {currentTask.status === 'needs_clarification' && currentTask.clarificationPrompt && (
              <ClarificationCard
                prompt={currentTask.clarificationPrompt}
                missingFields={currentTask.missingFields}
                onSubmit={handleClarify}
                isLoading={isLoading}
              />
            )}
            {(currentTask.status === 'provider_limitation' ||
              currentTask.status === 'handoff_complete') &&
              currentTask.handoffInfo && (
                <ProviderLimitationCard
                  handoffInfo={currentTask.handoffInfo}
                  taskType={currentTask.taskType}
                  searchSummary={taskSearchSummary(currentTask)}
                  status={currentTask.status}
                  onOpenOfficialSite={handleOpenOfficialSite}
                />
              )}
            {currentTask.infoResult && <SourcedInfoCard infoResult={currentTask.infoResult} />}
            {currentTask.recommendation && (
              <RecommendationCard
                recommendation={currentTask.recommendation}
                taskType={currentTask.taskType}
                selectedOptionId={currentTask.selectedOptionId}
                selectionConfirmed={currentTask.selectionConfirmed}
                onSelectOption={handleSelectOption}
                onConfirmSelection={() =>
                  handleSelectOption(
                    currentTask.selectedOptionId || currentTask.recommendation!.selectedItem.id,
                  )
                }
                disabled={currentTask.status !== 'awaiting_selection'}
              />
            )}
            {currentTask.status === 'awaiting_selection' && (
              <ConfirmationGate
                taskType={currentTask.taskType}
                onConfirm={handleConfirm}
                isLoading={isLoading}
              />
            )}
            {currentTask.providerHandoff && (
              <ProviderHandoffCard
                handoff={currentTask.providerHandoff}
                onOpen={handleOpenOfficialSite}
              />
            )}
            {currentTask.status === 'cancelled' && (
              <div className="panel text-sm text-zinc-600">This task was stopped.</div>
            )}
            <AuditLog events={currentTask.actionLog} />
            <div className="mt-6 pt-5 border-t border-zinc-200">
              <TaskInput
                onSubmit={handleCreateTask}
                isLoading={isLoading}
                compact
                draftText={draftText}
                onDraftConsumed={() => setDraftText('')}
              />
              <PromptChips onFillPrompt={fillPrompt} disabled={isLoading} variant="compact" />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <CreateTaskPage
        onSubmit={handleCreateTask}
        isLoading={isLoading}
        draftText={draftText}
        onDraftConsumed={() => setDraftText('')}
        onFillPrompt={fillPrompt}
        providers={providers}
        startVoiceOnMount={startVoiceOnCreate}
        onVoiceModeOpened={() => setStartVoiceOnCreate(false)}
      />
    );

  const renderPage = () => {
    if (view === 'task') return taskView();
    if (view === 'create')
      return (
        <CreateTaskPage
          onSubmit={handleCreateTask}
          isLoading={isLoading}
          draftText={draftText}
          onDraftConsumed={() => setDraftText('')}
          onFillPrompt={fillPrompt}
          providers={providers}
          startVoiceOnMount={startVoiceOnCreate}
          onVoiceModeOpened={() => setStartVoiceOnCreate(false)}
        />
      );
    if (view === 'home')
      return (
        <HomePage
          onNewTask={() => setView('create')}
          onQuickAction={fillPrompt}
          activeCount={
            tasks.filter((task) => !['cancelled', 'handoff_complete'].includes(task.status)).length
          }
          providers={providers}
        />
      );
    if (view === 'agents') return <AgentsPage providers={providers} />;
    if (view === 'partners')
      return (
        <PartnersPage
          providers={filteredProviders}
          query={partnerQuery}
          setQuery={setPartnerQuery}
        />
      );
    if (view === 'tasks')
      return (
        <TaskListPage
          tasks={tasks}
          onSelect={(task) => {
            setCurrentTask(task);
            setView('task');
          }}
        />
      );
    if (view === 'bookings') return <EmptyBookingsPage />;
    if (view === 'history')
      return (
        <HistoryPage
          tasks={tasks}
          onSelect={(task) => {
            setCurrentTask(task);
            setView('task');
          }}
        />
      );
    if (view === 'sources') return <SourcesPage providers={providers} />;
    return <SettingsPage providers={providers} />;
  };

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar
        active={view}
        onNavigate={(next) => {
          setError(null);
          setView(next);
        }}
      />
      <div className="workspace-main">
        <Header isSpeaking={isSpeaking} onStopSpeaking={stopSpeaking} onNewTask={newTask} />
        <main id="main-workspace" tabIndex={-1} className="workspace-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">ActionDesk workspace</p>
              <h1>{view === 'home' ? 'Good afternoon' : pageTitle[view]}</h1>
              <p>
                {view === 'home'
                  ? 'Your assistant is ready to plan, find, and guide your next task.'
                  : pageDescription(view)}
              </p>
            </div>
            {view === 'home' && (
              <span className="local-status">
                <span className="status-dot" />
                Private local session
              </span>
            )}
          </div>
          {(error || currentTask?.error) && (
            <div role="alert" className="error-banner">
              <AlertCircle size={18} />
              <div>
                <strong>Something went wrong</strong>
                <p>{error || currentTask?.error}</p>
              </div>
            </div>
          )}
          {renderPage()}
          <footer className="workspace-footer">
            <span>ActionDesk · Live partner search and official provider handoff</span>
            <span>Passwords, booking, and payment stay with you</span>
          </footer>
        </main>
      </div>
      <DeskBuddy onSelectPrompt={fillPrompt} onStartVoice={startVoiceRequest} />
    </div>
  );
};

function statusTone(status: TaskState['status']): string {
  return status === 'provider_limitation' || status === 'needs_clarification'
    ? 'amber'
    : status === 'handoff_complete' || status === 'provider_handoff_ready'
      ? 'green'
      : status === 'failed'
        ? 'red'
        : 'neutral';
}
function taskSearchSummary(task: TaskState): string | undefined {
  if (task.constraints?.type === 'product_shopping') {
    const { query, budget, currency, constraints } = task.constraints.data;
    return [
      `Product: ${query}`,
      ...(constraints.length ? [`Features: ${constraints.join(', ')}`] : []),
      ...(budget ? [`Budget: ${formatBudgetTag(budget, currency)}`] : []),
    ].join(' · ');
  }
  if (task.constraints?.type === 'train_search') {
    const route = task.constraints.data;
    return `${route.origin} → ${route.destination} · ${route.date} · ${route.passengerCount} passenger(s)${route.budget ? ` · ${formatBudgetTag(route.budget, route.currency)}` : ''}`;
  }
  if (task.constraints?.type === 'general_info') return `Question: ${task.constraints.data.query}`;
  return undefined;
}
function pageDescription(view: WorkspaceView): string {
  const descriptions: Record<WorkspaceView, string> = {
    home: '',
    create:
      'Describe what you need. ActionDesk checks provider access, searches approved sources, and shows you the next step.',
    agents: 'Focused assistants for tasks ActionDesk can actually support.',
    partners: 'Check which partner APIs are configured and open official provider sites.',
    tasks: 'Your tasks from this local session.',
    bookings: 'ActionDesk does not place or store bookings.',
    history: 'A record of task steps ActionDesk has performed in this session.',
    sources: 'Provider connections and the sources ActionDesk can use.',
    settings: 'Manage local preferences and review privacy boundaries.',
    task: 'Review the plan, provider status, and next action.',
  };
  return descriptions[view];
}

function CreateTaskPage(props: {
  onSubmit: (text: string, mode: 'text' | 'voice') => void;
  isLoading: boolean;
  draftText: string;
  onDraftConsumed: () => void;
  onFillPrompt: (text: string) => void;
  providers?: ProviderDescriptor[];
  startVoiceOnMount?: boolean;
  onVoiceModeOpened?: () => void;
}) {
  return (
    <div className="create-grid">
      <section>
        <div className="panel composer-panel">
          <TaskInput
            onSubmit={props.onSubmit}
            isLoading={props.isLoading}
            draftText={props.draftText}
            onDraftConsumed={props.onDraftConsumed}
            startVoiceOnMount={props.startVoiceOnMount}
            onVoiceModeOpened={props.onVoiceModeOpened}
          />
          <PromptChips
            onFillPrompt={props.onFillPrompt}
            disabled={props.isLoading}
            variant="cards"
          />
        </div>
        <section className="how-section">
          <h2>How ActionDesk works</h2>
          <div className="how-steps">
            <div>
              <span>01</span>
              <strong>Understands</strong>
              <p>Parses the request and asks for any missing details.</p>
            </div>
            <ArrowRight />
            <div>
              <span>02</span>
              <strong>Finds or hands off</strong>
              <p>Uses a configured partner API or opens its official site.</p>
            </div>
            <ArrowRight />
            <div>
              <span>03</span>
              <strong>You decide</strong>
              <p>Review the result and continue on the provider site.</p>
            </div>
          </div>
        </section>
      </section>
      <aside className="provider-rail">
        <h2>Connected sources</h2>
        <p>Search is available only when partner credentials are configured.</p>
        <ProviderStatusList providers={props.providers || []} />
      </aside>
    </div>
  );
}

function HomePage(props: {
  onNewTask: () => void;
  onQuickAction: (text: string) => void;
  activeCount: number;
  providers: ProviderDescriptor[];
}) {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="hero-kicker">YOUR TASK DESK</span>
          <h2>What can I help with?</h2>
          <p>
            Describe a task in plain language. ActionDesk will find a supported provider or guide
            you to its official site.
          </p>
          <button type="button" className="hero-cta" onClick={props.onNewTask}>
            Create a task <ArrowRight size={16} />
          </button>
          <div className="hero-metrics">
            <div>
              <strong>{props.activeCount}</strong>
              <span>Tasks this session</span>
            </div>
            <div>
              <strong>{props.providers.filter((p) => p.connected).length}</strong>
              <span>Partner credentials configured</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-hill art-hill-back" />
          <div className="art-hill art-hill-front" />
          <div className="art-task-card">
            <div className="art-card-top">
              <span />
              <span />
              <span />
            </div>
            <div className="art-line long" />
            <div className="art-line" />
            <div className="art-check-row">
              <i>
                <Check size={14} />
              </i>
              <div>
                <span className="art-line long" />
                <span className="art-line short" />
              </div>
            </div>
            <div className="art-check-row">
              <i>
                <Check size={14} />
              </i>
              <div>
                <span className="art-line medium" />
                <span className="art-line short" />
              </div>
            </div>
          </div>
          <div className="art-orbit">
            <ArrowRight size={24} />
          </div>
        </div>
      </section>
      <section className="quick-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Get started</p>
            <h2>Quick actions</h2>
          </div>
          <button className="text-link" type="button" onClick={props.onNewTask}>
            All tasks <ArrowRight size={15} />
          </button>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`quick-card quick-${action.tone}`}
              onClick={() => props.onQuickAction(action.text)}
            >
              <span className="quick-icon">{action.icon}</span>
              <span>
                <strong>{action.label}</strong>
                <small>{action.detail}</small>
              </span>
              <ArrowRight size={16} className="quick-arrow" />
            </button>
          ))}
        </div>
      </section>
      <section className="home-bottom">
        <div className="panel home-provider-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Connections</p>
              <h2>Partner availability</h2>
            </div>
          </div>
          <ProviderStatusList providers={props.providers} compact />
        </div>
        <div className="panel trust-panel">
          <span className="trust-icon">
            <ShieldCheck size={20} />
          </span>
          <h2>Your accounts stay yours</h2>
          <p>
            ActionDesk keeps partner keys on the server. You sign in, choose addresses, book, and
            pay directly on provider websites.
          </p>
        </div>
      </section>
    </div>
  );
}

function ProviderStatusList({
  providers,
  compact = false,
}: {
  providers: ProviderDescriptor[];
  compact?: boolean;
}) {
  return (
    <ul className={`provider-status-list ${compact ? 'is-compact' : ''}`}>
      {providers
        .filter((p) => p.domain !== 'general_info')
        .map((provider) => (
          <li key={provider.id}>
            <div>
              <strong>{provider.name}</strong>
              <small>
                {provider.domain === 'product_shopping' ? 'Product search' : 'Train search'}
              </small>
            </div>
            <span className={`connection-badge ${provider.connected ? 'configured' : 'handoff'}`}>
              <i />
              {provider.connected ? 'Credentials configured' : 'Official-site handoff'}
            </span>
          </li>
        ))}
    </ul>
  );
}

function AgentsPage({ providers }: { providers: ProviderDescriptor[] }) {
  const agents = [
    {
      title: 'Request planner',
      icon: <ListChecks />,
      text: 'Parses your request, identifies missing details, and tracks each task step.',
      state: 'Ready',
      good: true,
    },
    {
      title: 'Shopping assistant',
      icon: <ShoppingBag />,
      text: 'Searches Amazon India or Flipkart only when official API credentials are configured.',
      state: providers.some((p) => p.domain === 'product_shopping' && p.connected)
        ? 'API credentials configured'
        : 'Needs provider credentials',
      good: providers.some((p) => p.domain === 'product_shopping' && p.connected),
    },
    {
      title: 'Travel assistant',
      icon: <Plane />,
      text: 'Collects route and date details, then hands off to an official travel provider.',
      state: 'Handoff only',
      good: false,
    },
    {
      title: 'Web lookup',
      icon: <Search />,
      text: 'Offers a direct web search link. Live search and sourced answers are not connected yet.',
      state: 'Search handoff',
      good: false,
    },
    {
      title: 'Payment assistant',
      icon: <WalletCards />,
      text: 'No payment or booking automation. You complete those steps with the provider.',
      state: 'User-controlled',
      good: true,
    },
    {
      title: 'Voice assistant',
      icon: <AudioLines />,
      text: 'Accepts speech and reads task updates when supported by your browser.',
      state: 'Browser support',
      good: true,
    },
  ];
  return (
    <div className="page-section">
      <div className="agent-grid">
        {agents.map((agent) => (
          <article className="panel agent-card" key={agent.title}>
            <div className="agent-icon">{agent.icon}</div>
            <h2>{agent.title}</h2>
            <p>{agent.text}</p>
            <span className={`agent-state ${agent.good ? 'good' : 'limited'}`}>
              <i />
              {agent.state}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

function PartnersPage({
  providers,
  query,
  setQuery,
}: {
  providers: ProviderDescriptor[];
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="page-section">
      <label className="partner-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search providers by name or task type"
        />
      </label>
      <div className="provider-card-grid">
        {providers
          .filter((p) => p.domain !== 'general_info')
          .map((provider) => (
            <article className="panel provider-card" key={provider.id}>
              <div className="provider-card-heading">
                <ProviderLogo provider={provider} />
                <span
                  className={`connection-badge ${provider.connected ? 'configured' : 'handoff'}`}
                >
                  <i />
                  {provider.connected ? 'Credentials configured' : 'Handoff only'}
                </span>
              </div>
              <h2>{provider.name}</h2>
              <p>{provider.domain === 'product_shopping' ? 'Product search' : 'Train search'}</p>
              <p className="provider-reason">{provider.statusReason}</p>
              <a
                href={provider.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="provider-link"
              >
                Open official site <ExternalLink size={15} />
              </a>
            </article>
          ))}
      </div>
      {providers.length === 0 && (
        <div className="empty-panel">
          Provider status is unavailable. Check that the local server is running.
        </div>
      )}
    </div>
  );
}

function TaskListPage({
  tasks,
  onSelect,
}: {
  tasks: TaskState[];
  onSelect: (task: TaskState) => void;
}) {
  return (
    <div className="page-section panel list-panel">
      {tasks.length ? (
        tasks.map((task) => (
          <button
            className="task-list-row"
            type="button"
            key={task.id}
            onClick={() => onSelect(task)}
          >
            <span className="task-row-icon">
              <ListChecks size={17} />
            </span>
            <span className="task-row-title">
              <strong>{task.rawInput}</strong>
              <small>
                {task.targetProvider?.name || 'Provider pending'} ·{' '}
                {new Date(task.updatedAt).toLocaleString()}
              </small>
            </span>
            <span className={`status-pill status-${statusTone(task.status)}`}>
              {getPlainStatusLabel(task.status).label}
            </span>
            <ArrowRight size={16} />
          </button>
        ))
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <ListChecks />
          </span>
          <h2>No tasks yet</h2>
          <p>Tasks you create in this session will appear here.</p>
        </div>
      )}
    </div>
  );
}

function EmptyBookingsPage() {
  return (
    <section className="panel empty-state booking-empty">
      <span className="empty-icon">
        <ReceiptText />
      </span>
      <h2>No bookings recorded</h2>
      <p>
        ActionDesk does not book tickets or place orders. When you continue on a provider site,
        booking and payment stay there; this workspace does not currently import booking records.
      </p>
    </section>
  );
}

function HistoryPage({
  tasks,
  onSelect,
}: {
  tasks: TaskState[];
  onSelect: (task: TaskState) => void;
}) {
  return (
    <div className="page-section history-list">
      {tasks.length ? (
        tasks.map((task) => (
          <button
            className="panel history-card"
            key={task.id}
            type="button"
            onClick={() => onSelect(task)}
          >
            <div className="history-date">
              <Clock3 size={15} />
              {new Date(task.createdAt).toLocaleString()}
            </div>
            <strong>{task.rawInput}</strong>
            <div className="history-events">
              {task.actionLog.slice(-3).map((event) => (
                <span key={event.id}>
                  <i className={event.level === 'success' ? 'event-success' : ''} />
                  {event.message}
                </span>
              ))}
            </div>
          </button>
        ))
      ) : (
        <div className="panel empty-state">
          <span className="empty-icon">
            <Clock3 />
          </span>
          <h2>Your history is empty</h2>
          <p>ActionDesk will keep a record of task steps during this local session.</p>
        </div>
      )}
    </div>
  );
}

function SourcesPage({ providers }: { providers: ProviderDescriptor[] }) {
  return (
    <div className="page-section">
      <div className="panel sources-intro">
        <Database size={22} />
        <div>
          <h2>Provider connections</h2>
          <p>
            ActionDesk checks for locally configured partner credentials. A configured status does
            not guarantee provider acceptance until a live request succeeds.
          </p>
        </div>
      </div>
      <ProviderStatusList providers={providers} />
      {providers
        .filter((p) => p.domain !== 'general_info')
        .map((provider) => (
          <details className="source-detail panel" key={provider.id}>
            <summary>
              <span>{provider.name}</span>
              <span>{provider.termsSummary}</span>
            </summary>
          </details>
        ))}
    </div>
  );
}

function SettingsPage({ providers }: { providers: ProviderDescriptor[] }) {
  return (
    <div className="settings-layout">
      <nav className="panel settings-nav">
        <span className="selected">
          <Settings size={16} /> General
        </span>
        <span>
          <ShieldCheck size={16} /> Privacy &amp; security
        </span>
        <span>
          <AudioLines size={16} /> Assistant preferences
        </span>
      </nav>
      <section className="panel settings-panel">
        <p className="eyebrow">Preferences</p>
        <h2>General</h2>
        <div className="setting-row">
          <span>
            <strong>Workspace</strong>
            <small>ActionDesk runs locally on this computer.</small>
          </span>
          <b>Local</b>
        </div>
        <div className="setting-row">
          <span>
            <strong>Task history</strong>
            <small>Stored in server memory and cleared when the server restarts.</small>
          </span>
          <b>Session only</b>
        </div>
        <div className="setting-row">
          <span>
            <strong>Voice replies</strong>
            <small>Controlled from the speaker button in the top bar.</small>
          </span>
          <b>Browser feature</b>
        </div>
        <div className="setting-row">
          <span>
            <strong>Provider integrations</strong>
            <small>
              {providers.filter((p) => p.connected).length} partner credential set(s) configured.
            </small>
          </span>
          <b>Server only</b>
        </div>
      </section>
    </div>
  );
}
