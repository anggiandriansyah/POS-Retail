'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Volume2,
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Load sound setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('alphos_notification_sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const playOfficialSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/alphos-official-notification.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {
        // Fallback to Web Audio API synthesis if file play fails
        playSyntheticChime();
      });
    } catch {
      playSyntheticChime();
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
      {/* Clean Bell Button (Hotfix v1.5.1: Clean transparent icon with responsive sound trigger) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && soundEnabled) {
            playOfficialSound();
          }
        }}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition focus:outline-none"
        title="Pusat Notifikasi Pintar"
      >
        <Bell size={19} className="transition-transform hover:scale-110 text-emerald-400" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900 shadow-md">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                <span>Pusat Notifikasi Pintar</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Peringatan stok minimum & persetujuan stok
              </p>
            </div>
            <button
              type="button"
              onClick={playOfficialSound}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-1"
              title="Putar tes bunyi notifikasi"
            >
              <Volume2 size={12} />
              <span>Tes Audio</span>
            </button>
          </div>

          {/* Alert Content List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-2">
            {totalAlerts === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Check size={24} className="mx-auto mb-2 text-emerald-400" />
                <span>Semua stok aman dan tidak ada permintaan tertunda.</span>
              </div>
            ) : (
              <>
                {/* Pending Requests for Owner */}
                {isOwner && pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <PackagePlus size={16} className="text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-purple-200">
                          Request Stok: {req.product_name}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Jumlah: <strong className="text-white">{req.requested_qty}</strong> unit
                        </div>
                      </div>
                    </div>
                    {onApproveRequest && onRejectRequest && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onApproveRequest(req.id)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          title="Setujui permintaan"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectRequest(req.id)}
                          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                          title="Tolak permintaan"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Out of Stock Items */}
                {outOfStockItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold text-rose-200 block">{item.name}</span>
                        <span className="text-[10px] text-rose-400">Stok Habis (0 pcs)</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 text-[10px] font-bold">
                      HABIS
                    </span>
                  </div>
                ))}

                {/* Low Stock Items */}
                {lowStockItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-200 block">{item.name}</span>
                        <span className="text-[10px] text-amber-400">
                          Tersisa {item.stock} pcs (Min: {item.min_stock})
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 text-[10px] font-bold">
                      MENIPIS
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
