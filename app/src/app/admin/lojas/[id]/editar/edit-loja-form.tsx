"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Store, Phone, MapPin, FileText } from "lucide-react";
import type { Loja } from "@prisma/client";

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
  const [cnpjError, setCnpjError] = useState("");
  const [cepError, setCepError] = useState("");

  const [form, setForm] = useState({
    lojaMX: loja.lojaMX,
    shortName: loja.shortName || "",
    numero: loja.numero?.toString() || "",
    potenciaId: loja.potenciaId,
    ritoId: loja.ritoId || "",
    situacao: loja.situacao,
    dataFundacao: formatDateForInput(loja.dataFundacao),
    contractNumber: loja.contractNumber,
    mensalidadeAtiva: loja.mensalidadeAtiva,
    mensalidadeVencimentoDia: loja.mensalidadeVencimentoDia?.toString() || "",
    valorMensalidade: loja.valorMensalidade?.toString() || "150.00",
    cnpj: loja.cnpj || "",
    razaoSocial: loja.razaoSocial || "",
    nomeFantasia: loja.nomeFantasia || "",
    dataAbertura: formatDateForInput(loja.dataAbertura),
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
    // Dados bancários
    bancoCodigo: loja.bancoCodigo || "",
    bancoNome: loja.bancoNome || "",
    bancoAgencia: loja.bancoAgencia || "",
    bancoAgenciaDigito: loja.bancoAgenciaDigito || "",
    bancoConta: loja.bancoConta || "",
    bancoContaDigito: loja.bancoContaDigito || "",
    bancoTipoConta: loja.bancoTipoConta || "",
    bancoPix: loja.bancoPix || "",
    observacoes: loja.observacoes || "",
  });

  const update = (key: string) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const formatCnpj = (value: string) => {
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
  };

  const handleCnpjChange = (value: string) => {
    setCnpjError("");
    update("cnpj")(formatCnpj(value));
  };

  const handleCnpjBlur = async () => {
    const digits = String(form.cnpj || "").replace(/\D/g, "");
    if (digits.length !== 14) return;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.message || data?.error) {
        setCnpjError(data?.message || "CNPJ n\u00e3o encontrado na base p\u00fablica.");
        return;
      }
      setCnpjError("");
      if (data?.razao_social && !String(form.razaoSocial || "").trim()) {
        update("razaoSocial")(data.razao_social);
      }
      if (data?.nome_fantasia && !String(form.nomeFantasia || "").trim()) {
        update("nomeFantasia")(data.nome_fantasia);
      }
      if (data?.data_inicio_atividade && !form.dataAbertura) {
        update("dataAbertura")(String(data.data_inicio_atividade).slice(0, 10));
      }
    } catch (_error) {
      setCnpjError("N\u00e3o foi poss\u00edvel validar o CNPJ agora.");
    }
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepChange = (value: string) => {
    setCepError("");
    update("enderecoCep")(formatCep(value));
  };

  const handleCepBlur = async () => {
    const digits = String(form.enderecoCep || "").replace(/\D/g, "");
    if (digits.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) {
        setCepError("CEP não encontrado.");
        return;
      }
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      update("enderecoLogradouro")(data.logradouro || "");
      update("enderecoBairro")(data.bairro || "");
      update("enderecoCidade")(data.localidade || "");
      update("enderecoUf")(data.uf || "");
      if (data.complemento && !String(form.enderecoComplemento || "").trim()) {
        update("enderecoComplemento")(data.complemento);
      }
    } catch (_error) {
      setCepError("Não foi possível validar o CEP agora.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!form.shortName.trim()) {
      setError("Nome curto é obrigatório");
      setSubmitting(false);
      return;
    }

    if (!form.contatoNome.trim()) {
      setError("Nome do contato \u00e9 obrigat\u00f3rio");
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
            dataAbertura: form.dataAbertura || null,
            mensalidadeVencimentoDia: form.mensalidadeVencimentoDia ? parseInt(form.mensalidadeVencimentoDia) : null,
            ritoId: form.ritoId || null,
            valorMensalidade: parseFloat(form.valorMensalidade),
            mensalidadeRegular: form.mensalidadeRegular
              ? parseFloat(form.mensalidadeRegular)
              : undefined,
            mensalidadeFiliado: form.mensalidadeFiliado
              ? parseFloat(form.mensalidadeFiliado)
              : undefined,
            mensalidadeRemido: form.mensalidadeRemido
              ? parseFloat(form.mensalidadeRemido)
              : undefined,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar loja";
      setError(message);
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
      <form onSubmit={handleSubmit} className="space-y-6 form-br-forest">
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
            <Field label="Nome curto (Short name)" required>
              <input
                type="text"
                value={form.shortName}
                onChange={(e) => update("shortName")(e.target.value)}
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
            <Field label="Prefeitura" required>
              <select
                value={form.potenciaId}
                onChange={(e) => update("potenciaId")(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Selecione a prefeitura</option>
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
                onChange={(e) => handleCnpjChange(e.target.value)}
                onBlur={handleCnpjBlur}
                className="input-field"
                placeholder="00.000.000/0000-00"
              />
              {cnpjError && (
                <span className="text-xs text-red-600">{cnpjError}</span>
              )}
            </Field>
            <Field label="Razão social">
              <input
                type="text"
                value={form.razaoSocial}
                onChange={(e) => update("razaoSocial")(e.target.value)}
                className="input-field"
                placeholder="Ex: Associação Maçônica XYZ"
              />
            </Field>
            <Field label="Nome fantasia">
              <input
                type="text"
                value={form.nomeFantasia}
                onChange={(e) => update("nomeFantasia")(e.target.value)}
                className="input-field"
                placeholder="Ex: ARLSFBU4"
              />
            </Field>
            <Field label="Data de abertura">
              <input
                type="date"
                value={form.dataAbertura}
                onChange={(e) => update("dataAbertura")(e.target.value)}
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
            <Field label="Dia de vencimento da mensalidade">
              <input
                type="number"
                min="1"
                max="31"
                value={form.mensalidadeVencimentoDia}
                onChange={(e) => update("mensalidadeVencimentoDia")(e.target.value)}
                className="input-field"
                placeholder="Ex: 10 (todo dia 10 do mês)"
              />
            </Field>
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
            <Field label="Mensalidade regular (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.mensalidadeRegular}
                onChange={(e) => update("mensalidadeRegular")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Mensalidade filiado (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.mensalidadeFiliado}
                onChange={(e) => update("mensalidadeFiliado")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Mensalidade remido (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.mensalidadeRemido}
                onChange={(e) => update("mensalidadeRemido")(e.target.value)}
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

        {/* Dados Bancários */}
        <Section title="Dados Bancários" icon={<FileText size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Banco">
              <input
                type="text"
                value={form.bancoNome}
                onChange={(e) => update("bancoNome")(e.target.value)}
                className="input-field"
                placeholder="Ex: Banco do Brasil"
              />
            </Field>
            <Field label="Código do banco">
              <input
                type="text"
                value={form.bancoCodigo}
                onChange={(e) => update("bancoCodigo")(e.target.value)}
                className="input-field"
                placeholder="Ex: 001, 237, 341"
              />
            </Field>
            <Field label="Agência">
              <input
                type="text"
                value={form.bancoAgencia}
                onChange={(e) => update("bancoAgencia")(e.target.value)}
                className="input-field"
                placeholder="Ex: 1234"
              />
            </Field>
            <Field label="Dígito da agência">
              <input
                type="text"
                value={form.bancoAgenciaDigito}
                onChange={(e) => update("bancoAgenciaDigito")(e.target.value)}
                className="input-field"
                placeholder="Ex: 5"
                maxLength={1}
              />
            </Field>
            <Field label="Conta">
              <input
                type="text"
                value={form.bancoConta}
                onChange={(e) => update("bancoConta")(e.target.value)}
                className="input-field"
                placeholder="Ex: 12345678"
              />
            </Field>
            <Field label="Dígito da conta">
              <input
                type="text"
                value={form.bancoContaDigito}
                onChange={(e) => update("bancoContaDigito")(e.target.value)}
                className="input-field"
                placeholder="Ex: 9"
              />
            </Field>
            <Field label="Tipo de conta">
              <select
                value={form.bancoTipoConta}
                onChange={(e) => update("bancoTipoConta")(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione</option>
                <option value="CORRENTE">Corrente</option>
                <option value="POUPANCA">Poupança</option>
              </select>
            </Field>
            <Field label="Chave PIX">
              <input
                type="text"
                value={form.bancoPix}
                onChange={(e) => update("bancoPix")(e.target.value)}
                className="input-field"
                placeholder="CNPJ, e-mail, telefone ou chave aleatória"
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
            <Field label="E-mail">
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
            <Field label="Site">
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
        
        <Section title="Endere\u00e7o" icon={<MapPin size={18} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CEP">
              <input
                type="text"
                value={form.enderecoCep}
                onChange={(e) => handleCepChange(e.target.value)}
                onBlur={handleCepBlur}
                className="input-field"
              />
              {cepError && (
                <span className="text-xs text-red-600">{cepError}</span>
              )}
            </Field>
            <Field label="Logradouro">
              <input
                type="text"
                value={form.enderecoLogradouro}
                onChange={(e) => update("enderecoLogradouro")(e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="N\u00famero">
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
        <div className="flex items-center gap-3 border-t-2 border-border pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
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
            className="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-border bg-white px-8 text-sm font-semibold text-foreground transition hover:bg-muted hover:border-gray-400"
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
    <div className="space-y-4 rounded-lg border-2 border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {icon && <span className="text-emerald-600">{icon}</span>}
        <div className="h-1 w-1 rounded-full bg-emerald-600"></div>
        <h3 className="text-base font-semibold tracking-tight text-br-deep">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
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
    <label className="flex flex-col gap-1.5 text-sm text-br-deep">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

