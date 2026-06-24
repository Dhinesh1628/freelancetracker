/**
 * usePermission(project)
 * Pass the project object (must include `yourRole` from the API response).
 * Returns boolean flags the UI can use to conditionally render controls.
 *
 * Roles: 'admin' | 'member' | 'viewer' | null (no access)
 */
export default function usePermission(project) {
  const role = project?.yourRole || null;

  const isAdmin  = role === 'admin';
  const isMember = role === 'member';
  const isViewer = role === 'viewer';

  return {
    role,
    isAdmin,
    isMember,
    isViewer,
    canView:   !!role,                 // admin, member, viewer can all view
    canEdit:   isAdmin || isMember,     // admin + member can edit tasks/fields
    canRename: isAdmin,                 // only admin can rename/change client/budget
    canDelete: isAdmin,                 // only admin can delete the project
    canManageMembers: isAdmin,          // only admin can invite/remove/change roles
  };
}