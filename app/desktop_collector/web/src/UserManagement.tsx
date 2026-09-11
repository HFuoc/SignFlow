import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";

import type { AuditEvent, AuthUser, UserRole } from "./api";
import { BridgeClient, userFacingBridgeError } from "./api";
import { PasswordField, roleLabels } from "./AuthScreens";
import {
  OneUIButton,
  OneUICard,
  OneUIDialog,
  OneUIKeyValueList,
  OneUISideSheet,
  OneUIInteractionPage,
  OneUISelectField,
  OneUIStateMessage,
  OneUIStatusIndicator,
  OneUITextField,
  type SnackbarNotice,
} from "./one-ui";
import type { RuntimeActivityInput } from "./runtimeActivity";

type Notice = Omit<SnackbarNotice, "id">;
export type AccountSection = "overview" | "accounts" | "security";
type Confirmation =
  | { kind: "deactivate"; user: AuthUser }
  | { kind: "role"; user: AuthUser; role: UserRole; displayName: string }
  | { kind: "reset"; user: AuthUser; password: string }
  | { kind: "revoke"; user: AuthUser };

const allRoles: UserRole[] = ["participant", "researcher", "administrator", "developer"];

const auditLabels: Record<string, string> = {
  bootstrap_administrator_created: "Create first administrator",
  login_succeeded: "Sign-in succeeded",
  login_failed: "Sign-in failed",
  logout: "Sign out",
  user_created: "Create account",
  role_changed: "Change role",
  account_activated: "Activate account",
  account_deactivated: "Deactivate account",
  password_changed: "Change password",
  password_reset: "Reset password",
  session_revoked: "Revoke session",
  privileged_action_denied: "Privileged action denied",
};

function confirmationDescription(confirmation: Confirmation | null): string {
  if (!confirmation) return "";
  const account = `@${confirmation.user.username}`;
  if (confirmation.kind === "deactivate") {
    return `${account} will no longer be able to sign in and all active sessions will be revoked.`;
  }
  if (confirmation.kind === "role") {
    return `${account} will receive the permissions of the ${roleLabels[confirmation.role]} role in future sessions.`;
  }
  if (confirmation.kind === "reset") {
    return `${account} must use the new temporary password and replace it after the next sign-in.`;
  }
  return `All active sessions for ${account} will end; the account can sign in again.`;
}

