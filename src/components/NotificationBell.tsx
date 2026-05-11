import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { 
  Bell, 
  Check, 
  Trash2, 
  Mail, 
  MessageSquare, 
  CreditCard,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function NotificationBell() {
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `company_id=eq.${profile?.company_id}` 
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  const markAllRead = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('company_id', profile.company_id)
      .eq('status', 'unread');
    await fetchNotifications();
    setLoading(false);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all group"
      >
        <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 tracking-tight">{t('notifications')}</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button 
                  onClick={markAllRead}
                  disabled={loading || unreadCount === 0}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-30 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  {t('mark_all_read')}
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <p className="font-bold italic">{t('no_notifications')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={cn(
                          "p-4 group flex gap-4 transition-colors hover:bg-gray-50/50",
                          n.status === 'unread' ? "bg-blue-50/30" : ""
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center",
                          n.status === 'unread' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {n.title_en}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message_en}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
