"use client";

import { useActionState, useState } from "react";

type PotenciaFormState = {
  error: string | null;
};

type PotenciaFormData = {
  nome: string;
  sigla?: string | null;
  email?: string | null;
  telefone?: string | null;
  website?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  enderecoCep?: string | null;
  observacoes?: string | null;
};

type PotenciaFormProps = {
  action: (prevState: PotenciaFormState, formData: FormData) => Promise<PotenciaFormState>;
  initialData?: PotenciaFormData;
  submitLabel: string;
  cancelHref?: string;
  hiddenFields?: Record<string, string>;
};

const initialState: PotenciaFormState = { error: null };

export function PotenciaForm({
  action,
  initialData,
  submitLabel,
  cancelHref,
  hiddenFields,
}: PotenciaFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [cep, setCep] = useState(initialData?.enderecoCep ?? "");
  const [logradouro, setLogradouro] = useState(initialData?.enderecoLogradouro ?? "");
  const [numero, setNumero] = useState(initialData?.enderecoNumero ?? "");
  const [complemento, setComplemento] = useState(initialData?.enderecoComplemento ?? "");
  const [bairro, setBairro] = useState(initialData?.enderecoBairro ?? "");
  const [cidade, setCidade] = useState(initialData?.enderecoCidade ?? "");
  const [uf, setUf] = useState(initialData?.enderecoUf ?? "");
  const [cepError, setCepError] = useState("");

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepChange = (value: string) => {
    setCepError("");
    setCep(formatCep(value));
  };

  const handleCepBlur = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) {
        setCepError("CEP nao encontrado.");
        return;
      }
      const data = await response.json();
      if (data?.erro) {
        setCepError("CEP nao encontrado.");
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
      if (data.complemento && !complemento.trim()) {
        setComplemento(data.complemento);
      }
    } catch (_error) {
      setCepError("Nao foi possivel validar o CEP agora.");
    }
  };

  return (
    <form action={formAction} className="space-y-6 form-br-forest">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {state.error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <Section title="Dados da Potencia">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" required>
            <input
              name="nome"
              defaultValue={initialData?.nome ?? ""}
              className="input-field"
              placeholder="Ex: Grande Oriente"
              required
            />
          </Field>
          <Field label="Sigla">
            <input
              name="sigla"
              defaultValue={initialData?.sigla ?? ""}
              className="input-field"
              placeholder="Ex: GOISC"
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              defaultValue={initialData?.email ?? ""}
              className="input-field"
              placeholder="contato@potencia.org.br"
            />
          </Field>
          <Field label="Telefone">
            <input
              name="telefone"
              defaultValue={initialData?.telefone ?? ""}
              className="input-field"
              placeholder="Ex: (48) 99999-9999"
            />
          </Field>
          <Field label="Website">
            <input
              name="website"
              defaultValue={initialData?.website ?? ""}
              className="input-field"
              placeholder="https://"
            />
          </Field>
        </div>
      </Section>

      <Section title="Endereco">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CEP">
            <input
              name="enderecoCep"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              className="input-field"
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
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              className="input-field"
              placeholder="Rua Principal"
            />
          </Field>
          <Field label="Numero">
            <input
              name="enderecoNumero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="input-field"
              placeholder="Ex: 100"
            />
          </Field>
          <Field label="Complemento">
            <input
              name="enderecoComplemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="input-field"
              placeholder="Sala 01"
            />
          </Field>
          <Field label="Bairro">
            <input
              name="enderecoBairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="input-field"
              placeholder="Centro"
            />
          </Field>
          <Field label="Cidade">
            <input
              name="enderecoCidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="input-field"
              placeholder="Florianopolis"
            />
          </Field>
          <Field label="UF">
            <input
              name="enderecoUf"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="SC"
              maxLength={2}
            />
          </Field>
        </div>
      </Section>

      <Section title="Observacoes">
        <Field label="Observacoes gerais">
          <textarea
            name="observacoes"
            defaultValue={initialData?.observacoes ?? ""}
            rows={4}
            className="input-field resize-none"
            placeholder="Notas adicionais"
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3 border-t-2 border-border pt-6">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-8 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg"
        >
          {submitLabel}
        </button>
        {cancelHref && (
          <a
            href={cancelHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-border bg-white px-8 text-sm font-semibold text-foreground transition hover:bg-muted hover:border-gray-400"
          >
            Cancelar
          </a>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  children: React.ReactNode;
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
