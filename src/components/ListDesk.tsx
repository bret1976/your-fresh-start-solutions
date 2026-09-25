import { useMemo, useState } from "react";
import {
  loadSubscribers,
  mergeSubscribers,
  parseSubscriberCsv,
  saveSubscribers,
  subscribersToCsv,
  type Subscriber,
  type SubscriberStatus,
} from "@/lib/tools/subscribers";

export function ListDesk() {
  const [rows, setRows] = useState<Subscriber[]>(() => loadSubscribers());
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [pasted, setPasted] = useState("");

  const counts = useMemo(() => {
    return {
      subscribed: rows.filter((row) => row.status === "subscribed").length,
      unsubscribed: rows.filter((row) => row.status === "unsubscribed").length,
      suppressed: rows.filter((row) => row.status === "suppressed").length,
    };
  }, [rows]);

  function commit(next: Subscriber[]) {
    setRows(next);
    saveSubscribers(next);
  }

  function add(status: SubscriberStatus = "subscribed") {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setNote("Enter a real email address.");
      return;
    }
    commit(mergeSubscribers(rows, [{ email: clean, name: name.trim(), status, source: "typed" }]));
    setEmail("");
    setName("");
    setNote(status === "subscribed" ? "Added on this computer." : "Recorded on this computer.");
  }

  function setStatus(address: string, status: SubscriberStatus) {
    commit(rows.map((row) => (row.email === address ? { ...row, status } : row)));
  }

  function takeText(text: string, source: string) {
    const incoming = parseSubscriberCsv(text);
    if (!incoming.length) {
      setNote("No email addresses were found. Use the CPA export, or paste one address per line.");
      return false;
    }
    const tagged = incoming.map((row) => ({ ...row, source }));
    commit(mergeSubscribers(rows, tagged));
    setNote(`Imported ${incoming.length} addresses onto this computer.`);
    return true;
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => takeText(String(reader.result || ""), "import");
    reader.readAsText(file);
  }

  function download() {
    const blob = new Blob([subscribersToCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "newsletter-list.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="page-copy desk">
      <h1>Newsletter list</h1>
      <p>
        The addresses are inside CPA’s email tool, not on the website. This page cannot see them. Download the export, then
        drop it here or paste it below. Do not send the file in email or chat.
      </p>
      <ol className="desk-steps">
        <li>Log into the Secure Firm Portal.</li>
        <li>Open the Email Marketing System.</li>
        <li>Hover over Contacts and choose Export Contacts.</li>
        <li>Check Email, First Name, Last Name, and status if it is offered. Choose all lists. Choose CSV. Click Export Contacts.</li>
      </ol>
      <p className="desk-counts">
        {counts.subscribed} subscribed · {counts.unsubscribed} unsubscribed · {counts.suppressed} suppressed
      </p>
      <div className="desk-add">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="off" />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </label>
        <button type="button" className="btn btn-green" onClick={() => add("subscribed")}>
          Add
        </button>
        <button type="button" className="btn btn-navy" onClick={() => add("unsubscribed")}>
          Add as unsubscribed
        </button>
      </div>
      <label className="desk-paste">
        Or paste the export here, one address per line
        <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={6} placeholder={"name@example.com\nname@example.com"} />
      </label>
      <div className="notice-actions">
        <button
          type="button"
          className="btn btn-green"
          onClick={() => {
            if (takeText(pasted, "pasted")) setPasted("");
          }}
        >
          Import pasted addresses
        </button>
        <label className="btn btn-navy">
          Import CSV
          <input
            className="hp"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" className="btn btn-green" onClick={download} disabled={!rows.length}>
          Download CSV
        </button>
      </div>
      {note ? <p>{note}</p> : null}
      {rows.length ? (
        <table className="desk-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.email}>
                <td>{row.email}</td>
                <td>{row.name}</td>
                <td>{row.status}</td>
                <td>
                  {row.status !== "subscribed" ? (
                    <button type="button" onClick={() => setStatus(row.email, "subscribed")}>
                      Resubscribe
                    </button>
                  ) : (
                    <button type="button" onClick={() => setStatus(row.email, "unsubscribed")}>
                      Unsubscribe
                    </button>
                  )}
                  {row.status !== "suppressed" ? (
                    <button type="button" onClick={() => setStatus(row.email, "suppressed")}>
                      Suppress
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No addresses yet. Import the CPA export, or add one.</p>
      )}
    </article>
  );
}
