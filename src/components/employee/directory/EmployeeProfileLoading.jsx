export default function EmployeeProfileLoading({ notFound = false }) {
  return (
    <div className="sibs-page-card-in sibs-card p-6 text-sm font-semibold text-[#667085]">
      {notFound ? "Profile not found." : "Loading employee profile..."}
    </div>
  );
}
