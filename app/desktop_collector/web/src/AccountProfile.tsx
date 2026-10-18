import type { ReactNode } from "react";
import type { AuthUser } from "./api";
import avatarUrl from "./assets/one-ui/figma/account-avatar.png";
import { OneUIStatusIndicator } from "./one-ui/controls";
import "./account-profile.css";

/** Default identity asset: One UI 827:4723. No invented photo or account data. */
export function AccountProfile({ user, roleLabel, action }: {
  user: AuthUser; roleLabel: string; action?: ReactNode;
}) {
  return <section className="account-profile" aria-label="Your profile">
    <img className="account-profile__avatar" data-custom={!!user.avatar_data_url} src={user.avatar_data_url || avatarUrl} width="96" height="96" alt="" />
    <div className="account-profile__identity">
      <h2>{user.display_name || user.username}</h2>
      <p>@{user.username}</p>
      <div className="account-profile__status">
        <span>{roleLabel}</span>
        <OneUIStatusIndicator emphasis="quiet" label={user.is_active ? "Active" : "Disabled"} tone={user.is_active ? "positive" : "negative"} />
      </div>
    </div>
    {action && <div className="account-profile__action">{action}</div>}
    <dl className="account-profile__details">
      <div><dt>Full name</dt><dd>{user.full_name || "Not set"}</dd></div>
      <div><dt>Contact email</dt><dd>{user.contact_email || "Not set"}</dd></div>
      <div><dt>Organization / team</dt><dd>{user.organization || "Not set"}</dd></div>
      <div><dt>Joined</dt><dd>{new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</dd></div>
      <div><dt>Last sign-in</dt><dd>{user.last_login_at ? new Date(user.last_login_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "No sign-in recorded"}</dd></div>
      <div><dt>Password</dt><dd>{user.must_change_password ? "Change required" : "No change required"}</dd></div>
    </dl>
  </section>;
}
