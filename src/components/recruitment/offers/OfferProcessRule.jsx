export default function OfferProcessRule() {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
      <h3 className="text-sm font-bold text-sibs-primary-1">
        Offer Process Rule
      </h3>

      <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
        This page only displays candidates currently in the Offered stage from
        Candidate Pipeline. Approval updates are synced back to the pipeline.
        Contract email sending and candidate response actions remain in
        Candidate Pipeline.
      </p>
    </section>
  );
}
