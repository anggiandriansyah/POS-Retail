'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  PackagePlus,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import type { Product, StockRequest } from '../types/pos';

interface SmartNotificationCenterProps {
  products: Product[];
  stockRequests?: StockRequest[];
  isOwner: boolean;
  onApproveRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Load sound setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('alphos_notification_sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('alphos_notification_sound', String(next));
  };

  const playOfficialSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/alphos-official-notification.mp3');
      audio.volume = 0.8;
      audio.play().catch(e => console.log('Audio playback prevented:', e));
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Critical Low / Out of stock products
  const outOfStockItems = products.filter(p => p.stock <= 0 && p.is_active !== false);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.min_stock && p.is_active !== false);
  const pendingRequests = stockRequests.filter(r => r.status === 'PENDING');

  const totalAlerts = outOfStockItems.length + lowStockItems.length + (isOwner ? pendingRequests.length : 0);

  // Trigger sound when alert count increases
  useEffect(() => {
    if (totalAlerts > prevCountRef.current && prevCountRef.current !== 0) {
      playOfficialSound();
    }
    prevCountRef.current = totalAlerts;
  }, [totalAlerts, playOfficialSound]);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition"
        title="Pusat Notifikasi Pintar"
      >
        <Bell size={18} />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900 shadow-md">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-xs font-extrabold text-white">Smart Notification Center</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  soundEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={soundEnabled ? 'Matikan Suara Jingle' : 'Nyalakan Suara Jingle'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span className="text-[10px] font-bold">{soundEnabled ? 'Audio: ON' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={playOfficialSound}
                className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700"
                title="Tes Bunyi Jingle Resmi"
              >
                🔔 Tes Jingle
              </button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 p-2 text-xs space-y-2">
            {totalAlerts === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <div className="text-2xl">🎉</div>
                <div className="font-bold text-white text-xs">Semua Stok & Request Aman!</div>
                <div className="text-[11px] text-slate-500">Tidak ada peringatan kritis saat ini.</div>
              </div>
            ) : (
              <>
                {/* Pending Stock Requests (Owner Only) */}
                {isOwner && pendingRequests.length > 0 && (
                  <div className="space-y-1.5 pb-2">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 px-2">
                      <PackagePlus size={13} />
                      <span>Permintaan Stok Kasir ({pendingRequests.length})</span>
                    </div>

                    {pendingRequests.map(r => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-white text-xs">{r.product_name}</div>
                            <div className="text-[11px] text-slate-300">
                              Minta: <strong className="text-purple-300">+{r.requested_qty} pcs</strong>
                              {r.note && ` • "${r.note}"`}
                            </div>
                          </div>
                        </div>

                        {onApproveRequest && onRejectRequest && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => onRejectRequest(r.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-bold flex items-center gap-1 transition"
                            >
                              <X size={11} /> Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => onApproveRequest(r.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold flex items-center gap-1 transition shadow-sm"
                            >
                              <Check size={11} /> Setujui Restock
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Out of Stock Items */}
                {outOfStockItems.length > 0 && (
                  <div className="space-y-1.5 pb-2">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 px-2">
                      <AlertTriangle size={13} />
                      <span>Stok Habis Total ({outOfStockItems.length})</span>
                    </div>

                    {outOfStockItems.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10.5px] text-rose-300">Stok: 0 pcs • Segera restock!</div>
                        </div>
                        <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                          HABIS
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Stock Items */}
                {lowStockItems.length > 0 && (
                  <div className="space-y-1.5 pb-2">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 px-2">
                      <AlertTriangle size={13} />
                      <span>Stok Menipis Di Bawah Min ({lowStockItems.length})</span>
                    </div>

                    {lowStockItems.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10.5px] text-amber-300">
                            Sisa: {p.stock} pcs (Min: {p.min_stock})
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                          MENIPIS
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
