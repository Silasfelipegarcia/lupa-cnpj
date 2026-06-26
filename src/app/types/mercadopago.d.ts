export type MercadoPagoInstance = {
  createCardToken: (data: Record<string, string>) => Promise<{ id?: string }>;
  fields?: {
    create: (field: string, options?: { placeholder?: string }) => { mount: (id: string) => void };
    createCardToken: (data: { cardId: string }) => Promise<{ id?: string }>;
  };
};

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

export {};
