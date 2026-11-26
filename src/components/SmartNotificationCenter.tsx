'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  PackagePlus,
  Check,
  CheckCheck,
  ShoppingBag,
  Sparkles,
  Clock,
  Trash2,
} from 'lucide-react';
import type { Product, StockRequest } from '../types/pos';

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

// Synthesizes a clean crystal notification bell chime via Web Audio API
function playSyntheticChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic 1: Primary bell tone (880Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic 2: Sparkle overtone (1320Hz / E6)
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'alert' | 'activity'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Load sound and read settings from localStorage
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

  // Construct Notification History feed
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Stock Requests
    if (isOwner && stockRequests) {
      stockRequests.forEach(req => {
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

    // 2. Out of Stock
    products.filter(p => p.stock <= 0 && p.is_active !== false).forEach(p => {
      list.push({
        id: `out-${p.id}`,
        type: 'stock_out',
        title: `Stok Habis: ${p.name}`,
        message: `Sisa stok 0 unit. Segera lakukan restock gudang.`,
        timestamp: '5 menit lalu',
        read: readIds.has(`out-${p.id}`),
      });
    });

    // 3. Low Stock
    products.filter(p => p.stock > 0 && p.stock <= p.min_stock && p.is_active !== false).forEach(p => {
      list.push({
        id: `low-${p.id}`,
        type: 'stock_low',
        title: `Stok Menipis: ${p.name}`,
        message: `Tersisa ${p.stock} unit (Batas minimum: ${p.min_stock}).`,
        timestamp: '15 menit lalu',
        read: readIds.has(`low-${p.id}`),
      });
    });

    // 4. System Update / Hotfix Announcement
    list.push({
      id: 'sys-hotfix-151',
      type: 'system',
      title: 'Update Sistem: Hotfix v1.5.1 Aktif',
      message: 'Perbaikan responsivitas mobile, branding ALPHOS Smart Retail OS, dan optimasi visual chart.',
      timestamp: 'Hari ini',
      read: readIds.has('sys-hotfix-151'),
    });

    return list;
  }, [products, stockRequests, isOwner, readIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sound chime when new alerts arrive
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current !== 0) {
      playOfficialSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, playOfficialSound]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem('alphos_notifications_read', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => {
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
      return notifications.filter(n => n.type === 'stock_out' || n.type === 'stock_low');
    }
    if (filter === 'activity') {
      return notifications.filter(n => n.type === 'stock_request' || n.type === 'system');
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      {/* Clean Bell Button: Zero border box, sleek transparent hover */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && soundEnabled) {
            playOfficialSound();
          }
        }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          background: 'transparent',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        title="Riwayat Notifikasi"
        aria-label="Riwayat Notifikasi"
      >
        <Bell size={20} style={{ color: unreadCount > 0 ? '#10B981' : 'var(--muted)' }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              minWidth: '17px',
              height: '17px',
              borderRadius: '999px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Riwayat Notifikasi Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} style={{ color: '#10B981' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>Riwayat Notifikasi</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.78rem',
                  color: '#059669',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck size={14} />
                <span>Tandai Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--surface-hover)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {(['all', 'alert', 'activity'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: filter === f ? 700 : 500,
                  border: '1px solid',
                  borderColor: filter === f ? '#10B981' : 'transparent',
                  background: filter === f ? '#10B981' : 'transparent',
                  color: filter === f ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f === 'all' ? 'Semua' : f === 'alert' ? 'Stok & Alert' : 'Aktivitas Toko'}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '6px 0',
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <Check size={28} style={{ color: '#10B981', margin: '0 auto 8px', display: 'block' }} />
                <span>Tidak ada notifikasi pada kategori ini.</span>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: item.read ? 'transparent' : 'rgba(16, 185, 129, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = item.read ? 'transparent' : 'rgba(16, 185, 129, 0.04)')
                  }
                >
                  {/* Icon Indicator */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        item.type === 'stock_out'
                          ? '#fef2f2'
                          : item.type === 'stock_low'
                          ? '#fffbeb'
                          : item.type === 'stock_request'
                          ? '#f3e8ff'
                          : '#eff6ff',
                      color:
                        item.type === 'stock_out'
                          ? '#dc2626'
                          : item.type === 'stock_low'
                          ? '#d97706'
                          : item.type === 'stock_request'
                          ? '#7e22ce'
                          : '#2563eb',
                    }}
                  >
                    {item.type === 'stock_out' ? (
                      <AlertTriangle size={15} />
                    ) : item.type === 'stock_low' ? (
                      <AlertTriangle size={15} />
                    ) : item.type === 'stock_request' ? (
                      <PackagePlus size={15} />
                    ) : (
                      <Sparkles size={15} />
                    )}
                  </div>

                  {/* Text content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text)',
                          fontWeight: item.read ? 600 : 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {item.title}
                      </strong>
                      {!item.read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#10B981',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--muted)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '0.7rem',
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={11} />
                      <span>{item.timestamp}</span>
                    </div>

                    {/* Stock Request Action Buttons */}
                    {item.actionRequired && item.requestId && onApproveRequest && onRejectRequest && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onApproveRequest(item.requestId!);
                            markAsRead(item.id);
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          <Check size={12} /> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onRejectRequest(item.requestId!);
                            markAsRead(item.id);
                          }}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
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

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--surface-hover)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--muted)',
            }}
          >
            <span>Pengaturan suara ada di Pengaturan Toko</span>
            <button
              type="button"
              onClick={() => {
                setReadIds(new Set());
                try {
                  localStorage.removeItem('alphos_notifications_read');
                } catch {}
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Reset status riwayat"
            >
              <Trash2 size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
