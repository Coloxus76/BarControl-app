import {
  ContainerConfig,
  Drink,
  DrinkSalesStats,
  Ingredient,
  IngredientConsumption,
  Order,
  TicketConfig,
} from '../types/bar';

/**
 * Calculates theoretical beverage and ingredient consumption across all valid orders.
 * Uses exact percentages applied to dynamic container capacities (vaso 350cc, tanque 750cc, etc.).
 */
export function calculateIngredientConsumption(
  orders: Order[],
  drinks: Drink[],
  ingredients: Ingredient[],
  containers: ContainerConfig[]
): IngredientConsumption[] {
  // Map container capacities
  const containerMap = new Map<string, number>();
  containers.forEach((c) => containerMap.set(c.id, c.capacityMl));

  // Map drinks
  const drinkMap = new Map<string, Drink>();
  drinks.forEach((d) => drinkMap.set(d.id, d));

  // Accumulator for milliliters consumed per ingredient
  const mlByIngredient = new Map<string, number>();
  ingredients.forEach((ing) => mlByIngredient.set(ing.id, 0));

  // Only consider confirmed orders
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');

  for (const order of confirmedOrders) {
    for (const item of order.items) {
      const drink = drinkMap.get(item.drinkId);
      if (!drink) continue;

      const capacity = containerMap.get(drink.containerType) || 350;

      for (const recipeItem of drink.recipe) {
        // e.g. 750cc * (20 / 100) = 150cc per drink
        const mlPerDrink = capacity * (recipeItem.percentage / 100);
        const totalMlForItem = mlPerDrink * item.quantity;

        const currentTotal = mlByIngredient.get(recipeItem.ingredientId) || 0;
        mlByIngredient.set(recipeItem.ingredientId, currentTotal + totalMlForItem);
      }
    }
  }

  // Build the detailed consumption items
  const result: IngredientConsumption[] = ingredients.map((ing) => {
    const totalMl = mlByIngredient.get(ing.id) || 0;
    const totalLiters = totalMl / 1000;
    const bottleSize = ing.bottleSizeMl || 750;
    const theoreticalBottles = totalMl / bottleSize;

    const initial = ing.stockInitialBottles ?? 0;
    const remaining = ing.stockRemainingBottles ?? initial;
    const realBottlesUsed = Math.max(0, initial - remaining);
    const deviationBottles = realBottlesUsed - theoreticalBottles;

    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      type: ing.type,
      bottleSizeMl: ing.bottleSizeMl,
      bottleLabel: ing.bottleLabel,
      totalMl,
      totalLiters,
      theoreticalBottles,
      stockInitialBottles: initial,
      stockRemainingBottles: remaining,
      realBottlesUsed,
      deviationBottles,
      isDirectItem: ing.type === 'water',
    };
  });

  return result;
}

/**
 * Calculates top selling drinks ("Qué vendió más") by units and revenue.
 */
