import { useRef, useState, type FormEvent } from "react";
import { BridgeClient, userFacingBridgeError, type AuthUser, type ProfileUpdate } from "./api";
import avatarUrl from "./assets/one-ui/figma/account-avatar.png";
import { OneUIButton, OneUITextField } from "./one-ui";

export function AccountProfileEditor({ bridge, user, onSaved, onCancel }: {
  bridge: BridgeClient; user: AuthUser; onSaved: (user: AuthUser) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProfileUpdate>({ display_name: user.display_name,
    full_name: user.full_name, contact_email: user.contact_email,
    organization: user.organization, avatar_data_url: user.avatar_data_url });
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileVersion = useRef(0);
  function setField(field: keyof ProfileUpdate, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }));
  }
  async function chooseAvatar(file?: File) {
    if (!file) return;
    const version = ++fileVersion.current;
    setError(null);
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG or JPEG image no larger than 2 MB."); return;
    }
    setReading(true);
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = url; await image.decode();
      if (image.width > 4096 || image.height > 4096 || image.width * image.height > 8_388_608) {
        throw new Error("dimensions");
      }
      if (version === fileVersion.current) setDraft(value => ({ ...value, avatar_data_url: url }));
    } catch { if (version === fileVersion.current) setError("Could not read this image. Choose a smaller PNG or JPEG."); }
    finally { if (version === fileVersion.current) setReading(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (pending || reading) return;
    setPending(true); setError(null);
    try { onSaved((await bridge.updateProfile(draft)).user); }
    catch (error) { setError(userFacingBridgeError(error)); }
    finally { setPending(false); }
  }
  return <form className="profile-editor auth-form" onSubmit={event => void save(event)} aria-busy={pending || reading}>
    <div className="profile-editor__avatar-row">
      <img src={draft.avatar_data_url || avatarUrl} data-custom={!!draft.avatar_data_url} alt="Avatar preview" width="80" height="80" />
      <div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={event => {
          void chooseAvatar(event.currentTarget.files?.[0]); event.currentTarget.value = "";
        }} />
        <OneUIButton variant="secondary" disabled={pending || reading} onClick={() => fileRef.current?.click()}>Choose avatar</OneUIButton>
        {draft.avatar_data_url && <OneUIButton variant="quiet" disabled={pending || reading} onClick={() => setDraft(value => ({ ...value, avatar_data_url: null }))}>Remove avatar</OneUIButton>}
        <p className="account-form-note">PNG or JPEG · up to 2 MB · cropped to a square</p>
      </div>
    </div>
    <OneUITextField autoFocus label="Display name" autoComplete="nickname" maxLength={100} value={draft.display_name || ""} disabled={pending} onChange={e => setField("display_name", e.currentTarget.value)} />
    <OneUITextField label="Full name" autoComplete="name" maxLength={150} value={draft.full_name || ""} disabled={pending} onChange={e => setField("full_name", e.currentTarget.value)} />
    <OneUITextField label="Contact email" type="email" autoComplete="email" maxLength={254} value={draft.contact_email || ""} disabled={pending} onChange={e => setField("contact_email", e.currentTarget.value)} />
    <p className="account-form-note">Contact information only. Sign in with your username; this email is not used for password recovery.</p>
    <OneUITextField label="Organization / team" autoComplete="organization" maxLength={150} value={draft.organization || ""} disabled={pending} onChange={e => setField("organization", e.currentTarget.value)} />
    {error && <p className="auth-form-error" role="alert">{error}</p>}
    <div className="profile-editor__actions">
      <OneUIButton variant="secondary" disabled={pending} onClick={onCancel}>Cancel</OneUIButton>
      <OneUIButton variant="primary" type="submit" loading={pending} disabled={reading} loadingLabel="Saving profile">Save profile</OneUIButton>
    </div>
  </form>;
}
