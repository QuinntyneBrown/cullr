export function formatLogged(ms: number): string {
  const date = new Date(ms);
  const time = date
    .toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\./g, '')
    .replace(/\u202f/g, ' ');
  const day =
    date.toDateString() === new Date().toDateString()
      ? 'Today'
      : date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  return `${day}, ${time}`;
}
