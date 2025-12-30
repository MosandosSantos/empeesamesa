"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Store, Phone, MapPin, FileText } from "lucide-react";
import type { Loja, Potencia, Rito } from "@prisma/client";

const ufOptions = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const situacaoOptions = [
  { value: "ATIVA", label: "Ativa" },
  { value: "ADORMECIDA", label: "Adormecida" },
  { value: "SUSPENSA", label: "Suspensa" },
  { value: "EXTINGUIDA", label: "Extinguida" },
];

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

type LojaWithRelations = Loja & {
  potencia: { id: string; nome: string } | null;
  rito: { id: string; nome: string } | null;
};

type PotenciaOption = {
  id: string;
  nome: string;
  sigla: string | null;
};

type RitoOption = {
  id: string;
  nome: string;
  sigla: string | null;
};

export default function EditLojaForm({
  loja,
  potencias,
  ritos,
}: {
  loja: LojaWithRelations;
  potencias: PotenciaOption[];
  ritos: RitoOption[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    lojaMX: loja.lojaMX,
    numero: loja.numero?.toString() || "",
    potenciaId: loja.potenciaId,
    ritoId: loja.ritoId || "",
    situacao: loja.situacao,
    dataFundacao: formatDateForInput(loja.dataFundacao),
    contractNumber: loja.contractNumber,
    mensalidadeAtiva: loja.mensalidadeAtiva,
    mensalidadeValidaAte: formatDateForInput(loja.mensalidadeValidaAte),
    valorMensalidade: loja.valorMensalidade?.toString() || "150.00",
    valorAnuidade: loja.valorAnuidade?.toString() || "500.00",
    cnpj: loja.cnpj || "",
    contatoNome: loja.contatoNome || "",
    email: loja.email || "",
    telefone: loja.telefone || "",
    website: loja.website || "",
    enderecoLogradouro: loja.enderecoLogradouro || "",
    enderecoNumero: loja.enderecoNumero || "",
    enderecoComplemento: loja.enderecoComplemento || "",
    enderecoBairro: loja.enderecoBairro || "",
    enderecoCidade: loja.enderecoCidade || "",
    enderecoUf: loja.enderecoUf || "",
    enderecoCep: loja.enderecoCep || "",
    observacoes: loja.observacoes || "",
  });

  const update = (key: string) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!form.contatoNome.trim()) {
      setError("Nome do contato e obrigatorio");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/lojas/${loja.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numero: form.numero ? parseInt(form.numero) : null,
          dataFundacao: form.dataFundacao || null,
          mensalidadeValidaAte: form.mensalidadeValidaAte || null,
          ritoId: form.ritoId || null,
          valorMensalidade: parseFloat(form.valorMensalidade),
          valorAnuidade: parseFloat(form.valorAnuidade),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar loja");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/lojas");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar loja");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Editar Loja
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualize as informações da loja de Mesa (Santo André - Grau 4 RER)
          </p>
        </div>
        <Link
          href={`/admin/lojas/${loja.id}`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Cancelar
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Erro</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Sucesso!</p>
          <p className="text-sm text-emerald-700">
            Loja atualizada com sucesso. Redirecionando...
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Gerais */}
        <Section title="Dados Gerais" icon={<Store size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da Loja MX" required>
              <input
                type="text"
                value={form.lojaMX}
                onChange={(e) => update("lojaMX")(e.target.value)}
                required
                className="input-field"
              />
            </Field>
            <Field label="Número Ritualístico">
              <input
                type="number"
                value={form.numero}
                onChange={(e) => update("numero")(e.target.value)}
                min="0"
                className="input-field"
              />
            </Field>
            <Field label="Potência" required>
              <select
                value={form.potenciaId}
                onChange={(e) => update("potenciaId")(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Selecione a potência</option>
                {potencias.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sigla ? `${p.sigla} - ` : ""}
                    {p.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rito">
              <select
                value={form.ritoId}
                onChange={(e) => update("ritoId")(e.target.value)}
                className="input-field"
              >
                <option value="">Nenhum</option>
                {ritos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.sigla ? `${r.sigla} - ` : ""}
                    {r.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Situação" required>
              <select
                value={form.situacao}
                onChange={(e) => update("situacao")(e.target.value)}
                required
                className="input-field"
              >
                {situacaoOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data de Fundação">
              <input
                type="date"
                value={form.dataFundacao}
                onChange={(e) => update("dataFundacao")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="CNPJ">
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => update("cnpj")(e.target.value)}
                className="input-field"
              />
            </Field>
          </div>
        </Section>

        {/* Contrato SaaS */}
        <Section title="Contrato SaaS" icon={<FileText size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Número do Contrato" required>
              <input
                type="text"
                value={form.contractNumber}
                onChange={(e) => update("contractNumber")(e.target.value)}
                required
                className="input-field"
              />
            </Field>
            <Field label="Mensalidade Válida Até">
              <input
                type="date"
                value={form.mensalidadeValidaAte}
                onChange={(e) => update("mensalidadeValidaAte")(e.target.value)}
                className="input-field"
              />
            </Field>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="mensalidadeAtiva"
                type="checkbox"
                checked={form.mensalidadeAtiva}
                onChange={(e) => update("mensalidadeAtiva")(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background"
              />
              <label htmlFor="mensalidadeAtiva" className="text-sm font-medium text-foreground">
                Mensalidade Ativa
              </label>
            </div>
          </div>
        </Section>

        {/* Valores de Pagamento */}
        <Section title="Valores de Pagamento" icon={<FileText size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Valor da Mensalidade (R$)" required>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valorMensalidade}
                onChange={(e) => update("valorMensalidade")(e.target.value)}
                required
                className="input-field"
              />
            </Field>
            <Field label="Valor da Anuidade (R$)" required>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valorAnuidade}
                onChange={(e) => update("valorAnuidade")(e.target.value)}
                required
                className="input-field"
              />
            </Field>
          </div>
        </Section>

        {/* Contato */}
        <Section title="Contato" icon={<Phone size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do Contato" required>
              <input
                type="text"
                value={form.contatoNome}
                onChange={(e) => update("contatoNome")(e.target.value)}
                required
                className="input-field"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Telefone">
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => update("telefone")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website")(e.target.value)}
                className="input-field"
              />
            </Field>
          </div>
        </Section>

        {/* Endereço */}
        <Section title="Endereço" icon={<MapPin size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Logradouro">
              <input
                type="text"
                value={form.enderecoLogradouro}
                onChange={(e) => update("enderecoLogradouro")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Número">
              <input
                type="text"
                value={form.enderecoNumero}
                onChange={(e) => update("enderecoNumero")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Complemento">
              <input
                type="text"
                value={form.enderecoComplemento}
                onChange={(e) => update("enderecoComplemento")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Bairro">
              <input
                type="text"
                value={form.enderecoBairro}
                onChange={(e) => update("enderecoBairro")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Cidade">
              <input
                type="text"
                value={form.enderecoCidade}
                onChange={(e) => update("enderecoCidade")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="UF">
              <select
                value={form.enderecoUf}
                onChange={(e) => update("enderecoUf")(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione</option>
                {ufOptions.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="CEP">
              <input
                type="text"
                value={form.enderecoCep}
                onChange={(e) => update("enderecoCep")(e.target.value)}
                className="input-field"
              />
            </Field>
          </div>
        </Section>

        {/* Observações */}
        <Section title="Observações">
          <Field label="Observações gerais">
            <textarea
              value={form.observacoes}
              onChange={(e) => update("observacoes")(e.target.value)}
              rows={4}
              className="input-field resize-none"
            />
          </Field>
        </Section>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar Alterações
              </>
            )}
          </button>
          <Link
            href={`/admin/lojas/${loja.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        {icon && <span className="text-emerald-700">{icon}</span>}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div>{children}</div>
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
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-foreground">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
