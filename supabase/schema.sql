create extension if not exists pgcrypto;

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  language text not null default 'Deutsch',
  level text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  number integer not null,
  title text not null,
  topic text,
  level text,
  description text,
  created_at timestamptz not null default now(),
  unique (book_id, number)
);

create table if not exists lesson_learning_objectives (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  description text not null
);

create table if not exists lesson_vocabulary (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  word text not null,
  meaning text,
  example text
);

create table if not exists lesson_grammar (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  topic text not null,
  notes text
);

create table if not exists lesson_phrases (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  phrase text not null
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  level text,
  duration integer,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_book_id on lessons(book_id);
create index if not exists idx_materials_lesson_id on materials(lesson_id);
