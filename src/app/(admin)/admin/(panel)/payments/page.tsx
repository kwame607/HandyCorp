import ComingSoon from "@/components/admin/ComingSoon";

export const metadata = { title: "Payments | HandyCorp Admin" };

export default function Page() {
  return (
    <ComingSoon
      title={"Payments"}
      text={"Money paid by customers."}
      items={["Transaction reference, customer, professional, booking, amount, method and date", "Statuses: pending, successful, failed, refunded, partially refunded", "Payment records are read-only. They can't be edited by hand, and every financial action is audited"]}
      columns={["Reference", "Customer", "Booking", "Amount", "Method", "Status"]}
    />
  );
}
