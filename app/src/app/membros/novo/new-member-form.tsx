"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  User,
  MapPin,
  Award,
  History,
  ChevronRight,
  CheckCircle2,
  Circle,
  Shield,
} from "lucide-react";

export type LojaOption = {
  id: string;
  tenantId: string;
  label: string;
  numero: number | null;
  contractNumber: string;
  validade: string | null;
  cidadeUf?: string;
};

type FormState = {
  tenantId: string;
  lojaId: string;
  lojaAtualNome: string;
  lojaAtualNumero: string;
  dataEntradaLojaAtual: string;
  rito: string;
  dataAdmissao: string;
  tipoAdmissao: string;
  numeroFiliado: string;
  nomeCompleto: string;
  dataNascimento: string;
  pai: string;
  mae: string;
  naturalCidade: string;
  naturalUf: string;
  nacionalidade: string;
  estadoCivil: string;
  identidadeNumero: string;
  orgaoEmissor: string;
  dataEmissao: string;
  class: string;
  cpf: string;
  email: string;
  celular: string;
  telefoneUrgencia: string;
  enderecoLogradouro: string;
  enderecoCep: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  escolaridade: string;
  dataIniciacao: string;
  lojaIniciacaoNome: string;
  lojaIniciacaoNumero: string;
  potenciaIniciacaoId: string;
  dataPassagem: string;
  lojaPassagemNome: string;
  lojaPassagemNumero: string;
  potenciaPassagemId: string;
  dataElevacao: string;
  lojaElevacaoNome: string;
  lojaElevacaoNumero: string;
  potenciaElevacaoId: string;
  dataInstalacao: string;
  lojaInstalacaoNome: string;
  lojaInstalacaoNumero: string;
  potenciaInstalacaoId: string;
  situacao: string;
  fotoUrl: string;
  dataMESA: string;
  dataEN: string;
  dataCBCS: string;
};

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

