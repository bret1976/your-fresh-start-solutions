import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { CalcLoader } from "@/components/CalcLoader";
import { ActivityPage } from "@/components/ActivityPage";
import { InnerPage } from "@/components/InnerPage";
import { ListDesk } from "@/components/ListDesk";
import { SiteShell } from "@/components/SiteShell";
import { getPage } from "@/lib/site";

export const Route = createFileRoute("/$")({
  loader: ({ location }) => {
    if (location.pathname === "/calcloader.php") {
      return { title: "Financial Calculator", description: "" };
    }
    const page = getPage(location.pathname, location.searchStr);
    return {
      title: page?.title || "Your Fresh Start Solutions LLC",
      description: page?.description || "",
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || "Your Fresh Start Solutions LLC" },
      ...(loaderData?.description
        ? [{ name: "description", content: loaderData.description }]
        : []),
    ],
  }),
  component: CatchAll,
});

function CatchAll() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  if (pathname === "/calcloader.php") {
    return <CalcLoader search={searchStr} />;
  }
  if (pathname === "/newsletter-list.php") {
    return (
      <SiteShell variant="internal">
        <div className="wrap page-layout">
          <ListDesk />
        </div>
      </SiteShell>
    );
  }
  if (pathname === "/activity.php") {
    return (
      <SiteShell variant="internal">
        <div className="wrap page-layout">
          <ActivityPage />
        </div>
      </SiteShell>
    );
  }
  return (
    <SiteShell variant="internal">
      <InnerPage pathname={pathname} search={searchStr} />
    </SiteShell>
  );
}
