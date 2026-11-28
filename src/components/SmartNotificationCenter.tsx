'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  AlertTriangle,
  PackagePlus,
  Check,
  CheckCheck,
  Info,
  Clock,
  Trash2,
  X,
} from 'lucide-react';
import type { Product, StockRequest } from '../types/pos';
import { APP_VERSION } from '../utils/format';

interface SmartNotificationCenterProps {
  products: Product[];
  stockRequests?: StockRequest[];
  isOwner: boolean;
  onApproveRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'stock_out' | 'stock_low' | 'stock_request' | 'system' | 'sale';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  requestId?: string;
}

function playSyntheticChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.55);
  } catch {
    // Ignore audio context errors
  }
}

export function SmartNotificationCenter({
  products,
  stockRequests = [],
  isOwner,
  onApproveRequest,
  onRejectRequest,
}: SmartNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const [alignSide, setAlignSide] = useState<'right' | 'left'>('right');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'alert' | 'activity'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const syncViewport = () => setIsMobileSheet(mq.matches);
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('alphos_notification_sound');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
      const savedRead = localStorage.getItem('alphos_notifications_read');
      if (savedRead) {
        setReadIds(new Set(JSON.parse(savedRead)));
      }
    } catch {}
  }, []);

  const playOfficialSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/alphos-official-notification.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {
        playSyntheticChime();
      });
    } catch {
      playSyntheticChime();
    }
  }, [soundEnabled]);

  const systemNotifId = `sys-release-${APP_VERSION}`;

  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    if (isOwner && stockRequests) {
      stockRequests.forEach((req) => {
        list.push({
          id: `req-${req.id}`,
          type: 'stock_request',
          title: `Permintaan Stok: ${req.product_name}`,
          message: `Kasir mengajukan penambahan ${req.requested_qty} unit.`,
          timestamp: 'Baru saja',
          read: readIds.has(`req-${req.id}`),
          actionRequired: req.status === 'PENDING',
          requestId: req.id,
        });
      });
    }

    products
      .filter((p) => p.stock <= 0 && p.is_active !== false)
      .forEach((p) => {
        list.push({
          id: `out-${p.id}`,
          type: 'stock_out',
          title: `Stok Habis: ${p.name}`,
          message: 'Sisa stok 0 unit. Segera lakukan restock gudang.',
          timestamp: '5 menit lalu',
          read: readIds.has(`out-${p.id}`),
        });
      });

    products
      .filter((p) => p.stock > 0 && p.stock <= p.min_stock && p.is_active !== false)
      .forEach((p) => {
        list.push({
          id: `low-${p.id}`,
          type: 'stock_low',
          title: `Stok Menipis: ${p.name}`,
          message: `Tersisa ${p.stock} unit (Batas minimum: ${p.min_stock}).`,
          timestamp: '15 menit lalu',
          read: readIds.has(`low-${p.id}`),
        });
      });

    list.push({
      id: systemNotifId,
      type: 'system',
      title: `Pembaruan Sistem: v${APP_VERSION} Aktif`,
      message:
        'Tampilan mobile lebih ringkas, perlindungan safe area di seluruh layar, dan kontrol shift langsung di kasir.',
      timestamp: 'Hari ini',
      read: readIds.has(systemNotifId),
    });

    return list;
  }, [products, stockRequests, isOwner, readIds, systemNotifId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current !== 0) {
      playOfficialSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, playOfficialSound]);

  const closePanel = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        bellBtnRef.current?.focus();
      });
    }
  }, []);

  const updateDesktopAnchor = useCallback(() => {
    if (!dropdownRef.current || typeof window === 'undefined') return;
    if (window.innerWidth < 640) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    if (rect.right < 392 && window.innerWidth - rect.left >= 392) {
      setAlignSide('left');
    } else {
      setAlignSide('right');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateDesktopAnchor();

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (backdropRef.current?.contains(target)) {
        return;
      }
      const inTrigger = dropdownRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        closePanel(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel(true);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateDesktopAnchor);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateDesktopAnchor);
    };
  }, [isOpen, closePanel, updateDesktopAnchor]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem('alphos_notifications_read', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('alphos_notifications_read', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'alert') {
      return notifications.filter((n) => n.type === 'stock_out' || n.type === 'stock_low');
    }
    if (filter === 'activity') {
      return notifications.filter((n) => n.type === 'stock_request' || n.type === 'system');
    }
    return notifications;
  }, [notifications, filter]);

  const notifOverlay = isOpen ? (
    <>
      <div
        ref={backdropRef}
        className="notif-backdrop"
        aria-hidden="true"
        onClick={() => closePanel(true)}
      />
      <div
        ref={panelRef}
        id="notif-dialog-panel"
        role="dialog"
        aria-label="Riwayat Notifikasi"
        className={`notif-panel ${
          alignSide === 'left' ? 'notif-panel--align-left' : 'notif-panel--align-right'
        }`}
      >
        <div className="notif-header">
          <div className="notif-header-title-wrap">
            <Bell size={16} className="notif-header-icon" aria-hidden="true" />
            <strong className="notif-header-title">Riwayat Notifikasi</strong>
            {unreadCount > 0 && (
              <span className="notif-unread-pill">{unreadCount} Baru</span>
            )}
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="notif-mark-all-btn"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck size={14} aria-hidden="true" />
                <span>Tandai Dibaca</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => closePanel(true)}
              className="notif-close-btn"
              aria-label="Tutup notifikasi"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="notif-filters">
          {(['all', 'alert', 'activity'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`notif-filter-chip ${filter === f ? 'active' : ''}`}
            >
              {f === 'all' ? 'Semua' : f === 'alert' ? 'Stok & Alert' : 'Aktivitas Toko'}
            </button>
          ))}
        </div>

        <div className="notif-list">
          {filteredNotifications.length === 0 ? (
            <div className="notif-empty">
              <Check size={28} className="notif-empty-icon" aria-hidden="true" />
              <span>Tidak ada notifikasi pada kategori ini.</span>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notif-item ${item.read ? 'is-read' : 'is-unread'}`}
              >
                <div className={`notif-item-icon notif-item-icon--${item.type}`}>
                  {item.type === 'stock_out' || item.type === 'stock_low' ? (
                    <AlertTriangle size={15} aria-hidden="true" />
                  ) : item.type === 'stock_request' ? (
                    <PackagePlus size={15} aria-hidden="true" />
                  ) : (
                    <Info size={15} aria-hidden="true" />
                  )}
                </div>

                <div className="notif-item-body">
                  <button
                    type="button"
                    className="notif-item-trigger"
                    onClick={() => markAsRead(item.id)}
                  >
                    <div className="notif-item-head">
                      <strong
                        className={`notif-item-title ${
                          item.read ? 'is-read' : 'is-unread'
                        }`}
                      >
                        {item.title}
                      </strong>
                      {!item.read && <span className="notif-unread-dot" aria-hidden="true" />}
                    </div>
                    <p className="notif-item-message">{item.message}</p>
                    <div className="notif-item-time">
                      <Clock size={11} aria-hidden="true" />
                      <span>{item.timestamp}</span>
                    </div>
                  </button>

                  {item.actionRequired &&
                    item.requestId &&
                    onApproveRequest &&
                    onRejectRequest && (
                      <div className="notif-item-actions">
                        <button
                          type="button"
                          onClick={() => {
                            onApproveRequest(item.requestId!);
                            markAsRead(item.id);
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          <Check size={12} aria-hidden="true" /> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onRejectRequest(item.requestId!);
                            markAsRead(item.id);
                          }}
                          className="btn btn-sm btn-danger"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="notif-footer">
          <span>Pengaturan suara ada di Pengaturan Toko</span>
          <button
            type="button"
            onClick={() => {
              setReadIds(new Set());
              try {
                localStorage.removeItem('alphos_notifications_read');
              } catch {}
            }}
            className="notif-reset-btn"
            title="Reset status riwayat"
          >
            <Trash2 size={11} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="notif-root" ref={dropdownRef}>
      <button
        ref={bellBtnRef}
        type="button"
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen && soundEnabled) {
            playOfficialSound();
          }
        }}
        title="Riwayat Notifikasi"
        aria-label="Riwayat Notifikasi"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="notif-dialog-panel"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (mounted && isMobileSheet ? createPortal(notifOverlay, document.body) : notifOverlay)}
    </div>
  );
}
