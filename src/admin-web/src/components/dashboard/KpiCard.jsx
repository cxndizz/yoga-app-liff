import React from 'react';
import styles from './KpiCard.module.css';

const trendColor = (diff) => {
  if (typeof diff !== 'number') {
    return styles.neutral;
  }
  if (diff > 0) {
    return styles.positive;
  }
  if (diff < 0) {
    return styles.negative;
  }
  return styles.neutral;
};

const formatDiff = (diff) => {
  if (typeof diff === 'string') {
    return diff;
  }
  if (typeof diff === 'number') {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  }
  return '—';
};

function KpiCard({ title, value, diff }) {
  return (
    <article className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      <div className={`${styles.diff} ${trendColor(typeof diff === 'string' ? null : diff)}`}>
        {formatDiff(diff)}
      </div>
    </article>
  );
}

export default KpiCard;
