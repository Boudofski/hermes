-- RZG AI — initial schema
-- Run in Supabase SQL Editor or via: npm run db:push

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Enums
create type task_status as enum ('pending','running','completed','failed','cancelled');
create type run_status as enum ('pending','running','completed','failed','cancelled');

-- Workspaces
create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Agents
create table agents (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  name                text not null,
  role                text not null,
  goal                text not null,
  instructions        text,
  model               text not null default 'openai/gpt-4o-mini',
  provider            text,
  enabled_toolsets    text[] default '{}',
  disabled_toolsets   text[] default '{}',
  memory_enabled      boolean not null default false,
  max_iterations      int not null default 20,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Tasks
create table tasks (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  agent_id              uuid not null references agents(id) on delete cascade,
  name                  text not null,
  prompt                text not null,
  status                task_status not null default 'pending',
  schedule_expression   text,
  last_run_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Task Runs
create table task_runs (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references tasks(id) on delete cascade,
  status           run_status not null default 'pending',
  started_at       timestamptz,
  completed_at     timestamptz,
  final_response   text,
  error_message    text,
  input_prompt     text not null,
  model_used       text,
  created_at       timestamptz not null default now()
);

-- Task Logs (individual SSE events persisted)
create table task_logs (
  id            uuid primary key default gen_random_uuid(),
  task_run_id   uuid not null references task_runs(id) on delete cascade,
  event_type    text not null,
  content       text not null,
  tool_name     text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- Memories
create table memories (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  agent_id      uuid references agents(id) on delete cascade,
  key           text not null,
  content       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Provider Keys (keys are encrypted at application layer before insert)
create table provider_keys (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  provider        text not null,
  label           text not null,
  encrypted_key   text not null,
  base_url        text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Usage Logs
create table usage_logs (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  task_run_id           uuid references task_runs(id),
  agent_id              uuid references agents(id),
  model                 text,
  prompt_tokens         int default 0,
  completion_tokens     int default 0,
  estimated_cost_usd    text,
  created_at            timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table workspaces    enable row level security;
alter table agents        enable row level security;
alter table tasks         enable row level security;
alter table task_runs     enable row level security;
alter table task_logs     enable row level security;
alter table memories      enable row level security;
alter table provider_keys enable row level security;
alter table usage_logs    enable row level security;

-- Workspace access: only owner
create policy "workspace_owner" on workspaces
  using (owner_id = auth.uid());

-- Agent access: via workspace ownership
create policy "agent_workspace_owner" on agents
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "task_workspace_owner" on tasks
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "task_run_owner" on task_runs
  using (task_id in (
    select t.id from tasks t
    join workspaces w on w.id = t.workspace_id
    where w.owner_id = auth.uid()
  ));

create policy "task_log_owner" on task_logs
  using (task_run_id in (
    select tr.id from task_runs tr
    join tasks t on t.id = tr.task_id
    join workspaces w on w.id = t.workspace_id
    where w.owner_id = auth.uid()
  ));

create policy "memory_workspace_owner" on memories
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "provider_key_workspace_owner" on provider_keys
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

create policy "usage_log_workspace_owner" on usage_logs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- ── Auto-create workspace on signup ──────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into workspaces (name, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
    new.id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
