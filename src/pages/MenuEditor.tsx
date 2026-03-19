import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, X, Plus, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import type { Restaurant, MenuCategory, MenuItem, DietaryTag } from '../lib/types';
import { DIETARY_LABELS } from '../lib/types';
import { useToast } from '../components/Toast';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-[#D97706]" />
          </div>
          <p className="text-sm font-body text-[#1A1A1A]">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm font-body hover:bg-surface-hover transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-sm font-body hover:bg-[#B91C1C] transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

const ALL_DIETARY_TAGS: DietaryTag[] = [
  'halal', 'vegan', 'vegetarian', 'spicy', 'gluten_free', 'contains_nuts',
];

interface ItemFormState {
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  dietary_tags: DietaryTag[];
  sort_order: number;
}

const EMPTY_ITEM: ItemFormState = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  is_available: true,
  dietary_tags: [],
  sort_order: 0,
};

export function MenuEditor() {
  const { showToast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurants, cats, menuItems] = await Promise.all([
          api.get<Restaurant[]>('/api/owner/restaurant'),
          api.get<MenuCategory[]>('/api/owner/categories'),
          api.get<MenuItem[]>('/api/owner/items'),
        ]);
        if (restaurants.length > 0) setRestaurant(restaurants[0]);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
        setItems(menuItems);
      } catch (err) {
        console.error('Failed to fetch menu data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Category actions
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !restaurant) return;

    try {
      const data = await api.post<MenuCategory>('/api/owner/categories', {
        name: newCategoryName.trim(),
        sort_order: categories.length,
        restaurant_id: restaurant.id,
      });
      setCategories((prev) => [...prev, data]);
      setActiveCategory(data.id);
      setNewCategoryName('');
      showToast('Catégorie ajoutée');
    } catch {
      showToast('Échec de l\'ajout de la catégorie', 'error');
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryName.trim()) return;

    try {
      await api.patch(`/api/owner/categories/${categoryId}`, {
        name: editCategoryName.trim(),
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, name: editCategoryName.trim() } : c,
        ),
      );
      setEditingCategory(null);
      showToast('Catégorie mise à jour');
    } catch {
      showToast('Échec de la mise à jour', 'error');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const catItems = items.filter((i) => i.category_id === categoryId);
    const message = catItems.length > 0
      ? `Cette catégorie contient ${catItems.length} plat(s). Tout supprimer ?`
      : 'Supprimer cette catégorie ?';

    setConfirmModal({
      message,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/api/owner/categories/${categoryId}`);
          setCategories((prev) => prev.filter((c) => c.id !== categoryId));
          setItems((prev) => prev.filter((i) => i.category_id !== categoryId));
          if (activeCategory === categoryId) {
            setActiveCategory(categories.find((c) => c.id !== categoryId)?.id ?? null);
          }
          showToast('Catégorie supprimée');
        } catch {
          showToast('Échec de la suppression', 'error');
        }
      },
    });
  };

  // Item actions
  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !restaurant) return;

    try {
      const data = await api.post<MenuItem>('/api/owner/items', {
        ...itemForm,
        category_id: activeCategory,
        restaurant_id: restaurant.id,
      });
      setItems((prev) => [...prev, data]);
      setItemForm(EMPTY_ITEM);
      setShowItemForm(false);
      showToast('Plat ajouté');
    } catch {
      showToast('Échec de l\'ajout du plat', 'error');
    }
  };

  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const data = await api.patch<MenuItem>(`/api/owner/items/${editingItem}`, itemForm);
      setItems((prev) => prev.map((i) => (i.id === editingItem ? data : i)));
      setEditingItem(null);
      setItemForm(EMPTY_ITEM);
      setShowItemForm(false);
      showToast('Plat mis à jour');
    } catch {
      showToast('Échec de la mise à jour', 'error');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setConfirmModal({
      message: 'Supprimer ce plat ?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/api/owner/items/${itemId}`);
          setItems((prev) => prev.filter((i) => i.id !== itemId));
          showToast('Plat supprimé');
        } catch {
          showToast('Échec de la suppression', 'error');
        }
      },
    });
  };

  const handleToggleAvailable = async (itemId: string, current: boolean) => {
    try {
      await api.patch(`/api/owner/items/${itemId}`, { is_available: !current });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_available: !current } : i)),
      );
    } catch {
      showToast('Échec de la mise à jour', 'error');
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item.id);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      dietary_tags: item.dietary_tags ?? [],
      sort_order: item.sort_order,
    });
    setShowItemForm(true);
  };

  const toggleDietaryTag = (tag: DietaryTag) => {
    setItemForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const activeItems = items.filter((i) => i.category_id === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6B6560] font-body">Chargement du menu...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-[#6B6560] font-body mb-2">Aucun restaurant trouvé</p>
          <p className="text-sm text-[#9C9690] font-body">
            Contactez l'administrateur pour associer un restaurant à votre compte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <h1 className="text-2xl font-semibold font-body mb-6">
        Menu — {restaurant.name}
      </h1>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border-light p-4">
            <h3 className="text-sm font-medium text-[#6B6560] font-body mb-3">
              Catégories
            </h3>

            <div className="space-y-1 mb-4">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1">
                  {editingCategory === cat.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCategory(cat.id);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 text-sm border border-border rounded font-body"
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="text-xs text-primary"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-surface-hover text-[#1A1A1A]'
                        }`}
                      >
                        {cat.name}
                        <span className="ml-1 text-xs text-[#A39E98]">
                          ({items.filter((i) => i.category_id === cat.id).length})
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(cat.id);
                          setEditCategoryName(cat.name);
                        }}
                        className="text-xs text-[#A39E98] hover:text-primary px-1"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-[#A39E98] hover:text-[#DC2626] px-1"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add Category */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-body focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-primary text-white text-sm"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1">
          {!activeCategory ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-border-light">
              <p className="text-[#6B6560] font-body">
                Créez une catégorie pour commencer à ajouter des plats
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-body">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(EMPTY_ITEM);
                    setShowItemForm(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} className="inline -mt-0.5" /> Ajouter un plat
                </button>
              </div>

              {/* Item Form */}
              {showItemForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light mb-6">
                  <h3 className="text-base font-semibold font-body mb-4">
                    {editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                  </h3>
                  <form
                    onSubmit={editingItem ? handleUpdateItem : handleAddItem}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, name: e.target.value }))
                          }
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Description
                        </label>
                        <textarea
                          value={itemForm.description}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, description: e.target.value }))
                          }
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Prix (€) *
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={itemForm.price}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, price: Number(e.target.value) }))
                          }
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          URL de l'image
                        </label>
                        <input
                          type="url"
                          value={itemForm.image_url}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, image_url: e.target.value }))
                          }
                          placeholder="https://..."
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    <div>
                      <label className="block text-sm font-medium text-[#6B6560] font-body mb-2">
                        Tags alimentaires
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DIETARY_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleDietaryTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
                              itemForm.dietary_tags.includes(tag)
                                ? 'bg-primary text-white'
                                : 'bg-surface-hover text-[#6B6560] border border-border'
                            }`}
                          >
                            {DIETARY_LABELS[tag]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors"
                      >
                        {editingItem ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                          setItemForm(EMPTY_ITEM);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-border text-sm font-body hover:bg-surface-hover transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Table */}
              {activeItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-border-light">
                  <p className="text-[#6B6560] font-body">
                    Aucun plat dans cette catégorie
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Nom
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Prix
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Tags
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Disponible
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border-light last:border-0 hover:bg-surface-hover transition-colors"
                        >
                          <td className="p-4">
                            <div className="text-sm font-medium font-body">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-[#A39E98] font-body mt-0.5 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm font-body">
                            €{Number(item.price).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {(item.dietary_tags ?? []).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-body bg-surface-hover text-[#6B6560]"
                                >
                                  {DIETARY_LABELS[tag]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                handleToggleAvailable(item.id, item.is_available)
                              }
                              className={`px-3 py-1 rounded-full text-xs font-body ${
                                item.is_available
                                  ? 'bg-[#E8F9EE] text-[#16A34A]'
                                  : 'bg-[#FDE8E8] text-[#DC2626]'
                              }`}
                            >
                              {item.is_available ? 'Oui' : 'Non'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditItem(item)}
                                className="text-sm text-primary hover:underline font-body"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-sm text-[#DC2626] hover:underline font-body"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
