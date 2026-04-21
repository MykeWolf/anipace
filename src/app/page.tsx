import HeroSection from "@/components/sections/HeroSection";
import HowItWorks from "@/components/sections/HowItWorks";
import FounderStory from "@/components/sections/FounderStory";
import PlannerSection from "@/components/sections/PlannerSection";
import SavedPlansSection from "@/components/sections/SavedPlansSection";
import SiteFooter from "@/components/sections/SiteFooter";
import EmailSignup from "@/components/sections/EmailSignup";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FounderStory />
      <PlannerSection />
      <SavedPlansSection />
      <div className="px-6 py-10 border-t border-border">
        <EmailSignup />
      </div>
      <SiteFooter />
    </main>
  );
}
