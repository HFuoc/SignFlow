import { useEffect, useRef, useState } from "react";
import { type BridgeClient, type RecognitionReference, userFacingBridgeError } from "./api";
import { OneUIButton, OneUISelectField, OneUIStateMessage } from "./one-ui";

/** Viewing a reference never changes the camera or the recognition input. */
export function ReferenceVideo({ bridge, providerId = "visign-ridge-25" }: { bridge: BridgeClient; providerId?: string }) {
  const landmarks = providerId === "vsl-gh-tcn-25";
  const [references, setReferences] = useState<RecognitionReference[]>([]);
  const [selected, setSelected] = useState("");
  const [media, setMedia] = useState<{ id: string; url: string } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [speed, setSpeed] = useState("1");
  const [ready, setReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const reference = references.find(item => item.reference_id === selected);
  const src = media?.id === selected ? media.url : undefined;

  useEffect(() => {
    const abort = new AbortController();
    setLoadingCatalog(true); setError("");
    void bridge.recognitionReferences(abort.signal, providerId).then(data => {
      if (abort.signal.aborted) return;
      setReferences(data.references);
      setSelected(previous => data.references.some(item => item.reference_id === previous) ? previous : data.references[0]?.reference_id ?? "");
    }).catch(cause => { if (!abort.signal.aborted) setError(userFacingBridgeError(cause)); })
      .finally(() => { if (!abort.signal.aborted) setLoadingCatalog(false); });
    return () => abort.abort();
  }, [bridge, providerId, retry]);

  useEffect(() => {
    const abort = new AbortController();
    const player = video.current;
    let objectUrl: string | undefined;
    setMedia(null); setReady(false);
    if (reference?.available && !loadingCatalog) {
      setError("");
      void bridge.recognitionReferenceMedia(reference.reference_id, abort.signal).then(blob => {
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setMedia({ id: reference.reference_id, url: objectUrl });
      }).catch(cause => { if (!abort.signal.aborted) setError(userFacingBridgeError(cause)); });
    }
    return () => {
      abort.abort();
      player?.pause();
      player?.removeAttribute("src");
      player?.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bridge, reference, loadingCatalog, retry]);

  useEffect(() => {
    const pause = () => video.current?.pause();
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pause);
    };
  }, []);

  async function replay() {
    const player = video.current;
    if (!player || !src || !ready) return;
    player.currentTime = 0;
    try { await player.play(); }
    catch { if (video.current === player && player.getAttribute("src") === src) setError("Playback could not start. Try the video's play control."); }
  }
  const unavailable = !loadingCatalog && (!references.length || reference?.available === false);
  return <section className="reference-video studio-form" aria-label={landmarks ? "Landmark replay" : "Reference video"}>
    <h3>{landmarks ? "Landmark replay" : "Reference video"}</h3>
    {landmarks && <p className="studio-note">Movement reconstructed from the training landmarks, with enlarged hand views. This is not an original human video or verified sign-language instruction. Use slow playback to inspect the recorded movement.</p>}
    <OneUISelectField label="Reference sign" value={selected} disabled={loadingCatalog || !references.length}
      onChange={event => {
        if (event.target.value === selected) return;
        video.current?.pause(); setSelected(event.target.value); setError(""); setReady(false);
      }}>
      {!references.length && <option value="">{loadingCatalog ? "Loading signs…" : "No references available"}</option>}
      {references.map(item => <option key={item.reference_id} value={item.reference_id}>{item.display_name}{item.available ? "" : " · unavailable"}</option>)}
    </OneUISelectField>
    <video ref={video} src={src} controls muted playsInline preload="auto" className="reference-video__player"
      aria-label={`${landmarks ? "Landmark replay" : "Reference video"}: ${reference?.display_name ?? "loading"}`}
      onLoadedMetadata={() => { if (video.current) video.current.playbackRate = Number(speed); }}
      onLoadedData={() => setReady(true)} onError={() => { if (src) { setReady(false); setError("This reference video could not be played. Retry to load it again."); } }} />
    <div className="studio-actions">
      <OneUIButton onClick={() => void replay()} disabled={!ready || !src || loadingCatalog}>Replay reference</OneUIButton>
      <OneUISelectField label="Playback speed" value={speed} onChange={event => {
        setSpeed(event.target.value); if (video.current) video.current.playbackRate = Number(event.target.value);
      }}><option value="1">1× · Normal</option><option value="0.5">0.5× · Slow</option></OneUISelectField>
    </div>
    {!error && !unavailable && !ready && <p role="status" className="studio-note">Loading reference…</p>}
    {(error || unavailable) && <>
      <OneUIStateMessage title="Reference unavailable" description={error || "The local reference preview is missing. You can still use the camera."} tone="error" />
      <OneUIButton variant="quiet" onClick={() => setRetry(value => value + 1)}>Retry reference</OneUIButton>
    </>}
    <p className="studio-note">{landmarks ? "Source front view · not mirrored. Blue: left hand; orange: right hand. Labels and original timing have not been independently reviewed. Human reference videos are still needed to verify the signs." : "Source example · not mirrored. Labels have not been independently reviewed. Select a sign to watch, then try it on camera."}</p>
  </section>;
}
