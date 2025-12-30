"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useFormState } from "react-dom";

type Potencia = {
  id: string;
  nome: string;
  sigla: string | null;
};

type FormState = {
  error: string | null;
};

type LojaFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  potencias: Potencia[];
};

const initialState: FormState = { error: null };

export function LojaForm({ action, potencias }: LojaFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const [cnpj, setCnpj] = useState("");

  const handleCnpjChange = (value: string) => {
    setCnpj(formatCnpj(value));
  };

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm">
      {state.error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <Section title="Tenant e contrato">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do tenant (org)" required>
            <input
              name="tenantName"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Loja Aurora - REAA"
              required
            />
          </Field>
          <Field label="NÇ§mero do contrato" required>
            <input
              name="contractNumber"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="SAAS-2025-XXXX"
              required
            />
          </Field>
          <Field label="Mensalidade vÇ­lida atÇ¸">
            <input
              name="mensalidadeValidaAte"
              type="date"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="mensalidadeAtiva"
              name="mensalidadeAtiva"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-border bg-background"
            />
            <label htmlFor="mensalidadeAtiva" className="text-sm text-foreground">
              Mensalidade ativa
            </label>
          </div>
        </div>
      </Section>

      <Section title="Dados da loja">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Loja MX (Mesa ExtraordinÇ­ria)" required>
            <input
              name="lojaMX"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Nome da Loja de Mesa"
              required
            />
          </Field>
          <Field label="Potencia" required>
            <select
              name="potenciaId"
              required
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="">Selecione a potencia</option>
              {potencias.map((potencia) => (
                <option key={potencia.id} value={potencia.id}>
                  {potencia.sigla ? `${potencia.sigla} - ` : ""}
                  {potencia.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="CNPJ">
            <input
              name="cnpj"
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => handleCnpjChange(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </Field>
          <Field label="NÇ§mero (ritualÇðstico)">
            <input
              name="numero"
              type="number"
              min="0"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 22"
            />
          </Field>
          <Field label="Cidade">
            <input
              name="enderecoCidade"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Cidade"
            />
          </Field>
          <Field label="UF">
            <input
              name="enderecoUf"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="SP"
              maxLength={2}
            />
          </Field>
        </div>
      </Section>

      <Section title="Valores de Pagamento">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Valor da Mensalidade (R$)" required>
            <input
              name="valorMensalidade"
              type="number"
              step="0.01"
              min="0"
              defaultValue="150.00"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="150.00"
              required
            />
          </Field>
          <Field label="Valor da Anuidade (R$)" required>
            <input
              name="valorAnuidade"
              type="number"
              step="0.01"
              min="0"
              defaultValue="500.00"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="500.00"
              required
            />
          </Field>
        </div>
      </Section>

      <Section title="Contato">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do contato" required>
            <input
              name="contatoNome"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="ResponsÇ­vel pela loja"
              required
            />
          </Field>
          <Field label="Telefone" required>
            <input
              name="telefone"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="+55..."
              required
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="contato@loja.com"
            />
          </Field>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Salvar loja
        </button>
        <a
          href="/admin/lojas"
          className="h-10 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-foreground">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
}
