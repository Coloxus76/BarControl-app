import React, { useState } from 'react';
import {
  ContainerConfig,
  Drink,
  Ingredient,
  OrderItem,
  PaymentMethod,
  TicketColorId,
  TicketConfig,
} from '../../types/bar';
import { formatMoney } from '../../utils/calculations';
import { sounds } from '../../utils/audioHaptics';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Sparkles,
  Flame,
  Wine,
  GlassWater,
  Beer,
  Zap,
  CupSoda,
  Droplets,
  Cherry,
  Citrus,
  Info,
} from 'lucide-react';

interface PosViewProps {
  drinks: Drink[];
  tickets: TicketConfig[];
  containers?: ContainerConfig[];
  ingredients?: Ingredient[];
  onConfirmOrder: (items: OrderItem[], paymentMethod: PaymentMethod) => void;
  lastDispatchedOrder?: {
    orderNumber: number;
    total: number;
    tickets: Record<string, number>;
  } | null;
  onClearLastDispatched?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  drinks,
  tickets,
  containers,
  ingredients,
  onConfirmOrder,
  lastDispatchedOrder,
  onClearLastDispatched,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TicketColorId | 'all'>('all');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [infoDrink, setInfoDrink] = useState<Drink | null>(null);

  // Quick ticket map
  const ticketMap = new Map<string, TicketConfig>();
  tickets.forEach((t) => ticketMap.set(t.id, t));

  // Quick container map
  const containerMap = new Map<string, number>();
  containers?.forEach((c) => containerMap.set(c.id, c.capacityMl));
  if (!containerMap.has('vaso')) containerMap.set('vaso', 350);
  if (!containerMap.has('tanque')) containerMap.set('tanque', 750);
  if (!containerMap.has('botella')) containerMap.set('botella', 500);

  // Quick ingredient map
  const ingredientMap = new Map<string, Ingredient>();
  ingredients?.forEach((ing) => ingredientMap.set(ing.id, ing));

  // Filtered drinks
  const filteredDrinks = drinks.filter((drink) => {
    if (!drink.active) return false;
    if (selectedCategory === 'all') return true;
    return drink.ticketId === selectedCategory;
  });

  // Calculate current cart totals and tickets breakdown
  const cartItems: OrderItem[] = [];
  let totalCost = 0;
  const ticketCounts: Record<string, number> = {};

  for (const [drinkId, qty] of Object.entries(cartQuantities)) {
    if (qty > 0) {
      const drink = drinks.find((d) => d.id === drinkId);
      if (!drink) continue;
      const ticket = ticketMap.get(drink.ticketId);
      const unitPrice = ticket?.price ?? 0;
      const subtotal = unitPrice * qty;

      totalCost += subtotal;
      ticketCounts[drink.ticketId] = (ticketCounts[drink.ticketId] || 0) + qty;

      cartItems.push({
        drinkId: drink.id,
        drinkName: drink.name,
        ticketId: drink.ticketId,
        ticketName: ticket?.name || 'Ticket',
        ticketColor: ticket?.color || '#ffffff',
        unitPrice,
        quantity: qty,
        subtotal,
        containerType: drink.containerType,
      });
    }
  }

  const totalItemsCount = Object.values(cartQuantities).reduce((a, b) => a + b, 0);

  // Handlers
  const handleAdd = (drinkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playTap();
    setCartQuantities((prev) => ({
      ...prev,
      [drinkId]: (prev[drinkId] || 0) + 1,
    }));
  };

  const handleRemove = (drinkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playTap();
    setCartQuantities((prev) => {
      const current = prev[drinkId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[drinkId];
        return copy;
      }
      return { ...prev, [drinkId]: current - 1 };
    });
  };

  const handleClearCart = () => {
    sounds.playDelete();
    setCartQuantities({});
  };

  const handleConfirm = () => {
    if (cartItems.length === 0) return;
    sounds.playSuccess();
    onConfirmOrder(cartItems, paymentMethod);
    setCartQuantities({});
    setShowDispatchModal(true);
    // Auto-dismiss dispatch modal after 3 seconds so the bartender keeps flowing
    setTimeout(() => {
      setShowDispatchModal(false);
    }, 4000);
  };

