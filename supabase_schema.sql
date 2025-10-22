create extension if not exists "uuid-ossp";

create table if not exists public.messages (
    id uuid default uuid_generate_v4() primary key,
    date date not null,
    nombre text not null,
    telefono text not null,
    direccion text not null,
    ciudad_departamento text not null,
    producto text not null,
    observaciones text,
    created_at timestamp with time zone default now()
);

create index if not exists idx_messages_date on public.messages (date);