'use client';

import { useState, useMemo } from 'react';
import {
  Download,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';
import type { Product } from '../types/pos';
import { formatRupiah } from '../utils/format';

export type Timeframe = 'today' | '7d' | '30d' | 'month';

interface VisualAnalyticsProps {
  products: Product[];
}

export function VisualAnalytics({ products: _products }: VisualAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');

  // Realistic mock data generated based on timeframe
  const data = useMemo(() => {
    if (timeframe === 'today') {
      return {
        revenueTimeline: [
          { label: '08:00', value: 340000, orders: 4 },
          { label: '10:00', value: 890000, orders: 11 },
          { label: '12:00', value: 1650000, orders: 22 },
          { label: '14:00', value: 920000, orders: 12 },
          { label: '16:00', value: 1380000, orders: 18 },
          { label: '18:00', value: 2450000, orders: 31 },
          { label: '20:00', value: 1820000, orders: 24 },
          { label: '21:30', value: 650000, orders: 8 },
        ],
        topProducts: [
          { name: 'Kopi Susu Gula Aren 250ml', qty: 38, revenue: 950000, category: 'Minuman' },
          { name: 'Roti Bakar Cokelat Keju', qty: 29, revenue: 580000, category: 'Makanan' },
          { name: 'Air Mineral 600ml', qty: 45, revenue: 225000, category: 'Minuman' },
          { name: 'Matcha Latte Ice', qty: 19, revenue: 475000, category: 'Minuman' },
          { name: 'Croissant Butter', qty: 14, revenue: 420000, category: 'Bakery' },
        ],
        payments: [
          { method: 'QRIS', count: 72, total: 5850000, color: '#3B82F6', percent: 58 },
          { method: 'CASH', count: 41, total: 3250000, color: '#10B981', percent: 32 },
          { method: 'TRANSFER', count: 17, total: 1000000, color: '#8B5CF6', percent: 10 },
        ],
        grossRevenue: 10100000,
        totalOrders: 130,
        avgOrderValue: 77692,
        netProfit: 4242000,
      };
    }

    if (timeframe === '30d' || timeframe === 'month') {
      return {
        revenueTimeline: [
          { label: 'Mgg 1', value: 42500000, orders: 540 },
          { label: 'Mgg 2', value: 48900000, orders: 610 },
          { label: 'Mgg 3', value: 54200000, orders: 690 },
          { label: 'Mgg 4', value: 61800000, orders: 780 },
        ],
        topProducts: [
          { name: 'Kopi Susu Gula Aren 250ml', qty: 980, revenue: 24500000, category: 'Minuman' },
          { name: 'Roti Bakar Cokelat Keju', qty: 650, revenue: 13000000, category: 'Makanan' },
          { name: 'Croissant Butter', qty: 420, revenue: 12600000, category: 'Bakery' },
          { name: 'Matcha Latte Ice', qty: 380, revenue: 9500000, category: 'Minuman' },
          { name: 'Espresso Double Shot', qty: 410, revenue: 8200000, category: 'Minuman' },
          { name: 'French Fries Crispy', qty: 350, revenue: 7000000, category: 'Snack' },
          { name: 'Air Mineral 600ml', qty: 1100, revenue: 5500000, category: 'Minuman' },
        ],
        payments: [
          { method: 'QRIS', count: 1580, total: 124440000, color: '#3B82F6', percent: 60 },
          { method: 'CASH', count: 790, total: 62220000, color: '#10B981', percent: 30 },
          { method: 'TRANSFER', count: 250, total: 20740000, color: '#8B5CF6', percent: 10 },
        ],
        grossRevenue: 207400000,
        totalOrders: 2620,
        avgOrderValue: 79160,
        netProfit: 87108000,
      };
    }

    // Default '7d' (Last 7 Days)
    return {
      revenueTimeline: [
        { label: 'Kamis', value: 6800000, orders: 88 },
        { label: 'Jumat', value: 8900000, orders: 112 },
        { label: 'Sabtu', value: 12400000, orders: 156 },
        { label: 'Minggu', value: 14200000, orders: 178 },
        { label: 'Senin', value: 7100000, orders: 92 },
        { label: 'Selasa', value: 7900000, orders: 104 },
        { label: 'Hari Ini', value: 9500000, orders: 120 },
      ],
      topProducts: [
        { name: 'Kopi Susu Gula Aren 250ml', qty: 245, revenue: 6125000, category: 'Minuman' },
        { name: 'Roti Bakar Cokelat Keju', qty: 180, revenue: 3600000, category: 'Makanan' },
        { name: 'Croissant Butter', qty: 115, revenue: 3450000, category: 'Bakery' },
        { name: 'Matcha Latte Ice', qty: 95, revenue: 2375000, category: 'Minuman' },
        { name: 'French Fries Crispy', qty: 88, revenue: 1760000, category: 'Snack' },
        { name: 'Air Mineral 600ml', qty: 280, revenue: 1400000, category: 'Minuman' },
      ],
      payments: [
        { method: 'QRIS', count: 462, total: 39520000, color: '#3B82F6', percent: 59 },
        { method: 'CASH', count: 226, total: 20640000, color: '#10B981', percent: 31 },
        { method: 'TRANSFER', count: 62, total: 6640000, color: '#8B5CF6', percent: 10 },
      ],
      grossRevenue: 66800000,
      totalOrders: 750,
      avgOrderValue: 89066,
      netProfit: 28056000,
    };
  }, [timeframe]);

  // SVG Line Chart Calculations
  const maxRevenue = Math.max(...data.revenueTimeline.map(d => d.value), 1);
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;

  const points = data.revenueTimeline.map((item, idx) => {
    const x = paddingX + (idx / (data.revenueTimeline.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (item.value / maxRevenue) * (chartHeight - paddingY * 2);
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Bar Chart calculations
  const maxBarRevenue = Math.max(...data.topProducts.map(p => p.revenue), 1);

  // Donut slices pre-calculated immutably
  const donutSlices = useMemo(() => {
    return data.payments.map((p, idx, arr) => {
      const offset = arr.slice(0, idx).reduce((sum, item) => sum + item.percent, 0);
      return {
        ...p,
        strokeDasharray: `${p.percent} ${100 - p.percent}`,
        strokeDashoffset: -offset,
      };
    });
  }, [data.payments]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Timeframe Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            <span>Visual Analytics & Insight Penjualan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis tren pendapatan, produk terlaris, dan rasio pembayaran kasir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['today', '7d', '30d', 'month'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'today' ? 'Hari Ini' : tf === '7d' ? '7 Hari' : tf === '30d' ? '30 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Cetak atau simpan PDF analitik"
          >
            <Download size={14} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Pendapatan Kotor</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatRupiah(data.grossRevenue)}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowUpRight size={13} className="text-emerald-400" />
            <span className="text-emerald-400 font-semibold">+14.2%</span> dibanding periode sebelumnya
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Jumlah Transaksi</span>
            <ShoppingBag size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.totalOrders} Transaksi</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rata-rata {Math.round(data.totalOrders / (timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : 30))} order / hari
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Average Order Value (AOV)</span>
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{formatRupiah(data.avgOrderValue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Nilai rata-rata per struk belanja kasir
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Estimasi Laba Bersih</span>
            <CheckCircle size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">{formatRupiah(data.netProfit)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin bersih toko ~42%
          </div>
        </div>
      </div>

      {/* Main Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: LINE CHART (Tren Omzet & Peak Hours) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" />
                <span>Kurva Pertumbuhan Omzet Penjualan</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualisasi omzet terhadap waktu ({timeframe === 'today' ? 'Jam Sibuk' : 'Hari ke Hari'})
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              Interactive SVG Curve
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 select-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#1F293D"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 4}
                      fill="#64748B"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {Math.round((maxRevenue * ratio) / 1000000)}M
                    </text>
                  </g>
                );
              })}

              {/* Filled Area */}
              <path d={areaD} fill="url(#revenueGrad)" />

              {/* Curved Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points & labels */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#1E293B"
                    stroke="#60A5FA"
                    strokeWidth="2.5"
                    className="transition transform group-hover:scale-150"
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 10}
                    fill="#94A3B8"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                  <text
                    x={p.x}
                    y={p.y - 12}
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="opacity-90"
                  >
                    {formatRupiah(p.value).replace(',00', '')}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* CHART 2: DONUT CHART (Metode Pembayaran) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <PieIcon size={16} className="text-purple-400" />
              <span>Komposisi Pembayaran</span>
            </h3>
            <p className="text-[11px] text-slate-400">Rasio metode transaksi kasir</p>
          </div>

          {/* Donut representation */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {donutSlices.map((p, idx) => (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke={p.color}
                    strokeWidth="3.8"
                    strokeDasharray={p.strokeDasharray}
                    strokeDashoffset={p.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-medium">Dominan</span>
                <span className="text-base font-black text-blue-400">QRIS</span>
                <span className="text-[10px] text-slate-400">58-60%</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2 mt-4 text-xs">
              {data.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-slate-200">{p.method}</span>
                    <span className="text-[11px] text-slate-400">({p.count}x)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">{p.percent}%</span>
                    <div className="text-[10px] text-slate-400">{formatRupiah(p.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHART 3: TOP 10 BEST SELLERS (Bar Chart) */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              <span>Peringkat Produk Terlaris (Top Performers)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Berdasarkan akumulasi kuantitas terjual dan kontribusi omzet kasir
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Katalog Unggulan
          </span>
        </div>

        <div className="space-y-3">
          {data.topProducts.map((p, idx) => {
            const barPercent = Math.round((p.revenue / maxBarRevenue) * 100);
            return (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="text-emerald-400">{formatRupiah(p.revenue)}</strong>
                    <span className="text-slate-400 text-[11px] ml-2">({p.qty} terjual)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
