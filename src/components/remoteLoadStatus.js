export default function RemoteLoadStatus({ state }) {
  return <div className="rounded-lg border p-5 text-sm" role={state.error ? "alert" : "status"}>
    <p>{state.error || "Loading…"}</p>
    {state.error && <button type="button" className="mt-3 text-brand underline" onClick={state.retry}>Retry</button>}
  </div>;
}
