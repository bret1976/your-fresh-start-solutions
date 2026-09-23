import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Fresh Start Solutions LLC | Home Page" },
      {
        name: "description",
        content:
          "Take a look at our Home page. Your Fresh Start Solutions LLC is a full service tax, accounting and business consulting firm located in Camden, NJ.",
      },
    ],
  }),
  component: function Home() {
    return (
      <SiteShell variant="home">
        <HomePage />
      </SiteShell>
    );
  },
});
