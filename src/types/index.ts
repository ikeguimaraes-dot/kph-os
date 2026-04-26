// Tipos compartilhados do KPH OS. Expandem ao longo das fases.

export type Group = {
  id: string;
  nome: string;
};

export type Brand = {
  id: string;
  group_id: string;
  nome: string;
};

export type Unit = {
  id: string;
  brand_id: string;
  nome: string;
};

export type Role =
  | "founder"
  | "cfo"
  | "gm"
  | "pessoas"
  | "chef"
  | "comprador"
  | "colaborador"
  | "socio_readonly";
