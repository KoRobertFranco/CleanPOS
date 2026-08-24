export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + ' Ks';

export const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
