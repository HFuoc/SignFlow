import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import brightnessGlyphUrl from "./assets/one-ui/figma/brightness.svg";
import darkGlyphUrl from "./assets/one-ui/figma/dark.svg";
import passwordHideGlyphUrl from "./assets/one-ui/figma/password-hide.svg";
import passwordShowGlyphUrl from "./assets/one-ui/figma/password-show.svg";
import type { AuthStatus, AuthUser, UserRole } from "./api";
import { BridgeClient, userFacingBridgeError } from "./api";
import {
  OneUIButton,
  OneUICard,
  OneUICheckboxRow,
  OneUIIconButton,
  OneUIInteractionPage,
  OneUIProgressIndicator,
  OneUISideSheet,
  OneUIStatusIndicator,
  OneUITextField,
} from "./one-ui";

export const roleLabels: Record<UserRole, string> = {
  participant: "Participant",
  researcher: "Researcher",
  administrator: "Administrator",
  developer: "Developer",
};

function ThemeGlyph({ dark }: { dark: boolean }) {
  return <img className="one-ui-figma-glyph" src={dark ? brightnessGlyphUrl : darkGlyphUrl} alt="" />;
}

function PasswordVisibilityGlyph({ visible }: { visible: boolean }) {
  return <img className="one-ui-figma-glyph" src={visible ? passwordHideGlyphUrl : passwordShowGlyphUrl} alt="" />;
}

