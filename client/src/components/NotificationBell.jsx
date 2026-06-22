import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore — the bell just won't update
    } finally {
      setLoading(false);
    }
  };

  // Poll lightly for new notifications even when the dropdown is closed.
  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) load();
  };

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markAsRead(id);
    } catch {
      // best-effort
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch {
      // best-effort
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative text-ink/70 hover:text-ink transition-colors"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-3 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-gold text-paper text-[10px] font-medium">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-sand-dark rounded-sm shadow-lg z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-dark">
            <span className="text-sm font-medium text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-ink/50 hover:text-ink">
                Mark all read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <p className="text-sm text-ink/50 px-4 py-6 text-center">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-ink/50 px-4 py-6 text-center">You're all caught up.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n._id}
                to={n.link || '#'}
                onClick={() => {
                  if (!n.isRead) handleMarkRead(n._id);
                  setOpen(false);
                }}
                className={`block px-4 py-3 border-b border-sand-dark last:border-0 hover:bg-sand transition-colors ${
                  n.isRead ? '' : 'bg-cream'
                }`}
              >
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-xs text-ink/60 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-ink/35 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
