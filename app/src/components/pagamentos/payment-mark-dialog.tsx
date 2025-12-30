'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  PayStatus,
  PaymentMethod,
  payStatusSchema,
  paymentMethodSchema,
} from '@/lib/validations/payments';
import type { PaymentStatusInfo } from '@/types/payment-table';

const formSchema = z.object({
  status: payStatusSchema,
  amount: z.string().optional(),
  method: paymentMethodSchema.optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  periodId: string;
  periodLabel: string;
  currentStatus?: PaymentStatusInfo;
  onSuccess: () => void;
}

export function PaymentMarkDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  periodId,
  periodLabel,
  currentStatus,
  onSuccess,
}: PaymentMarkDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: currentStatus?.status || PayStatus.PENDING,
      amount: currentStatus?.amount?.toString() || '',
      method: currentStatus?.method || undefined,
      paidAt: currentStatus?.paidAt
        ? new Date(currentStatus.paidAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      notes: currentStatus?.notes || '',
    },
  });

  const watchedStatus = form.watch('status');

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const payload = {
        memberId,
        periodId,
        status: values.status,
        amount: values.amount ? parseFloat(values.amount) : undefined,
        method: values.method,
        paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
        notes: values.notes || undefined,
      };

      const response = await fetch('/api/payments/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar pagamento');
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error marking payment:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Marcar Pagamento</DialogTitle>
          <DialogDescription>
            {memberName} - {periodLabel}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PayStatus.PAID}>Pago</SelectItem>
                      <SelectItem value={PayStatus.PENDING}>Pendente</SelectItem>
                      <SelectItem value={PayStatus.CANCELED}>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedStatus === PayStatus.PAID && (
              <>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="150.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                          <SelectItem value={PaymentMethod.DINHEIRO}>Dinheiro</SelectItem>
                          <SelectItem value={PaymentMethod.TRANSFERENCIA}>
                            Transferência
                          </SelectItem>
                          <SelectItem value={PaymentMethod.BOLETO}>Boleto</SelectItem>
                          <SelectItem value={PaymentMethod.CARTAO}>Cartão</SelectItem>
                          <SelectItem value={PaymentMethod.CONVENIO}>Convênio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Pagamento</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o pagamento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
