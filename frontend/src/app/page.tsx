import { HeatMap } from "@/components/heatmap";
import { HomeConnections } from "@/components/home-connections";
import { HomeNotification } from "@/components/home-notification";
import { HomeRecommendedMatch } from "@/components/home-recommended-match";
import { UserHomeCard } from "@/components/user-home-card";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      {/* USER PROFILE SECTION - Top */}
      <UserHomeCard />
      
      {/* ACTIVITY GRAPH - Below profile */}
      <HeatMap />
      
      {/* BOTTOM CARDS - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HomeConnections />
        <HomeRecommendedMatch />
        <HomeNotification />
      </div>
    </div>
  );
}
