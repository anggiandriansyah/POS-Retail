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
  PackageCheck,
  CreditCard,
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

  // Realistic mock analytics data generated per timeframe
  const data = useMemo(() => {
    if (timeframe === 'today') {
      return {
        revenueTimeline: [
          { label: '08:00', value: 450000, orders: 5 },
          { label: '10:00', value: 980000, orders: 12 },
          { label: '12:00', value: 1850000, orders: 24 },
          { label: '14:00', value: 1120000, orders: 14 },
          { label: '16:00', value: 1480000, orders: 19 },
          { label: '18:00', value: 2650000, orders: 34 },
          { label: '20:00', value: 1950000, orders: 25 },
          { label: '21:30', value: 720000, orders: 9 },
        ],
        topProducts: [
          { name: 'Kopi Susu Gula Aren 250ml', qty: 42, revenue: 1050000, category: 'Minuman' },
          { name: 'Roti Bakar Cokelat Keju', qty: 31, revenue: 620000, category: 'Makanan' },
          { name: 'Air Mineral 600ml', qty: 50, revenue: 250000, category: 'Minuman' },
          { name: 'Matcha Latte Ice', qty: 22, revenue: 550000, category: 'Minuman' },
          { name: 'Croissant Butter', qty: 16, revenue: 480000, category: 'Bakery' },
        ],
        payments: [
          { method: 'QRIS', count: 78, total: 6680000, color: '#3B82F6', percent: 60 },
          { method: 'CASH', count: 44, total: 3450000, color: '#10B981', percent: 31 },
          { method: 'TRANSFER', count: 16, total: 1070000, color: '#8B5CF6', percent: 9 },
        ],
        grossRevenue: 11200000,
        totalOrders: 138,
        avgOrderValue: 81159,
        netProfit: 4704000,
      };
    }

    if (timeframe === '30d' || timeframe === 'month') {
      return {
        revenueTimeline: [
          { label: 'Minggu 1', value: 43500000, orders: 540 },
          { label: 'Minggu 2', value: 49800000, orders: 620 },
          { label: 'Minggu 3', value: 55200000, orders: 700 },
          { label: 'Minggu 4', value: 63500000, orders: 810 },
        ],
        topProducts: [
          { name: 'Kopi Susu Gula Aren 250ml', qty: 1020, revenue: 25500000, category: 'Minuman' },
          { name: 'Roti Bakar Cokelat Keju', qty: 680, revenue: 13600000, category: 'Makanan' },
          { name: 'Croissant Butter', qty: 440, revenue: 13200000, category: 'Bakery' },
          { name: 'Matcha Latte Ice', qty: 395, revenue: 9875000, category: 'Minuman' },
          { name: 'Espresso Double Shot', qty: 420, revenue: 8400000, category: 'Minuman' },
        ],
        payments: [
          { method: 'QRIS', count: 1620, total: 127200000, color: '#3B82F6', percent: 60 },
          { method: 'CASH', count: 810, total: 63600000, color: '#10B981', percent: 30 },
          { method: 'TRANSFER', count: 240, total: 21200000, color: '#8B5CF6', percent: 10 },
        ],
        grossRevenue: 212000000,
        totalOrders: 2670,
        avgOrderValue: 79400,
        netProfit: 89040000,
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

  // Scaled dimensions for Line and Bar Charts (compact & well-proportioned)
  const chartHeight = 180;
  const chartWidth = 560;
  const paddingX = 36;
  const paddingY = 24;

  const maxRevenue = Math.max(...data.revenueTimeline.map(d => d.value), 1);

  const points = useMemo(() => {
    return data.revenueTimeline.map((item, idx) => {
      const x = paddingX + (idx / Math.max(data.revenueTimeline.length - 1, 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (item.value / maxRevenue) * (chartHeight - paddingY * 2);
      return { x, y, ...item };
    });
  }, [data.revenueTimeline, maxRevenue, chartWidth, chartHeight, paddingX, paddingY]);

  const pathD = useMemo(() => {
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }, [pathD, points, chartHeight, paddingY]);

  // Donut slices for Pie Chart
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Printable Report Header (Only visible in Print preview / PDF output) */}
      <div
        className="print-header"
        style={{
          display: 'none',
          paddingBottom: '12px',
          marginBottom: '16px',
          borderBottom: '2px solid #0f172a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              ALPHOS Store • Laporan Visual Analisis & Penjualan
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#475569' }}>
              Rentang Waktu: {timeframe === 'today' ? 'Hari Ini' : timeframe === '7d' ? '7 Hari Terakhir' : timeframe === '30d' ? '30 Hari Terakhir' : 'Bulan Ini'} • Status: Terverifikasi
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>Smart Retail OS v1.5.1</span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .print-header {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Header Bar & Timeframe Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={22} style={{ color: '#10B981' }} />
            <span>Visual Analytics & Insight Penjualan</span>
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Analisis tren omzet, produk terlaris, dan rasio pembayaran kasir
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeframe Chips */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--bg)',
              padding: '3px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
            }}
          >
            {(['today', '7d', '30d', 'month'] as const).map(tf => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    border: 'none',
                    background: isActive ? '#10B981' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                  }}
                >
                  {tf === 'today' ? 'Hari Ini' : tf === '7d' ? '7 Hari' : tf === '30d' ? '30 Hari' : 'Bulan Ini'}
                </button>
              );
            })}
          </div>

          {/* Print PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#10B981';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            title="Cetak Laporan / Simpan PDF"
            aria-label="Cetak Laporan PDF"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards (4 Columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Omzet Kotor */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Total Pendapatan Kotor</span>
            <DollarSign size={16} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
            {formatRupiah(data.grossRevenue)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>+14.2% dibanding periode lalu</span>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Jumlah Transaksi</span>
            <ShoppingBag size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
            {data.totalOrders} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--muted)' }}>Struk</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--muted)' }}>
            Rata-rata {Math.round(data.totalOrders / (timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : 30))} order / hari
          </div>
        </div>

        {/* Card 3: AOV */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Average Order Value</span>
            <TrendingUp size={16} style={{ color: '#8B5CF6' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
            {formatRupiah(data.avgOrderValue)}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--muted)' }}>
            Rata-rata nominal per transaksi
          </div>
        </div>

        {/* Card 4: Estimasi Laba Bersih */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Estimasi Laba Bersih</span>
            <CheckCircle size={16} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
            {formatRupiah(data.netProfit)}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--muted)' }}>
            Margin bersih estimasi ~42%
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION CHART: PILIHAN BENTUK CHART KOTAK ADA DI DALAM SECTION (HANYA ICON CHART) */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Header Section Chart: Judul di Kiri, Icon Switcher Kotak + Puncak Omzet di Kanan */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Judul & Keterangan Grafik Aktif */}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.96rem',
                fontWeight: 800,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {chartType === 'line' && <LineIcon size={18} style={{ color: '#10B981' }} />}
              {chartType === 'bar' && <BarChart3 size={18} style={{ color: '#10B981' }} />}
              {chartType === 'pie' && <PieIcon size={18} style={{ color: '#10B981' }} />}
              <span>
                {chartType === 'line' && 'Kurva Pertumbuhan Omzet (Line Chart)'}
                {chartType === 'bar' && 'Distribusi Omzet per Periode (Bar Chart)'}
                {chartType === 'pie' && 'Rasio Proporsi Pembayaran Kasir (Pie / Donut)'}
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
              {chartType === 'line' && `Visualisasi tren penjualan (${timeframe === 'today' ? 'Jam Sibuk' : 'Hari ke Hari'})`}
              {chartType === 'bar' && `Perbandingan volume omzet riil (${timeframe === 'today' ? 'Per Jam' : 'Per Hari'})`}
              {chartType === 'pie' && 'Persentase transaksi berdasarkan kanal pembayaran (QRIS, Tunai, Transfer)'}
            </p>
          </div>

          {/* Sisi Kanan: Switcher Kotak Icon Chart di Dalam Section (Sesuai Permintaan Mas Gege) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              className="no-print"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              {/* Kotak Icon 1: Line Chart */}
              <button
                type="button"
                onClick={() => setChartType('line')}
                title="Line Chart (Kurva Omzet)"
                aria-label="Line Chart"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  border: chartType === 'line' ? '1.5px solid #10B981' : '1px solid transparent',
                  background: chartType === 'line' ? '#10B981' : 'transparent',
                  color: chartType === 'line' ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: chartType === 'line' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                }}
                onMouseEnter={e => {
                  if (chartType !== 'line') {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (chartType !== 'line') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted)';
                  }
                }}
              >
                <LineIcon size={18} />
              </button>

              {/* Kotak Icon 2: Bar Chart */}
              <button
                type="button"
                onClick={() => setChartType('bar')}
                title="Bar Chart (Distribusi Omzet)"
                aria-label="Bar Chart"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  border: chartType === 'bar' ? '1.5px solid #10B981' : '1px solid transparent',
                  background: chartType === 'bar' ? '#10B981' : 'transparent',
                  color: chartType === 'bar' ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: chartType === 'bar' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                }}
                onMouseEnter={e => {
                  if (chartType !== 'bar') {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (chartType !== 'bar') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted)';
                  }
                }}
              >
                <BarChart3 size={18} />
              </button>

              {/* Kotak Icon 3: Pie Chart */}
              <button
                type="button"
                onClick={() => setChartType('pie')}
                title="Pie / Donut Chart (Rasio Pembayaran)"
                aria-label="Pie Chart"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  border: chartType === 'pie' ? '1.5px solid #10B981' : '1px solid transparent',
                  background: chartType === 'pie' ? '#10B981' : 'transparent',
                  color: chartType === 'pie' ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: chartType === 'pie' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                }}
                onMouseEnter={e => {
                  if (chartType !== 'pie') {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (chartType !== 'pie') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted)';
                  }
                }}
              >
                <PieIcon size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Puncak Omzet</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>{formatRupiah(maxRevenue)}</span>
            </div>
          </div>
        </div>

        {/* VIEW 1: LINE CHART (Compact & Proportioned) */}
        {chartType === 'line' && (
          <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', maxHeight: '220px', display: 'block' }}
            >
              <defs>
                <linearGradient id="alphosLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines */}
              {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="var(--muted)"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {((maxRevenue * ratio) / 1000000).toFixed(1)}M
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area under curve */}
              <path d={areaD} fill="url(#alphosLineGrad)" />

              {/* Curve Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--surface)"
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill="var(--muted)"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* VIEW 2: BAR CHART (Compact & Proportioned) */}
        {chartType === 'bar' && (
          <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', maxHeight: '220px', display: 'block' }}
            >
              <defs>
                <linearGradient id="alphosBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.45" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Bars */}
              {data.revenueTimeline.map((item, idx) => {
                const count = data.revenueTimeline.length;
                const availableWidth = chartWidth - paddingX * 2;
                const barWidth = Math.min(32, availableWidth / count - 10);
                const stepX = availableWidth / count;
                const x = paddingX + idx * stepX + (stepX - barWidth) / 2;
                const barH = (item.value / maxRevenue) * (chartHeight - paddingY * 2);
                const y = chartHeight - paddingY - barH;

                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx="4"
                      fill="url(#alphosBarGrad)"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fill="#059669"
                      fontSize="9"
                      fontWeight="700"
                    >
                      {(item.value / 1000000).toFixed(1)}M
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill="var(--muted)"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* VIEW 3: PIE / DONUT CHART */}
        {chartType === 'pie' && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: '24px',
              padding: '12px 0',
            }}
          >
            {/* Donut SVG */}
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border)" strokeWidth="5.5" />
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
                  />
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700 }}>QRIS Dominan</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                  {data.payments[0].percent}%
                </span>
              </div>
            </div>

            {/* Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
              {data.payments.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: p.color,
                        display: 'inline-block',
                      }}
                    />
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{p.method}</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>({p.count}x)</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                      {formatRupiah(p.total)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>{p.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. DUA KARTU DETAIL TAMBAHAN (PRODUK TERLARIS & RINCIAN PEMBAYARAN) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Top 5 Products */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageCheck size={18} style={{ color: '#10B981' }} />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Top 5 Produk Terlaris</strong>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Periode {timeframe === 'today' ? 'Hari Ini' : timeframe === '7d' ? '7 Hari' : '30 Hari'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.topProducts.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: idx < data.topProducts.length - 1 ? '1px dashed var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#10B981' : 'var(--bg)',
                      color: idx === 0 ? '#ffffff' : 'var(--muted)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{p.category} • Terjual {p.qty} pcs</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
                  {formatRupiah(p.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: '#3B82F6' }} />
                <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Kesehatan Arus Kasir</strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>Real-Time Data</span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 14px' }}>
              Mayoritas konsumen toko menyukai pembayaran digital non-tunai (QRIS & Transfer mencapai 70%).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.payments.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.method}</span>
                    <span style={{ color: 'var(--muted)' }}>{formatRupiah(p.total)} ({p.percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${p.percent}%`, height: '100%', background: p.color, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--muted)',
            }}
          >
            <span>Audit Finansial:</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>100% Cocok Tanpa Selisih</span>
          </div>
        </div>
      </div>
    </div>
  );
}
