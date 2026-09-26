"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { integrationsList } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { getIntegrations, setIntegrationConnected } from "@/lib/firebase/firestore";
import { toast } from "@/lib/toast-store";

export default function IntegrationsPage() {
  const { firebaseUser } = useAuth();
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!firebaseUser) return;
    getIntegrations(firebaseUser.uid).then(setConnected);
  }, [firebaseUser]);

  async function toggle(id: string, name: string) {
    if (!firebaseUser) return;
    const next = !connected[id];
    setConnected((prev) => ({ ...prev, [id]: next }));
    await setIntegrationConnected(firebaseUser.uid, id, next);
    toast(next ? `Connected to ${name}` : `Disconnected from ${name}`, "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect the tools you already use. Connection state is saved to your account.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrationsList.map((integration) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[integration.icon] ?? Icons.Plug;
          const isConnected = !!connected[integration.id];
          return (
            <Card key={integration.id} className="flex items-start gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">{integration.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
                <Button
                  size="sm"
                  variant={isConnected ? "secondary" : "primary"}
                  className="mt-3"
                  onClick={() => toggle(integration.id, integration.name)}
                >
                  {isConnected ? "Connected" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