export function calculateDrinkSalesStats(
  orders: Order[],
  drinks: Drink[]
): DrinkSalesStats[] {
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const drinkMap = new Map<string, Drink>();
  drinks.forEach((d) => drinkMap.set(d.id, d));

  const countByDrink = new Map<string, { quantity: number; revenue: number }>();

  let totalItemsSold = 0;

  for (const order of confirmedOrders) {
    for (const item of order.items) {
      const current = countByDrink.get(item.drinkId) || { quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      countByDrink.set(item.drinkId, current);
      totalItemsSold += item.quantity;
    }
  }

  const stats: DrinkSalesStats[] = [];

  for (const [drinkId, data] of countByDrink.entries()) {
    const drink = drinkMap.get(drinkId);
    if (!drink) continue;

    stats.push({
      drinkId,
      drinkName: drink.name,
      ticketId: drink.ticketId,
      ticketColor: drink.ticketId,
      quantity: data.quantity,
      totalRevenue: data.revenue,
      percentageOfTotalOrders: totalItemsSold > 0 ? (data.quantity / totalItemsSold) * 100 : 0,
    });
  }

  // Sort descending by units sold
  return stats.sort((a, b) => b.quantity - a.quantity);
}

/**
 * Summary totals of money and tickets
 */
export interface BarFinancialSummary {
  totalRevenue: number;
  cashRevenue: number;
  transferRevenue: number;
  otherRevenue: number;
  totalOrdersCount: number;
  confirmedOrdersCount: number;
  cancelledOrdersCount: number;
  ticketCountsByColor: Record<string, number>;
  totalTicketsCount: number;
}

export function calculateFinancialSummary(
  orders: Order[],
  tickets: TicketConfig[]
): BarFinancialSummary {
  const summary: BarFinancialSummary = {
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    otherRevenue: 0,
    totalOrdersCount: orders.length,
    confirmedOrdersCount: 0,
    cancelledOrdersCount: 0,
    ticketCountsByColor: {},
    totalTicketsCount: 0,
  };

  tickets.forEach((t) => {
    summary.ticketCountsByColor[t.id] = 0;
  });

  for (const order of orders) {
    if (order.status === 'cancelled') {
      summary.cancelledOrdersCount++;
      continue;
    }

    summary.confirmedOrdersCount++;
    summary.totalRevenue += order.total;

    if (order.paymentMethod === 'efectivo') {
      summary.cashRevenue += order.total;
    } else if (order.paymentMethod === 'transferencia') {
      summary.transferRevenue += order.total;
    } else {
      summary.otherRevenue += order.total;
    }

    // Count tickets
    if (order.ticketCountByColor) {
      for (const [color, count] of Object.entries(order.ticketCountByColor)) {
        summary.ticketCountsByColor[color] = (summary.ticketCountsByColor[color] || 0) + count;
        summary.totalTicketsCount += count;
      }
    }
  }

  return summary;
}

/**
 * Generates TSV (Tab-Separated Values) ready to copy to clipboard and paste straight into Google Sheets
 */
export function generateSheetsTSV(orders: Order[]): string {
  const headers = [
    'N° Pedido',
    'Hora',
    'Estado',
    'Detalle de Bebidas',
    'Cant. Ítems',
    'Tickets Físicos',
    'Método de Pago',
    'Monto Total ($)',
  ];

  const rows = orders.map((order) => {
    const timeStr = new Date(order.timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const itemsSummary = order.items
      .map((it) => `${it.quantity}x ${it.drinkName}`)
      .join('; ');

    const totalItems = order.items.reduce((acc, it) => acc + it.quantity, 0);

    const ticketsSummary = Object.entries(order.ticketCountByColor || {})
      .filter(([, count]) => count > 0)
      .map(([color, count]) => `${count} ${color.toUpperCase()}`)
      .join(', ');

    return [
      `#${String(order.orderNumber).padStart(3, '0')}`,
      timeStr,
      order.status === 'confirmed' ? 'Confirmado' : 'ANULADO',
      itemsSummary,
      totalItems,
      ticketsSummary,
      order.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia/MP',
      order.total,
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
}

/**
 * Generates CSV download format
 */
export function generateCSV(orders: Order[]): string {
  const headers = [
    'Numero_Pedido',
    'Hora',
    'Estado',
    'Bebidas',
    'Total_Items',
    'Tickets',
    'Metodo_Pago',
    'Total_Pesos',
  ];

  const escapeCsv = (str: string | number) => {
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = orders.map((order) => {
    const timeStr = new Date(order.timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsSummary = order.items
      .map((it) => `${it.quantity}x ${it.drinkName}`)
      .join('; ');

    const totalItems = order.items.reduce((acc, it) => acc + it.quantity, 0);

    const ticketsSummary = Object.entries(order.ticketCountByColor || {})
      .filter(([, count]) => count > 0)
      .map(([color, count]) => `${count} ${color}`)
      .join(', ');

    return [
      escapeCsv(`#${String(order.orderNumber).padStart(3, '0')}`),
      escapeCsv(timeStr),
      escapeCsv(order.status === 'confirmed' ? 'CONFIRMADO' : 'ANULADO'),
      escapeCsv(itemsSummary),
      totalItems,
      escapeCsv(ticketsSummary),
      escapeCsv(order.paymentMethod),
      order.total,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format currency in Argentine Pesos (ARS) format (e.g. $ 12.000)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}
