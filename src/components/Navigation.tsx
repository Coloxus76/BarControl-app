import {
  Zap,
  ClipboardList,
  FlaskConical,
  Settings,
  Sparkles,
} from 'lucide-react';
import { formatMoney } from '../utils/calculations';

interface NavigationProps {
  activeTab: 'pos' | 'orders' | 'arqueo' | 'settings';
  setActiveTab: (tab: 'pos' | 'orders' | 'arqueo' | 'settings') => void;
  totalRevenue: number;
  totalOrdersCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  totalRevenue,
  totalOrdersCount,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white uppercase">
                  Bar<span className="text-amber-400">Control</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  EN VIVO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">POS Barra & Arqueo</p>
            </div>
          </div>

          {/* Quick Balance Header Pill */}
          <div
            onClick={() => setActiveTab('orders')}
            className="cursor-pointer flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 hover:border-zinc-700 transition"
          >
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                Recaudado ({totalOrdersCount})
              </div>
              <div className="text-sm font-black text-emerald-400 leading-tight">
                {formatMoney(totalRevenue)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Sticky Tab Bar (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 pb-safe select-none">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          {/* Tab 1: Despacho */}
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
              activeTab === 'pos'
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'pos' ? 'text-amber-400 stroke-[2.5]' : 'stroke-2'
              }`}
            />
            <span className="text-[11px] tracking-tight">Despacho</span>
          </button>

          {/* Tab 2: Pedidos */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative ${
              activeTab === 'orders'
                ? 'text-blue-400 bg-blue-500/10 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardList
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'orders' ? 'text-blue-400 stroke-[2.5]' : 'stroke-2'
              }`}
            />
            <span className="text-[11px] tracking-tight">Pedidos</span>
            {totalOrdersCount > 0 && (
              <span className="absolute top-1 right-3 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500 text-black">
                {totalOrdersCount}
              </span>
            )}
          </button>

          {/* Tab 3: Arqueo */}
          <button
            type="button"
            onClick={() => setActiveTab('arqueo')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
              activeTab === 'arqueo'
                ? 'text-fuchsia-400 bg-fuchsia-500/10 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FlaskConical
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'arqueo' ? 'text-fuchsia-400 stroke-[2.5]' : 'stroke-2'
              }`}
            />
            <span className="text-[11px] tracking-tight">Arqueo %</span>
          </button>

          {/* Tab 4: Configuración */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
              activeTab === 'settings'
                ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'settings' ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'
              }`}
            />
            <span className="text-[11px] tracking-tight">Ajustes</span>
          </button>
        </div>
      </nav>
    </>
  );
};
