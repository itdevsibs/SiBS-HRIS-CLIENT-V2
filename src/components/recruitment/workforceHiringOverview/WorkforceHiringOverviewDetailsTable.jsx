import { useWorkforceHiringView } from "../../../services/context/WorkforceHiringContextAdapter";
import {
  formatOverviewNumber,
  formatOverviewPercent,
} from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewHelpers";
import { DetailTd, DetailTh } from "./shared/TableCells";

export default function WorkforceHiringOverviewDetailsTable() {
  const {
    detailTable: { detailRows, totals },
  } = useWorkforceHiringView();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-bold uppercase tracking-tight text-sibs-primary-90">
        Detailed Performance by Cluster / Account
      </h2>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1540px] table-fixed border-collapse">
          <thead>
            <tr>
              <DetailTh rowSpan={2}>Cluster</DetailTh>
              <DetailTh rowSpan={2}>Account</DetailTh>
              <DetailTh rowSpan={2}>
                Required
                <br />
                Headcount
              </DetailTh>
              <DetailTh rowSpan={2}>
                Actual
                <br />
                Headcount
              </DetailTh>
              <DetailTh rowSpan={2}>
                Buffer
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Absenteeism
                <br />
                (6 weeks)
              </DetailTh>
              <DetailTh rowSpan={2}>
                Absenteeism
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Attrition
                <br />
                (6 weeks)
              </DetailTh>
              <DetailTh rowSpan={2}>
                Attrition
                <br />%
              </DetailTh>
              <DetailTh rowSpan={2}>
                Net
                <br />
                Actual HC
              </DetailTh>
              <DetailTh rowSpan={2}>
                Hiring
                <br />
                Needed
              </DetailTh>
              <DetailTh colSpan={5}>Hiring Funnel Counts</DetailTh>
              <DetailTh colSpan={10}>Attrition Between Stages</DetailTh>
              <DetailTh rowSpan={2}>
                Hired
                <br />
                Count
              </DetailTh>
              <DetailTh rowSpan={2}>
                Hiring Rate
                <br />
                (Leads to JO)
              </DetailTh>
            </tr>
            <tr>
              <DetailTh>
                Accepted
                <br />
                JO
              </DetailTh>
              <DetailTh>
                NHO
                <br />
                Count
              </DetailTh>
              <DetailTh>
                FST
                <br />
                Count
              </DetailTh>
              <DetailTh>
                PST
                <br />
                Count
              </DetailTh>
              <DetailTh>
                Go
                <br />
                Live
              </DetailTh>
              <DetailTh>
                JO - NHO
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                NHO - FST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                FST - PST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                NHO - PST
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
              <DetailTh>
                PST - Go Live
                <br />
                Count
              </DetailTh>
              <DetailTh>%</DetailTh>
            </tr>
          </thead>

          <tbody>
            {[...detailRows, totals].map((row, index) => (
              <tr
                key={`${row.cluster}-${row.account || "total"}`}
                className={
                  index === detailRows.length ? "bg-slate-50 font-bold" : "bg-white"
                }
              >
                <DetailTd>{row.cluster}</DetailTd>
                <DetailTd>{row.account}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.requiredHeadcount)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.actualHeadcount)}</DetailTd>
                <DetailTd className="text-red-600">
                  {formatOverviewPercent(row.bufferPercentage)}
                </DetailTd>
                <DetailTd>{formatOverviewNumber(row.absenteeism)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.absenteeismPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.attrition)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.attritionPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.netActualHc)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.hiringNeeded)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.acceptedJo)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.nho)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.fst)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.pst)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.goLive)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.joNhoCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.joNhoPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.nhoFstCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.nhoFstPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.fstPstCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.fstPstPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.nhoPstCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.nhoPstPercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.pstGoLiveCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.pstGoLivePercentage)}</DetailTd>
                <DetailTd>{formatOverviewNumber(row.hiredCount)}</DetailTd>
                <DetailTd>{formatOverviewPercent(row.hiringRate)}</DetailTd>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
