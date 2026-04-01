export interface CreateOrderRequest {
  machineId: string;
  machineName: string;
  amount: number;
}

export interface CaptureOrderRequest {
  orderID: string;
}

export const paypalService = {
  createOrder: async (data: CreateOrderRequest): Promise<any> => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        let msg = "Failed to create order";
        try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
        throw new Error(msg);
    }
    return res.json();
  },

  captureOrder: async (data: CaptureOrderRequest): Promise<any> => {
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        let msg = "Failed to capture order";
        try { const err = await res.json(); msg = err.error || msg; } catch (e) {}
        throw new Error(msg);
    }
    return res.json();
  }
};