export function UserManagement({
  bridge,
  currentUser,
  section,
  onSectionChange,
  onActivity,
  onNotify,
}: {
  bridge: BridgeClient;
  currentUser: AuthUser;
  section: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  onActivity: (activity: RuntimeActivityInput) => void;
  onNotify: (notice: Notice) => void;
}) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [userPayload, auditPayload] = await Promise.all([
        bridge.listUsers(),
        bridge.listAuditEvents(),
      ]);
      setUsers(userPayload.users);
      setAuditEvents(auditPayload.events);
    } catch (failure) {
      setError(userFacingBridgeError(failure));
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  useEffect(() => { void refresh(); }, [refresh]);

  const visibleUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-US");
    if (!normalized) return users;
    return users.filter((user) => (
      user.username.toLocaleLowerCase("en-US").includes(normalized)
      || (user.display_name ?? "").toLocaleLowerCase("en-US").includes(normalized)
      || roleLabels[user.role].toLocaleLowerCase("en-US").includes(normalized)
    ));
  }, [query, users]);

  const accountSummary = useMemo(() => ({
    active: users.filter((user) => user.is_active).length,
    administrators: users.filter((user) => user.role === "administrator").length,
    passwordChangeRequired: users.filter((user) => user.must_change_password).length,
  }), [users]);
  const latestAuditEvent = auditEvents[0] ?? null;
  const sectionCopy: Record<AccountSection, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: "Local administration",
      title: "Account overview",
      description: "Review the signed-in administrator, local access, and recent security state on this device.",
    },
    accounts: {
      eyebrow: "Local administration",
      title: "Accounts & access",
      description: "Manage product roles, temporary passwords, and local sign-in sessions on this device.",
    },
    security: {
      eyebrow: "Security",
      title: "Authentication activity",
      description: "Review recent local sign-in and privileged account activity.",
    },
  };
  const currentSection = sectionCopy[section];

  async function confirmAction() {
    if (!confirmation) return;
    const operation = confirmation.kind;
    const target = confirmation.user.username;
    const key = `admin:${operation}:${confirmation.user.id}`;
    setPending(true);
    try {
      if (confirmation.kind === "deactivate") {
        await bridge.updateUser(confirmation.user.id, {
          display_name: confirmation.user.display_name,
          role: confirmation.user.role,
          is_active: false,
        });
        onNotify({ message: `Disabled ${confirmation.user.username}.`, tone: "success" });
      } else if (confirmation.kind === "role") {
        await bridge.updateUser(confirmation.user.id, {
          display_name: confirmation.displayName || null,
          role: confirmation.role,
          is_active: confirmation.user.is_active,
        });
        onNotify({ message: `Updated role for ${confirmation.user.username}.`, tone: "success" });
      } else if (confirmation.kind === "reset") {
        await bridge.resetUserPassword(confirmation.user.id, confirmation.password);
        onNotify({ message: `Set a temporary password for ${confirmation.user.username}.`, tone: "success" });
      } else {
        const result = await bridge.revokeUserSessions(confirmation.user.id);
        onNotify({ message: `Revoked ${result.revoked_sessions} sessions.`, tone: "success" });
      }
      const titles = {
        deactivate: "Account deactivated",
        role: "Account role updated",
        reset: "Temporary password set",
        revoke: "Sign-in sessions revoked",
      } as const;
      onActivity({
        key,
        kind: "admin",
        surface: "center",
        severity: "success",
        title: titles[operation],
        message: `Action for @${target} completed.`,
        audiences: ["administrator"],
        active: false,
        dismissible: true,
        actionLabel: "Open Account",
        command: { kind: "navigate", page: "users" },
        announcedBySnackbar: true,
      });
      setConfirmation(null);
      setEditing(null);
      await refresh();
    } catch (failure) {
      onActivity({
        key,
        kind: "admin",
        surface: "center",
        severity: "error",
        title: "Could not update account",
        message: userFacingBridgeError(failure),
        audiences: ["administrator"],
        active: false,
        dismissible: true,
        actionLabel: "Open Account",
        command: { kind: "navigate", page: "users" },
        announcedBySnackbar: true,
        markUnread: "always",
      });
      onNotify({ message: userFacingBridgeError(failure), tone: "error" });
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <OneUIStateMessage className="management-state" pending tone="waiting" title="Loading accounts" description="Opening the account list and security log…" />;
  }

  if (error) {
    return <OneUIStateMessage announce className="management-state" tone="error" title="Could not load user management" description={error} action={<OneUIButton onClick={() => { setLoading(true); void refresh(); }}>Try again</OneUIButton>} />;
  }

  return (
    <section id="account-section" className="user-management" data-testid="user-management" data-section={section} aria-labelledby="user-management-title">
      <header className="user-management__header">
        <div>
          <span className="section-eyebrow">{currentSection.eyebrow}</span>
          <h2 id="user-management-title">{currentSection.title}</h2>
          <p>{currentSection.description}</p>
        </div>
        {section === "accounts" ? (
          <OneUIButton className="create-account-entry" ref={createButtonRef} variant="primary" onClick={() => setCreateOpen(true)}>Create account</OneUIButton>
        ) : section === "security" ? (
          <OneUIButton variant="quiet" onClick={() => void refresh()}>Refresh</OneUIButton>
        ) : null}
      </header>

      {section === "overview" ? (
        <div className="account-overview-grid" aria-label="Account overview">
          <OneUICard title="Signed-in account" description="Current local administrator for this workspace.">
            <div className="account-overview-identity">
              <div>
                <strong>{currentUser.display_name || currentUser.username}</strong>
                <span>@{currentUser.username}</span>
              </div>
              <OneUIStatusIndicator emphasis="quiet" label={currentUser.is_active ? "Active" : "Disabled"} tone={currentUser.is_active ? "positive" : "negative"} />
            </div>
            <OneUIKeyValueList rows={[
              ["Role", roleLabels[currentUser.role]],
              ["Password", currentUser.must_change_password ? "Change required" : "Up to date"],
            ]} />
          </OneUICard>

          <OneUICard title="Local access" description="Accounts that can sign in on this device.">
            <div className="account-overview-metric"><strong>{users.length}</strong><span>accounts</span></div>
            <OneUIKeyValueList rows={[
              ["Active", `${accountSummary.active}`],
              ["Administrators", `${accountSummary.administrators}`],
              ["Password change required", `${accountSummary.passwordChangeRequired}`],
            ]} />
            <OneUIButton variant="quiet" onClick={() => onSectionChange("accounts")}>Manage accounts</OneUIButton>
          </OneUICard>

          <OneUICard title="Recent security" description="Latest authentication activity recorded locally.">
            {latestAuditEvent ? (
              <>
                <div className="account-overview-security">
                  <OneUIStatusIndicator
                    emphasis="quiet"
                    label={latestAuditEvent.outcome === "success" ? "Succeeded" : latestAuditEvent.outcome === "denied" ? "Denied" : "Failed"}
                    tone={latestAuditEvent.outcome === "success" ? "positive" : latestAuditEvent.outcome === "denied" ? "waiting" : "negative"}
                  />
                  <strong>{auditLabels[latestAuditEvent.event_type] ?? latestAuditEvent.event_type}</strong>
                </div>
                <OneUIKeyValueList rows={[["Time", new Date(latestAuditEvent.occurred_at).toLocaleString("en-US")]]} />
              </>
            ) : (
              <OneUIStateMessage title="No audit events yet" description="Security actions will appear here." />
            )}
            <OneUIButton variant="quiet" onClick={() => onSectionChange("security")}>Review security</OneUIButton>
          </OneUICard>
        </div>
      ) : null}

      {section === "accounts" ? (
        <section className="user-management__accounts" aria-label="Account list and search">
          <div className="user-management__toolbar">
            <OneUITextField
              aria-label="Search accounts"
              label="Search accounts"
              placeholder="Username, display name, or role"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <span>{visibleUsers.length}/{users.length} accounts</span>
          </div>

          {visibleUsers.length ? (
            <ul className="user-list" aria-label="Account list">
              {visibleUsers.map((user) => (
                <li className="user-row" key={user.id}>
                  <div className="user-row__identity">
                    <strong>{user.display_name || user.username}</strong>
                    <span>@{user.username}{user.id === currentUser.id ? " · You" : ""}</span>
                  </div>
                  <OneUIStatusIndicator
                    emphasis="quiet"
                    label={roleLabels[user.role]}
                    tone={user.role === "administrator" ? "positive" : "neutral"}
                  />
                  <OneUIStatusIndicator
                    emphasis="quiet"
                    label={user.is_active ? "Active" : "Disabled"}
                    tone={user.is_active ? "positive" : "negative"}
                  />
                  {user.must_change_password ? <span className="user-row__flag">Password change required</span> : <span />}
                  <OneUIButton
                    variant="quiet"
                    onClick={(event) => {
                      editButtonRef.current = event.currentTarget;
                      setEditing(user);
                    }}
                  >
                    Manage
                  </OneUIButton>
                </li>
              ))}
            </ul>
          ) : (
            <OneUIStateMessage title="No matching accounts" description="Try another username, display name, or role." />
          )}
        </section>
      ) : null}

      {section === "security" ? (
        <section className="audit-panel account-security-panel" aria-labelledby="audit-title">
          <header><div><span className="section-eyebrow">Security log</span><h3 id="audit-title">Recent authentication activity</h3></div></header>
          {auditEvents.length ? (
            <ol className="audit-list" tabIndex={0} aria-label="Recent authentication activity">
              {auditEvents.slice(0, 20).map((event) => (
                <li key={event.id}>
                  <span className="audit-list__mark" data-outcome={event.outcome} aria-hidden="true" />
                  <span><strong>{auditLabels[event.event_type] ?? event.event_type}</strong><small>{new Date(event.occurred_at).toLocaleString("en-US")}</small></span>
                  <span>{event.outcome === "success" ? "Succeeded" : event.outcome === "denied" ? "Denied" : "Failed"}</span>
                </li>
              ))}
            </ol>
          ) : <OneUIStateMessage title="No audit events yet" description="Security actions will appear here." />}
        </section>
      ) : null}

      <CreateUserSheet
        bridge={bridge}
        open={createOpen}
        returnFocusRef={createButtonRef}
        onDismiss={() => setCreateOpen(false)}
        onFailed={(message, username) => {
          onActivity({
            key: `admin:create:${username.trim().toLocaleLowerCase("en-US") || "unknown"}`,
            kind: "admin",
            surface: "center",
            severity: "error",
            title: "Could not create account",
            message,
            audiences: ["administrator"],
            active: false,
            dismissible: true,
            actionLabel: "Open Account",
            command: { kind: "navigate", page: "users" },
            markUnread: "always",
          });
        }}
        onCreated={async (user) => {
          setCreateOpen(false);
          onActivity({
            key: `admin:create:${user.id}`,
            kind: "admin",
            surface: "center",
            severity: "success",
            title: "Account created",
            message: `@${user.username} must replace the temporary password at first sign-in.`,
            audiences: ["administrator"],
            active: false,
            dismissible: true,
            actionLabel: "Open Account",
            command: { kind: "navigate", page: "users" },
            announcedBySnackbar: true,
          });
          onNotify({ message: `Created ${user.username}; the user must replace the temporary password.`, tone: "success" });
          await refresh();
        }}
      />

      <EditUserSheet
        user={editing}
        returnFocusRef={editButtonRef}
        onDismiss={() => setEditing(null)}
        onActivate={async (user) => {
          try {
            await bridge.updateUser(user.id, { display_name: user.display_name, role: user.role, is_active: true });
            setEditing(null);
            onActivity({
              key: `admin:activate:${user.id}`,
              kind: "admin",
              surface: "center",
              severity: "success",
              title: "Account activated",
              message: `@${user.username} can sign in again.`,
              audiences: ["administrator"],
              active: false,
              dismissible: true,
              actionLabel: "Open Account",
              command: { kind: "navigate", page: "users" },
              announcedBySnackbar: true,
            });
            onNotify({ message: `Activated ${user.username}.`, tone: "success" });
            await refresh();
          } catch (failure) {
            onActivity({
              key: `admin:activate:${user.id}`,
              kind: "admin",
              surface: "center",
              severity: "error",
              title: "Could not activate account",
              message: userFacingBridgeError(failure),
              audiences: ["administrator"],
              active: false,
              dismissible: true,
              actionLabel: "Open Account",
              command: { kind: "navigate", page: "users" },
              announcedBySnackbar: true,
              markUnread: "always",
            });
            onNotify({ message: userFacingBridgeError(failure), tone: "error" });
          }
        }}
        onConfirm={(nextConfirmation) => {
          setEditing(null);
          setConfirmation(nextConfirmation);
        }}
      />

      <OneUIDialog
        open={!!confirmation}
        title={confirmation?.kind === "deactivate" ? "Deactivate account?" : confirmation?.kind === "role" ? "Change account role?" : confirmation?.kind === "reset" ? "Set a new temporary password?" : "Revoke all sessions?"}
        description={confirmationDescription(confirmation)}
        cancelLabel="Keep current"
        confirmLabel={confirmation?.kind === "deactivate" ? "Deactivate" : confirmation?.kind === "role" ? "Change role" : confirmation?.kind === "reset" ? "Reset password" : "Revoke session"}
        destructive
        pending={pending}
        pendingLabel="Updating account"
        returnFocusRef={editButtonRef}
        onDismiss={() => { if (!pending) setConfirmation(null); }}
        onConfirm={() => void confirmAction()}
      />
    </section>
  );
}

