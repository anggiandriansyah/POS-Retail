'use client';

import { useState, useMemo } from 'react';
import {
  Printer,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';
import type { Product } from '../types/pos';
import { formatRupiah } from '../utils/format';

export type Timeframe = 'today' | '7d' | '30d' | 'month';
export type ChartType = 'line' | 'bar' | 'pie';

interface VisualAnalyticsProps {
  products: Product[];
}

export function VisualAnalytics({ products: _products }: VisualAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [chartType, setChartType] = useState<ChartType>('line');

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

  // Calculations for Line Chart
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

  // Calculations for Bar Chart
  const maxBarRevenue = Math.max(...data.revenueTimeline.map(d => d.value), 1);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-sm">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            <span>Visual Analytics & Insight Penjualan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis tren pendapatan, produk terlaris, dan rasio pembayaran kasir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chart Type Selector Bar (Hotfix v1.5.1: Line / Bar / Pie switcher requested by Mas Gege) */}
          <div className="inline-flex items-center bg-slate-950/80 p-1 rounded-full border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilkan grafik garis (Line Chart)"
            >
              <LineIcon size={13} />
              <span>Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilkan grafik batang (Bar Chart)"
            >
              <BarChart3 size={13} />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                chartType === 'pie'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilkan diagram lingkaran (Pie/Donut Chart)"
            >
              <PieIcon size={13} />
              <span>Pie</span>
            </button>
          </div>

          {/* Timeframe Chips (Modern Sleek Pill Shape) */}
          <div className="inline-flex items-center bg-slate-950/80 p-1 rounded-full border border-slate-800 text-xs font-semibold">
            {(['today', '7d', '30d', 'month'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'today' ? 'Hari Ini' : tf === '7d' ? '7 Hari' : tf === '30d' ? '30 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>

          {/* Print PDF Button (Icon Only - Requested by Mas Gege) */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition focus:outline-none"
            title="Cetak atau simpan PDF analitik"
            aria-label="Cetak PDF"
          >
            <Printer size={16} />
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
        {/* PRIMARY SELECTED CHART VIEW (Line, Bar, or Pie) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                {chartType === 'line' && <LineIcon size={16} className="text-blue-400" />}
                {chartType === 'bar' && <BarChart3 size={16} className="text-emerald-400" />}
                {chartType === 'pie' && <PieIcon size={16} className="text-purple-400" />}
                <span>
                  {chartType === 'line' && 'Kurva Pertumbuhan Omzet (Line Chart)'}
                  {chartType === 'bar' && 'Distribusi Omzet per Periode (Bar Chart)'}
                  {chartType === 'pie' && 'Rasio Proporsi Pembayaran & Transaksi (Pie Chart)'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualisasi dinamik ({timeframe === 'today' ? 'Jam Sibuk' : 'Hari ke Hari'})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Puncak Tertinggi</span>
              <span className="text-xs font-black text-emerald-400">{formatRupiah(maxRevenue)}</span>
            </div>
          </div>

          {/* VIEW 1: LINE CHART */}
          {chartType === 'line' && (
            <div className="relative w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px]">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                  return (
                    <g key={i}>
                      <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                      <text x={paddingX - 6} y={y + 3} textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
                        {(maxRevenue * ratio / 1000000).toFixed(1)}M
                      </text>
                    </g>
                  );
                })}

                {/* Area under curve */}
                <path d={areaD} fill="url(#revenueGrad)" />

                {/* Main line */}
                <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Points */}
                {points.map((p, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" className="transition-all hover:r-6" />
                    <text x={p.x} y={chartHeight - 10} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="500">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          {/* VIEW 2: BAR CHART */}
          {chartType === 'bar' && (
            <div className="relative w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px]">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                  return (
                    <line key={i} x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                  );
                })}

                {/* Vertical Bars */}
                {data.revenueTimeline.map((item, idx) => {
                  const count = data.revenueTimeline.length;
                  const availableWidth = chartWidth - paddingX * 2;
                  const barWidth = Math.min(36, availableWidth / count - 12);
                  const stepX = availableWidth / count;
                  const x = paddingX + idx * stepX + (stepX - barWidth) / 2;
                  const barH = (item.value / maxBarRevenue) * (chartHeight - paddingY * 2);
                  const y = chartHeight - paddingY - barH;

                  return (
                    <g key={idx}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx="5"
                        fill="url(#barGrad)"
                        className="transition-all hover:opacity-80"
                      />
                      <text x={x + barWidth / 2} y={chartHeight - 10} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="500">
                        {item.label}
                      </text>
                      <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="#34D399" fontSize="9" fontWeight="700">
                        {(item.value / 1000000).toFixed(1)}M
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* VIEW 3: PIE / DONUT CHART */}
          {chartType === 'pie' && (
            <div className="py-2 flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1E293B" strokeWidth="6" />
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="6"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all hover:opacity-80"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">QRIS Leader</span>
                  <span className="text-base font-black text-white">{data.payments[0].percent}%</span>
                </div>
              </div>

              <div className="space-y-3 w-full sm:w-64">
                {data.payments.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-white">{p.method}</span>
                      <span className="text-[11px] text-slate-400">({p.count}x)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-white block">{formatRupiah(p.total)}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{p.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: DONUT PAYMENT BREAKDOWN & TOP PRODUCTS */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <PieIcon size={16} className="text-purple-400" />
                  <span>Metode Pembayaran</span>
                </h3>
                <p className="text-[11px] text-slate-400">Rasio QRIS vs Tunai vs Transfer</p>
              </div>
            </div>

            {/* Donut Chart SVG */}
            <div className="my-4 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1E293B" strokeWidth="5.5" />
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="5.5"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all hover:opacity-80"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">QRIS Dominan</span>
                  <span className="text-sm font-black text-white">{data.payments[0].percent}%</span>
                </div>
              </div>
            </div>

            {/* Legend list */}
            <div className="space-y-2">
              {data.payments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-300 font-medium">{p.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{formatRupiah(p.total)}</span>
                    <span className="text-[10px] text-slate-400 w-7 text-right">{p.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Integrasi Dinamis QRIS:</span>
            <span className="text-emerald-400 font-semibold">Aktif Real-Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
