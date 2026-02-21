-- Schema Supabase / Postgres para Musicalizacao Infantil
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.musicalizacao_criancas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo text not null default 'crianca',
  nome_crianca text not null,
  sexo text,
  data_nascimento text,
  comum_congregacao text not null,
  nome_pai text,
  pai_e_crente text,
  nome_mae text,
  mae_e_crente text,
  pais_vivem_juntos text,
  crianca_vive_com_os_pais text,
  se_nao_vive_com_pais_com_quem_vive text,
  nome_responsavel text,
  celular_responsavel text,
  tem_whatsapp text,
  participa_reunioes_jovens_menores text,
  participa_espaco_infantil text,
  logradouro_numero text,
  complemento text,
  bairro text,
  cidade text,
  cep text,
  dificuldade_aprendizagem text,
  dificuldade_descricao text,
  faz_terapia text,
  terapia_especialidade text,
  constraint chk_musicalizacao_criancas_tipo check (tipo = 'crianca')
);

create table if not exists public.musicalizacao_monitores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo text not null default 'monitor',
  nome_completo text not null,
  comum_congregacao text not null,
  idade text,
  batizado text,
  data_batismo text,
  celular text,
  email text,
  polo_auxilio text,
  musico_ou_musicista text,
  oficializado text,
  data_oficializacao text,
  instrutor_atualmente text,
  instrutor_em_qual_igreja text,
  formacao_musica text,
  formacao_qual text,
  formacao_data text,
  pedagogo text,
  pedagogo_desde text,
  atua_na_area text,
  afinidade_criancas text,
  cursos_conhecimentos text,
  de_acordo_voluntario text,
  autoriza_tratamento_dados text,
  constraint chk_musicalizacao_monitores_tipo check (tipo = 'monitor')
);

-- Unicidade global (sem considerar dia): tipo + nome + comum
create unique index if not exists ux_musicalizacao_criancas_unico
  on public.musicalizacao_criancas (
    upper(trim(nome_crianca)),
    upper(trim(comum_congregacao))
  );

create unique index if not exists ux_musicalizacao_monitores_unico
  on public.musicalizacao_monitores (
    upper(trim(nome_completo)),
    upper(trim(comum_congregacao))
  );

-- Índices auxiliares para busca
create index if not exists ix_musicalizacao_criancas_created_at
  on public.musicalizacao_criancas (created_at desc);

create index if not exists ix_musicalizacao_monitores_created_at
  on public.musicalizacao_monitores (created_at desc);
