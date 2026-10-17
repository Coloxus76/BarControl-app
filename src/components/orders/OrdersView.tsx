import React, { useState } from 'react';
import {
  Drink,
  Order,
  OrderItem,
  PaymentMethod,
  TicketConfig,
} from '../../types/bar';
import {
  formatMoney,
  generateCSV,
  generateSheetsTSV,
  calculateFinancialSummary,
} from '../../utils/calculations';
import { sounds } from '../../utils/audioHaptics';
import {
  Search,
  Copy,
  Download,
  Check,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
  Minus,
  X,
  AlertCircle,
  Banknote,
  CreditCard,
  Filter,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  drinks: Drink[];
  tickets: TicketConfig[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onToggleOrderStatus: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  drinks,
  tickets,
  onUpdateOrder,
  onDeleteOrder,
  onToggleOrderStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | PaymentMethod>('all');
  const [copiedSheets, setCopiedSheets] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Financial summary
  const summary = calculateFinancialSummary(orders, tickets);
  const ticketMap = new Map<string, TicketConfig>();
  tickets.forEach((t) => ticketMap.set(t.id, t));

  // Filtered orders list (reverse chronological: latest on top)
  const filteredOrders = [...orders]
    .reverse()
    .filter((order) => {
      if (filterPayment !== 'all' && order.paymentMethod !== filterPayment) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const numMatch = String(order.orderNumber).includes(term);
      const itemMatch = order.items.some((it) =>
        it.drinkName.toLowerCase().includes(term)
      );
      return numMatch || itemMatch;
    });

  // Export to Sheets (TSV to clipboard)
  const handleCopySheets = async () => {
    try {
      const tsvData = generateSheetsTSV(orders);
      await navigator.clipboard.writeText(tsvData);
      sounds.playSuccess();
      setCopiedSheets(true);
      setTimeout(() => setCopiedSheets(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Export to CSV
  const handleDownloadCSV = () => {
    sounds.playTap();
    const csvData = generateCSV(orders);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barcontrol_pedidos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Edit Order save
  const handleSaveEdit = (edited: Order) => {
    sounds.playSuccess();
    onUpdateOrder(edited);
    setEditingOrder(null);
  };

  return (
    <div className="pb-28 pt-2 px-3 max-w-5xl mx-auto select-none">
      {/* Financial & Audit Summary Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2.5">
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Auditoría & Caja en Vivo
            </h2>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {formatMoney(summary.totalRevenue)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-zinc-400 block">
              {summary.confirmedOrdersCount} Pedidos Confirmados
            </span>
            {summary.cancelledOrdersCount > 0 && (
              <span className="text-[10px] text-rose-400 font-bold block">
                {summary.cancelledOrdersCount} Anulados
              </span>
            )}
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              <span>Efectivo</span>
            </div>
            <div className="text-base font-extrabold text-zinc-100 font-mono mt-0.5">
              {formatMoney(summary.cashRevenue)}
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>MP / Transf</span>
            </div>
            <div className="text-base font-extrabold text-zinc-100 font-mono mt-0.5">
              {formatMoney(summary.transferRevenue)}
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 col-span-2">
            <div className="text-zinc-400 text-[11px] font-bold mb-1">
              Tickets Entregados ({summary.totalTicketsCount})
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tickets.map((t) => {
                const count = summary.ticketCountsByColor[t.id] || 0;
                return (
                  <span
                    key={t.id}
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${t.badgeBg}`}
                  >
                    <span>{count}x</span>
                    <span>{t.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleCopySheets}
            className="flex-1 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500 text-emerald-300 active:text-zinc-950 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {copiedSheets ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Copiado p/ Google Sheets!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar p/ Google Sheets</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span> CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por # o trago..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by payment */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setFilterPayment('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPayment === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterPayment('efectivo')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPayment === 'efectivo'
                ? 'bg-emerald-500 text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Efvo
          </button>
          <button
            type="button"
            onClick={() => setFilterPayment('transferencia')}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPayment === 'transferencia'
                ? 'bg-blue-500 text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            MP
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-6">
          <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-300">No hay pedidos registrados</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Los pedidos que confirmes en la pantalla de Despacho aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const timeStr = new Date(order.timestamp).toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className={`rounded-2xl p-3.5 border transition ${
                  isCancelled
                    ? 'bg-zinc-950/60 border-zinc-900 opacity-60'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header: Order #, Time, Status, Payment */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 font-mono">
                      #{String(order.orderNumber).padStart(3, '0')}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{timeStr}</span>
                    {isCancelled && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ANULADO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        order.paymentMethod === 'efectivo'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                    </span>
                    <span
                      className={`text-base font-black font-mono ${
                        isCancelled ? 'line-through text-zinc-500' : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="py-2.5 space-y-1">
                  {order.items.map((item, idx) => {
                    const ticket = ticketMap.get(item.ticketId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-zinc-300"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold">{item.drinkName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              ticket?.badgeBg || 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {ticket?.name || item.ticketId}
                          </span>
                        </div>
                        <span className="text-zinc-400 font-mono">
                          {formatMoney(item.subtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tickets physically handed over & Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                      🎟️ Tickets:
                    </span>
                    {Object.entries(order.ticketCountByColor || {}).map(([ticketId, count]) => {
                      const t = ticketMap.get(ticketId);
                      return (
                        <span
                          key={ticketId}
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                            t?.badgeBg || 'bg-zinc-800 text-white'
                          }`}
                        >
                          {count} {t?.name || ticketId}
                        </span>
                      );
                    })}
                  </div>

                  {/* Actions: Modify / Cancel */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingOrder(order)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Modificar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleOrderStatus(order.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isCancelled
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                      }`}
                      title={isCancelled ? 'Restaurar pedido' : 'Anular pedido'}
                    >
                      {isCancelled ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          <span>Anular</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modal to Edit an Existing Order */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          drinks={drinks}
          tickets={tickets}
          onSave={handleSaveEdit}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Interactive Modal to Edit Order Details
// -------------------------------------------------------------
interface EditOrderModalProps {
  order: Order;
  drinks: Drink[];
  tickets: TicketConfig[];
  onSave: (editedOrder: Order) => void;
  onClose: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  drinks,
  tickets,
  onSave,
  onClose,
}) => {
  const [items, setItems] = useState<OrderItem[]>([...order.items]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [selectedDrinkToAdd, setSelectedDrinkToAdd] = useState<string>('');

  const ticketMap = new Map<string, TicketConfig>();
  tickets.forEach((t) => ticketMap.set(t.id, t));

  const handleQtyChange = (index: number, delta: number) => {
    sounds.playTap();
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        subtotal: updated[index].unitPrice * newQty,
      };
    }
    setItems(updated);
  };

  const handleAddDrink = () => {
    if (!selectedDrinkToAdd) return;
    const drink = drinks.find((d) => d.id === selectedDrinkToAdd);
    if (!drink) return;
    sounds.playTap();

    const ticket = ticketMap.get(drink.ticketId);
    const unitPrice = ticket?.price || 0;

    // Check if item already exists
    const existingIndex = items.findIndex((it) => it.drinkId === drink.id);
    if (existingIndex >= 0) {
      handleQtyChange(existingIndex, 1);
    } else {
      setItems([
        ...items,
        {
          drinkId: drink.id,
          drinkName: drink.name,
          ticketId: drink.ticketId,
          ticketName: ticket?.name || 'Ticket',
          ticketColor: ticket?.color || '#ffffff',
          unitPrice,
          quantity: 1,
          subtotal: unitPrice,
          containerType: drink.containerType,
        },
      ]);
    }
    setSelectedDrinkToAdd('');
  };

  const handleSave = () => {
    if (items.length === 0) return;

    // Recalculate total and ticket counts
    const newTotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const newTicketCount: Record<string, number> = {};
    for (const it of items) {
      newTicketCount[it.ticketId] = (newTicketCount[it.ticketId] || 0) + it.quantity;
    }

    onSave({
      ...order,
      items,
      total: newTotal,
      paymentMethod,
      ticketCountByColor: newTicketCount,
    });
  };

  const total = items.reduce((sum, it) => sum + it.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-4 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-black text-white">
              Modificar Pedido #{String(order.orderNumber).padStart(3, '0')}
            </h3>
            <p className="text-xs text-zinc-400">
              Ajusta las bebidas o cambia el método de cobro
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-3 overflow-y-auto space-y-3 flex-1">
          {/* Items Stepper */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Bebidas del Pedido
            </label>
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-100">{it.drinkName}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {formatMoney(it.unitPrice)} c/u
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(idx, -1)}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-xs text-amber-400">
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(idx, 1)}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-bold font-mono text-zinc-200 w-16 text-right">
                    {formatMoney(it.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Drink selector */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Agregar otra bebida
            </label>
            <div className="flex gap-2">
              <select
                value={selectedDrinkToAdd}
                onChange={(e) => setSelectedDrinkToAdd(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Seleccionar trago...</option>
                {drinks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({ticketMap.get(d.ticketId)?.name} - {formatMoney(ticketMap.get(d.ticketId)?.price || 0)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDrink}
                disabled={!selectedDrinkToAdd}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Sumar</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Forma de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'transferencia'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>MP / Transferencia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">
              Nuevo Total
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatMoney(total)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={items.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-md shadow-amber-400/20 transition"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
