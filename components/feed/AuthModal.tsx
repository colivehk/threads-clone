'use client';

import Login from '@/components/Login';

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return <Login onClose={onClose} />;
}
