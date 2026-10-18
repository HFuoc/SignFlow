import type { UserRole } from "./api";

/** Describes the existing P.1 backend policies; does not grant permissions. */
export function RolePermissions({ role }: { role: UserRole }) {
  return <section className="role-permissions" aria-label="Role permissions">
    <h3>Role permissions</h3>
    <dl>
      <div><dt>Own profile, avatar and password</dt><dd>Allowed</dd></div>
      <div><dt>Devices, Monitor and simulator</dt><dd>{role === "participant" ? "Not allowed" : "Allowed"}</dd></div>
      <div><dt>Manage users, roles and sessions</dt><dd>{role === "administrator" ? "Allowed" : "Not allowed"}</dd></div>
      <div><dt>Review security audit</dt><dd>{role === "administrator" ? "Allowed" : "Not allowed"}</dd></div>
    </dl>
    {role === "developer" && <p>Developer has collector access. Account administration requires the Administrator role.</p>}
  </section>;
}
