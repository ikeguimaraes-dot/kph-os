"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  employeeFormSchema,
  type EmployeeFormInput,
  type EmployeeFormOutput,
} from "@/lib/pessoas/schema";
import { createEmployee, updateEmployee } from "@/lib/pessoas/actions";
import type { Employee } from "@/types/pessoas";

type Props =
  | { mode: "create"; unitId: string; defaultValues?: undefined; employeeId?: undefined }
  | { mode: "edit"; unitId: string; employeeId: string; defaultValues: EmployeeFormInput };

export function EmployeeForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // RHF: TFieldValues = input (o que o user digita), TTransformedValues = output
  // (depois do schema transform com nulls). Sem isso, o tipo do resolver não bate.
  const form = useForm<EmployeeFormInput, undefined, EmployeeFormOutput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues:
      props.mode === "edit"
        ? props.defaultValues
        : {
            nome: "",
            sobrenome: "",
            funcao: "",
            salario_base: "" as unknown as number, // input vazio até user digitar
            data_admissao: "",
            cpf: "",
            ctps: "",
            banco: "",
            agencia: "",
            conta: "",
            tipo_conta: "",
            pix: "",
          },
  });

  // handleSubmit recebe o OUTPUT do schema (com transforms aplicadas).
  const onSubmit = (parsed: EmployeeFormOutput) => {
    setSubmitError(null);
    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await createEmployee({ ...parsed, unit_id: props.unitId })
          : await updateEmployee(props.employeeId, parsed);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push("/pessoas/colaboradores");
      router.refresh();
    });
  };

  const errs = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}
    >
      <Section title="Identificação" desc="Dados pessoais e função na casa.">
        <Row>
          <Field label="Nome" error={errs.nome?.message}>
            <Input {...form.register("nome")} autoComplete="off" />
          </Field>
          <Field label="Sobrenome" error={errs.sobrenome?.message}>
            <Input {...form.register("sobrenome")} autoComplete="off" />
          </Field>
        </Row>
        <Row>
          <Field label="Função" error={errs.funcao?.message}>
            <Input {...form.register("funcao")} placeholder="Ex: Garçonete, Cozinheiro" />
          </Field>
          <Field label="CPF (opcional)" error={errs.cpf?.message}>
            <Input {...form.register("cpf")} placeholder="000.000.000-00" />
          </Field>
        </Row>
        <Field label="CTPS (opcional)" error={errs.ctps?.message}>
          <Input {...form.register("ctps")} placeholder="Número/série" />
        </Field>
      </Section>

      <Section title="Vínculo e remuneração" desc="Salário-base é o de carteira (sem horas extras / gorjeta).">
        <Row>
          <Field label="Salário-base (R$)" error={errs.salario_base?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("salario_base")}
              placeholder="0,00"
            />
          </Field>
          <Field label="Data de admissão" error={errs.data_admissao?.message}>
            <Input type="date" {...form.register("data_admissao")} />
          </Field>
        </Row>
      </Section>

      <Section title="Dados bancários" desc="Opcionais. Preenche quando tiver os dados; não bloqueia o cadastro.">
        <Row>
          <Field label="Banco" error={errs.banco?.message}>
            <Input {...form.register("banco")} placeholder="Ex: Itaú" />
          </Field>
          <Field label="Agência" error={errs.agencia?.message}>
            <Input {...form.register("agencia")} />
          </Field>
        </Row>
        <Row>
          <Field label="Conta" error={errs.conta?.message}>
            <Input {...form.register("conta")} />
          </Field>
          <Field label="Tipo de conta" error={errs.tipo_conta?.message}>
            <Select
              value={form.watch("tipo_conta") ?? ""}
              onValueChange={(v) =>
                form.setValue("tipo_conta", v as EmployeeFormInput["tipo_conta"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="salario">Salário</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Row>
        <Field label="Chave PIX" error={errs.pix?.message}>
          <Input {...form.register("pix")} placeholder="CPF, email ou aleatória" />
        </Field>
      </Section>

      {submitError && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 8,
            color: "var(--destructive)",
            fontSize: 12,
          }}
        >
          {submitError}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/pessoas/colaboradores")}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : props.mode === "create" ? "Criar colaborador" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <legend style={{ padding: "0 6px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
        {title}
      </legend>
      {desc && (
        <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
          {desc}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label style={{ fontSize: 11, color: "var(--text-2)" }}>{label}</Label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: "var(--destructive)" }}>{error}</span>
      )}
    </div>
  );
}

/** Helper pra preencher defaultValues do form a partir de um Employee carregado. */
export function employeeToFormDefaults(e: Employee): EmployeeFormInput {
  return {
    nome: e.nome,
    sobrenome: e.sobrenome,
    funcao: e.funcao,
    salario_base: Number(e.salario_base) as unknown as number,
    data_admissao: e.data_admissao.slice(0, 10),
    cpf: e.cpf ?? "",
    ctps: e.ctps ?? "",
    banco: e.banco ?? "",
    agencia: e.agencia ?? "",
    conta: e.conta ?? "",
    tipo_conta:
      e.tipo_conta === "corrente" || e.tipo_conta === "poupanca" || e.tipo_conta === "salario"
        ? e.tipo_conta
        : "",
    pix: e.pix ?? "",
  };
}
