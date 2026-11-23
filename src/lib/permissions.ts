// What each staff role may do. Keep in step with public.has_permission() in the database,
// which is the real gate; this copy only decides what to show.
export type StaffRole = "super_admin" | "operations_manager" | "verification_officer" | "customer_support" | "finance_officer";

export const permissions = [
  "professionals.view", "professionals.verify", "workrequests.decide", "customers.view", "accounts.manage",
  "catalogue.manage", "bookings.view", "support.view", "analytics.view", "finance.view", "finance.manage", "staff.manage", "audit.view",
] as const;
export type Permission = (typeof permissions)[number];

const matrix: Record<Permission, StaffRole[]> = {
  "professionals.view": ["super_admin", "operations_manager", "verification_officer", "customer_support"],
  "professionals.verify": ["super_admin", "operations_manager", "verification_officer"],
  "workrequests.decide": ["super_admin", "operations_manager", "verification_officer"],
  "customers.view": ["super_admin", "operations_manager", "customer_support"],
  "accounts.manage": ["super_admin", "operations_manager"],
  "catalogue.manage": ["super_admin", "operations_manager"],
  "bookings.view": ["super_admin", "operations_manager", "customer_support"],
  "support.view": ["super_admin", "operations_manager", "customer_support"],
  "analytics.view": ["super_admin", "operations_manager", "finance_officer"],
  "finance.view": ["super_admin", "finance_officer"],
  "finance.manage": ["super_admin", "finance_officer"],
  "staff.manage": ["super_admin"],
  "audit.view": ["super_admin"],
};

export const can = (role: StaffRole | null | undefined, permission: Permission) => !!role && matrix[permission].includes(role);
export const permissionsOf = (role: StaffRole | null | undefined): Permission[] => permissions.filter((p) => can(role, p));

export const staffRoles: { value: StaffRole; label: string; text: string }[] = [
  { value: "super_admin", label: "Super Administrator", text: "Everything, including staff roles and the audit log." },
  { value: "operations_manager", label: "Operations Manager", text: "Customers, professionals, requests, bookings, categories and areas." },
  { value: "verification_officer", label: "Verification Officer", text: "Review professional documents, verify professionals and decide work requests." },
  { value: "customer_support", label: "Customer Support", text: "View customers and professionals, bookings, messages and complaints." },
  { value: "finance_officer", label: "Finance Officer", text: "Payments, commissions, refunds and reports." },
];
export const roleLabel = (r: string | null | undefined) => staffRoles.find((x) => x.value === r)?.label ?? "Staff";
