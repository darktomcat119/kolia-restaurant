import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CUISINE_LABELS } from '../lib/types';
import type { CuisineType, Restaurant } from '../lib/types';

const CUISINE_OPTIONS = Object.entries(CUISINE_LABELS) as [CuisineType, string][];
const ADDRESS_DEBOUNCE_MS = 450;

type AddressSuggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export function RestaurantSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [cuisineType, setCuisineType] = useState<CuisineType>('west_african');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(48.8566);
  const [longitude, setLongitude] = useState(2.3522);
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = address.trim();

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '6',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
        if (!res.ok) {
          setAddressSuggestions([]);
          return;
        }
        const data = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
        const suggestions = (data || [])
          .filter((item) => item.display_name && item.lat && item.lon)
          .map((item) => ({
            displayName: item.display_name as string,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
          }));
        setAddressSuggestions(suggestions);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSearching(false);
      }
    }, ADDRESS_DEBOUNCE_MS);

    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
  }, [address]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post<Restaurant>('/api/owner/restaurant', {
        name: name.trim(),
        cuisine_type: cuisineType,
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        country: 'FR',
        latitude,
        longitude,
        phone: phone.trim() || undefined,
        delivery_fee: 3.5,
        minimum_order: 15,
        estimated_delivery_min: 30,
        estimated_delivery_max: 50,
        delivery_radius_km: 5,
        pickup_available: false,
        is_active: false,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Échec de la création du restaurant',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="Kolia" className="h-12 w-auto object-contain mx-auto mb-2" />
          <p className="text-[#6B6560] font-body">
            Configurez votre restaurant
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 shadow-sm border border-border-light"
        >
          <h2 className="text-xl font-semibold font-body mb-2">
            Créer votre restaurant
          </h2>
          <p className="text-sm text-[#9C9690] font-body mb-6">
            Renseignez les informations de base. Vous pourrez les modifier
            ensuite dans les paramètres.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDE8E8] text-[#DC2626] text-sm font-body">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Nom du restaurant *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                placeholder="Ex : Chez Mama Africa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Type de cuisine *
              </label>
              <select
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value as CuisineType)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              >
                {CUISINE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                placeholder="Décrivez votre restaurant en quelques mots..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                  Adresse *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setShowAddressSuggestions(true);
                    }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    placeholder="Adresse complète (ex: 12 rue de la Paix)"
                  />
                  {addressSearching && (
                    <div className="absolute right-3 top-3.5 text-xs text-[#9C9690] font-body">Recherche...</div>
                  )}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-border-light bg-white shadow-lg">
                      {addressSuggestions.map((item, index) => (
                        <button
                          key={`${item.latitude}-${item.longitude}-${index}`}
                          type="button"
                          onClick={() => {
                            setAddress(item.displayName);
                            setLatitude(item.latitude);
                            setLongitude(item.longitude);
                            setShowAddressSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm font-body text-[#4A4642] hover:bg-[#F7F7F5] border-b last:border-b-0 border-border-light"
                        >
                          {item.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                  Ville *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  placeholder="Paris"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-body font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer mon restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
