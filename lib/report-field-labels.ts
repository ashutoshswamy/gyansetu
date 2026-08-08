// Shared label maps for rendering tour_reports full detail — used by the admin
// tour-reports list and the core-member volunteer detail page so both stay in sync.
export const TOUR_REPORT_OBSERVATION_FIELDS: { key: string; label: string }[] = [
  { key: "unique_features", label: "Unique Features of the Region" },
  { key: "best_practices", label: "Best Practices Observed" },
  { key: "cultural_observations", label: "Cultural Observations" },
  { key: "challenges_faced", label: "Challenges Faced During the Visit" },
  { key: "suggestions_future_teams", label: "Suggestions for Future Teams" },
  { key: "important_contacts", label: "Important Local Contacts or Resources" },
  { key: "places_worth_visiting", label: "Places Worth Visiting" },
];

export const TOUR_REPORT_LOGISTICS_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  food: "Food",
  local_transport: "Local Transport",
  coordination_communication: "Coordination & Communication",
  safety_security: "Safety & Security",
  overall_experience: "Overall Experience",
};
