import { useAuth } from "../contexts/AuthContext";

export function useEditGuard() {
  const { canEdit, openGate } = useAuth();

  function requireEdit(action: () => void) {
    if (canEdit) {
      action();
    } else {
      openGate();
    }
  }

  return { canEdit, requireEdit };
}
