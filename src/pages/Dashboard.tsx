import { useEffect, useState, useCallback, useRef } from 'react';
import { Package, DollarSign, Clock, ShoppingBag, Bell } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { HeroCarousel } from '../components/HeroCarousel';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { OwnerStats, Order, OrderStatus } from '../lib/types';
import { ORDER_STATUS_LABELS } from '../lib/types';
import { useToast } from '../components/Toast';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes les commandes' },
  { value: 'received', label: 'Reçues' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready', label: 'Prêtes' },
  { value: 'on_the_way', label: 'En livraison' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  received: 'preparing',
  preparing: 'ready',
  ready: 'on_the_way',
};

export function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restaurantIdsRef = useRef<string[]>([]);

  const showNotification = (message: string) => {
    setNotification(message);
    if (notifTimeout.current) clearTimeout(notifTimeout.current);
    notifTimeout.current = setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const [statsData, ordersData] = await Promise.all([
        api.get<OwnerStats>('/api/owner/stats'),
        api.get<Order[]>(`/api/owner/orders${params}`),
      ]);
      setStats(statsData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const fetchRestaurantIds = async () => {
      try {
        const restaurants = await api.get<{ id: string }[]>('/api/owner/restaurant');
        restaurantIdsRef.current = restaurants.map((r) => r.id);
      } catch {
        // Will fall back to polling only
      }
    };
    fetchRestaurantIds();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);

    const channel = supabase
      .channel('owner-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const record = (payload.new as Record<string, unknown>) ?? {};
          const restaurantId = record.restaurant_id as string | undefined;

          if (restaurantId && restaurantIdsRef.current.length > 0 &&
              !restaurantIdsRef.current.includes(restaurantId)) {
            return;
          }

          if (payload.eventType === 'INSERT') {
            showNotification('Nouvelle commande reçue !');
          } else if (payload.eventType === 'UPDATE') {
            const status = record.status as string | undefined;
            if (status === 'cancelled') {
              showNotification('Une commande a été annulée');
            }
          }

          fetchData();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrder(orderId);
    try {
      await api.patch(`/api/owner/orders/${orderId}/status`, { status: newStatus });
      await fetchData();
      showToast(`Statut mis à jour : ${ORDER_STATUS_LABELS[newStatus]}`);
    } catch {
      showToast('Échec de la mise à jour du statut', 'error');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Realtime notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-secondary to-secondary/90 text-white shadow-2xl shadow-secondary/25 font-body text-sm backdrop-blur-sm border border-white/10 animate-fade-up">
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
            <Bell size={14} />
          </div>
          {notification}
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/60 hover:text-white transition-colors duration-200 hover:scale-110"
          >
            &times;
          </button>
        </div>
      )}

      {/* Hero Carousel */}
      <HeroCarousel
        greeting={greeting}
        title="Tableau de bord"
        subtitle={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Stats — staggered fade-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="animate-fade-up-1">
          <StatsCard
            icon={<Package size={21} />}
            label="Commandes aujourd'hui"
            value={stats?.orders_today ?? 0}
            color="orange"
          />
        </div>
        <div className="animate-fade-up-2">
          <StatsCard
            icon={<DollarSign size={21} />}
            label="Revenu aujourd'hui"
            value={`€${(stats?.revenue_today ?? 0).toFixed(2)}`}
            color="green"
          />
        </div>
        <div className="animate-fade-up-3">
          <StatsCard
            icon={<Clock size={21} />}
            label="Commandes en attente"
            value={stats?.pending_orders ?? 0}
            color="blue"
          />
        </div>
        <div className="animate-fade-up-4">
          <StatsCard
            icon={<ShoppingBag size={21} />}
            label="Total commandes"
            value={stats?.total_orders ?? 0}
            color="purple"
          />
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#F0EDE8] animate-fade-up overflow-hidden" style={{ animationDelay: '0.5s' }}>
        {/* Table header */}
        <div className="px-7 py-5 border-b border-[#F0EDE8] flex items-center justify-between bg-gradient-to-r from-white to-[#FDFCFB]">
          <div>
            <h2 className="text-lg font-semibold font-body text-[#1A1A1A] tracking-tight">Commandes</h2>
            <p className="text-xs text-[#9C9690] font-body mt-0.5">
              {orders.length} commande{orders.length !== 1 ? 's' : ''} au total
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#E8E4DF] bg-white font-body text-sm text-[#4A4540] focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all duration-200 cursor-pointer hover:border-[#D0CBC5]"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5F3F0] to-[#EBE8E4] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={24} className="text-[#C4C0BB]" />
            </div>
            <p className="text-[#6B6560] font-body text-sm font-medium">Aucune commande trouvée</p>
            <p className="text-[#B0AAA4] font-body text-xs mt-1">Les nouvelles commandes apparaitront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EDE8] bg-gradient-to-r from-[#FAFAF7] to-[#F8F7F4]">
                  <th className="text-left px-7 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    N° commande
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#9C9690] font-body uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EE]">
                {orders.map((order) => {
                  const nextStatus = NEXT_STATUS[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="group hover:bg-gradient-to-r hover:from-[#FDFCFA] hover:to-[#FAF9F6] transition-all duration-200"
                    >
                      <td className="px-7 py-5 text-sm font-semibold font-body text-[#1A1A1A]">
                        <span className="bg-[#F5F3F0] px-2.5 py-1 rounded-lg text-[13px] group-hover:bg-[#EDE9E4] transition-colors duration-200">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-sm font-body text-[#4A4540]">
                        <div className="font-medium">{order.profile?.full_name ?? 'Inconnu'}</div>
                        {order.profile?.phone && (
                          <div className="text-[11px] text-[#9C9690] mt-0.5">{order.profile.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-5 text-sm font-body text-[#6B6560]">
                        <span className="font-medium">{order.order_items?.length ?? 0}</span> article(s)
                        {order.notes && (
                          <div className="text-[11px] text-[#B0AAA4] mt-1 italic leading-tight">
                            Note : {order.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-5 text-sm font-body font-bold text-[#1A1A1A] tracking-tight">
                        €{Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-5 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-5 text-sm font-body text-[#9C9690]">
                        {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-5">
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            disabled={updatingOrder === order.id}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-secondary to-secondary/90 text-white text-xs font-body font-semibold hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                          >
                            {updatingOrder === order.id
                              ? 'Mise à jour...'
                              : ORDER_STATUS_LABELS[nextStatus]}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
