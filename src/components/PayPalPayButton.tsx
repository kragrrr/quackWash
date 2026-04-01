import { useEffect, useRef, useState } from 'react';
import { usePayPal } from '@/hooks/usePayPal';
import { paypalService } from '@/services/paypalService';
import { Machine } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface PayPalPayButtonProps {
    machine: Machine;
    onSuccess: (details: any) => void;
}

export default function PayPalPayButton({ machine, onSuccess }: PayPalPayButtonProps) {
    const { isReady, error } = usePayPal();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!isReady || !window.paypal || !containerRef.current) return;

        // Clear previous buttons if any
        containerRef.current.innerHTML = '';

        window.paypal.Buttons({
            style: {
                layout: 'horizontal',
                color: 'gold',
                shape: 'rect',
                label: 'pay',
                height: 48,
            },
            createOrder: async () => {
                if (machine.price === undefined) {
                    toast({
                        variant: "destructive",
                        title: "Price Error", 
                        description: "Price not found for this machine."
                    });
                    throw new Error("Price not found");
                }
                setIsLoading(true);
                try {
                    const orderData = await paypalService.createOrder({
                        machineId: machine.machineGuid || machine.id,
                        machineName: machine.name,
                        amount: machine.price
                    });
                    
                    if (!orderData.id) {
                        const errorDetail = orderData?.details?.[0];
                        const errorMessage = errorDetail ? `${errorDetail.issue} ${errorDetail.description}` : 'Unexpected error occurred.';
                        throw new Error(errorMessage);
                    }
                    return orderData.id;
                } catch (err: any) {
                    setIsLoading(false);
                    toast({
                        variant: "destructive",
                        title: "Payment Initialization Failed", 
                        description: err.message
                    });
                    throw err;
                }
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    const captureData = await paypalService.captureOrder({
                        orderID: data.orderID,
                    });
                    setIsLoading(false);
                    
                    const errorDetail = captureData?.details?.[0];
                    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                        return actions.restart();
                    } else if (errorDetail || captureData.status !== "COMPLETED") {
                        toast({
                            variant: "destructive",
                            title: "Transaction Failed", 
                            description: errorDetail?.description || "Payment could not be completed."
                        });
                    } else {
                        onSuccess(captureData);
                    }
                } catch (err: any) {
                    setIsLoading(false);
                    toast({
                        variant: "destructive",
                        title: "Capture Failed", 
                        description: err.message
                    });
                }
            },
            onError: (err: any) => {
                setIsLoading(false);
                toast({
                    variant: "destructive",
                    title: "Payment Error", 
                    description: "An error occurred with PayPal checkout."
                });
                console.error("PayPal component error", err);
            },
            onCancel: () => {
                 setIsLoading(false);
            }
        }).render(containerRef.current);

    }, [isReady, machine, onSuccess, toast]);

    if (error) {
        return (
            <div className="text-red-500 text-xs text-center border p-2 border-red-500/50 bg-red-500/10" style={{ fontFamily: "VT323, monospace", fontSize: "1.1rem" }}>
                Failed to load PayPal: {error.message}
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="flex justify-center items-center h-12 text-muted-foreground animate-pulse" style={{ fontFamily: "VT323, monospace", fontSize: "1.2rem" }}>
                Loading PayPal...
            </div>
        );
    }

    return (
        <div className="w-full relative mt-4">
            <div ref={containerRef} className="w-full relative z-10" />
            {isLoading && (
                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none" style={{ fontFamily: "VT323, monospace", fontSize: "1.4rem" }}>
                    <span className="animate-pulse">Processing...</span>
                 </div>
            )}
        </div>
    );
}