function CreateUserSheet({
  bridge,
  onCreated,
  onDismiss,
  onFailed,
  open,
  returnFocusRef,
}: {
  bridge: BridgeClient;
  onCreated: (user: AuthUser) => void | Promise<void>;
  onDismiss: () => void;
  onFailed: (message: string, username: string) => void;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("participant");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"username" | "password" | null>(null);
  const [pending, setPending] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUsername(""); setDisplayName(""); setPassword(""); setRole("participant"); setError(null); setErrorField(null);
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrorField(null);
    if (!username.trim()) {
      setError("Username is required.");
      setErrorField("username");
      usernameRef.current?.focus();
      return;
    }
    if (password.length < 12) {
      setError("Temporary password must contain at least 12 characters.");
      setErrorField("password");
      passwordRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const result = await bridge.createUser({ username, display_name: displayName.trim() || null, password, role });
      await onCreated(result.user);
    } catch (failure) {
      const message = userFacingBridgeError(failure);
      setError(message);
      onFailed(message, username);
      setErrorField("username");
      usernameRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <OneUIInteractionPage id="create-user-sheet" className="create-account-page" eyebrow="Accounts" initialFocusRef={usernameRef} dismissible={!pending} title="Create account" open={open} onDismiss={onDismiss} returnFocusRef={returnFocusRef}>
      <form className="auth-form create-account-form" onSubmit={submit} noValidate>
        <OneUITextField ref={usernameRef} label="Username" autoComplete="off" invalid={errorField === "username"} message={errorField === "username" ? error ?? undefined : undefined} value={username} onChange={(event) => setUsername(event.currentTarget.value)} />
        <OneUITextField label="Display name (optional)" autoComplete="off" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
        <PasswordField inputRef={passwordRef} autoComplete="new-password" error={errorField === "password" ? error ?? undefined : undefined} label="Temporary password" name="temporary-password" value={password} onChange={setPassword} />
        <OneUISelectField label="Role" value={role} onChange={(event) => setRole(event.currentTarget.value as UserRole)}>{allRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}</OneUISelectField>
        {error && !errorField ? <p className="auth-form-error" role="alert">{error}</p> : null}
        <p className="account-form-note">New accounts must replace the temporary password at first sign-in.</p>
        <OneUIButton variant="primary" type="submit" loading={pending} loadingLabel="Creating account">Create account</OneUIButton>
      </form>
    </OneUIInteractionPage>
  );
}

function EditUserSheet({ user, onActivate, onConfirm, onDismiss, returnFocusRef }: {
  user: AuthUser | null;
  onActivate: (user: AuthUser) => void | Promise<void>;
  onConfirm: (confirmation: Confirmation) => void;
  onDismiss: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("participant");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [displayedUser, setDisplayedUser] = useState<AuthUser | null>(user);
  useEffect(() => {
    if (!user) return;
    setDisplayedUser(user);
    setDisplayName(user.display_name ?? ""); setRole(user.role); setTemporaryPassword(""); setError(null);
  }, [user]);
  const activeUser = user ?? displayedUser;
  if (!activeUser) return null;
  return (
    <OneUISideSheet id="edit-user-sheet" className="account-editor-sheet" eyebrow={`@${activeUser.username}`} title="Manage account" open={!!user} onDismiss={onDismiss} returnFocusRef={returnFocusRef}>
      <div className="auth-form">
        <OneUITextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
        <OneUISelectField label="Role" value={role} onChange={(event) => setRole(event.currentTarget.value as UserRole)}>{allRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}</OneUISelectField>
        <OneUIButton variant="primary" onClick={() => {
          if (role === activeUser.role && displayName.trim() === (activeUser.display_name ?? "")) { setError("There are no changes to save."); return; }
          onConfirm({ kind: "role", user: activeUser, role, displayName: displayName.trim() });
        }}>Save profile and role</OneUIButton>
        <div className="account-editor-divider" />
        <PasswordField autoComplete="new-password" label="New temporary password" name="reset-password" value={temporaryPassword} onChange={setTemporaryPassword} />
        <OneUIButton variant="quiet" onClick={() => {
          if (temporaryPassword.length < 12) { setError("Temporary password must contain at least 12 characters."); return; }
          onConfirm({ kind: "reset", user: activeUser, password: temporaryPassword });
        }}>Set temporary password</OneUIButton>
        <OneUIButton variant="quiet" onClick={() => onConfirm({ kind: "revoke", user: activeUser })}>Revoke all sign-in sessions</OneUIButton>
        {activeUser.is_active
          ? <OneUIButton variant="danger-quiet" onClick={() => onConfirm({ kind: "deactivate", user: activeUser })}>Deactivate account</OneUIButton>
          : <OneUIButton variant="primary" onClick={() => void onActivate(activeUser)}>Activate account</OneUIButton>}
        {error ? <p className="auth-form-error" role="alert">{error}</p> : null}
      </div>
    </OneUISideSheet>
  );
}
