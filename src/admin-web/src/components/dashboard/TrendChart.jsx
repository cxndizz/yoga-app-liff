import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';
import styles from './TrendChart.module.css';

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

const formatDateTick = (timestamp) => {
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
};

const TrendTooltipContent = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const revenueEntry = payload.find((item) => item.dataKey === 'revenue');
  const ordersEntry = payload.find((item) => item.dataKey === 'orders');
  const dateLabel = revenueEntry?.payload?.dateLabel || ordersEntry?.payload?.dateLabel;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{dateLabel}</p>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipMetric}>
          <span className={styles.tooltipDot} style={{ backgroundColor: '#6366f1' }} />
          ยอดขาย
        </span>
        <span className={styles.tooltipValue}>
          {currencyFormatter.format(Number(revenueEntry?.value ?? 0))}
        </span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipMetric}>
          <span className={styles.tooltipDot} style={{ backgroundColor: '#14b8a6' }} />
          ออเดอร์
        </span>
        <span className={styles.tooltipValue}>
          {Number(ordersEntry?.value ?? 0).toLocaleString('th-TH')} ครั้ง
        </span>
      </div>
    </div>
  );
};

function TrendChart({
  title,
  subtitle,
  dataset = [],
  loading = false,
  emptyText = 'ยังไม่มีข้อมูล',
  actions,
  className,
}) {
  const chartData = useMemo(() => {
    return (dataset || [])
      .map((item) => {
        if (!item) return null;
        let timestamp = Number(item.timestamp);
        if (!Number.isFinite(timestamp)) {
          if (item.date) {
            const parsedDate = new Date(item.date);
            if (!Number.isNaN(parsedDate.getTime())) {
              timestamp = parsedDate.getTime();
            }
          }
        }
        if (!Number.isFinite(timestamp)) {
          return null;
        }
        const dateLabel = item.dateLabel || formatDateTick(timestamp);
        const revenue = Number.isFinite(Number(item.revenue)) ? Number(item.revenue) : 0;
        const orders = Number.isFinite(Number(item.orders)) ? Number(item.orders) : 0;
        return {
          ...item,
          timestamp,
          dateLabel,
          revenue,
          orders,
        };
      })
      .filter(Boolean);
  }, [dataset]);

  const labelByTimestamp = useMemo(() => {
    const map = new Map();
    chartData.forEach((item) => {
      map.set(item.timestamp, item.dateLabel);
    });
    return map;
  }, [chartData]);

  const rootClassName = [styles.card, className].filter(Boolean).join(' ');

  return (
    <article className={rootClassName} aria-live={loading ? 'polite' : 'off'}>
      <header className={styles.header}>
        <div>
          {subtitle && <p className={styles.eyebrow}>{subtitle}</p>}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.chartBody} aria-label={title}>
        {loading ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={`skeleton-${index}`}
                className={styles.skeletonRow}
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <p className={styles.emptyState}>{emptyText}</p>
        ) : (
          <div className={styles.chartSurface}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['auto', 'auto']}
                  scale="time"
                  tickFormatter={(value) => labelByTimestamp.get(value) || formatDateTick(value)}
                  stroke="#94a3b8"
                  tickMargin={12}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  axisLine={false}
                  tickFormatter={(value) => currencyFormatter.format(Number(value) || 0)}
                  stroke="#94a3b8"
                  tickMargin={8}
                  width={80}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickFormatter={(value) => `${Number(value || 0).toLocaleString('th-TH')}`}
                  stroke="#94a3b8"
                  tickMargin={8}
                  width={50}
                />
                <Tooltip content={<TrendTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="ยอดขาย (บาท)"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="จำนวนออเดอร์"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </article>
  );
}

export default TrendChart;
