import { HeatMap } from "@/components/heatmap";
import { HomeConnections } from "@/components/home-connections";
import { HomeNotification } from "@/components/home-notification";
import { HomeRecommendedMatch } from "@/components/home-recommended-match";
import { UserHomeCard } from "@/components/user-home-card";

export default function Home() {
  return (
    <div className="grid gap-6 p-6">
      {/* TOP ROW */}
      <div className="grid grid-cols-[280px_1fr] gap-6 p-6">
        <UserHomeCard />
        <HeatMap />
      </div>
      {/* BOTTOM ROW (50 / 50) */}
      <div className="grid grid-cols-3 gap-6 p-6">
        <HomeConnections />
        <HomeRecommendedMatch />
        <HomeNotification />
      </div>
    </div>
  );
}
