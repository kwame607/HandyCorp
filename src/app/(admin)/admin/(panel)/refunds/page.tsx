import ComingSoon from "@/components/admin/ComingSoon";

export const metadata = { title: "Refunds & Disputes | HandyCorp Admin" };

export default function Page() {
  return (
    <ComingSoon
      title={"Refunds & Disputes"}
      text={"Refund requests and how they were decided."}
      items={["Review refund requests next to the original transaction and evidence", "Approve or reject with a recorded reason, and track the refund", "Refunds are processed only by authorised staff and are fully audited"]}
      columns={["Refund", "Booking", "Amount", "Reason", "Status"]}
    />
  );
}
