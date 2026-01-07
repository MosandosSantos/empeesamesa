"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";

type Potencia = {
  id: string;
  nome: string;
  sigla: string | null;
};

type Rito = {
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
  ritos: Rito[];
};

const initialState: FormState = { error: null };

export function LojaForm({ action, potencias, ritos }: LojaFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [dataAbertura, setDataAbertura] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpjError, setCnpjError] = useState("");
  const [cepError, setCepError] = useState("");
  const [enderecoCep, setEnderecoCep] = useState("");
  const [enderecoLogradouro, setEnderecoLogradouro] = useState("");
  const [enderecoNumero, setEnderecoNumero] = useState("");
  const [enderecoComplemento, setEnderecoComplemento] = useState("");
  const [enderecoBairro, setEnderecoBairro] = useState("");
  const [enderecoCidade, setEnderecoCidade] = useState("");
  const [enderecoUf, setEnderecoUf] = useState("");

  const handleCnpjChange = (value: string) => {
    setCnpjError("");
    setCnpj(formatCnpj(value));
  };

  const handleCnpjBlur = async () => {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.message || data?.error) {
        setCnpjError(data?.message || "CNPJ nao encontrado na base publica.");
        return;
      }
      setCnpjError("");
      if (data?.razao_social && !razaoSocial.trim()) setRazaoSocial(data.razao_social);
      if (data?.nome_fantasia && !nomeFantasia.trim()) setNomeFantasia(data.nome_fantasia);
      if (data?.data_inicio_atividade && !dataAbertura) {
        setDataAbertura(String(data.data_inicio_atividade).slice(0, 10));
      }
    } catch (_error) {
      setCnpjError("Nao foi possivel validar o CNPJ agora.");
    }
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepChange = (value: string) => {
    setCepError("");
    setEnderecoCep(formatCep(value));
  };

  const handleCepBlur = async () => {
    const digits = enderecoCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) {
        setCepError("CEP n?o encontrado.");
        return;
      }
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP n?o encontrado.");
        return;
      }

      setEnderecoLogradouro(data.logradouro || "");
      setEnderecoBairro(data.bairro || "");
      setEnderecoCidade(data.localidade || "");
      setEnderecoUf(data.uf || "");
      if (data.complemento) {
        setEnderecoComplemento(data.complemento);
      }
    } catch (_error) {
      setCepError("N?o foi poss?vel validar o CEP agora.");
    }
  };

  return (
    <form action={formAction} className="space-y-6 form-br-forest">
      {state.error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <Section title="Informações do Contrato">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Linha 1: Número do contrato e Nome do responsável */}
          <Field label="Número do contrato" required>
            <input
              name="contractNumber"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="SAAS-2025-XXXX"
              required
            />
          </Field>
          <Field label="Nome do responsável" required>
            <input
              name="contatoNome"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: João da Silva Santos"
              required
            />
          </Field>

          {/* Linha 2: Nome da organização (toda a linha) */}
          <div className="md:col-span-2">
            <Field label="Nome da organização (tenant)" required>
              <input
                name="tenantName"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
                placeholder="Ex: Loja Aurora - REAA"
                required
              />
            </Field>
          </div>

          {/* Linha 3: Telefone e E-mail */}
          <Field label="Telefone" required>
            <input
              name="telefone"
              type="tel"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: (48) 99999-9999"
              required
            />
          </Field>
          <Field label="E-mail">
            <input
              name="email"
              type="email"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: contato@loja.org.br"
            />
          </Field>

          {/* Linha 4: Valor, Data de vencimento e Ativo */}
          <Field label="Valor por membro (R$)" required>
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
          <Field label="Dia de vencimento da mensalidade">
            <input
              name="mensalidadeVencimentoDia"
              type="number"
              min="1"
              max="31"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 10 (todo dia 10 do mês)"
            />
          </Field>

          {/* Checkbox Mensalidade ativa */}
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

      <Section title="Dados da Loja">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da Loja (Mesa Extraordinária)" required>
            <input
              name="lojaMX"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Cavaleiros da Luz e da Virtude"
              required
            />
          </Field>
          <Field label="Potência" required>
            <select
              name="potenciaId"
              required
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="">Selecione a potência</option>
              {potencias.map((potencia) => (
                <option key={potencia.id} value={potencia.id}>
                  {potencia.sigla ? `${potencia.sigla} - ` : ""}
                  {potencia.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Número (ritualístico)">
            <input
              name="numero"
              type="number"
              min="0"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 22"
            />
          </Field>
          <Field label="Rito">
            <select
              name="ritoId"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="">Selecione o rito</option>
              {ritos.map((rito) => (
                <option key={rito.id} value={rito.id}>
                  {rito.nome}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Endereço da Loja">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CEP">
            <input
              name="enderecoCep"
              value={enderecoCep}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 88000-000"
              maxLength={9}
            />
            {cepError && (
              <span className="text-xs text-red-600">{cepError}</span>
            )}
          </Field>
          <Field label="Logradouro">
            <input
              name="enderecoLogradouro"
              value={enderecoLogradouro}
              onChange={(e) => setEnderecoLogradouro(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Rua das Flores"
            />
          </Field>
          <Field label="Número">
            <input
              name="enderecoNumero"
              value={enderecoNumero}
              onChange={(e) => setEnderecoNumero(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 123"
            />
          </Field>
          <Field label="Complemento">
            <input
              name="enderecoComplemento"
              value={enderecoComplemento}
              onChange={(e) => setEnderecoComplemento(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Sala 02"
            />
          </Field>
          <Field label="Bairro">
            <input
              name="enderecoBairro"
              value={enderecoBairro}
              onChange={(e) => setEnderecoBairro(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Centro"
            />
          </Field>
          <Field label="Cidade">
            <input
              name="enderecoCidade"
              value={enderecoCidade}
              onChange={(e) => setEnderecoCidade(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Florianópolis"
            />
          </Field>
          <Field label="UF">
            <input
              name="enderecoUf"
              value={enderecoUf}
              onChange={(e) => setEnderecoUf(e.target.value.toUpperCase())}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: SC"
              maxLength={2}
            />
          </Field>
        </div>
      </Section>

      <Section title="Dados do CNPJ">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CNPJ">
            <input
              name="cnpj"
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => handleCnpjChange(e.target.value)}
              onBlur={handleCnpjBlur}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
            {cnpjError && (
              <span className="text-xs text-red-600">{cnpjError}</span>
            )}
          </Field>
          <Field label="Razão social">
            <input
              name="razaoSocial"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Associação Maçônica XYZ"
            />
          </Field>
          <Field label="Nome fantasia">
            <input
              name="nomeFantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: ARLSFBU4"
            />
          </Field>
          <Field label="Data de abertura">
            <input
              name="dataAbertura"
              type="date"
              value={dataAbertura}
              onChange={(e) => setDataAbertura(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      <Section title="Dados Bancários">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Banco">
            <input
              name="bancoNome"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: Banco do Brasil"
            />
          </Field>
          <Field label="Código do banco">
            <input
              name="bancoCodigo"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 001, 237, 341"
            />
          </Field>
          <Field label="Agência">
            <input
              name="bancoAgencia"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 1234"
            />
          </Field>
          <Field label="Dígito da agência">
            <input
              name="bancoAgenciaDigito"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 5"
              maxLength={1}
            />
          </Field>
          <Field label="Conta">
            <input
              name="bancoConta"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 12345678"
            />
          </Field>
          <Field label="Dígito da conta">
            <input
              name="bancoContaDigito"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Ex: 9"
            />
          </Field>
          <Field label="Tipo de conta">
            <select
              name="bancoTipoConta"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
            >
              <option value="">Selecione</option>
              <option value="CORRENTE">Corrente</option>
              <option value="POUPANCA">Poupança</option>
            </select>
          </Field>
          <Field label="Chave PIX">
            <input
              name="bancoPix"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="CNPJ, e-mail, telefone ou chave aleatória"
            />
          </Field>
        </div>
      </Section>

      <Section title="Observações">
        <Field label="Observações gerais">
          <textarea
            name="observacoes"
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none resize-none"
            placeholder="Informações adicionais sobre a loja"
          />
        </Field>
      </Section>

      

      <div className="flex items-center gap-3 border-t-2 border-border pt-6">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-8 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg"
        >
          Cadastrar loja
        </button>
        <a
          href="/admin/lojas"
          className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-border bg-white px-8 text-sm font-semibold text-foreground transition hover:bg-muted hover:border-gray-400"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border-2 border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
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
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-br-deep">
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
