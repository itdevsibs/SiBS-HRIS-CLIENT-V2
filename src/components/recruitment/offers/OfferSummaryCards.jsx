import { Clock3, FileText, Send, ShieldCheck, UserCheck, UserX } from "lucide-react";
import StatCard from "./common/StatCard";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferSummaryCards() {
  const { stats } = useOffers();

  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-[#101828]">Offer Summary</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Offers" value={stats.total} icon={FileText} description="Offer records" />
        <StatCard title="For Review" value={stats.forReview} icon={Clock3} description="Needs approval" />
        <StatCard title="Approved" value={stats.approved} icon={ShieldCheck} description="Ready to send" valueClassName="text-emerald-600" />
        <StatCard title="Contract Sent" value={stats.contractSent} icon={Send} description="Awaiting response" />
        <StatCard title="Accepted" value={stats.accepted} icon={UserCheck} description={`${stats.acceptanceRate}% rate`} valueClassName="text-emerald-600" />
        <StatCard title="Declined" value={stats.declined} icon={UserX} description="With reasons" valueClassName="text-red-600" />
      </div>
    </section>
  );
}
