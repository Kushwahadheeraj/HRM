const avatarColors = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F59E0B'];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}