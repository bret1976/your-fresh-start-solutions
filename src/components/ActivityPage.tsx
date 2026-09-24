import { useEffect, useState } from "react";
import { listTraffic, type TrafficRow } from "@/lib/tools/traffic";

export function ActivityPage() {
  const [rows, setRows] = useState<TrafficRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let gone = false;
    void listTraffic()
      .then((data) => {
        if (!gone) setRows(data);
      })
      .catch(() => {
        if (!gone) setError("Activity could not be loaded.");
      });
    return () => {
      gone = true;
    };
  }, []);

  const total = rows?.reduce((sum, row) => sum + row.hits, 0) || 0;

  return (
    <article className="page-copy desk">
      <h1>Site activity</h1>
      <p>
        Page counts for this copy of the site, last 30 days. No names, emails, or addresses are stored. The old CPA Site
        Solutions statistics are a separate export and are not in this table.
      </p>
      {error ? <p>{error}</p> : null}
      {rows === null && !error ? <p>Loading.</p> : null}
      {rows ? <p className="desk-counts">{total} page views in this window.</p> : null}
      {rows && rows.length ? (
        <table className="desk-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Page</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.day}-${row.path}`}>
                <td>{row.day}</td>
                <td>{row.path}</td>
                <td>{row.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {rows && !rows.length ? <p>No views recorded yet. Open a few pages, then come back.</p> : null}
    </article>
  );
}