  // Helper icon renderer
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Wine':
        return <Wine className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Beer':
        return <Beer className="w-5 h-5 text-amber-300" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-fuchsia-400" />;
      case 'CupSoda':
        return <CupSoda className="w-5 h-5 text-emerald-400" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-blue-300" />;
      case 'Cherry':
        return <Cherry className="w-5 h-5 text-rose-400" />;
      case 'Citrus':
        return <Citrus className="w-5 h-5 text-orange-400" />;
      default:
        return <GlassWater className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`pt-2 px-3 max-w-5xl mx-auto select-none transition-all duration-200 ${
        cartItems.length > 0 ? 'pb-80 sm:pb-72' : 'pb-40'
      }`}
    >
      {/* Recent Dispatched Banner / Alert */}
      {lastDispatchedOrder && showDispatchModal && (
        <div className="mb-3 bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-2 border-emerald-500 rounded-2xl p-3 shadow-xl shadow-emerald-950/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-emerald-500 text-zinc-950 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  ¡Pedido #{String(lastDispatchedOrder.orderNumber).padStart(3, '0')} Despachado!
                </span>
                <div className="text-base font-extrabold text-white">
                  Cobrado: {formatMoney(lastDispatchedOrder.total)}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDispatchModal(false);
                if (onClearLastDispatched) onClearLastDispatched();
              }}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tickets To Hand Over Highlight */}
          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
              🎟️ Entregar al cliente:
            </span>
            {Object.entries(lastDispatchedOrder.tickets).map(([ticketId, count]) => {
              const t = ticketMap.get(ticketId);
              return (
                <span
                  key={ticketId}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-sm ${
                    t?.badgeBg || 'bg-zinc-700 text-white'
                  }`}
                >
                  <span>{count}x</span>
                  <span>{t?.name || ticketId}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Ticket Category Selector: Fits 100% of mobile screen width in 5 columns */}
      {/* Ticket Category Selector: Single line, no prices, fits 100% of mobile screen */}
      <div className="sticky top-[57px] z-30 -mx-3 px-3 py-2 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 mb-3">
        <div
          className="grid gap-1.5 w-full"
          style={{
            gridTemplateColumns: `repeat(${tickets.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {/* Button 1: TODOS */}
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setSelectedCategory('all');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black tracking-tight transition-all text-center truncate ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/25 ring-2 ring-amber-300 scale-[1.02]'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            TODOS
          </button>

          {/* Ticket buttons: Agua (Blanco), Vaso (Verde), Vaso (Azul), Tanque (Rosa) + custom tickets */}
          {tickets.map((t) => {
            const isSelected = selectedCategory === t.id;

            // Explicit labels and backgrounds as requested by user:
            // [ Agua ] con fondo blanco
            // [ Vaso ] con fondo verde
            // [ Vaso ] con fondo azul
            // [Tanque] con fondo rosa
            let label = 'Vaso';
            let bgStyle = '';
            let customBg = false;

            if (t.id === 'blanco' && (t.color === '#f8fafc' || t.color === '#ffffff') && t.name === 'Ticket Blanco') {
              label = 'Agua';
              bgStyle = 'bg-white text-zinc-950 shadow-sm';
            } else if (t.id === 'verde' && t.color === '#22c55e' && t.name === 'Ticket Verde') {
              label = 'Vaso';
              bgStyle = 'bg-emerald-500 text-zinc-950 shadow-sm';
            } else if (t.id === 'azul' && t.color === '#3b82f6' && t.name === 'Ticket Azul') {
              label = 'Vaso';
              bgStyle = 'bg-blue-600 text-white shadow-sm';
            } else if (t.id === 'rosa' && t.color === '#ec4899' && t.name === 'Ticket Rosa') {
              label = 'Tanque';
              bgStyle = 'bg-pink-500 text-white shadow-sm';
            } else {
              label = t.name.replace(/^Ticket\s+/i, '').trim().slice(0, 8) || 'Ticket';
              const clean = t.color.replace('#', '');
              let isLight = false;
              if (clean.length === 6) {
                const r = parseInt(clean.substring(0, 2), 16);
                const g = parseInt(clean.substring(2, 4), 16);
                const b = parseInt(clean.substring(4, 6), 16);
                isLight = (r * 299 + g * 587 + b * 114) / 1000 > 155;
              } else {
                isLight = ['#f8fafc', '#ffffff', '#eab308', '#84cc16', '#06b6d4', '#f59e0b'].includes(t.color.toLowerCase());
              }
              bgStyle = isLight ? 'text-zinc-950 shadow-sm' : 'text-white shadow-sm';
              customBg = true;
            }

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setSelectedCategory(t.id);
                }}
                title={t.name}
                style={customBg ? { backgroundColor: t.color } : undefined}
                className={`py-2 px-1 rounded-xl text-xs font-black transition-all text-center truncate ${bgStyle} ${
                  isSelected
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 shadow-lg scale-[1.03] opacity-100'
                    : 'opacity-85 hover:opacity-100 active:scale-[0.98]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Drink Cards Grid (2 cols mobile, 3-4 cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filteredDrinks.map((drink) => {
          const ticket = ticketMap.get(drink.ticketId);
          const qty = cartQuantities[drink.id] || 0;
          const isSelected = qty > 0;

          return (
            <div
              key={drink.id}
              onClick={() => handleAdd(drink.id)}
              className={`relative cursor-pointer rounded-xl overflow-hidden border transition-all duration-150 flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-zinc-900 border-amber-400/80 shadow-md shadow-amber-400/10 ring-1 ring-amber-400/30'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              {/* Top Color Accent Bar (Barra de color superior, no muy ancha) */}
              <div
                className="h-1.5 w-full shadow-xs flex-shrink-0"
                style={{ backgroundColor: ticket?.color || '#ffffff' }}
              />

              <div className="p-2 flex-1 flex flex-col justify-between">
                {/* Header inside card: Drink icon on left, Info Button on right */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div
                    className="p-1 rounded-md flex-shrink-0"
                    style={{
                      backgroundColor: `${ticket?.color || '#ffffff'}15`,
                      color: ticket?.color || '#ffffff',
                    }}
                  >
                    {renderIcon(drink.iconName)}
                  </div>

                  {/* Info Button: Opens recipe & container details */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTap();
                      setInfoDrink(drink);
                    }}
                    title="Ver receta y capacidad"
                    className="w-5 h-5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition flex-shrink-0"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                {/* Drink Title & Price */}
                <div className="my-0.5 flex-1">
                  <h3 className="text-xs font-bold text-zinc-100 leading-tight line-clamp-2">
                    {drink.name}
                  </h3>

                  <div className="text-sm font-black text-amber-400 font-mono tracking-tight mt-1">
                    {formatMoney(ticket?.price || 0)}
                  </div>
                </div>

                {/* Stepper / Tap to Add Footer */}
                <div className="mt-1 pt-1 border-t border-zinc-800/60">
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handleAdd(drink.id, e)}
                      className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 active:bg-amber-400 active:text-zinc-950 text-zinc-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Sumar</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-zinc-950/90 border border-zinc-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleRemove(drink.id, e)}
                        className="w-7 h-6 rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center font-bold transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="text-center px-1">
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {qty}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAdd(drink.id, e)}
                        className="w-7 h-6 rounded bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-zinc-950 flex items-center justify-center font-bold transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll spacer: guarantees the last row of drink cards can easily scroll well above the floating checkout drawer */}
      <div
        className={`w-full transition-all duration-200 ${
          cartItems.length > 0 ? 'h-64 sm:h-56' : 'h-24'
        }`}
        aria-hidden="true"
      />

      {/* Recipe & Container Info Modal Popup */}
      {infoDrink && (
        <div
          onClick={() => setInfoDrink(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-sm p-4 shadow-2xl relative animate-in zoom-in-95 duration-150"
          >
            {/* Close button */}
            <button
              onClick={() => setInfoDrink(null)}
              className="absolute right-3 top-3 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3 pr-6">
              <div
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{
                  backgroundColor: `${ticketMap.get(infoDrink.ticketId)?.color || '#ffffff'}20`,
                  color: ticketMap.get(infoDrink.ticketId)?.color || '#ffffff',
                }}
              >
                {renderIcon(infoDrink.iconName)}
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight">
                  {infoDrink.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      ticketMap.get(infoDrink.ticketId)?.badgeBg || 'bg-zinc-700 text-white'
                    }`}
                  >
                    {ticketMap.get(infoDrink.ticketId)?.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatMoney(ticketMap.get(infoDrink.ticketId)?.price || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Container Info */}
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 mb-3 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Tamaño de Envase:</span>
              <span className="font-bold text-zinc-200">
                {(() => {
                  const matchedContainer = containers?.find((c) => c.id === infoDrink.containerType);
                  const name = matchedContainer?.name || (infoDrink.containerType === 'tanque' ? 'Tanque' : infoDrink.containerType === 'botella' ? 'Botella' : 'Vaso');
                  const capacity = matchedContainer?.capacityMl || containerMap.get(infoDrink.containerType) || 350;
                  const icon = infoDrink.containerType === 'tanque' ? '🏺' : infoDrink.containerType === 'botella' ? '🧴' : '🥤';
                  return `${icon} ${name} (${capacity} cc)`;
                })()}
              </span>
            </div>

            {/* Recipe Ingredients & Percentages Breakdown */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Fórmula de Mezcla (% y cc teóricos)
              </span>

              {infoDrink.recipe.map((r, i) => {
                const ing = ingredientMap.get(r.ingredientId);
                const capacity = containerMap.get(infoDrink.containerType) || 350;
                const mlAmount = Math.round(capacity * (r.percentage / 100));

                return (
                  <div
                    key={i}
                    className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-200">
                        {ing?.name || r.ingredientId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-amber-400 font-bold">{r.percentage}%</span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        (~{mlAmount} cc)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInfoDrink(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 rounded-xl text-xs font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Checkout Drawer (Always accessible) */}
      <div
        className="fixed left-0 right-0 z-30 px-3 pb-1 select-none pointer-events-none"
        style={{ bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-xl mx-auto pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl p-3 shadow-2xl shadow-black/80">
          {/* Active Cart Summary & Physical Tickets to Deliver */}
          {cartItems.length > 0 ? (
            <div>
              {/* Tickets breakdown chips */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tickets:
                  </span>
                  {Object.entries(ticketCounts).map(([ticketId, count]) => {
                    const t = ticketMap.get(ticketId);
                    return (
                      <span
                        key={ticketId}
                        className={`text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm ${
                          t?.badgeBg || 'bg-zinc-700 text-white'
                        }`}
                      >
                        <span>{count}x</span>
                        <span>{t?.name || ticketId}</span>
                      </span>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-zinc-400 hover:text-rose-400 p-1 flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Payment Method Selector & Confirm CTA */}
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Payment toggle */}
                <div className="col-span-5 flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setPaymentMethod('efectivo');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      paymentMethod === 'efectivo'
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Efvo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setPaymentMethod('transferencia');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      paymentMethod === 'transferencia'
                        ? 'bg-blue-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>MP/Transf</span>
                  </button>
                </div>

                {/* Big Green Confirm CTA */}
                <div className="col-span-7">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-green-600 active:from-emerald-600 active:to-green-700 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-between text-sm transition"
                  >
                    <div className="text-left leading-tight">
                      <div className="text-[10px] uppercase font-bold text-emerald-950/80">
                        {totalItemsCount} {totalItemsCount === 1 ? 'bebida' : 'bebidas'}
                      </div>
                      <div className="text-base font-black font-mono">
                        {formatMoney(totalCost)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 uppercase tracking-tight text-xs bg-zinc-950 text-emerald-400 px-2.5 py-1.5 rounded-lg font-black shadow-inner">
                      <span>Despachar</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1 text-zinc-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium">
                  Toca cualquier bebida para armar el pedido
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-500 font-mono">$ 0</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
