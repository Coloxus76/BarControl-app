export type TicketColorId = 'blanco' | 'verde' | 'azul' | 'rosa' | string;

export interface TicketConfig {
  id: TicketColorId;
  name: string; // e.g. "Ticket Blanco", "Ticket Verde", etc.
  label: string; // e.g. "Agua 500cc", "Bebida s/ Alcohol", "Vasos c/ Alcohol", "Tanques 750cc"
  color: string; // hex or tailwind class descriptor
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  glowClass: string;
  price: number; // e.g. 4000, 6000, 8000, 12000
  containerType: ContainerType;
}

export type ContainerType = 'vaso' | 'tanque' | 'botella' | string;

export interface ContainerConfig {
  id: ContainerType;
  name: string;
  capacityMl: number; // e.g. 350 for vaso, 750 for tanque, 500 for botella
}

export type IngredientType = 'alcohol' | 'mixer' | 'ice' | 'water' | 'direct';

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
  bottleSizeMl: number; // e.g. 750 for Fernet, 2250 for Coca 2.25L, 250 for Speed
  bottleLabel: string; // e.g. "Botella 750ml", "Botella 2.25L", "Lata 250ml", "Bolsa 1kg"
  stockInitialBottles?: number;
  stockRemainingBottles?: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  percentage: number; // 0 to 100
}

export interface Drink {
  id: string;
  name: string;
  ticketId: TicketColorId;
  containerType: ContainerType;
  description?: string;
  recipe: RecipeIngredient[]; // percentages that make up the drink
  active: boolean;
  iconName?: string;
}

export interface OrderItem {
  drinkId: string;
  drinkName: string;
  ticketId: TicketColorId;
  ticketName: string;
  ticketColor: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  containerType: ContainerType;
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: number;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  ticketCountByColor: Record<string, number>; // e.g. { blanco: 1, azul: 2 }
  status: 'confirmed' | 'cancelled';
  notes?: string;
}

export interface IngredientConsumption {
  ingredientId: string;
  ingredientName: string;
  type: IngredientType;
  bottleSizeMl: number;
  bottleLabel: string;
  totalMl: number;
  totalLiters: number;
  theoreticalBottles: number;
  stockInitialBottles: number;
  stockRemainingBottles: number;
  realBottlesUsed: number;
  deviationBottles: number; // real - theoretical
  isDirectItem?: boolean;
}

export interface DrinkSalesStats {
  drinkId: string;
  drinkName: string;
  ticketId: string;
  ticketColor: string;
  quantity: number;
  totalRevenue: number;
  percentageOfTotalOrders: number;
}
