import { useEffect, useState, type FormEvent } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Restaurant, CuisineType } from '../lib/types';
import { CUISINE_LABELS } from '../lib/types';
import { useToast } from '../components/Toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
  friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};

export function RestaurantSettings() {
  const { showToast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState<CuisineType>('west_african');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [deliveryMin, setDeliveryMin] = useState('');
  const [deliveryMax, setDeliveryMax] = useState('');
  const [deliveryRadius, setDeliveryRadius] = useState('');
  const [pickupAvailable, setPickupAvailable] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [openingHours, setOpeningHours] = useState<
    Record<string, { open: string; close: string } | null>
  >({});

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await api.get<Restaurant[]>('/api/owner/restaurant');
        if (data.length > 0) {
          const r = data[0];
          setRestaurant(r);
          setName(r.name);
          setDescription(r.description ?? '');
          setCuisineType(r.cuisine_type);
          setAddress(r.address);
          setCity(r.city);
          setPhone(r.phone ?? '');
          setDeliveryFee(String(r.delivery_fee));
          setMinimumOrder(String(r.minimum_order));
          setDeliveryMin(String(r.estimated_delivery_min));
          setDeliveryMax(String(r.estimated_delivery_max));
          setDeliveryRadius(String(r.delivery_radius_km));
          setPickupAvailable(r.pickup_available);
          setIsActive(r.is_active);
          setOpeningHours(r.opening_hours ?? {});
        }
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setSaving(true);

    try {
      const updated = await api.patch<Restaurant>(`/api/owner/restaurant/${restaurant.id}`, {
        name,
        description: description || null,
        cuisine_type: cuisineType,
        address,
        city,
        phone: phone || null,
        delivery_fee: parseFloat(deliveryFee),
        minimum_order: parseFloat(minimumOrder),
        estimated_delivery_min: parseInt(deliveryMin),
        estimated_delivery_max: parseInt(deliveryMax),
        delivery_radius_km: parseFloat(deliveryRadius),
        pickup_available: pickupAvailable,
        is_active: isActive,
        opening_hours: openingHours,
      });
      setRestaurant(updated);
      showToast('Paramètres enregistrés avec succès');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Échec de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (day: string, field: 'open' | 'close', value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        open: prev[day]?.open ?? '09:00',
        close: prev[day]?.close ?? '22:00',
        [field]: value,
      },
    }));
  };

  const toggleDay = (day: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '22:00' },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold font-body">Paramètres du restaurant</h1>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium font-body ${
              isActive ? 'bg-[#E8F9EE] text-[#16A34A]' : 'bg-[#FDE8E8] text-[#DC2626]'
            }`}
          >
            {isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Two-column top section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <h2 className="text-base font-semibold font-body mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Nom du restaurant
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Type de cuisine
              </label>
              <select
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value as CuisineType)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary"
              >
                {Object.entries(CUISINE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Images (read-only — managed in admin) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <h2 className="text-base font-semibold font-body mb-1">Images</h2>
          <p className="text-xs text-[#9C9690] font-body mb-4">Image de couverture, logo et galerie sont gérés dans l’interface d’administration.</p>
          <div className="flex flex-wrap items-start gap-4">
            {restaurant.image_url && (
              <div>
                <p className="text-xs font-medium text-[#6B6560] font-body mb-1.5">Couverture</p>
                <img src={restaurant.image_url} alt="Couverture" className="h-20 w-32 object-cover rounded-xl border border-border-light" />
              </div>
            )}
            {restaurant.logo_url && (
              <div>
                <p className="text-xs font-medium text-[#6B6560] font-body mb-1.5">Logo</p>
                <img src={restaurant.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-border-light" />
              </div>
            )}
            {restaurant.gallery_urls && restaurant.gallery_urls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#6B6560] font-body mb-1.5">Galerie</p>
                <div className="flex flex-wrap gap-2">
                  {restaurant.gallery_urls.map((url, i) => (
                    <img key={`${url}-${i}`} src={url} alt="" className="h-14 w-14 object-cover rounded-lg border border-border-light" />
                  ))}
                </div>
              </div>
            )}
            {!restaurant.image_url && !restaurant.logo_url && (!restaurant.gallery_urls || restaurant.gallery_urls.length === 0) && (
              <p className="text-sm text-[#9C9690] font-body">Aucune image configurée.</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <h2 className="text-base font-semibold font-body mb-4">Adresse & Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Adresse
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>
        </div>

        </div>{/* end xl:grid-cols-2 */}

        {/* Delivery */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <h2 className="text-base font-semibold font-body mb-4">Paramètres de livraison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Frais de livraison (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Commande minimum (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Rayon de livraison (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Délai min. (min)
              </label>
              <input
                type="number"
                value={deliveryMin}
                onChange={(e) => setDeliveryMin(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Délai max. (min)
              </label>
              <input
                type="number"
                value={deliveryMax}
                onChange={(e) => setDeliveryMax(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupAvailable}
                  onChange={(e) => setPickupAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                <span className="ms-2 text-sm font-body text-[#6B6560]">Retrait disponible</span>
              </label>
            </div>
          </div>
        </div>

        {/* Active toggle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold font-body">Statut du restaurant</h2>
              <p className="text-sm text-[#6B6560] font-body mt-1">
                Lorsqu'il est inactif, votre restaurant n'apparaît pas dans l'application.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
            </label>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <h2 className="text-base font-semibold font-body mb-4">Horaires d'ouverture</h2>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openingHours[day] !== null && openingHours[day] !== undefined}
                    onChange={() => toggleDay(day)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
                <span className="w-24 text-sm font-body">{DAY_LABELS[day]}</span>
                {openingHours[day] ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={openingHours[day]?.open ?? '09:00'}
                      onChange={(e) => updateHours(day, 'open', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary"
                    />
                    <span className="text-[#6B6560] text-sm">à</span>
                    <input
                      type="time"
                      value={openingHours[day]?.close ?? '22:00'}
                      onChange={(e) => updateHours(day, 'close', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:border-secondary"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-[#9C9690] font-body">Fermé</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-white font-body font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
