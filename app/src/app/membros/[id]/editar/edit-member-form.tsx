"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, User, MapPin, Award, Shield } from "lucide-react";
import type { Member } from "@prisma/client";

const ufOptions = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const estadoCivilOptions = [
  { value: "SOLTEIRO", label: "Solteiro" },
  { value: "CASADO", label: "Casado" },
  { value: "DIVORCIADO", label: "Divorciado" },
  { value: "VIUVO", label: "Viúvo" },
  { value: "UNIAO_ESTAVEL", label: "União Estável" },
];

const escolaridadeOptions = [
  { value: "OUTRO", label: "Outro" },
  { value: "PRIMEIRO_GRAU", label: "Ensino Fundamental" },
  { value: "SEGUNDO_GRAU", label: "Ensino Médio" },
  { value: "TERCEIRO_GRAU", label: "Ensino Superior" },
  { value: "POS_GRADUACAO", label: "Pós-Graduação" },
  { value: "MESTRADO", label: "Mestrado" },
  { value: "DOUTORADO", label: "Doutorado" },
  { value: "ESPECIALIZACAO", label: "Especialização" },
];

const situacaoOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "PROPOSTO", label: "Proposto" },
  { value: "ADORMECIDO", label: "Adormecido" },
];

const classeOptions = [
  { value: "MESA", label: "MESA" },
  { value: "EN", label: "EN" },
  { value: "CBCS", label: "CBCS" },
];