const tipoAdmissaoOptions = [
  { value: "INIC", label: "Iniciação" },
  { value: "FILI", label: "Filiação" },
  { value: "READ", label: "Readmissão" },
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

type StepId = "personal" | "contact" | "ritual" | "history" | "rer";

const steps: { id: StepId; title: string; icon: React.ComponentType<any> }[] = [
  { id: "personal", title: "Dados Pessoais", icon: User },
  { id: "contact", title: "Contato e Endereço", icon: MapPin },
  { id: "ritual", title: "Dados Ritualísticos", icon: Award },
  { id: "history", title: "Histórico Ritualístico", icon: History },
  { id: "rer", title: "Classes RER", icon: Shield },
];

export function NewMemberForm({ lojas }: { lojas: LojaOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const initialState = useMemo<FormState>(
    () => ({
      tenantId: "",
      lojaId: "",
      lojaAtualNome: "",
      lojaAtualNumero: "",
      dataEntradaLojaAtual: "",
      rito: ritoOptions[1].value,
      dataAdmissao: "",
      tipoAdmissao: tipoAdmissaoOptions[0].value,
      numeroFiliado: "",
      nomeCompleto: "",
      dataNascimento: "",
      pai: "",
      mae: "",
      naturalCidade: "",
      naturalUf: "",
      nacionalidade: "Brasileira",
      estadoCivil: estadoCivilOptions[0].value,
      identidadeNumero: "",
      orgaoEmissor: "",
      dataEmissao: "",
      cpf: "",
      email: "",
      celular: "",
      telefoneUrgencia: "",
      enderecoLogradouro: "",
      enderecoCep: "",
      enderecoBairro: "",
      enderecoCidade: "",
      enderecoUf: "",
      escolaridade: escolaridadeOptions[0].value,
      dataIniciacao: "",
      lojaIniciacaoNome: "",
      lojaIniciacaoNumero: "",
      potenciaIniciacaoId: "",
      dataPassagem: "",
      lojaPassagemNome: "",
      lojaPassagemNumero: "",
      potenciaPassagemId: "",
      dataElevacao: "",
      lojaElevacaoNome: "",
      lojaElevacaoNumero: "",
      potenciaElevacaoId: "",
      dataInstalacao: "",
      lojaInstalacaoNome: "",
      lojaInstalacaoNumero: "",
      potenciaInstalacaoId: "",
      situacao: situacaoOptions[0].value,
      class: classeOptions[0].value,
      fotoUrl: "",
      dataMESA: "",
      dataEN: "",
      dataCBCS: "",
    }),
    []
  );

  const [form, setForm] = useState<FormState>(initialState);

  const lojaMap = useMemo(() => {
    const entries = lojas.map((loja) => [loja.id, loja]);
    return Object.fromEntries(entries) as Record<string, LojaOption>;
  }, [lojas]);

  const selectedLoja = form.lojaId ? lojaMap[form.lojaId] : undefined;

  const update = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleLojaChange = (lojaId: string) => {
    const loja = lojaMap[lojaId];
    setForm((f) => ({
      ...f,
      lojaId,
      tenantId: loja?.tenantId ?? "",
      lojaAtualNome: loja?.label ?? "",
      lojaAtualNumero: loja?.numero ? loja.numero.toString() : "",
    }));
    // Limpa erro de loja ao selecionar
    if (lojaId) {
      setErrors((e) => {
        const newErrors = { ...e };
        delete newErrors.lojaId;
        delete newErrors.tenantId;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validação de campos obrigatórios
    if (!form.tenantId || !form.lojaId) {
      newErrors.lojaId = "Selecione uma loja";
    }
    if (!form.nomeCompleto.trim()) {
      newErrors.nomeCompleto = "Nome completo é obrigatório";
    }
    if (!form.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (form.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email inválido";
    }
    if (!form.dataNascimento) {
      newErrors.dataNascimento = "Data de nascimento é obrigatória";
    }
    if (!form.dataAdmissao) {
      newErrors.dataAdmissao = "Data de admissão é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marca todos os campos como tocados
    const allFields = {
      tenantId: true,
      lojaId: true,
      nomeCompleto: true,
      cpf: true,
      email: true,
      dataNascimento: true,
      dataAdmissao: true,
    };
    setTouched(allFields);

    // Valida formulário
    if (!validateForm()) {
      setMessage("Por favor, preencha todos os campos obrigatórios corretamente");
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/membros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar membro");
      }

      setMessage("Membro cadastrado com sucesso!");
      setTimeout(() => {
        router.push("/membros");
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao cadastrar membro:", error);
      setMessage(error.message || "Erro ao cadastrar membro. Tente novamente.");
      setSubmitting(false);
    }
  };

  const hasActiveLojas = lojas.length > 0;

  const getStepIndex = (stepId: StepId) => steps.findIndex((s) => s.id === stepId);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pb-16">
      {/* Header */}
      <div className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Novo Membro
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Cadastre um novo membro na loja selecionada
              </p>
            </div>
            <Link
              href="/membros"
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="border-b border-border/50 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = idx < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <div
                        className={`text-sm font-semibold ${
                          isActive
                            ? "text-emerald-700"
                            : isCompleted
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="mx-4 h-0.5 flex-1 bg-slate-200">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? "bg-emerald-600" : "bg-transparent"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert for no active lojas */}
      {!hasActiveLojas && (
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <Circle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  Nenhuma loja ativa disponível
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  Para cadastrar membros, é necessário ter pelo menos uma loja com
                  mensalidade ativa. Acesse{" "}
                  <Link
                    href="/admin/lojas"
                    className="font-semibold underline underline-offset-2"
                  >
                    Administração → Lojas
                  </Link>{" "}
                  para gerenciar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-6xl px-6">
        <fieldset disabled={!hasActiveLojas} className="space-y-6">
          {/* Section 1: Dados Pessoais */}
          {currentStep === "personal" && (
            <div className="space-y-6">
              <SectionCard
                title="Dados Pessoais"
                description="Informações básicas e documentação do membro"
                icon={User}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Nome completo"
                    required
                    error={touched.nomeCompleto ? errors.nomeCompleto : undefined}
                  >
                    <input
                      value={form.nomeCompleto}
                      onChange={(e) => {
                        update("nomeCompleto")(e.target.value);
                        if (touched.nomeCompleto) validateForm();
                      }}
                      onBlur={() => handleBlur("nomeCompleto")}
                      className={`input-field ${touched.nomeCompleto && errors.nomeCompleto ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="Digite o nome completo"
                    />
                  </FormField>

                  <FormField
                    label="CPF"
                    required
                    error={touched.cpf ? errors.cpf : undefined}
                  >
                    <input
                      value={form.cpf}
                      onChange={(e) => {
                        update("cpf")(e.target.value);
                        if (touched.cpf) validateForm();
                      }}
                      onBlur={() => handleBlur("cpf")}
                      className={`input-field ${touched.cpf && errors.cpf ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="000.000.000-00"
                    />
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    label="Data de Nascimento"
                    required
                    error={touched.dataNascimento ? errors.dataNascimento : undefined}
                  >
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => {
                        update("dataNascimento")(e.target.value);
                        if (touched.dataNascimento) validateForm();
                      }}
                      onBlur={() => handleBlur("dataNascimento")}
                      className={`input-field ${touched.dataNascimento && errors.dataNascimento ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                  </FormField>

                  <FormField label="RG / Identidade">
                    <input
                      value={form.identidadeNumero}
                      onChange={(e) => update("identidadeNumero")(e.target.value)}
                      className="input-field"
                      placeholder="00.000.000-0"
                    />
                  </FormField>

                  <FormField label="Órgão emissor">
                    <input
                      value={form.orgaoEmissor}
                      onChange={(e) => update("orgaoEmissor")(e.target.value)}
                      className="input-field"
                      placeholder="SSP-SP"
                    />
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField label="Nacionalidade">
                    <input
                      value={form.nacionalidade}
                      onChange={(e) => update("nacionalidade")(e.target.value)}
                      className="input-field"
                      placeholder="Brasileira"
                    />
                  </FormField>

                  <FormField label="Naturalidade - Cidade">
                    <input
                      value={form.naturalCidade}
                      onChange={(e) => update("naturalCidade")(e.target.value)}
                      className="input-field"
                      placeholder="São Paulo"
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
                  <FormField label="Nome do Pai">
                    <input
                      value={form.pai}
                      onChange={(e) => update("pai")(e.target.value)}
                      className="input-field"
                      placeholder="Nome completo do pai"
                    />
                  </FormField>

                  <FormField label="Nome da Mãe">
                    <input
                      value={form.mae}
                      onChange={(e) => update("mae")(e.target.value)}
                      className="input-field"
                      placeholder="Nome completo da mãe"
                    />
                  </FormField>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Section 2: Contato e Endereço */}
          {currentStep === "contact" && (
            <div className="space-y-6">
              <SectionCard
                title="Contato e Endereço"
                description="Informações de contato e localização"
                icon={MapPin}
              >
                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    label="Email"
                    required
                    error={touched.email ? errors.email : undefined}
                  >
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        update("email")(e.target.value);
                        if (touched.email) validateForm();
                      }}
                      onBlur={() => handleBlur("email")}
                      className={`input-field ${touched.email && errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="email@exemplo.com"
                    />
                  </FormField>

                  <FormField label="Celular">
                    <input
                      value={form.celular}
                      onChange={(e) => update("celular")(e.target.value)}
                      className="input-field"
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>

                  <FormField label="Telefone de Emergência">
                    <input
                      value={form.telefoneUrgencia}
                      onChange={(e) => update("telefoneUrgencia")(e.target.value)}
                      className="input-field"
                      placeholder="(00) 00000-0000"
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
                            onChange={(e) =>
                              update("enderecoLogradouro")(e.target.value)
                            }
                            className="input-field"
                            placeholder="Rua, Avenida, etc."
                          />
                        </FormField>
                      </div>

                      <FormField label="CEP">
                        <input
                          value={form.enderecoCep}
                          onChange={(e) => update("enderecoCep")(e.target.value)}
                          className="input-field"
                          placeholder="00000-000"
                        />
                      </FormField>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <FormField label="Bairro">
                        <input
                          value={form.enderecoBairro}
                          onChange={(e) => update("enderecoBairro")(e.target.value)}
                          className="input-field"
                          placeholder="Nome do bairro"
                        />
                      </FormField>

                      <FormField label="Cidade">
                        <input
                          value={form.enderecoCidade}
                          onChange={(e) => update("enderecoCidade")(e.target.value)}
                          className="input-field"
                          placeholder="Nome da cidade"
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
            </div>
          )}

          {/* Section 3: Dados Ritualísticos */}
          {currentStep === "ritual" && (
            <div className="space-y-6">
              <SectionCard
                title="Dados Ritualísticos"
                description="Informações sobre loja atual e admissão"
                icon={Award}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Loja"
                    required
                    error={touched.lojaId ? errors.lojaId : undefined}
                  >
                    <select
                      value={form.lojaId}
                      onChange={(e) => {
                        handleLojaChange(e.target.value);
                        if (touched.lojaId) validateForm();
                      }}
                      onBlur={() => handleBlur("lojaId")}
                      className={`input-field ${touched.lojaId && errors.lojaId ? "border-red-500 focus:border-red-500" : ""}`}
                    >
                      <option value="">Selecione a loja</option>
                      {lojas.map((loja) => (
                        <option key={loja.id} value={loja.id}>
                          {loja.label}
                          {loja.numero ? ` · Nº ${loja.numero}` : ""} ·{" "}
                          {loja.contractNumber}
                        </option>
                      ))}
                    </select>
                    {selectedLoja && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Contrato {selectedLoja.contractNumber} — validade{" "}
                        {selectedLoja.validade
                          ? new Intl.DateTimeFormat("pt-BR").format(
                              new Date(selectedLoja.validade)
                            )
                          : "sem data"}{" "}
                        {selectedLoja.cidadeUf ? `· ${selectedLoja.cidadeUf}` : ""}
                      </p>
                    )}
                  </FormField>

                  <FormField label="Data de entrada na loja">
                    <input
                      type="date"
                      value={form.dataEntradaLojaAtual}
                      onChange={(e) =>
                        update("dataEntradaLojaAtual")(e.target.value)
                      }
                      className="input-field"
                    />
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField label="Rito no Simbolismo">
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

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    label="Data de admissão"
                    required
                    error={touched.dataAdmissao ? errors.dataAdmissao : undefined}
                  >
                    <input
                      type="date"
                      value={form.dataAdmissao}
                      onChange={(e) => {
                        update("dataAdmissao")(e.target.value);
                        if (touched.dataAdmissao) validateForm();
                      }}
                      onBlur={() => handleBlur("dataAdmissao")}
                      className={`input-field ${touched.dataAdmissao && errors.dataAdmissao ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                  </FormField>

                  <FormField label="Tipo de admissão">
                    <select
                      value={form.tipoAdmissao}
                      onChange={(e) => update("tipoAdmissao")(e.target.value)}
                      className="input-field"
                    >
                      {tipoAdmissaoOptions.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Número de filiado">
                    <input
                      value={form.numeroFiliado}
                      onChange={(e) => update("numeroFiliado")(e.target.value)}
                      className="input-field"
                      placeholder="000"
                    />
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
                </div>
              </SectionCard>
            </div>
          )}

          {/* Section 4: Histórico Ritualístico */}
          {currentStep === "history" && (
            <div className="space-y-6">
              <SectionCard
                title="Histórico Ritualístico"
                description="Registro das cerimônias e datas importantes"
                icon={History}
              >
                {/* Iniciação */}
                <div className="rounded-lg bg-emerald-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      1
                    </span>
                    Recepção de Aprendiz
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
                        onChange={(e) =>
                          update("lojaIniciacaoNome")(e.target.value)
                        }
                        className="input-field"
                        placeholder="Nome da loja"
                      />
                    </FormField>
                    <FormField label="Loja (número)">
                      <input
                        value={form.lojaIniciacaoNumero}
                        onChange={(e) =>
                          update("lojaIniciacaoNumero")(e.target.value)
                        }
                        className="input-field"
                        placeholder="000"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Passagem */}
                <div className="rounded-lg bg-blue-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      2
                    </span>
                    Recepção de Companheiro
                  </h4>
                  <div className="grid gap-6 md:grid-cols-3">
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
                        onChange={(e) =>
                          update("lojaPassagemNome")(e.target.value)
                        }
                        className="input-field"
                        placeholder="Nome da loja"
                      />
                    </FormField>
                    <FormField label="Loja (número)">
                      <input
                        value={form.lojaPassagemNumero}
                        onChange={(e) =>
                          update("lojaPassagemNumero")(e.target.value)
                        }
                        className="input-field"
                        placeholder="000"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Elevação */}
                <div className="rounded-lg bg-amber-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                      3
                    </span>
                    Recepção de Mestre
                  </h4>
                  <div className="grid gap-6 md:grid-cols-3">
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
                        onChange={(e) =>
                          update("lojaElevacaoNome")(e.target.value)
                        }
                        className="input-field"
                        placeholder="Nome da loja"
                      />
                    </FormField>
                    <FormField label="Loja (número)">
                      <input
                        value={form.lojaElevacaoNumero}
                        onChange={(e) =>
                          update("lojaElevacaoNumero")(e.target.value)
                        }
                        className="input-field"
                        placeholder="000"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Instalação */}
                <div className="rounded-lg bg-purple-50/50 p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-purple-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      4
                    </span>
                    Instalação
                  </h4>
                  <div className="grid gap-6 md:grid-cols-3">
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
                        onChange={(e) =>
                          update("lojaInstalacaoNome")(e.target.value)
                        }
                        className="input-field"
                        placeholder="Nome da loja"
                      />
                    </FormField>
                    <FormField label="Loja (número)">
                      <input
                        value={form.lojaInstalacaoNumero}
                        onChange={(e) =>
                          update("lojaInstalacaoNumero")(e.target.value)
                        }
                        className="input-field"
                        placeholder="000"
                      />
                    </FormField>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Section 5: Classes RER */}
          {currentStep === "rer" && (
            <div className="space-y-6">
              <SectionCard
                title="Classes do Rito Escocês Retificado"
                description="Datas de recepção nas classes superiores do RER"
                icon={Shield}
              >
                <div className="space-y-6">
                  {/* MESA - Mestre de Santo André */}
                  <div className="rounded-lg bg-emerald-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        I
                      </span>
                      Recepção como Mestre de Santo André (MESA)
                    </h4>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField label="Data de recepção MESA">
                        <input
                          type="date"
                          value={form.dataMESA}
                          onChange={(e) => update("dataMESA")(e.target.value)}
                          className="input-field"
                        />
                      </FormField>
                      <div className="flex items-center rounded-lg bg-emerald-100 px-4 py-3">
                        <p className="text-xs text-emerald-800">
                          <strong>MESA:</strong> Primeira classe da Ordem Interior do RER, também conhecida como Mestre de Santo André.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* EN - Escudeiro Noviço */}
                  <div className="rounded-lg bg-blue-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        II
                      </span>
                      Recepção como Escudeiro Noviço (EN)
                    </h4>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField label="Data de recepção EN">
                        <input
                          type="date"
                          value={form.dataEN}
                          onChange={(e) => update("dataEN")(e.target.value)}
                          className="input-field"
                        />
                      </FormField>
                      <div className="flex items-center rounded-lg bg-blue-100 px-4 py-3">
                        <p className="text-xs text-blue-800">
                          <strong>EN:</strong> Segunda classe da Ordem Interior, período probatório de um ano antes da Armadura.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CBCS - Cavaleiro Benfeitor da Cidade Santa */}
                  <div className="rounded-lg bg-purple-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-purple-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        III
                      </span>
                      Armadura como Cavaleiro Benfeitor da Cidade Santa (CBCS)
                    </h4>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField label="Data de armadura CBCS">
                        <input
                          type="date"
                          value={form.dataCBCS}
                          onChange={(e) => update("dataCBCS")(e.target.value)}
                          className="input-field"
                        />
                      </FormField>
                      <div className="flex items-center rounded-lg bg-purple-100 px-4 py-3">
                        <p className="text-xs text-purple-800">
                          <strong>CBCS:</strong> Terceira e última classe da Ordem Interior, conferida após período probatório como EN.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-600">
                      <strong>Observação:</strong> Estes campos são opcionais e específicos para membros que participam da Ordem Interior do Rito Escocês Retificado. Deixe em branco caso o membro não possua essas recepções.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Validation Error Alert */}
          {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                  <Circle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-900">
                    Campos obrigatórios não preenchidos
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    Preencha todos os campos obrigatórios antes de salvar.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-600">
                    {Object.entries(errors).map(([key, error]) => (
                      <li key={key}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                const currentIdx = getStepIndex(currentStep);
                if (currentIdx > 0) {
                  setCurrentStep(steps[currentIdx - 1].id);
                }
              }}
              disabled={currentStepIndex === 0}
              className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <div className="flex items-center gap-3">
              {message && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  message.includes("sucesso")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </div>
              )}

              {currentStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(steps[currentStepIndex + 1].id);
                  }}
                  className="flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-xl"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !hasActiveLojas}
                  className="flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Salvar Membro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
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
            <p className="text-sm text-slate-600">{description}</p>
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
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}