function AuthThemeButton({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  return (
    <OneUIIconButton
      className="auth-theme-control"
      data-testid="theme-control"
      icon={<ThemeGlyph dark={dark} />}
      label={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={onToggleTheme}
    />
  );
}

function AuthLayout({
  cardClassName,
  children,
  dark,
  eyebrow,
  onToggleTheme,
  title,
}: {
  cardClassName?: string;
  children: ReactNode;
  dark: boolean;
  eyebrow: string;
  onToggleTheme: () => void;
  title: string;
}) {
  return (
    <main className="auth-screen">
      <header className="auth-screen__bar">
        <span className="auth-product-name">Dataset Studio</span>
        <AuthThemeButton dark={dark} onToggleTheme={onToggleTheme} />
      </header>
      <div className="auth-stage">
        <div className="auth-product-lockup" aria-hidden="true">
          <span className="auth-product-lockup__name">SmartGlove</span>
        </div>
        <OneUICard className={`auth-card${cardClassName ? ` ${cardClassName}` : ""}`} eyebrow={eyebrow} headingLevel={1} title={title}>
          {children}
        </OneUICard>
        <p className="auth-stage__footnote">Local workspace · account data stays on this device</p>
      </div>
    </main>
  );
}

export function PasswordField({
  autoComplete,
  error,
  inputRef,
  label,
  name,
  onChange,
  value,
  variant = "pill",
}: {
  autoComplete: string;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
  variant?: "pill" | "underline";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password-field">
      <OneUITextField
        ref={inputRef}
        autoComplete={autoComplete}
        invalid={!!error}
        className={variant === "underline" ? "auth-underline-field" : undefined}
        label={label}
        message={error}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <OneUIIconButton
        className="auth-password-field__toggle"
        icon={<PasswordVisibilityGlyph visible={visible} />}
        label={visible ? `Hide ${label.toLocaleLowerCase("en")}` : `Show ${label.toLocaleLowerCase("en")}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      />
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  return message ? <p className="auth-form-error" role="alert">{message}</p> : null;
}

export function FirstRunSetup({
  bridge,
  dark,
  onAuthenticated,
  onToggleTheme,
}: {
  bridge: BridgeClient;
  dark: boolean;
  onAuthenticated: (status: AuthStatus) => void;
  onToggleTheme: () => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"username" | "password" | "confirmation" | null>(null);
  const [pending, setPending] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrorField(null);
    if (!username.trim()) {
      setError("Enter an administrator username.");
      setErrorField("username");
      usernameRef.current?.focus();
      return;
    }
    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      setErrorField("password");
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      setErrorField("confirmation");
      confirmationRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      onAuthenticated(await bridge.setupAdministrator({
        username,
        display_name: displayName.trim() || null,
        password,
        password_confirmation: confirmation,
      }));
    } catch (failure) {
      setError(userFacingBridgeError(failure));
      setErrorField("username");
      usernameRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout dark={dark} eyebrow="First-time secure setup" onToggleTheme={onToggleTheme} title="Create local administrator">
      <p className="auth-card__description">
        The first local account manages users and access on this device. There is no default password or public sign-up.
      </p>
      <form className="auth-form" onSubmit={submit} noValidate>
        <OneUITextField ref={usernameRef} autoComplete="username" invalid={errorField === "username"} label="Username" message={errorField === "username" ? error ?? undefined : undefined} value={username} onChange={(event) => setUsername(event.currentTarget.value)} />
        <OneUITextField autoComplete="name" label="Display name (optional)" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} />
        <PasswordField inputRef={passwordRef} autoComplete="new-password" error={errorField === "password" ? error ?? undefined : undefined} label="Password" name="password" value={password} onChange={setPassword} />
        <PasswordField inputRef={confirmationRef} autoComplete="new-password" error={errorField === "confirmation" ? error ?? undefined : undefined} label="Confirm password" name="password-confirmation" value={confirmation} onChange={setConfirmation} />
        <p className="auth-password-guidance">Use at least 12 characters. A passphrase with spaces is supported.</p>
        <FormError message={errorField ? null : error} />
        <OneUIButton variant="primary" type="submit" loading={pending} loadingLabel="Creating administrator" loadingText="Setting up…">
          Create administrator
        </OneUIButton>
      </form>
    </AuthLayout>
  );
}

const REMEMBERED_USERNAME_KEY = "smartglove.auth.rememberedUsername";

function readRememberedUsername(): string | null {
  try {
    const value = window.localStorage.getItem(REMEMBERED_USERNAME_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

function writeRememberedUsername(username: string | null): void {
  try {
    if (username) {
      window.localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
    } else {
      window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    }
  } catch {
    // Username persistence is optional; authentication must still work without storage.
  }
}

export function LoginScreen({
  bridge,
  dark,
  notice,
  onAuthenticated,
  onToggleTheme,
}: {
  bridge: BridgeClient;
  dark: boolean;
  notice?: string | null;
  onAuthenticated: (status: AuthStatus) => void;
  onToggleTheme: () => void;
}) {
  const [username, setUsername] = useState(() => readRememberedUsername() ?? "");
  const [rememberUsername, setRememberUsername] = useState(() => readRememberedUsername() !== null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      usernameRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const status = await bridge.login(username, password);
      writeRememberedUsername(rememberUsername ? username.trim() : null);
      onAuthenticated(status);
    } catch (failure) {
      setError(userFacingBridgeError(failure));
      usernameRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout cardClassName="auth-card--login" dark={dark} eyebrow="Local workspace" onToggleTheme={onToggleTheme} title="Sign in">
      <p className="auth-card__description">Use your local SmartGlove account to open the tools assigned to your role.</p>
      {notice ? <p className="auth-session-notice" role="alert">{notice}</p> : null}
      <form className="auth-form auth-form--login" onSubmit={submit} noValidate>
        <OneUITextField
          ref={usernameRef}
          className="auth-underline-field"
          autoComplete="username"
          invalid={!!error}
          label="Username"
          message={error ?? undefined}
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
        />
        <PasswordField
          autoComplete="current-password"
          label="Password"
          name="password"
          value={password}
          variant="underline"
          onChange={setPassword}
        />
        <OneUICheckboxRow
          className="auth-remember-row"
          checked={rememberUsername}
          label="Remember username"
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            setRememberUsername(checked);
            if (!checked) writeRememberedUsername(null);
          }}
        />
        <OneUIButton variant="primary" type="submit" loading={pending} loadingLabel="Signing in" loadingText="Authenticating…">
          Sign in
        </OneUIButton>
      </form>
    </AuthLayout>
  );
}

export function ChangePasswordForm({
  bridge,
  onAuthenticated,
  onCancel,
}: {
  bridge: BridgeClient;
  onAuthenticated: (status: AuthStatus) => void;
  onCancel?: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"current" | "new" | "confirmation" | null>(null);
  const [pending, setPending] = useState(false);
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrorField(null);
    if (newPassword.length < 12) {
      setError("New password must contain at least 12 characters.");
      setErrorField("new");
      newRef.current?.focus();
      return;
    }
    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      setErrorField("confirmation");
      confirmationRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      onAuthenticated(await bridge.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmation,
      }));
    } catch (failure) {
      setError(userFacingBridgeError(failure));
      setErrorField("current");
      currentRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form account-password-form" onSubmit={submit} noValidate>
      <PasswordField inputRef={currentRef} autoComplete="current-password" error={errorField === "current" ? error ?? undefined : undefined} label="Current password" name="current-password" value={currentPassword} onChange={setCurrentPassword} />
      <PasswordField inputRef={newRef} autoComplete="new-password" error={errorField === "new" ? error ?? undefined : undefined} label="New password" name="new-password" value={newPassword} onChange={setNewPassword} />
      <PasswordField inputRef={confirmationRef} autoComplete="new-password" error={errorField === "confirmation" ? error ?? undefined : undefined} label="Confirm new password" name="new-password-confirmation" value={confirmation} onChange={setConfirmation} />
      <FormError message={errorField ? null : error} />
      <div className="auth-form__actions">
        {onCancel ? <OneUIButton variant="quiet" onClick={onCancel}>Back</OneUIButton> : null}
        <OneUIButton variant="primary" type="submit" loading={pending} loadingLabel="Changing password" loadingText="Updating…">
          Change password
        </OneUIButton>
      </div>
    </form>
  );
}

export function ForcedPasswordChange({
  bridge,
  dark,
  onAuthenticated,
  onLogout,
  onToggleTheme,
  user,
}: {
  bridge: BridgeClient;
  dark: boolean;
  onAuthenticated: (status: AuthStatus) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  user: AuthUser;
}) {
  return (
    <AuthLayout dark={dark} eyebrow="Account protection" onToggleTheme={onToggleTheme} title="Replace temporary password">
      <p className="auth-card__description">
        Hello {user.display_name || user.username}. Set a private password before opening the tools assigned to your role.
      </p>
      <ChangePasswordForm bridge={bridge} onAuthenticated={onAuthenticated} />
      <OneUIButton className="auth-secondary-action" variant="quiet" onClick={onLogout}>Sign out</OneUIButton>
    </AuthLayout>
  );
}

export function ParticipantAccess({
  dark,
  onLogout,
  onToggleTheme,
  user,
}: {
  dark: boolean;
  onLogout: () => void;
  onToggleTheme: () => void;
  user: AuthUser;
}) {
  return (
    <AuthLayout dark={dark} eyebrow="Participant account" onToggleTheme={onToggleTheme} title="Limited access">
      <p className="auth-card__description">
        You are signed in. You can review your account and role here; data-collection tools remain available only to roles granted by an administrator.
      </p>
      <section className="participant-access-note" aria-labelledby="participant-next-actions">
        <h2 id="participant-next-actions">What can you do now?</h2>
        <ul>
          <li>Review your username and assigned role below.</li>
          <li>Sign out to switch accounts, or contact an administrator if you need a different role.</li>
        </ul>
      </section>
      <dl className="account-summary">
        <div><dt>Display name</dt><dd>{user.display_name || "Not set"}</dd></div>
        <div><dt>Username</dt><dd>{user.username}</dd></div>
        <div><dt>Role</dt><dd>{roleLabels[user.role]}</dd></div>
      </dl>
      <OneUIStatusIndicator label="Account access only" tone="neutral" size="medium" />
      <OneUIButton variant="primary" onClick={onLogout}>Sign out</OneUIButton>
    </AuthLayout>
  );
}

export function AccountSheet({
  bridge,
  onAuthenticated,
  onDismiss,
  onLogout,
  open,
  returnFocusRef,
  user,
}: {
  bridge: BridgeClient;
  onAuthenticated: (status: AuthStatus) => void;
  onDismiss: () => void;
  onLogout: () => void;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  user: AuthUser;
}) {
  const [changingPassword, setChangingPassword] = useState(false);
  useEffect(() => { if (!open) setChangingPassword(false); }, [open]);
  return (
    <OneUIInteractionPage
      className="account-interaction-page"
      eyebrow={changingPassword ? "Account" : "Local account"}
      id="account-panel"
      onDismiss={changingPassword ? () => setChangingPassword(false) : onDismiss}
      open={open}
      presentation="account"
      returnFocusRef={returnFocusRef}
      title={changingPassword ? "Change password" : "Account"}
    >
      {changingPassword ? (
        <ChangePasswordForm
          bridge={bridge}
          onCancel={() => setChangingPassword(false)}
          onAuthenticated={(status) => {
            setChangingPassword(false);
            onAuthenticated(status);
          }}
        />
      ) : (
        <div className="account-sheet__content">
          <dl className="account-summary">
            <div><dt>Display name</dt><dd>{user.display_name || "Not set"}</dd></div>
            <div><dt>Username</dt><dd>{user.username}</dd></div>
            <div><dt>Role</dt><dd>{roleLabels[user.role]}</dd></div>
            <div><dt>Status</dt><dd>{user.is_active ? "Active" : "Disabled"}</dd></div>
          </dl>
          <OneUIButton onClick={() => setChangingPassword(true)}>Change password</OneUIButton>
          <OneUIButton variant="danger-quiet" onClick={onLogout}>Sign out</OneUIButton>
        </div>
      )}
    </OneUIInteractionPage>
  );
}

export function AuthLoading({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  return (
    <main className="auth-screen" aria-busy="true">
      <header className="auth-screen__bar">
        <span>Dataset Studio</span>
        <AuthThemeButton dark={dark} onToggleTheme={onToggleTheme} />
      </header>
      <div className="auth-stage">
        <div className="auth-product-lockup" aria-hidden="true">
          <span className="auth-product-lockup__name">SmartGlove</span>
        </div>
        <OneUICard
          className="auth-card auth-card--loading"
          eyebrow="Local workspace"
          headingLevel={1}
          title="Opening your workspace"
          role="status"
        >
          <OneUIProgressIndicator label="Restoring sign-in session" size="large" />
          <p className="auth-card__description">Checking the local sign-in session on this device…</p>
        </OneUICard>
      </div>
    </main>
  );
}

export function AuthStartupError({ dark, message, onRetry, onToggleTheme }: {
  dark: boolean;
  message: string;
  onRetry: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <AuthLayout dark={dark} eyebrow="Startup unavailable" onToggleTheme={onToggleTheme} title="Local account service is not ready">
      <p className="auth-form-error" role="alert">{message}</p>
      <OneUIButton variant="primary" onClick={onRetry}>Try again</OneUIButton>
    </AuthLayout>
  );
}
