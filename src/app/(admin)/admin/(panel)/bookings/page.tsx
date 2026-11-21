import ComingSoon from "@/components/admin/ComingSoon";

export const metadata = { title: "Bookings | HandyCorp Admin" };

export default function Page() {
  return (
    <ComingSoon
      title={"Bookings"}
      text={"Jobs that customers and professionals have agreed."}
      items={["Booking reference, customer, professional, service, location, agreed price and date", "Statuses: pending, quoted, accepted, confirmed, in progress, completed, cancelled, disputed", "Each booking keeps the agreed quotation and scope of work", "Administrators cannot silently change an agreed price. Any correction is recorded in the audit log"]}
      columns={["Reference", "Customer", "Professional", "Service", "Price", "Status"]}
    />
  );
}
