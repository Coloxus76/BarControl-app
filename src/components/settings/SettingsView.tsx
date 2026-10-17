import React, { useState, useEffect } from 'react';
import {
  ContainerConfig,
  Drink,
  Ingredient,
  RecipeIngredient,
  TicketConfig,
} from '../../types/bar';
import { formatMoney } from '../../utils/calculations';
import { sounds } from '../../utils/audioHaptics';
import {
  Sliders,
  DollarSign,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Wine,
  Percent,
  X,
  Pencil,
} from 'lucide-react';

export const isLightColor = (hex: string): boolean => {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return false;
  }
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
};

const TICKET_COLOR_PRESETS = [
  { name: 'Blanco', hex: '#f8fafc', textDark: true },
  { name: 'Verde', hex: '#22c55e', textDark: true },
  { name: 'Azul', hex: '#3b82f6', textDark: false },
  { name: 'Rosa', hex: '#ec4899', textDark: false },
  { name: 'Amarillo', hex: '#eab308', textDark: true },
  { name: 'Rojo', hex: '#ef4444', textDark: false },
  { name: 'Violeta', hex: '#a855f7', textDark: false },
  { name: 'Naranja', hex: '#f97316', textDark: false },
  { name: 'Celeste', hex: '#06b6d4', textDark: true },
  { name: 'Dorado', hex: '#f59e0b', textDark: true },
  { name: 'Lima', hex: '#84cc16', textDark: true },
  { name: 'Gris', hex: '#64748b', textDark: false },
];

interface SettingsViewProps {
  tickets: TicketConfig[];
  containers: ContainerConfig[];
  drinks: Drink[];
  ingredients: Ingredient[];
  onUpdateTickets: (updatedTickets: TicketConfig[]) => void;
  onUpdateContainers: (updatedContainers: ContainerConfig[]) => void;
  onUpdateDrinks: (updatedDrinks: Drink[]) => void;
  onUpdateIngredients: (updatedIngredients: Ingredient[]) => void;
  onResetPartyData: () => void;
  onResetFactoryDefaults: () => void;
  onLoadDemoData: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tickets,
  containers,
  drinks,
  ingredients,
  onUpdateTickets,
  onUpdateContainers,
  onUpdateDrinks,
  onUpdateIngredients,
  onResetPartyData,
  onResetFactoryDefaults,
  onLoadDemoData,
  onExportBackup,
  onImportBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'envases' | 'recetas' | 'datos'>('tickets');
  const [editingDrinkId, setEditingDrinkId] = useState<string>(drinks[0]?.id || '');
  const [saveToast, setSaveToast] = useState(false);

  // Local state for tickets prices
  const [localTickets, setLocalTickets] = useState<TicketConfig[]>([...tickets]);

  // Local state for container capacities
  const [localContainers, setLocalContainers] = useState<ContainerConfig[]>([...containers]);

  // Local state for drinks
  const [localDrinks, setLocalDrinks] = useState<Drink[]>([...drinks]);

  // Active drink being edited for recipe percentages
  const currentEditingDrink = localDrinks.find((d) => d.id === editingDrinkId) || localDrinks[0];

  const ingredientMap = new Map<string, Ingredient>();
  ingredients.forEach((ing) => ingredientMap.set(ing.id, ing));

  // Sync local states if props change from outside
  useEffect(() => {
    setLocalTickets([...tickets]);
  }, [tickets]);

  useEffect(() => {
    setLocalContainers([...containers]);
  }, [containers]);

  useEffect(() => {
    setLocalDrinks([...drinks]);
  }, [drinks]);

