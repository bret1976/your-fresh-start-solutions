import { useMemo } from "react";
import { TextLink } from "@/components/SiteShell";
import { searchSite } from "@/lib/tools/search";

export function SearchResults({ query }: { query: string }) {
  const hits = useMemo(() => searchSite(query), [query]);
  if (!query.trim()) {
    return <p className="search-note">Search the pages on this site. Try payroll, newsletter, or Camden.</p>;
  }
  return (
    <div className="search-results">
      <p className="search-note">
        {hits.length} result{hits.length === 1 ? "" : "s"} for “{query}”
      </p>
      {hits.length === 0 ? <p>Nothing on this site matched. Try a shorter word.</p> : null}
      <ul>
        {hits.map((hit) => (
          <li key={hit.href}>
            <TextLink href={hit.href}>{hit.title}</TextLink>
            <p>{hit.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
