import { getDemoEvaluationById } from "@/actions/demo-evaluations";
import { EvaluationForm } from "@/components/features/demo-evaluations/evaluation-form";
import type { DemoEvaluation } from "@/types";

export default async function EditDemoEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = await getDemoEvaluationById(id);
  return <EvaluationForm evaluation={evaluation as DemoEvaluation} />;
}
