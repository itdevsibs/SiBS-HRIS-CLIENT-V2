import { useSearchParams } from "react-router-dom";

export default function FinalInterviewForms() {
  const [searchParams] = useSearchParams();

  const candidateId = searchParams.get("candidateId");
  const candidateApplicationId = searchParams.get("candidateApplicationId");

  return (
    <div>
      <p>Candidate ID: {candidateId}</p>
      <p>Application ID: {candidateApplicationId}</p>
    </div>
  );
}
