import type { PaymentProvider, PaymentResult } from './types';
import t from '../../i18n/es';

/**
 * Simula el checkout con un <dialog> para probar el embudo completo sin cobrar.
 */
export function demoProvider(real: PaymentProvider): PaymentProvider {
  return {
    ...real,
    id: 'demo',
    pay: () =>
      new Promise<PaymentResult>((resolve) => {
        const dialog = document.querySelector<HTMLDialogElement>('[data-demo-dialog]');
        if (!dialog) return resolve({ status: 'approved' });
        dialog.querySelector('[data-demo-body]')!.textContent = t.demo.body(real.label);

        const onClick = (e: Event) => {
          const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-demo-result]');
          if (!btn) return;
          finish(btn.dataset.demoResult === 'cancel' ? 'cancelled' : (btn.dataset.demoResult as PaymentResult['status']));
        };
        const onCancel = () => finish('cancelled');
        const finish = (status: PaymentResult['status']) => {
          dialog.removeEventListener('click', onClick);
          dialog.removeEventListener('cancel', onCancel);
          if (dialog.open) dialog.close();
          resolve({ status, transactionId: status === 'approved' ? `DEMO-${Date.now()}` : undefined });
        };

        dialog.addEventListener('click', onClick);
        dialog.addEventListener('cancel', onCancel);
        dialog.showModal();
      }),
  };
}
