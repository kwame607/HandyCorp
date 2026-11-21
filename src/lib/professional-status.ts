export const statusList = [
  { value: "submitted", label: "Registration submitted" },
  { value: "under_review", label: "Under review" },
  { value: "more_info_required", label: "More information required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const statusLabel = (v: string) => statusList.find((s) => s.value === v)?.label ?? v;
