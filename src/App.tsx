import React, { useState, useEffect } from 'react';
import {
  ContainerConfig,
  Drink,
  Ingredient,
  Order,
  OrderItem,
  PaymentMethod,
  TicketConfig,
} from './types/bar';
import { storage } from './utils/storage';
import { calculateFinancialSummary } from './utils/calculations';
import { Navigation } from './components/Navigation';
import { PosView } from './components/pos/PosView';
import { OrdersView } from './components/orders/OrdersView';
import { ArqueoView } from './components/arqueo/ArqueoView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'arqueo' | 'settings'>('pos');

  // Core state loaded from localStorage
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [tickets, setTickets] = useState<TicketConfig[]>(() => storage.getTickets());
  const [drinks, setDrinks] = useState<Drink[]>(() => storage.getDrinks());
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => storage.getIngredients());
  const [containers, setContainers] = useState<ContainerConfig[]>(() => storage.getContainers());

  const [lastDispatchedOrder, setLastDispatchedOrder] = useState<{
    orderNumber: number;
    total: number;
    tickets: Record<string, number>;
  } | null>(null);

  // Ensure any previous night mode classes are wiped clean
  useEffect(() => {
    document.documentElement.classList.remove('night-mode-active');
    document.body.classList.remove('night-mode-active');
    document.documentElement.style.removeProperty('--night-brightness');
  }, []);

  // Sync to localStorage
  useEffect(() => {
    storage.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    storage.saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    storage.saveDrinks(drinks);
  }, [drinks]);

  useEffect(() => {
    storage.saveIngredients(ingredients);
  }, [ingredients]);

  useEffect(() => {
    storage.saveContainers(containers);
  }, [containers]);

  // Financial summary
  const financialSummary = calculateFinancialSummary(orders, tickets);

  // 1. Dispatch new order from POS
  const handleConfirmOrder = (items: OrderItem[], paymentMethod: PaymentMethod) => {
    const orderNumber = storage.getNextOrderNumber();
    const total = items.reduce((sum, it) => sum + it.subtotal, 0);

    const ticketCountByColor: Record<string, number> = {};
    for (const it of items) {
      ticketCountByColor[it.ticketId] = (ticketCountByColor[it.ticketId] || 0) + it.quantity;
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      timestamp: Date.now(),
      items,
      total,
      paymentMethod,
      ticketCountByColor,
      status: 'confirmed',
    };

    setOrders((prev) => [...prev, newOrder]);
    setLastDispatchedOrder({
      orderNumber,
      total,
      tickets: ticketCountByColor,
    });
  };

  // 2. Update existing order
  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  // 3. Delete order completely
  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // 4. Toggle order status (Confirmado <-> Anulado)
  const handleToggleOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: o.status === 'confirmed' ? 'cancelled' : 'confirmed' }
          : o
      )
    );
  };

  // 5. Update Ingredient stock
  const handleUpdateIngredientStock = (
    ingredientId: string,
    initial: number,
    remaining: number
  ) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingredientId
          ? { ...ing, stockInitialBottles: initial, stockRemainingBottles: remaining }
          : ing
      )
    );
  };

  // 6. Update Container capacity
  const handleUpdateContainerCapacity = (containerId: string, newCapacity: number) => {
    setContainers((prev) =>
      prev.map((c) =>
        c.id === containerId ? { ...c, capacityMl: newCapacity } : c
      )
    );
  };

  // 7. Reset Party Data (keep recipes and tickets)
  const handleResetPartyData = () => {
    storage.resetAllPartyData();
    setOrders([]);
    setLastDispatchedOrder(null);
    setIngredients((prev) =>
      prev.map((ing) => ({
        ...ing,
        stockRemainingBottles: ing.stockInitialBottles,
      }))
    );
  };

  // 8. Reset to Factory Defaults
  const handleResetFactoryDefaults = () => {
    storage.resetToFactoryDefaults();
    setOrders(storage.getOrders());
    setTickets(storage.getTickets());
    setDrinks(storage.getDrinks());
    setIngredients(storage.getIngredients());
    setContainers(storage.getContainers());
    setLastDispatchedOrder(null);
  };

  // 9. Load Demo Data
  const handleLoadDemoData = () => {
    storage.loadDemoData();
    setOrders(storage.getOrders());
  };

  // 10. Backup export
  const handleExportBackup = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barcontrol_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 11. Backup import
  const handleImportBackup = (jsonStr: string) => {
    const ok = storage.importBackup(jsonStr);
    if (ok) {
      setOrders(storage.getOrders());
      setTickets(storage.getTickets());
      setDrinks(storage.getDrinks());
      setIngredients(storage.getIngredients());
      setContainers(storage.getContainers());
    }
    return ok;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header & Mobile Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRevenue={financialSummary.totalRevenue}
        totalOrdersCount={financialSummary.confirmedOrdersCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4">
        {activeTab === 'pos' && (
          <PosView
            drinks={drinks}
            tickets={tickets}
            containers={containers}
            ingredients={ingredients}
            onConfirmOrder={handleConfirmOrder}
            lastDispatchedOrder={lastDispatchedOrder}
            onClearLastDispatched={() => setLastDispatchedOrder(null)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            drinks={drinks}
            tickets={tickets}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onToggleOrderStatus={handleToggleOrderStatus}
          />
        )}

        {activeTab === 'arqueo' && (
          <ArqueoView
            orders={orders}
            drinks={drinks}
            ingredients={ingredients}
            containers={containers}
            tickets={tickets}
            onUpdateIngredientStock={handleUpdateIngredientStock}
            onUpdateContainerCapacity={handleUpdateContainerCapacity}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            tickets={tickets}
            containers={containers}
            drinks={drinks}
            ingredients={ingredients}
            onUpdateTickets={setTickets}
            onUpdateContainers={setContainers}
            onUpdateDrinks={setDrinks}
            onUpdateIngredients={setIngredients}
            onResetPartyData={handleResetPartyData}
            onResetFactoryDefaults={handleResetFactoryDefaults}
            onLoadDemoData={handleLoadDemoData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>
    </div>
  );
}