const ritoOptions = [
  { value: "REAA", label: "REAA - Rito Escocês Antigo e Aceito" },
  { value: "RER", label: "RER - Rito Escocês Retificado" },
  { value: "EM/YO", label: "EM/YO - Emulação/York" },
  { value: "BRAS", label: "BRAS - Brasileiro" },
  { value: "YORK", label: "YORK - York Americano" },
  { value: "SCHO", label: "SCHO - Schröder" },
  { value: "ADON", label: "ADON - Adonhiramita" },
  { value: "SJO", label: "SJO - São João" },
];

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export default function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nomeCompleto: member.nomeCompleto,
    cpf: member.cpf,
    email: member.email,
    dataNascimento: formatDateForInput(member.dataNascimento),
    pai: member.pai || "",
    mae: member.mae || "",
    naturalCidade: member.naturalCidade || "",
    naturalUf: member.naturalUf || "",
    nacionalidade: member.nacionalidade || "Brasileira",
    estadoCivil: member.estadoCivil || "SOLTEIRO",
    identidadeNumero: member.identidadeNumero || "",
    orgaoEmissor: member.orgaoEmissor || "",
    dataEmissao: formatDateForInput(member.dataEmissao),
    celular: member.celular || "",
    telefoneUrgencia: member.telefoneUrgencia || "",
    enderecoLogradouro: member.enderecoLogradouro || "",
    enderecoCep: member.enderecoCep || "",
    enderecoBairro: member.enderecoBairro || "",
    enderecoCidade: member.enderecoCidade || "",
    enderecoUf: member.enderecoUf || "",
    escolaridade: member.escolaridade || "OUTRO",
    rito: member.rito || "RER",
    dataEntradaLojaAtual: formatDateForInput(member.dataEntradaLojaAtual),
    situacao: member.situacao || "ATIVO",
    class: member.class || "MESA",
    dataMESA: formatDateForInput(member.dataMESA),
    dataEN: formatDateForInput(member.dataEN),
    dataCBCS: formatDateForInput(member.dataCBCS),
    dataIniciacao: formatDateForInput(member.dataIniciacao),
    lojaIniciacaoNome: member.lojaIniciacaoNome || "",
    lojaIniciacaoNumero: member.lojaIniciacaoNumero || "",
    dataPassagem: formatDateForInput(member.dataPassagem),
    lojaPassagemNome: member.lojaPassagemNome || "",
    lojaPassagemNumero: member.lojaPassagemNumero || "",
    dataElevacao: formatDateForInput(member.dataElevacao),
    lojaElevacaoNome: member.lojaElevacaoNome || "",
    lojaElevacaoNumero: member.lojaElevacaoNumero || "",
    dataInstalacao: formatDateForInput(member.dataInstalacao),
    lojaInstalacaoNome: member.lojaInstalacaoNome || "",
    lojaInstalacaoNumero: member.lojaInstalacaoNumero || "",
  });

  const update = (key: string) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/membros/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dataEmissao: form.dataEmissao || null,
          dataEntradaLojaAtual: form.dataEntradaLojaAtual || null,
          dataMESA: form.dataMESA || null,
          dataEN: form.dataEN || null,
          dataCBCS: form.dataCBCS || null,
          dataIniciacao: form.dataIniciacao || null,
          dataPassagem: form.dataPassagem || null,
          dataElevacao: form.dataElevacao || null,
          dataInstalacao: form.dataInstalacao || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar membro");
      }

      setSuccess(true);
      router.push("/membros");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar membro");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pb-16">
      {/* Header */}
      <div className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Editar Membro
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {member.nomeCompleto}
              </p>
            </div>
            <Link
              href="/membros"
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-6xl px-6">
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">Erro</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Sucesso!</p>
              <p className="text-sm text-emerald-700">Membro atualizado com sucesso</p>
            </div>
          )}

          {/* Dados Pessoais */}
          <SectionCard title="Dados Pessoais" icon={User}>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Nome completo" required>
                <input
                  value={form.nomeCompleto}
                  onChange={(e) => update("nomeCompleto")(e.target.value)}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField label="CPF" required>
                <input
                  value={form.cpf}
                  onChange={(e) => update("cpf")(e.target.value)}
                  className="input-field"
                  required
                  disabled
                  title="CPF não pode ser alterado"
                />
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Data de nascimento" required>
                <input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => update("dataNascimento")(e.target.value)}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField label="RG / Identidade">
                <input
                  value={form.identidadeNumero}
                  onChange={(e) => update("identidadeNumero")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Órgão emissor">
                <input
                  value={form.orgaoEmissor}
                  onChange={(e) => update("orgaoEmissor")(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Nacionalidade">
                <input
                  value={form.nacionalidade}
                  onChange={(e) => update("nacionalidade")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Naturalidade - Cidade">
                <input
                  value={form.naturalCidade}
                  onChange={(e) => update("naturalCidade")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Naturalidade - UF">
                <select
                  value={form.naturalUf}
                  onChange={(e) => update("naturalUf")(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecione</option>
                  {ufOptions.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Estado civil">
                <select
                  value={form.estadoCivil}
                  onChange={(e) => update("estadoCivil")(e.target.value)}
                  className="input-field"
                >
                  {estadoCivilOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Escolaridade">
                <select
                  value={form.escolaridade}
                  onChange={(e) => update("escolaridade")(e.target.value)}
                  className="input-field"
                >
                  {escolaridadeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Nome do pai">
                <input
                  value={form.pai}
                  onChange={(e) => update("pai")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Nome da mãe">
                <input
                  value={form.mae}
                  onChange={(e) => update("mae")(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Contato e Endereço */}
          <SectionCard title="Contato e Endereço" icon={MapPin}>
            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email")(e.target.value)}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField label="Celular">
                <input
                  value={form.celular}
                  onChange={(e) => update("celular")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Telefone de urgência">
                <input
                  value={form.telefoneUrgencia}
                  onChange={(e) => update("telefoneUrgencia")(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="mb-4 text-sm font-semibold text-slate-700">
                Endereço Completo
              </h4>

              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <FormField label="Logradouro">
                      <input
                        value={form.enderecoLogradouro}
                        onChange={(e) => update("enderecoLogradouro")(e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                  </div>

                  <FormField label="CEP">
                    <input
                      value={form.enderecoCep}
                      onChange={(e) => update("enderecoCep")(e.target.value)}
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField label="Bairro">
                    <input
                      value={form.enderecoBairro}
                      onChange={(e) => update("enderecoBairro")(e.target.value)}
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="Cidade">
                    <input
                      value={form.enderecoCidade}
                      onChange={(e) => update("enderecoCidade")(e.target.value)}
                      className="input-field"
                    />
                  </FormField>

                  <FormField label="UF">
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
                  </FormField>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Dados Ritualísticos */}
          <SectionCard title="Dados Ritualísticos" icon={Award}>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Rito">
                <select
                  value={form.rito}
                  onChange={(e) => update("rito")(e.target.value)}
                  className="input-field"
                >
                  {ritoOptions.map((rito) => (
                    <option key={rito.value} value={rito.value}>
                      {rito.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Classe (ordem)">
                <select
                  value={form.class}
                  onChange={(e) => update("class")(e.target.value)}
                  className="input-field"
                >
                  {classeOptions.map((classe) => (
                    <option key={classe.value} value={classe.value}>
                      {classe.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Situação">
                <select
                  value={form.situacao}
                  onChange={(e) => update("situacao")(e.target.value)}
                  className="input-field"
                >
                  {situacaoOptions.map((sit) => (
                    <option key={sit.value} value={sit.value}>
                      {sit.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Data de entrada na loja">
                <input
                  type="date"
                  value={form.dataEntradaLojaAtual}
                  onChange={(e) => update("dataEntradaLojaAtual")(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>

            <div className="rounded-lg bg-slate-50 p-6">
              <h4 className="mb-4 text-sm font-semibold text-slate-700">
                Histórico Ritualístico
              </h4>
              <div className="grid gap-6 md:grid-cols-3">
                <FormField label="Data de iniciação">
                  <input
                    type="date"
                    value={form.dataIniciacao}
                    onChange={(e) => update("dataIniciacao")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (nome)">
                  <input
                    value={form.lojaIniciacaoNome}
                    onChange={(e) => update("lojaIniciacaoNome")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (número)">
                  <input
                    value={form.lojaIniciacaoNumero}
                    onChange={(e) => update("lojaIniciacaoNumero")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-3">
                <FormField label="Data de passagem">
                  <input
                    type="date"
                    value={form.dataPassagem}
                    onChange={(e) => update("dataPassagem")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (nome)">
                  <input
                    value={form.lojaPassagemNome}
                    onChange={(e) => update("lojaPassagemNome")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (número)">
                  <input
                    value={form.lojaPassagemNumero}
                    onChange={(e) => update("lojaPassagemNumero")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-3">
                <FormField label="Data de elevação">
                  <input
                    type="date"
                    value={form.dataElevacao}
                    onChange={(e) => update("dataElevacao")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (nome)">
                  <input
                    value={form.lojaElevacaoNome}
                    onChange={(e) => update("lojaElevacaoNome")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (número)">
                  <input
                    value={form.lojaElevacaoNumero}
                    onChange={(e) => update("lojaElevacaoNumero")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-3">
                <FormField label="Data de instalação">
                  <input
                    type="date"
                    value={form.dataInstalacao}
                    onChange={(e) => update("dataInstalacao")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (nome)">
                  <input
                    value={form.lojaInstalacaoNome}
                    onChange={(e) => update("lojaInstalacaoNome")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Loja (número)">
                  <input
                    value={form.lojaInstalacaoNumero}
                    onChange={(e) => update("lojaInstalacaoNumero")(e.target.value)}
                    className="input-field"
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Classes RER */}
          <SectionCard title="Classes do Rito Escocês Retificado" icon={Shield}>
            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Data MESA">
                <input
                  type="date"
                  value={form.dataMESA}
                  onChange={(e) => update("dataMESA")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Data EN">
                <input
                  type="date"
                  value={form.dataEN}
                  onChange={(e) => update("dataEN")(e.target.value)}
                  className="input-field"
                />
              </FormField>

              <FormField label="Data CBCS">
                <input
                  type="date"
                  value={form.dataCBCS}
                  onChange={(e) => update("dataCBCS")(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Botões */}
          <div className="flex justify-end gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Link
              href="/membros"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          </div>
        </div>
      </div>
      <div className="space-y-6 p-8">{children}</div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
