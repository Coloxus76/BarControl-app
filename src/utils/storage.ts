import { ContainerConfig, Drink, Ingredient, Order, TicketConfig } from '../types/bar';
import { INITIAL_CONTAINERS, INITIAL_DRINKS, INITIAL_INGREDIENTS, INITIAL_TICKETS } from './initialData';

const STORAGE_KEYS = {
  ORDERS: 'barcontrol_orders_v1',
  TICKETS: 'barcontrol_tickets_v1',
  DRINKS: 'barcontrol_drinks_v1',
  INGREDIENTS: 'barcontrol_ingredients_v1',
  CONTAINERS: 'barcontrol_containers_v1',
  LAST_ORDER_NUM: 'barcontrol_last_order_num_v1',
  NIGHT_MODE: 'barcontrol_night_mode_v1',
  NIGHT_INTENSITY: 'barcontrol_night_intensity_v1',
};

export const storage = {
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (err) {
      console.error('Error saving orders to localStorage', err);
    }
  },

  getTickets(): TicketConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return data ? JSON.parse(data) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  },

  saveTickets(tickets: TicketConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getDrinks(): Drink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRINKS);
      return data ? JSON.parse(data) : INITIAL_DRINKS;
    } catch {
      return INITIAL_DRINKS;
    }
  },

  saveDrinks(drinks: Drink[]): void {
    localStorage.setItem(STORAGE_KEYS.DRINKS, JSON.stringify(drinks));
  },

  getIngredients(): Ingredient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      return data ? JSON.parse(data) : INITIAL_INGREDIENTS;
    } catch {
      return INITIAL_INGREDIENTS;
    }
  },

  saveIngredients(ingredients: Ingredient[]): void {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  },

  getContainers(): ContainerConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      return data ? JSON.parse(data) : INITIAL_CONTAINERS;
    } catch {
      return INITIAL_CONTAINERS;
    }
  },

  saveContainers(containers: ContainerConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
  },

  getNextOrderNumber(): number {
    try {
      const last = localStorage.getItem(STORAGE_KEYS.LAST_ORDER_NUM);
      const next = last ? parseInt(last, 10) + 1 : 1;
      localStorage.setItem(STORAGE_KEYS.LAST_ORDER_NUM, String(next));
      return next;
    } catch {
      return 1;
    }
  },

  getNightMode(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.NIGHT_MODE) === 'true';
    } catch {
      return false;
    }
  },

  saveNightMode(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NIGHT_MODE, String(enabled));
    } catch (err) {
      console.error('Error saving night mode', err);
    }
  },

  getNightIntensity(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.NIGHT_INTENSITY);
      return val ? parseInt(val, 10) : 80;
    } catch {
      return 80;
    }
  },

  saveNightIntensity(intensity: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NIGHT_INTENSITY, String(intensity));
    } catch (err) {
      console.error('Error saving night intensity', err);
    }
  },

  resetAllPartyData(): void {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.LAST_ORDER_NUM);
    // Reset ingredient remaining stock to initial stock
    const ingredients = storage.getIngredients();
    const resetIngredients = ingredients.map((ing) => ({
      ...ing,
      stockRemainingBottles: ing.stockInitialBottles,
    }));
    storage.saveIngredients(resetIngredients);
  },

  resetToFactoryDefaults(): void {
    localStorage.clear();
  },

  exportFullBackup(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      orders: storage.getOrders(),
      tickets: storage.getTickets(),
      drinks: storage.getDrinks(),
      ingredients: storage.getIngredients(),
      containers: storage.getContainers(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.orders) storage.saveOrders(parsed.orders);
      if (parsed.tickets) storage.saveTickets(parsed.tickets);
      if (parsed.drinks) storage.saveDrinks(parsed.drinks);
      if (parsed.ingredients) storage.saveIngredients(parsed.ingredients);
      if (parsed.containers) storage.saveContainers(parsed.containers);
      return true;
    } catch (err) {
      console.error('Invalid backup file', err);
      return false;
    }
  },

  loadDemoData(): void {
    // Generate realistic demo orders to test calculations
    const now = Date.now();
    const demoOrders: Order[] = [
      {
        id: 'ord_demo_1',
        orderNumber: 1,
        timestamp: now - 1000 * 60 * 95,
        items: [
          {
            drinkId: 'drink_fernet_tanque',
            drinkName: 'Fernet c/ Coca (Tanque 750cc)',
            ticketId: 'rosa',
            ticketName: 'Ticket Rosa',
            ticketColor: '#ec4899',
            unitPrice: 12000,
            quantity: 2,
            subtotal: 24000,
            containerType: 'tanque',
          },
          {
            drinkId: 'drink_agua',
            drinkName: 'Botella de Agua',
            ticketId: 'blanco',
            ticketName: 'Ticket Blanco',
            ticketColor: '#f8fafc',
            unitPrice: 4000,
            quantity: 1,
            subtotal: 4000,
            containerType: 'botella',
          },
        ],
        total: 28000,
        paymentMethod: 'transferencia',
        ticketCountByColor: { rosa: 2, blanco: 1 },
        status: 'confirmed',
      },
      {
        id: 'ord_demo_2',
        orderNumber: 2,
        timestamp: now - 1000 * 60 * 70,
        items: [
          {
            drinkId: 'drink_gintonic_vaso',
            drinkName: 'Gin Tonic (Vaso)',
            ticketId: 'azul',
            ticketName: 'Ticket Azul',
            ticketColor: '#3b82f6',
            unitPrice: 8000,
            quantity: 2,
            subtotal: 16000,
            containerType: 'vaso',
          },
          {
            drinkId: 'drink_fernet_vaso',
            drinkName: 'Fernet c/ Coca (Vaso)',
            ticketId: 'azul',
            ticketName: 'Ticket Azul',
            ticketColor: '#3b82f6',
            unitPrice: 8000,
            quantity: 1,
            subtotal: 8000,
            containerType: 'vaso',
          },
        ],
        total: 24000,
        paymentMethod: 'efectivo',
        ticketCountByColor: { azul: 3 },
        status: 'confirmed',
      },
      {
        id: 'ord_demo_3',
        orderNumber: 3,
        timestamp: now - 1000 * 60 * 45,
        items: [
          {
            drinkId: 'drink_vodka_speed_tanque',
            drinkName: 'Vodka c/ Speed (Tanque 750cc)',
            ticketId: 'rosa',
            ticketName: 'Ticket Rosa',
            ticketColor: '#ec4899',
            unitPrice: 12000,
            quantity: 1,
            subtotal: 12000,
            containerType: 'tanque',
          },
          {
            drinkId: 'drink_coca_vaso',
            drinkName: 'Coca-Cola (Vaso)',
            ticketId: 'verde',
            ticketName: 'Ticket Verde',
            ticketColor: '#22c55e',
            unitPrice: 6000,
            quantity: 2,
            subtotal: 12000,
            containerType: 'vaso',
          },
        ],
        total: 24000,
        paymentMethod: 'efectivo',
        ticketCountByColor: { rosa: 1, verde: 2 },
        status: 'confirmed',
      },
      {
        id: 'ord_demo_4',
        orderNumber: 4,
        timestamp: now - 1000 * 60 * 20,
        items: [
          {
            drinkId: 'drink_fernet_tanque',
            drinkName: 'Fernet c/ Coca (Tanque 750cc)',
            ticketId: 'rosa',
            ticketName: 'Ticket Rosa',
            ticketColor: '#ec4899',
            unitPrice: 12000,
            quantity: 1,
            subtotal: 12000,
            containerType: 'tanque',
          },
          {
            drinkId: 'drink_gancia_vaso',
            drinkName: 'Gancia c/ Sprite (Vaso)',
            ticketId: 'azul',
            ticketName: 'Ticket Azul',
            ticketColor: '#3b82f6',
            unitPrice: 8000,
            quantity: 1,
            subtotal: 8000,
            containerType: 'vaso',
          },
        ],
        total: 20000,
        paymentMethod: 'transferencia',
        ticketCountByColor: { rosa: 1, azul: 1 },
        status: 'confirmed',
      },
      {
        id: 'ord_demo_5',
        orderNumber: 5,
        timestamp: now - 1000 * 60 * 5,
        items: [
          {
            drinkId: 'drink_daiquiri_frutilla',
            drinkName: 'Daiquiri Frutilla (Vaso)',
            ticketId: 'azul',
            ticketName: 'Ticket Azul',
            ticketColor: '#3b82f6',
            unitPrice: 8000,
            quantity: 2,
            subtotal: 16000,
            containerType: 'vaso',
          },
          {
            drinkId: 'drink_cerveza_vaso',
            drinkName: 'Cerveza Tirada (Vaso)',
            ticketId: 'azul',
            ticketName: 'Ticket Azul',
            ticketColor: '#3b82f6',
            unitPrice: 8000,
            quantity: 2,
            subtotal: 16000,
            containerType: 'vaso',
          },
        ],
        total: 32000,
        paymentMethod: 'efectivo',
        ticketCountByColor: { azul: 4 },
        status: 'confirmed',
      },
    ];

    storage.saveOrders(demoOrders);
    localStorage.setItem(STORAGE_KEYS.LAST_ORDER_NUM, '5');
  },
};
