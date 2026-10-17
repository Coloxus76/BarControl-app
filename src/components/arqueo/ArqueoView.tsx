import React, { useState } from 'react';
import {
  ContainerConfig,
  Drink,
  Ingredient,
  Order,
  TicketConfig,
} from '../../types/bar';
import {
  calculateDrinkSalesStats,
  calculateIngredientConsumption,
  formatMoney,
} from '../../utils/calculations';
import { sounds } from '../../utils/audioHaptics';
import {
  Flame,
  Wine,
  Sparkles,
  CupSoda,
  Droplets,
  Trophy,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Scale,
} from 'lucide-react';

interface ArqueoViewProps {
  orders: Order[];
  drinks: Drink[];
  ingredients: Ingredient[];
  containers: ContainerConfig[];
  tickets: TicketConfig[];
  onUpdateIngredientStock: (ingredientId: string, initial: number, remaining: number) => void;
  onUpdateContainerCapacity: (containerId: string, newCapacity: number) => void;
}

export const ArqueoView: React.FC<ArqueoViewProps> = ({
  orders,
  drinks,
  ingredients,
  containers,
  tickets,
  onUpdateIngredientStock,
  onUpdateContainerCapacity,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'consumo' | 'ranking' | 'auditoria'>('consumo');

  // Perform calculation
  const consumption = calculateIngredientConsumption(orders, drinks, ingredients, containers);
  const salesStats = calculateDrinkSalesStats(orders, drinks);

  const vasoContainer = containers.find((c) => c.id === 'vaso');
  const tanqueContainer = containers.find((c) => c.id === 'tanque');

  // Groups
  const spirits = consumption.filter((c) => c.type === 'alcohol');
  const mixers = consumption.filter((c) => c.type === 'mixer');
  const waters = consumption.filter((c) => c.type === 'water');
  const ice = consumption.find((c) => c.type === 'ice');

  // Totals
  const totalAlcoholLiters = spirits.reduce((acc, s) => acc + s.totalLiters, 0);
  const totalMixerLiters = mixers.reduce((acc, m) => acc + m.totalLiters, 0);
  const totalBottlesConsumed = spirits.reduce((acc, s) => acc + s.theoreticalBottles, 0);
  const totalIceKg = ice ? ice.totalLiters : 0; // 1L ~ 1Kg

  // Copy full Arqueo report to clipboard for WhatsApp or Notes
  const handleCopyReport = async () => {
    try {
      sounds.playSuccess();
      const confirmedOrdersCount = orders.filter((o) => o.status === 'confirmed').length;
      const totalRevenue = orders
        .filter((o) => o.status === 'confirmed')
        .reduce((sum, o) => sum + o.total, 0);

      const lines = [
        '📊 *REPORTE DE ARQUEO Y CONSUMO - BARCONTROL*',
        `📅 Fecha/Hora: ${new Date().toLocaleString('es-AR')}`,
        `💰 Total Recaudado: ${formatMoney(totalRevenue)} (${confirmedOrdersCount} pedidos)`,
        '',
        '🍸 *CONSUMO DE DESTILADOS Y ALCOHOL:*',
        ...spirits.map(
          (s) =>
            `• ${s.ingredientName}: ${s.totalLiters.toFixed(2)}L (~${s.theoreticalBottles.toFixed(1)} botellas de ${s.bottleSizeMl}ml)` +
            (s.stockInitialBottles > 0
              ? ` | Desvío: ${(s.realBottlesUsed - s.theoreticalBottles).toFixed(1)} bot.`
              : '')
        ),
        '',
        '🥤 *CONSUMO DE GASEOSAS Y MIXERS:*',
        ...mixers.map(
          (m) =>
            `• ${m.ingredientName}: ${m.totalLiters.toFixed(2)}L (~${m.theoreticalBottles.toFixed(1)} ${m.bottleLabel})`
        ),
        '',
        '🧊 *HIELO ESTIMADO:*',
        `• ${totalIceKg.toFixed(1)} Kg de hielo`,
        '',
        '🏆 *LO MÁS VENDIDO (TOP 3):*',
        ...salesStats.slice(0, 3).map((st, i) => `${i + 1}. ${st.drinkName}: ${st.quantity} unidades (${formatMoney(st.totalRevenue)})`),
      ];

      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch (err) {
      console.error('Error copying report', err);
    }
  };

  return (
    <div className="pb-28 pt-2 px-3 max-w-5xl mx-auto select-none">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {/* Alcohol Liters */}
        <div className="bg-gradient-to-br from-amber-950/60 to-zinc-900 border border-amber-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Alcohol Consumido</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">
            {totalAlcoholLiters.toFixed(1)} <span className="text-sm font-semibold">Litros</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            ~{totalBottlesConsumed.toFixed(1)} botellas abiertas
          </p>
        </div>

        {/* Mixer Liters */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
            <CupSoda className="w-4 h-4 text-emerald-400" />
            <span>Mixers & Gaseosas</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            {totalMixerLiters.toFixed(1)} <span className="text-sm font-semibold">Litros</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Coca, Sprite, Fanta, Tónica</p>
        </div>

        {/* Hielo Estimado */}
        <div className="bg-gradient-to-br from-cyan-950/60 to-zinc-900 border border-cyan-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Hielo Utilizado</span>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
            {totalIceKg.toFixed(1)} <span className="text-sm font-semibold">Kg</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">~10% dilución en tragos</p>
        </div>

        {/* Botellas de Agua */}
        <div className="bg-gradient-to-br from-blue-950/60 to-zinc-900 border border-blue-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span>Agua Mineral</span>
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono mt-1">
            {waters.reduce((acc, w) => acc + w.theoreticalBottles, 0).toFixed(0)}{' '}
            <span className="text-sm font-semibold">unidades</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Botellas 500cc</p>
        </div>
      </div>

      {/* Dynamic Glass & Tank Capacity Fine-Tuner Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200">
              Capacidad de Envases Activa (Fórmula por %)
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Recálculo automático instantáneo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">🥤 Vaso estándar:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-zinc-100">
              <span>{vasoContainer?.capacityMl || 350}</span>
              <span className="text-zinc-500 text-[10px]">cc</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400">🏺 Tanque / Jarra:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-zinc-100">
              <span>{tanqueContainer?.capacityMl || 750}</span>
              <span className="text-zinc-500 text-[10px]">cc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Subtabs: Consumo vs Qué Vendió Más */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex-1">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('consumo');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'consumo'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Consumo Litros</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setActiveTab('ranking');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ranking'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Qué Vendió Más</span>
          </button>
        </div>

        {/* Copy Arqueo Report button */}
        <button
          type="button"
          onClick={handleCopyReport}
          className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 active:bg-emerald-500 active:text-zinc-950 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
        >
          {copiedReport ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Copiar Cierre</span>
            </>
          )}
        </button>
      </div>

      {/* TAB 1: Consumo en Litros & Arqueo de Botellas */}
      {activeTab === 'consumo' && (
        <div className="space-y-4">
          {/* Destilados y Bebidas Alcohólicas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Wine className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Destilados & Alcohol
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {totalAlcoholLiters.toFixed(2)} Litros Totales
              </span>
            </div>

            <div className="space-y-3">
              {spirits.map((item) => {
                const deviation = item.stockInitialBottles > 0 ? item.deviationBottles : null;
                const isShortage = deviation !== null && deviation > 0.8;
                const isMatching = deviation !== null && Math.abs(deviation) <= 0.8;

                return (
                  <div
                    key={item.ingredientId}
                    className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 transition hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-zinc-100">{item.ingredientName}</h4>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Envase:{' '}
                          <span className="text-zinc-300 font-semibold">{item.bottleLabel}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-amber-400 font-mono">
                          {item.totalLiters.toFixed(2)} <span className="text-xs">L</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-semibold font-mono">
                          ~{item.theoreticalBottles.toFixed(1)} botellas
                        </div>
                      </div>
                    </div>

                    {/* Stock Input fields for Bar Closing Audit */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            Stock Inicial:
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.stockInitialBottles}
                            onChange={(e) =>
                              onUpdateIngredientStock(
                                item.ingredientId,
                                Math.max(0, parseInt(e.target.value) || 0),
                                item.stockRemainingBottles
                              )
                            }
                            className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            Quedan:
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.stockRemainingBottles}
                            onChange={(e) =>
                              onUpdateIngredientStock(
                                item.ingredientId,
                                item.stockInitialBottles,
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Deviation Badge */}
                      {deviation !== null && item.stockInitialBottles > 0 && (
                        <div
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 font-mono ${
                            isMatching
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isShortage
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isMatching ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Cuadra bien ({deviation > 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1)} bot)</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>
                                {deviation > 0
                                  ? `Faltan ${deviation.toFixed(1)} botellas`
                                  : `Sobra ${Math.abs(deviation).toFixed(1)} botellas`}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gaseosas, Mixers y Jugos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <CupSoda className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Gaseosas, Mixers & Energizantes
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {totalMixerLiters.toFixed(2)} Litros Totales
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {mixers.map((item) => (
                <div
                  key={item.ingredientId}
                  className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{item.ingredientName}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {item.bottleLabel}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-emerald-400 font-mono">
                      {item.totalLiters.toFixed(2)} <span className="text-xs">L</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      ~{item.theoreticalBottles.toFixed(1)} envases
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Qué Vendió Más (Ranking) */}
      {activeTab === 'ranking' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Ranking de Bebidas Vendidas
                </h3>
                <p className="text-xs text-zinc-400">
                  Ordenado por cantidad de unidades entregadas en barra
                </p>
              </div>
            </div>
          </div>

          {salesStats.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Aún no hay ventas registradas para generar el ranking.
            </div>
          ) : (
            <div className="space-y-3">
              {salesStats.map((item, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <div
                    key={item.drinkId}
                    className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center font-mono ${
                            isTop1
                              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/30'
                              : isTop2
                              ? 'bg-slate-300 text-zinc-950'
                              : isTop3
                              ? 'bg-amber-700 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100">{item.drinkName}</h4>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {formatMoney(item.totalRevenue)} recaudados
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400 font-mono">
                          {item.quantity}{' '}
                          <span className="text-xs text-zinc-400 font-normal">
                            {item.quantity === 1 ? 'u.' : 'u.'}
                          </span>
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono font-bold">
                          {item.percentageOfTotalOrders.toFixed(1)}% del total
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Sales Share */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          isTop1
                            ? 'bg-amber-400'
                            : isTop2
                            ? 'bg-emerald-400'
                            : isTop3
                            ? 'bg-blue-400'
                            : 'bg-zinc-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentageOfTotalOrders)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
