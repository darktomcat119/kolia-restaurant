import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CUISINE_LABELS } from '../lib/types';
import type { CuisineType, Restaurant } from '../lib/types';

const CUISINE_OPTIONS = Object.entries(CUISINE_LABELS) as [CuisineType, string][];

export function RestaurantSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [cuisineType, setCuisineType] = useState<CuisineType>('west_african');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

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
        latitude: 48.8566,
        longitude: 2.3522,
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
          <h1 className="font-display text-4xl text-primary mb-2">Kolia</h1>
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
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  placeholder="12 rue de la Paix"
                />
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