  // State for discreet Add Ticket feature
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicketName, setNewTicketName] = useState('Ticket Amarillo');
  const [newTicketLabel, setNewTicketLabel] = useState('Shots / Tragos Especiales');
  const [newTicketPrice, setNewTicketPrice] = useState(5000);
  const [newTicketColor, setNewTicketColor] = useState('#eab308');
  const [newTicketContainer, setNewTicketContainer] = useState<string>('vaso');

  // State for discreet Add Container feature
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerCapacity, setNewContainerCapacity] = useState(500);

  // State for modifying / editing an existing ticket
  const [editingTicket, setEditingTicket] = useState<TicketConfig | null>(null);
  const [editTicketName, setEditTicketName] = useState('');
  const [editTicketLabel, setEditTicketLabel] = useState('');
  const [editTicketColor, setEditTicketColor] = useState('#f8fafc');
  const [editTicketPrice, setEditTicketPrice] = useState(4000);
  const [editTicketContainer, setEditTicketContainer] = useState('vaso');

  // State for modifying / editing an existing container
  const [editingContainer, setEditingContainer] = useState<ContainerConfig | null>(null);
  const [editContainerName, setEditContainerName] = useState('');
  const [editContainerCapacity, setEditContainerCapacity] = useState(350);

  // State for managing / modifying / deleting drinks
  const [editingDrinkModal, setEditingDrinkModal] = useState<Drink | null>(null);
  const [editDrinkName, setEditDrinkName] = useState('');
  const [editDrinkTicketId, setEditDrinkTicketId] = useState('');
  const [editDrinkContainerType, setEditDrinkContainerType] = useState('vaso');

  // State for creating a new drink
  const [showCreateDrinkModal, setShowCreateDrinkModal] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkTicketId, setNewDrinkTicketId] = useState('');
  const [newDrinkContainerType, setNewDrinkContainerType] = useState('vaso');
  const [newDrinkIngredientId, setNewDrinkIngredientId] = useState('');

  // State for deleting a drink
  const [drinkPendingDelete, setDrinkPendingDelete] = useState<Drink | null>(null);
  const [drinkDeleteAlert, setDrinkDeleteAlert] = useState<string | null>(null);

  // Toggle for full drink list view
  const [showDrinkListDrawer, setShowDrinkListDrawer] = useState(false);

  // Modal states for iframe-safe confirmation (never uses window.confirm or alert)
  const [ticketPendingDelete, setTicketPendingDelete] = useState<TicketConfig | null>(null);
  const [ticketDeleteAlert, setTicketDeleteAlert] = useState<string | null>(null);
  const [containerPendingDelete, setContainerPendingDelete] = useState<ContainerConfig | null>(null);
  const [containerDeleteAlert, setContainerDeleteAlert] = useState<string | null>(null);
  const [showResetPartyModal, setShowResetPartyModal] = useState(false);
  const [showResetFactoryModal, setShowResetFactoryModal] = useState(false);

  // Handler for Ticket price change
  const handlePriceChange = (ticketId: string, newPrice: number) => {
    const updated = localTickets.map((t) =>
      t.id === ticketId ? { ...t, price: Math.max(0, newPrice) } : t
    );
    setLocalTickets(updated);
  };

  // Handler to request deleting a ticket (in-app dialog, never blocked by iframe)
  const handleRequestDeleteTicket = (ticket: TicketConfig) => {
    sounds.playTap();
    if (localTickets.length <= 1) {
      setTicketDeleteAlert('Debe quedar al menos 1 ticket configurado en el sistema.');
      return;
    }
    setTicketPendingDelete(ticket);
  };

  // Handler to confirm and execute ticket deletion
  const handleConfirmDeleteTicket = () => {
    if (!ticketPendingDelete) return;
    sounds.playDelete();
    const ticketId = ticketPendingDelete.id;
    const updatedTickets = localTickets.filter((t) => t.id !== ticketId);
    const fallbackTicketId = updatedTickets[0]?.id;

    // Check if any drinks were using this ticket and reassign them
    let updatedDrinks = localDrinks;
    if (fallbackTicketId) {
      let hasReassigned = false;
      updatedDrinks = localDrinks.map((d) => {
        if (d.ticketId === ticketId) {
          hasReassigned = true;
          return { ...d, ticketId: fallbackTicketId };
        }
        return d;
      });
      if (hasReassigned) {
        setLocalDrinks(updatedDrinks);
        onUpdateDrinks(updatedDrinks);
      }
    }

    setLocalTickets(updatedTickets);
    onUpdateTickets(updatedTickets);
    setTicketPendingDelete(null);
  };

  // Handler to create a new ticket
  const handleCreateTicket = () => {
    if (!newTicketName.trim()) return;
    sounds.playSuccess();
    const selectedPreset = TICKET_COLOR_PRESETS.find((p) => p.hex === newTicketColor);
    const textDark = selectedPreset ? selectedPreset.textDark : false;
    const newId = `tk_${Date.now()}`;

    const created: TicketConfig = {
      id: newId,
      name: newTicketName.trim(),
      label: newTicketLabel.trim() || newTicketName.trim(),
      color: newTicketColor,
      bgClass: textDark ? 'bg-amber-400/20 text-amber-300' : 'bg-rose-500/20 text-rose-300',
      borderClass: 'border-zinc-700',
      textClass: textDark ? 'text-amber-400' : 'text-rose-400',
      badgeBg: textDark ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-rose-600 text-white font-bold',
      glowClass: '',
      price: Math.max(0, newTicketPrice),
      containerType: newTicketContainer,
    };

    const updated = [...localTickets, created];
    setLocalTickets(updated);
    onUpdateTickets(updated);
    setShowAddTicket(false);
    setNewTicketName('');
    setNewTicketLabel('');
  };

  // Handler for Container capacity change
  const handleCapacityChange = (containerId: string, newCapacity: number) => {
    const updated = localContainers.map((c) =>
      c.id === containerId ? { ...c, capacityMl: Math.max(20, newCapacity) } : c
    );
    setLocalContainers(updated);
  };

  // Handler to request deleting a container (in-app dialog, safe in iframes)
  const handleRequestDeleteContainer = (container: ContainerConfig) => {
    sounds.playTap();
    if (localContainers.length <= 1) {
      setContainerDeleteAlert('Debe quedar al menos 1 envase configurado en el sistema.');
      return;
    }
    setContainerPendingDelete(container);
  };

  // Handler to confirm and execute container deletion
  const handleConfirmDeleteContainer = () => {
    if (!containerPendingDelete) return;
    sounds.playDelete();
    const containerId = containerPendingDelete.id;
    const updatedContainers = localContainers.filter((c) => c.id !== containerId);
    const fallbackContainerId = updatedContainers[0]?.id || 'vaso';

    // Check if any drinks were using this container and reassign them
    let updatedDrinks = localDrinks;
    let hasReassigned = false;
    updatedDrinks = localDrinks.map((d) => {
      if (d.containerType === containerId) {
        hasReassigned = true;
        return { ...d, containerType: fallbackContainerId };
      }
      return d;
    });

    if (hasReassigned) {
      setLocalDrinks(updatedDrinks);
      onUpdateDrinks(updatedDrinks);
    }

    setLocalContainers(updatedContainers);
    onUpdateContainers(updatedContainers);
    setContainerPendingDelete(null);
  };

  // Handler to create a new container
  const handleCreateContainer = () => {
    if (!newContainerName.trim()) return;
    sounds.playSuccess();
    const newId = `env_${Date.now()}`;
    const created: ContainerConfig = {
      id: newId,
      name: newContainerName.trim(),
      capacityMl: Math.max(20, newContainerCapacity),
    };

    const updated = [...localContainers, created];
    setLocalContainers(updated);
    onUpdateContainers(updated);
    setShowAddContainer(false);
    setNewContainerName('');
    setNewContainerCapacity(500);
  };

  // Handlers for Modifying Tickets
  const handleStartEditTicket = (ticket: TicketConfig) => {
    sounds.playTap();
    setEditingTicket(ticket);
    setEditTicketName(ticket.name);
    setEditTicketLabel(ticket.label || ticket.name);
    setEditTicketColor(ticket.color);
    setEditTicketPrice(ticket.price);
    setEditTicketContainer(ticket.containerType);
  };

  const handleSaveEditTicket = () => {
    if (!editingTicket || !editTicketName.trim()) return;
    sounds.playSuccess();
    const light = isLightColor(editTicketColor);
    const updated = localTickets.map((t) => {
      if (t.id === editingTicket.id) {
        return {
          ...t,
          name: editTicketName.trim(),
          label: editTicketLabel.trim() || editTicketName.trim(),
          color: editTicketColor,
          price: Math.max(0, editTicketPrice),
          containerType: editTicketContainer,
          badgeBg: light ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-rose-600 text-white font-bold',
        };
      }
      return t;
    });

    setLocalTickets(updated);
    onUpdateTickets(updated);
    setEditingTicket(null);
  };

  // Handlers for Modifying Containers
  const handleStartEditContainer = (container: ContainerConfig) => {
    sounds.playTap();
    setEditingContainer(container);
    setEditContainerName(container.name);
    setEditContainerCapacity(container.capacityMl);
  };

  const handleSaveEditContainer = () => {
    if (!editingContainer || !editContainerName.trim()) return;
    sounds.playSuccess();
    const newCap = Math.max(20, editContainerCapacity);
    const updated = localContainers.map((c) => {
      if (c.id === editingContainer.id) {
        return {
          ...c,
          name: editContainerName.trim(),
          capacityMl: newCap,
        };
      }
      return c;
    });

    setLocalContainers(updated);
    onUpdateContainers(updated);
    setEditingContainer(null);
  };

  // Handler for Drink ticket assignment
  const handleDrinkTicketChange = (drinkId: string, newTicketId: string) => {
    const updatedDrinks = localDrinks.map((d) =>
      d.id === drinkId ? { ...d, ticketId: newTicketId } : d
    );
    setLocalDrinks(updatedDrinks);
  };

  // Handler for Drink container assignment
  const handleDrinkContainerChange = (drinkId: string, newContainer: string) => {
    const updatedDrinks = localDrinks.map((d) =>
      d.id === drinkId ? { ...d, containerType: newContainer } : d
    );
    setLocalDrinks(updatedDrinks);
  };

  // Handlers for Managing / Modifying Drinks
  const handleStartEditDrink = (drink: Drink) => {
    sounds.playTap();
    setEditingDrinkModal(drink);
    setEditDrinkName(drink.name);
    setEditDrinkTicketId(drink.ticketId);
    setEditDrinkContainerType(drink.containerType);
  };

  const handleSaveEditDrink = () => {
    if (!editingDrinkModal || !editDrinkName.trim()) return;
    sounds.playSuccess();
    const updated = localDrinks.map((d) => {
      if (d.id === editingDrinkModal.id) {
        return {
          ...d,
          name: editDrinkName.trim(),
          ticketId: editDrinkTicketId,
          containerType: editDrinkContainerType,
        };
      }
      return d;
    });

    setLocalDrinks(updated);
    onUpdateDrinks(updated);
    setEditingDrinkModal(null);
  };

  const handleStartCreateDrink = () => {
    sounds.playTap();
    setNewDrinkName('');
    setNewDrinkTicketId(localTickets[0]?.id || 'verde');
    setNewDrinkContainerType(localContainers[0]?.id || 'vaso');
    setNewDrinkIngredientId(ingredients[0]?.id || '');
    setShowCreateDrinkModal(true);
  };

  const handleCreateDrink = () => {
    if (!newDrinkName.trim()) return;
    sounds.playSuccess();
    const newId = `drink_${Date.now()}`;
    const initialRecipe: RecipeIngredient[] = newDrinkIngredientId
      ? [{ ingredientId: newDrinkIngredientId, percentage: 100 }]
      : [];

    const createdDrink: Drink = {
      id: newId,
      name: newDrinkName.trim(),
      ticketId: newDrinkTicketId || localTickets[0]?.id || 'verde',
      containerType: newDrinkContainerType || localContainers[0]?.id || 'vaso',
      recipe: initialRecipe,
      active: true,
      description: `${newDrinkName.trim()} en ${newDrinkContainerType}`,
    };

    const updated = [...localDrinks, createdDrink];
    setLocalDrinks(updated);
    onUpdateDrinks(updated);
    setEditingDrinkId(newId);
    setShowCreateDrinkModal(false);
    setNewDrinkName('');
  };

  const handleRequestDeleteDrink = (drink: Drink) => {
    sounds.playTap();
    if (localDrinks.length <= 1) {
      setDrinkDeleteAlert('Debe quedar al menos 1 bebida configurada en el menú del bar.');
      return;
    }
    setDrinkPendingDelete(drink);
  };

  const handleConfirmDeleteDrink = () => {
    if (!drinkPendingDelete) return;
    sounds.playDelete();
    const deletedId = drinkPendingDelete.id;
    const updated = localDrinks.filter((d) => d.id !== deletedId);
    setLocalDrinks(updated);
    onUpdateDrinks(updated);

    if (editingDrinkId === deletedId && updated.length > 0) {
      setEditingDrinkId(updated[0].id);
    }
    setDrinkPendingDelete(null);
  };

  // Save all tickets & containers
  const handleSaveConfigs = () => {
    sounds.playSuccess();
    onUpdateTickets(localTickets);
    onUpdateContainers(localContainers);
    onUpdateDrinks(localDrinks);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Recipe percentage update for the active drink
  const handleRecipePercentageChange = (ingredientId: string, newPercent: number) => {
    if (!currentEditingDrink) return;
    const clamped = Math.max(0, Math.min(100, newPercent));

    const updatedRecipe = currentEditingDrink.recipe.map((r) =>
      r.ingredientId === ingredientId ? { ...r, percentage: clamped } : r
    );

    const updatedDrinks = localDrinks.map((d) =>
      d.id === currentEditingDrink.id ? { ...d, recipe: updatedRecipe } : d
    );
    setLocalDrinks(updatedDrinks);
  };

  // Add ingredient to recipe
  const handleAddIngredientToRecipe = (ingredientId: string) => {
    if (!currentEditingDrink || !ingredientId) return;
    if (currentEditingDrink.recipe.some((r) => r.ingredientId === ingredientId)) return;

    sounds.playTap();
    const updatedRecipe: RecipeIngredient[] = [
      ...currentEditingDrink.recipe,
      { ingredientId, percentage: 10 },
    ];

    const updatedDrinks = localDrinks.map((d) =>
      d.id === currentEditingDrink.id ? { ...d, recipe: updatedRecipe } : d
    );
    setLocalDrinks(updatedDrinks);
  };

  // Remove ingredient from recipe
  const handleRemoveIngredientFromRecipe = (ingredientId: string) => {
    if (!currentEditingDrink) return;
    sounds.playTap();
    const updatedRecipe = currentEditingDrink.recipe.filter(
      (r) => r.ingredientId !== ingredientId
    );

    const updatedDrinks = localDrinks.map((d) =>
      d.id === currentEditingDrink.id ? { ...d, recipe: updatedRecipe } : d
    );
    setLocalDrinks(updatedDrinks);
  };

  // Calculate sum of recipe percentages
  const recipeTotalPercentage = currentEditingDrink?.recipe.reduce(
    (sum, r) => sum + r.percentage,
    0
  ) || 0;

  // File import for backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportBackup(content);
        if (success) {
          sounds.playSuccess();
          alert('¡Copia de seguridad restaurada con éxito!');
        } else {
          alert('Error al leer el archivo JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-28 pt-2 px-3 max-w-5xl mx-auto select-none">
      {/* Settings Navigation Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-4">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setActiveTab('tickets');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Tickets & Precios</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setActiveTab('envases');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'envases'
              ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Envases cc</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setActiveTab('recetas');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'recetas'
              ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Wine className="w-3.5 h-3.5" />
          <span>Bebidas & Recetas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setActiveTab('datos');
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'datos'
              ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Datos & Demo</span>
        </button>
      </div>

      {/* Save Button Header */}
      <div className="flex items-center justify-between mb-4 bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl">
        <span className="text-xs text-zinc-400">
          Modifica precios, cc o recetas y guarda los cambios en vivo.
        </span>

        <button
          type="button"
          onClick={handleSaveConfigs}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md shadow-amber-400/20 transition flex items-center gap-1.5"
        >
          {saveToast ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* TAB 1: TICKETS & PRECIOS */}
      {activeTab === 'tickets' && (
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
              Configuración de Tickets Físicos
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ajusta el precio de cobro asignado a cada color de ticket que entregarás en la fiesta.
            </p>

            <div className="space-y-3">
              {localTickets.map((t) => {
                const matchedContainer = localContainers.find((c) => c.id === t.containerType);
                const isLight = isLightColor(t.color);

                return (
                  <div
                    key={t.id}
                    className="bg-zinc-950/85 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-3.5 space-y-3 transition shadow-sm"
                  >
                    {/* Header: Color Indicator + Ticket Name Badge + Action Buttons (Modificar & Borrar) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/10 shadow-sm"
                          style={{ backgroundColor: t.color }}
                        />
                        <span
                          className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm shrink-0"
                          style={{
                            backgroundColor: t.color,
                            color: isLight ? '#09090b' : '#ffffff',
                          }}
                        >
                          {t.name}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditTicket(t)}
                          title={`Modificar ${t.name}`}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-bold rounded-xl border border-zinc-800 hover:border-amber-400/40 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Modificar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestDeleteTicket(t)}
                          title={`Borrar ${t.name}`}
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-transparent hover:border-rose-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle details: Full description / label without truncation! */}
                    <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-2.5 space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-200 leading-snug break-words">
                        {t.label || t.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                          Envase asociado:
                        </span>
                        <span className="font-semibold text-zinc-300">
                          {matchedContainer
                            ? `${matchedContainer.name} (${matchedContainer.capacityMl} cc)`
                            : t.containerType}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Price config */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                      <span className="text-xs font-bold text-zinc-400">
                        Precio de cobro:
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 font-mono text-sm font-bold">$</span>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          value={t.price}
                          onChange={(e) => handlePriceChange(t.id, parseInt(e.target.value) || 0)}
                          className="w-24 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-right font-mono font-black text-amber-400 text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle Add Ticket Option */}
            {!showAddTicket ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setShowAddTicket(true);
                  }}
                  className="w-full py-2 px-3 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/40 text-zinc-500 hover:text-zinc-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Agregar nuevo ticket</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold text-zinc-200">Nuevo Ticket Físico</span>
                  <button
                    type="button"
                    onClick={() => setShowAddTicket(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color presets selection */}
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">
                    Color del Ticket
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {TICKET_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => {
                          setNewTicketColor(preset.hex);
                          if (!newTicketName || newTicketName.startsWith('Ticket ')) {
                            setNewTicketName(`Ticket ${preset.name}`);
                          }
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
                          newTicketColor === preset.hex
                            ? 'border-white scale-110 shadow-md'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {newTicketColor === preset.hex && (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Label */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newTicketName}
                      onChange={(e) => setNewTicketName(e.target.value)}
                      placeholder="Ej: Ticket Amarillo"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Detalle / Bebidas
                    </label>
                    <input
                      type="text"
                      value={newTicketLabel}
                      onChange={(e) => setNewTicketLabel(e.target.value)}
                      placeholder="Ej: Shots / Tragos Especiales"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Price & Container */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Precio ($)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={newTicketPrice}
                      onChange={(e) => setNewTicketPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Envase Asignado
                    </label>
                    <select
                      value={newTicketContainer}
                      onChange={(e) => setNewTicketContainer(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      {localContainers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.capacityMl}cc)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddTicket(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTicket}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-lg shadow-sm transition"
                  >
                    Crear Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ENVASES (CAPACIDAD EN CC) */}
      {activeTab === 'envases' && (
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
              Capacidad de Envases
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Si cambias el vaso de 350 cc a 500 cc, o el tanque de 750 cc a 1000 cc, cámbialo aquí.
              Todos los litros de bebidas y botellas consumidas se recalculan automáticamente sin tocar
              las recetas.
            </p>

            <div className="space-y-3">
              {localContainers.map((c) => (
                <div
                  key={c.id}
                  className="bg-zinc-950/85 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-3.5 space-y-3 transition shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-zinc-100 uppercase tracking-wide">
                        {c.name}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Cálculo automático: <span className="font-mono font-bold text-amber-400">{c.capacityMl} cc</span> por trago
                      </span>
                    </div>

                    {/* Actions: Modificar & Borrar */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditContainer(c)}
                        title={`Modificar ${c.name}`}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-bold rounded-xl border border-zinc-800 hover:border-amber-400/40 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-400" />
                        <span>Modificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestDeleteContainer(c)}
                        title={`Borrar ${c.name}`}
                        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-transparent hover:border-rose-500/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <span className="text-xs font-bold text-zinc-400">
                      Capacidad del envase:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="25"
                        min="20"
                        max="5000"
                        value={c.capacityMl}
                        onChange={(e) => handleCapacityChange(c.id, parseInt(e.target.value) || 350)}
                        className="w-24 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-center font-mono font-black text-amber-400 text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                      />
                      <span className="text-xs font-bold text-zinc-400 font-mono">cc</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtle Add Container Option */}
            {!showAddContainer ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setShowAddContainer(true);
                  }}
                  className="w-full py-2 px-3 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/40 text-zinc-500 hover:text-zinc-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Agregar nuevo envase</span>
                </button>
              </div>
            ) : (
              <div className="mt-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold text-zinc-200">Nuevo Envase</span>
                  <button
                    type="button"
                    onClick={() => setShowAddContainer(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Nombre del Envase
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Copón 600cc, Jarra 1.5L..."
                      value={newContainerName}
                      onChange={(e) => setNewContainerName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Capacidad en cc (ml)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="25"
                        min="20"
                        max="5000"
                        placeholder="500"
                        value={newContainerCapacity}
                        onChange={(e) => setNewContainerCapacity(parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs font-mono font-bold text-zinc-400">cc</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddContainer(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateContainer}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-lg shadow-sm transition"
                  >
                    Crear Envase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECETAS PORCENTUALES (%) */}
      {activeTab === 'recetas' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Bebidas & Recetas (%)
                </h3>
                <p className="text-xs text-zinc-400">
                  Modifica bebidas, tickets de cobro, envases y proporciones de mezcla.
                </p>
              </div>

              {/* Action: Nueva Bebida */}
              <button
                type="button"
                onClick={handleStartCreateDrink}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-md shadow-amber-400/20 transition flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Bebida</span>
              </button>
            </div>

            {/* Drink Selector & Actions Bar */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Bebida a Configurar
                </label>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setShowDrinkListDrawer(!showDrinkListDrawer);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                >
                  <Layers className="w-3 h-3" />
                  <span>{showDrinkListDrawer ? 'Ocultar catálogo' : `Ver catálogo (${localDrinks.length})`}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={editingDrinkId}
                  onChange={(e) => setEditingDrinkId(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-amber-400 min-w-0"
                >
                  {localDrinks.map((d) => {
                    const t = localTickets.find((tk) => tk.id === d.ticketId);
                    const c = localContainers.find((ct) => ct.id === d.containerType);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} — {t?.name || 'Ticket'} (${t?.price.toLocaleString('es-AR')}) [{c?.name || d.containerType}]
                      </option>
                    );
                  })}
                </select>

                {currentEditingDrink && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEditDrink(currentEditingDrink)}
                      title={`Modificar nombre, ticket o envase de ${currentEditingDrink.name}`}
                      className="px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-bold rounded-xl border border-zinc-800 hover:border-amber-400/40 transition flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Modificar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestDeleteDrink(currentEditingDrink)}
                      title={`Eliminar ${currentEditingDrink.name} del menú`}
                      className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 rounded-xl border border-transparent hover:border-rose-500/20 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Collapsible Full Catalogue of all Drinks */}
            {showDrinkListDrawer && (
              <div className="mb-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-bold text-zinc-300">
                    Catálogo de Bebidas ({localDrinks.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Toca una bebida para editar su receta
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {localDrinks.map((d) => {
                    const t = localTickets.find((tk) => tk.id === d.ticketId);
                    const c = localContainers.find((ct) => ct.id === d.containerType);
                    const isSelected = d.id === editingDrinkId;

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          sounds.playTap();
                          setEditingDrinkId(d.id);
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400/50 shadow-sm'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-100 truncate">
                              {d.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950">
                                Activa
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                            <span
                              className="font-bold text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: t?.color || '#555',
                                color: isLightColor(t?.color || '#555') ? '#09090b' : '#ffffff',
                              }}
                            >
                              {t?.name || 'Ticket'}
                            </span>
                            <span>•</span>
                            <span>{c?.name || d.containerType} ({c?.capacityMl} cc)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleStartEditDrink(d)}
                            title={`Modificar ${d.name}`}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteDrink(d)}
                            title={`Borrar ${d.name}`}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drink Ticket and Container Assignment */}
            {currentEditingDrink && (
              <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Ticket / Precio Asignado
                  </label>
                  <select
                    value={currentEditingDrink.ticketId}
                    onChange={(e) => handleDrinkTicketChange(currentEditingDrink.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                  >
                    {localTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (${t.price.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Tipo de Envase
                  </label>
                  <select
                    value={currentEditingDrink.containerType}
                    onChange={(e) =>
                      handleDrinkContainerChange(
                        currentEditingDrink.id,
                        e.target.value
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-200 focus:outline-none focus:border-amber-400"
                  >
                    {localContainers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.capacityMl}cc)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Total Percentage indicator & Section Header */}
            <div className="flex items-center justify-between mb-3 pt-2 border-t border-zinc-800">
              <span className="text-xs font-bold text-zinc-300">
                Ingredientes y Proporciones de {currentEditingDrink?.name}:
              </span>
              <div
                className={`text-xs font-black px-2.5 py-1 rounded-lg font-mono ${
                  recipeTotalPercentage === 100
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                Total: {recipeTotalPercentage}%
              </div>
            </div>

            {/* Recipe Proportions Breakdown */}
            {currentEditingDrink && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-300">
                  Ingredientes de {currentEditingDrink.name}:
                </div>

                {currentEditingDrink.recipe.map((recipeItem) => {
                  const ing = ingredientMap.get(recipeItem.ingredientId);
                  return (
                    <div
                      key={recipeItem.ingredientId}
                      className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-100">
                            {ing?.name || recipeItem.ingredientId}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-400">
                            {recipeItem.percentage}%
                          </span>
                        </div>

                        {/* Slider for smooth tactile adjustment */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={recipeItem.percentage}
                          onChange={(e) =>
                            handleRecipePercentageChange(
                              recipeItem.ingredientId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveIngredientFromRecipe(recipeItem.ingredientId)
                        }
                        className="text-zinc-500 hover:text-rose-400 p-1"
                        title="Quitar ingrediente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Add new ingredient to this drink */}
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                  <select
                    id="addIngSelect"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddIngredientToRecipe(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>
                      + Sumar ingrediente a la receta...
                    </option>
                    {ingredients
                      .filter(
                        (i) =>
                          !currentEditingDrink.recipe.some(
                            (r) => r.ingredientId === i.id
                          )
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.bottleLabel})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DATOS, DEMO & RESPALDO */}
      {activeTab === 'datos' && (
        <div className="space-y-4">
          {/* Quick Demo Data Loader */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Datos de Demostración
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Carga una serie de pedidos simulados para probar la app, el cálculo de litros y el
              arqueo antes de la fiesta.
            </p>
            <button
              type="button"
              onClick={() => {
                sounds.playSuccess();
                onLoadDemoData();
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Cargar 5 Pedidos de Prueba</span>
            </button>
          </div>

          {/* Backup / Export / Import */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              Copia de Seguridad (Backup)
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Guarda un archivo JSON con toda tu configuración, recetas y pedidos para tener respaldo
              en tu celular.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onExportBackup}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar JSON</span>
              </button>

              <label className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Importar JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone: Reset Fiesta */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                Zona de Cierre / Reinicio
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Usa &quot;Reiniciar Fiesta&quot; para borrar los pedidos y dejar la caja en cero para una nueva
              fiesta, manteniendo tus recetas y precios intactos.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setShowResetPartyModal(true);
                }}
                className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Fiesta (Borrar Pedidos)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setShowResetFactoryModal(true);
                }}
                className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold transition"
              >
                Restaurar Fábrica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de eliminación de ticket (100% seguro en iframe) */}
      {ticketPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Ticket?</h3>
                <p className="text-xs text-zinc-400">Esta acción removerá el ticket físico de la lista.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
              <span
                className="text-xs font-black uppercase px-2.5 py-1.5 rounded-lg shadow-sm"
                style={{
                  backgroundColor: ticketPendingDelete.color,
                  color:
                    ticketPendingDelete.color === '#f8fafc' ||
                    ticketPendingDelete.color === '#ffffff' ||
                    ticketPendingDelete.color === '#eab308' ||
                    ticketPendingDelete.color === '#84cc16' ||
                    ticketPendingDelete.color === '#06b6d4'
                      ? '#09090b'
                      : '#ffffff',
                }}
              >
                {ticketPendingDelete.name}
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {formatMoney(ticketPendingDelete.price)}
              </span>
            </div>

            {/* Aviso si hay bebidas asociadas */}
            {(() => {
              const drinksUsing = localDrinks.filter((d) => d.ticketId === ticketPendingDelete.id);
              if (drinksUsing.length > 0) {
                const remaining = localTickets.filter((t) => t.id !== ticketPendingDelete.id);
                const fallbackName = remaining[0]?.name || 'Ticket disponible';
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{drinksUsing.length} bebida(s) usan este ticket:</span>
                    </p>
                    <p className="text-zinc-300 text-[11px] leading-tight pl-5">
                      {drinksUsing.map((d) => d.name).join(', ')}
                    </p>
                    <p className="text-zinc-400 text-[11px] pl-5">
                      Se reasignarán a <strong>{fallbackName}</strong> automáticamente.
                    </p>
                  </div>
                );
              }
              return (
                <p className="text-xs text-zinc-400">
                  Ninguna bebida está usando este ticket actualmente.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTicketPendingDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTicket}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alerta cuando solo queda 1 ticket */}
      {ticketDeleteAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">No se puede eliminar</h3>
                <p className="text-xs text-zinc-300 mt-1">{ticketDeleteAlert}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTicketDeleteAlert(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Reiniciar Fiesta */}
      {showResetPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Reiniciar Fiesta?</h3>
                <p className="text-xs text-zinc-400">Se borrarán los pedidos y el arqueo quedará en cero.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300">
              Tus recetas, tickets configurados y capacidades de envases se conservarán intactos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetPartyModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playDelete();
                  onResetPartyData();
                  setShowResetPartyModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmar Reinicio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Restaurar Fábrica */}
      {showResetFactoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Restaurar Valores de Fábrica</h3>
                <p className="text-xs text-zinc-400">¡Cuidado! Se restablecerán todos los datos iniciales.</p>
              </div>
            </div>
            <p className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              Todos los precios, tickets personalizados agregados, recetas y envases volverán a los valores por defecto iniciales.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetFactoryModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playDelete();
                  onResetFactoryDefaults();
                  setShowResetFactoryModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition"
              >
                Restaurar Fábrica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de eliminación de envase (100% seguro en iframe) */}
      {containerPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Envase?</h3>
                <p className="text-xs text-zinc-400">Esta acción removerá el envase de la lista.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">
                {containerPendingDelete.name}
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {containerPendingDelete.capacityMl} cc (ml)
              </span>
            </div>

            {/* Aviso si hay bebidas asociadas */}
            {(() => {
              const drinksUsing = localDrinks.filter((d) => d.containerType === containerPendingDelete.id);
              if (drinksUsing.length > 0) {
                const remaining = localContainers.filter((c) => c.id !== containerPendingDelete.id);
                const fallbackName = remaining[0]?.name || 'Envase disponible';
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{drinksUsing.length} bebida(s) usan este envase:</span>
                    </p>
                    <p className="text-zinc-300 text-[11px] leading-tight pl-5">
                      {drinksUsing.map((d) => d.name).join(', ')}
                    </p>
                    <p className="text-zinc-400 text-[11px] pl-5">
                      Se reasignarán a <strong>{fallbackName}</strong> para mantener el cálculo de litros.
                    </p>
                  </div>
                );
              }
              return (
                <p className="text-xs text-zinc-400">
                  Ninguna bebida está usando este envase actualmente.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setContainerPendingDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteContainer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alerta cuando solo queda 1 envase */}
      {containerDeleteAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">No se puede eliminar</h3>
                <p className="text-xs text-zinc-300 mt-1">{containerDeleteAlert}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setContainerDeleteAlert(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modificar Ticket Físico */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Modificar Ticket Físico</h3>
                  <p className="text-xs text-zinc-400">Cambia nombre, color, envase o precio.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Preview Badge */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold">Vista previa:</span>
              <span
                className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm"
                style={{
                  backgroundColor: editTicketColor,
                  color: isLightColor(editTicketColor) ? '#09090b' : '#ffffff',
                }}
              >
                {editTicketName || 'Nombre Ticket'}
              </span>
            </div>

            {/* Field 1: Ticket Name */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nombre del Ticket
              </label>
              <input
                type="text"
                value={editTicketName}
                onChange={(e) => setEditTicketName(e.target.value)}
                placeholder="Ej. Ticket Blanco, Ticket VIP, Ticket Gin"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Field 2: Label / Description */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Descripción / Bebidas incluidas
              </label>
              <input
                type="text"
                value={editTicketLabel}
                onChange={(e) => setEditTicketLabel(e.target.value)}
                placeholder="Ej. Agua mineral (Botella), Vasos sin alcohol..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Field 3: Color Selection */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                Color del Ticket
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {TICKET_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setEditTicketColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`w-7 h-7 rounded-lg shadow-sm transition-transform active:scale-90 ${
                      editTicketColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 scale-110'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={editTicketColor}
                  onChange={(e) => setEditTicketColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  title="Color personalizado"
                />
                <input
                  type="text"
                  value={editTicketColor}
                  onChange={(e) => setEditTicketColor(e.target.value)}
                  className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-200"
                />
              </div>
            </div>

            {/* Field 4 & 5: Price & Assigned Container */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Precio de Cobro ($)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-mono text-sm font-bold">$</span>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={editTicketPrice}
                    onChange={(e) => setEditTicketPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-right font-mono font-black text-amber-400 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Envase por Defecto
                </label>
                <select
                  value={editTicketContainer}
                  onChange={(e) => setEditTicketContainer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
                >
                  {localContainers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.capacityMl} cc)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditTicket}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modificar Capacidad / Nombre de Envase */}
      {editingContainer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Modificar Envase</h3>
                  <p className="text-xs text-zinc-400">Ajusta el nombre o la capacidad en cc.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingContainer(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nombre del Envase
              </label>
              <input
                type="text"
                value={editContainerName}
                onChange={(e) => setEditContainerName(e.target.value)}
                placeholder="Ej. Vaso Estándar, Tanque, Botella..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Capacidad en centímetros cúbicos (cc / ml)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="25"
                  min="20"
                  max="5000"
                  value={editContainerCapacity}
                  onChange={(e) => setEditContainerCapacity(parseInt(e.target.value) || 20)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-center font-mono font-black text-amber-400 text-base focus:outline-none focus:border-amber-400"
                />
                <span className="text-sm font-bold text-zinc-400 font-mono">cc</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Todos los consumos de ingredientes se recalculan automáticamente usando este valor.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingContainer(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditContainer}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Bebida */}
      {showCreateDrinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Nueva Bebida</h3>
                  <p className="text-xs text-zinc-400">Agrega un nuevo trago al menú del bar.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDrinkModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nombre de la Bebida
              </label>
              <input
                type="text"
                value={newDrinkName}
                onChange={(e) => setNewDrinkName(e.target.value)}
                placeholder="Ej. Mojito, Aperol Spritz, Gancia Batido..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Ticket / Precio Asignado
              </label>
              <select
                value={newDrinkTicketId}
                onChange={(e) => setNewDrinkTicketId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
              >
                {localTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (${t.price.toLocaleString('es-AR')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Tipo de Envase
              </label>
              <select
                value={newDrinkContainerType}
                onChange={(e) => setNewDrinkContainerType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
              >
                {localContainers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.capacityMl} cc)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Ingrediente Base Inicial
              </label>
              <select
                value={newDrinkIngredientId}
                onChange={(e) => setNewDrinkIngredientId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="">Sin ingrediente inicial (lo agrego luego)</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.bottleLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreateDrinkModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateDrink}
                disabled={!newDrinkName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Bebida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modificar Bebida */}
      {editingDrinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Modificar Bebida</h3>
                  <p className="text-xs text-zinc-400">Cambia el nombre, ticket o envase.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDrinkModal(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nombre de la Bebida
              </label>
              <input
                type="text"
                value={editDrinkName}
                onChange={(e) => setEditDrinkName(e.target.value)}
                placeholder="Nombre de la bebida"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Ticket / Precio Asignado
              </label>
              <select
                value={editDrinkTicketId}
                onChange={(e) => setEditDrinkTicketId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
              >
                {localTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (${t.price.toLocaleString('es-AR')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Tipo de Envase
              </label>
              <select
                value={editDrinkContainerType}
                onChange={(e) => setEditDrinkContainerType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-400"
              >
                {localContainers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.capacityMl} cc)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingDrinkModal(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditDrink}
                disabled={!editDrinkName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación de Bebida */}
      {drinkPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Bebida?</h3>
                <p className="text-xs text-zinc-400">Esta acción removerá el trago del menú del bar.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-sm font-bold text-zinc-200 block">
                {drinkPendingDelete.name}
              </span>
              <span className="text-xs text-zinc-400">
                Envase: {drinkPendingDelete.containerType}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDrinkPendingDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDrink}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alerta cuando solo queda 1 bebida */}
      {drinkDeleteAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">No se puede eliminar</h3>
                <p className="text-xs text-zinc-300 mt-1">{drinkDeleteAlert}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDrinkDeleteAlert(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
