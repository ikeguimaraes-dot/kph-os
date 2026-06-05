-- Tabelas adicionais para o PDF de Venda do Lorean
-- (mais completo que o Workday — tem breakdown por hora, garçom e cancelamentos)

CREATE TABLE public.lorean_horarios (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workday_id_fk uuid REFERENCES lorean_workdays(id) ON DELETE CASCADE,
  hora          integer NOT NULL,  -- 12, 13, 14 ... 23
  clientes      integer,
  gorjeta       numeric,
  produto       numeric,
  consumo       numeric,
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE public.lorean_usuarios (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workday_id_fk uuid REFERENCES lorean_workdays(id) ON DELETE CASCADE,
  usuario       varchar NOT NULL,  -- nome do garçom / operador
  qtd           integer,
  gorjeta       numeric,
  produto       numeric,
  consumo       numeric,
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE public.lorean_cancelamentos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workday_id_fk uuid REFERENCES lorean_workdays(id) ON DELETE CASCADE,
  motivo        varchar NOT NULL,
  qtd           integer,
  consumo       numeric,
  criado_em     timestamptz DEFAULT now()
);

CREATE INDEX lorean_horarios_workday     ON lorean_horarios     (workday_id_fk);
CREATE INDEX lorean_usuarios_workday     ON lorean_usuarios     (workday_id_fk);
CREATE INDEX lorean_cancelamentos_workday ON lorean_cancelamentos (workday_id_fk);
