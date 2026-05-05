export function calculatePulseScore({
  recentMessages,
  liveParticipants,
  reactions,
}: {
  recentMessages: number;
  liveParticipants: number;
  reactions: number;
}) {
  const score = recentMessages * 3 + liveParticipants * 8 + reactions * 2;
  return Math.max(0, Math.min(100, score));
}

export function getPulseLabel(score: number) {
  if (score >= 85) return 'Altissima';
  if (score >= 65) return 'Alta';
  if (score >= 35) return 'Media';
  if (score > 0) return 'Bassa';
  return 'In attesa';
}
