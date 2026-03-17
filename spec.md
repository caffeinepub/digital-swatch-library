# Digital Swatch Library

## Current State
The app is fully public — no login required. Anyone with the link can add, edit, or delete fabrics, colours, vendors, and styles. The backend has admin/user tracking but no access enforcement on mutations. The frontend has no auth context gating edit actions.

## Requested Changes (Diff)

### Add
- **PIN access**: A PIN (set by admin) that any visitor can enter to unlock edit mode without logging in. Stored in backend. Default PIN: 1234.
- **Internet Identity login**: Optional login via Internet Identity. Logged-in users record their session and can be assigned roles.
- **Role-based access**: Admin (first user to log in) can edit everything and manage users. Regular logged-in users are view-only unless promoted by admin. PIN holders get edit access for their session only.
- **Edit mode indicator**: A visible lock/unlock icon in the header. Locked = view only. Unlocked = edit mode active (via PIN or admin login).
- **Access gate modal**: A dialog prompting for PIN entry or Internet Identity login to unlock editing. Shown when a user tries to perform an edit action while locked.
- **Admin panel** (accessible only to logged-in admins): View all users, block/unblock, promote to editor role, change PIN.
- **Backend: PIN management**: `setPin`, `verifyPin` functions. Admin-only `setPin`. Public `verifyPin`.
- **Backend: Editor role**: `promoteToEditor(principal)`, `demoteFromEditor(principal)` — admin only. `isEditor(caller)` query.

### Modify
- All create/update/delete backend functions: enforce caller must be admin or editor (no anonymous mutations).
- Header: Add login button (when not logged in) and logout button (when logged in). Show admin panel link for admins.
- Dashboard and detail pages: Show add/edit/delete buttons only in edit mode.

### Remove
- Nothing removed.

## Implementation Plan
1. Update backend to add PIN storage, `setPin`, `verifyPin`, `promoteToEditor`, `demoteFromEditor`, `isEditor`, and enforce auth on all mutation functions.
2. Select `authorization` component.
3. Update frontend auth context to track: login state, isAdmin, isEditor, hasPinAccess (session-only).
4. Add access gate modal (PIN entry + Internet Identity login option).
5. Add edit mode toggle in header (lock icon).
6. Gate all add/edit/delete UI actions behind edit mode check.
7. Add admin panel (user list, block/unblock, promote/demote, change PIN).
