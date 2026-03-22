import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Check, Pencil, X, Plus, AlertTriangle, Upload, Loader2, ImageIcon } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-[#D97706]" />
          </div>
          <p className="text-sm font-body text-[#1A1A1A]">{message}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-border px-4 py-2 font-body text-sm transition-colors hover:bg-surface-hover sm:min-h-0"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] rounded-xl bg-[#DC2626] px-4 py-2 font-body text-sm text-white transition-colors hover:bg-[#B91C1C] sm:min-h-0"
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

  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  /** Local blob URL while user picks a file / during upload */
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [itemImagePreviewError, setItemImagePreviewError] = useState(false);

  useEffect(() => {
    return () => {
      if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl);
    };
  }, [blobPreviewUrl]);

  const clearItemImage = () => {
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setItemImagePreviewError(false);
    setItemForm((p) => ({ ...p, image_url: '' }));
    if (itemImageInputRef.current) itemImageInputRef.current.value = '';
  };

  const handleItemImageFile = async (file: File | undefined) => {
    if (!file || !restaurant) return;
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      showToast('Utilisez JPEG, PNG ou WebP', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Fichier trop volumineux (max 5 Mo)', 'error');
      return;
    }
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setItemImagePreviewError(false);
    setUploadingItemImage(true);
    try {
      const { url } = await api.uploadMenuItemImage(file, restaurant.id);
      setBlobPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setItemForm((p) => ({ ...p, image_url: url }));
      showToast('Image téléversée');
    } catch (err) {
      setBlobPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      showToast(err instanceof Error ? err.message : 'Échec du téléversement', 'error');
    } finally {
      setUploadingItemImage(false);
      if (itemImageInputRef.current) itemImageInputRef.current.value = '';
    }
  };

  const itemImagePreviewSrc = blobPreviewUrl || itemForm.image_url.trim();

  useEffect(() => {
    setItemImagePreviewError(false);
  }, [itemForm.image_url, blobPreviewUrl]);

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
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setItemImagePreviewError(false);
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

      <h1 className="mb-6 font-body text-xl font-semibold sm:text-2xl">
        Menu — {restaurant.name}
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Categories Sidebar */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm">
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
            <div className="rounded-2xl border border-border-light bg-white px-4 py-10 text-center shadow-sm sm:p-12">
              <p className="font-body text-[#6B6560]">
                Créez une catégorie pour commencer à ajouter des plats
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-body text-lg font-semibold">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setBlobPreviewUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                    setItemImagePreviewError(false);
                    setItemForm(EMPTY_ITEM);
                    setShowItemForm(true);
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark sm:w-auto sm:min-h-0"
                >
                  <Plus size={16} className="-mt-0.5 inline" /> Ajouter un plat
                </button>
              </div>

              {/* Item Form */}
              {showItemForm && (
                <div className="mb-6 rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-4 font-body text-base font-semibold">
                    {editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                  </h3>
                  <form
                    onSubmit={editingItem ? handleUpdateItem : handleAddItem}
                    className="space-y-4"
                  >
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="col-span-full min-w-0">
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
                      <div className="col-span-full min-w-0">
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
                      <div className="col-span-full min-w-0 sm:col-span-1">
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
                      <div className="col-span-full min-w-0 rounded-2xl border border-border-light bg-[#FAFAF7]/80 p-4 sm:p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <label className="mb-0.5 block font-body text-sm font-medium text-[#6B6560]">
                              Photo du plat
                            </label>
                            <p className="font-body text-xs text-[#9C9690]">
                              JPEG, PNG ou WebP — max 5 Mo. Aperçu en direct après choix du fichier ou saisie d&apos;une URL.
                            </p>
                          </div>
                          {itemImagePreviewSrc ? (
                            <button
                              type="button"
                              onClick={clearItemImage}
                              className="mt-2 shrink-0 rounded-lg px-3 py-1.5 font-body text-xs font-medium text-[#B45309] underline-offset-2 hover:underline sm:mt-0"
                            >
                              Retirer la photo
                            </button>
                          ) : null}
                        </div>

                        <div
                          className={`relative mt-4 flex min-h-[180px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white sm:min-h-[220px] ${
                            itemImagePreviewSrc && !itemImagePreviewError
                              ? 'border-transparent p-0'
                              : 'border-[#D8D5D0] p-6'
                          }`}
                        >
                          {uploadingItemImage ? (
                            <div
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[2px]"
                              aria-live="polite"
                            >
                              <Loader2 size={32} className="animate-spin text-primary" />
                              <span className="font-body text-sm font-medium text-[#3D3A37]">
                                Téléversement…
                              </span>
                            </div>
                          ) : null}
                          {itemImagePreviewSrc && !itemImagePreviewError ? (
                            <img
                              src={itemImagePreviewSrc}
                              alt="Aperçu du plat"
                              className="max-h-[280px] w-full object-cover sm:max-h-[320px]"
                              onLoad={() => setItemImagePreviewError(false)}
                              onError={() => setItemImagePreviewError(true)}
                            />
                          ) : itemImagePreviewSrc && itemImagePreviewError ? (
                            <div className="flex max-w-sm flex-col items-center gap-2 text-center">
                              <ImageIcon className="h-10 w-10 text-[#DC2626]/70" aria-hidden />
                              <p className="font-body text-sm font-medium text-[#B91C1C]">
                                Impossible de charger cette image
                              </p>
                              <p className="font-body text-xs text-[#9C9690]">
                                Vérifiez l&apos;URL ou choisissez un fichier.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EFEB]">
                                <ImageIcon className="h-7 w-7 text-[#A39E98]" aria-hidden />
                              </div>
                              <p className="font-body text-sm font-medium text-[#6B6560]">
                                Aucune image pour l&apos;instant
                              </p>
                              <p className="max-w-xs font-body text-xs text-[#9C9690]">
                                Utilisez le bouton ci-dessous ou collez un lien direct vers une image.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                          <input
                            ref={itemImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleItemImageFile(e.target.files?.[0])}
                          />
                          <button
                            type="button"
                            disabled={uploadingItemImage || !restaurant}
                            onClick={() => itemImageInputRef.current?.click()}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 font-body text-sm font-medium text-[#3D3A37] shadow-sm transition-colors hover:bg-surface-hover disabled:opacity-50 sm:w-auto sm:min-h-0"
                          >
                            {uploadingItemImage ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Téléversement…
                              </>
                            ) : (
                              <>
                                <Upload size={18} />
                                Choisir une image
                              </>
                            )}
                          </button>
                          <div className="min-w-0 flex-1 sm:min-w-[240px]">
                            <label className="mb-1 block font-body text-xs font-medium text-[#9C9690]">
                              Ou URL de l&apos;image
                            </label>
                            <input
                              type="url"
                              value={itemForm.image_url}
                              onChange={(e) => {
                                setBlobPreviewUrl((prev) => {
                                  if (prev) URL.revokeObjectURL(prev);
                                  return null;
                                });
                                setItemForm((p) => ({ ...p, image_url: e.target.value }));
                              }}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-body text-sm shadow-sm focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
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
                            className={`min-h-[40px] rounded-full px-3 py-2 text-xs font-body transition-colors sm:min-h-0 sm:py-1.5 ${
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <button
                        type="submit"
                        className="min-h-[44px] rounded-xl bg-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark sm:min-h-0"
                      >
                        {editingItem ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                          setBlobPreviewUrl((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                          setItemImagePreviewError(false);
                          setItemForm(EMPTY_ITEM);
                        }}
                        className="min-h-[44px] rounded-xl border border-border px-6 py-2.5 font-body text-sm transition-colors hover:bg-surface-hover sm:min-h-0"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Table */}
              {activeItems.length === 0 ? (
                <div className="rounded-2xl border border-border-light bg-white px-4 py-10 text-center shadow-sm sm:p-12">
                  <p className="font-body text-[#6B6560]">
                    Aucun plat dans cette catégorie
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm">
                  <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[560px]">
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
