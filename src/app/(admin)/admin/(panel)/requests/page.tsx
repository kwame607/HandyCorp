import ComingSoon from "@/components/admin/ComingSoon";
import Gate from "@/components/admin/Gate";

export const metadata = { title: "Service Requests | HandyCorp Admin" };

export default function Page() {
  return (
    <Gate permission="bookings.view" next="/admin/requests">
    <ComingSoon
      title={"Service Requests"}
      text={"Every request customers send to professionals."}
      items={["Search and filter requests by category, location, date and status", "Customer details, request description and uploaded images", "Invited professionals and the quotations received", "Statuses: open, awaiting professional response, quotations received, awaiting customer decision, converted to booking, cancelled, closed"]}
      columns={["Request", "Customer", "Category", "Location", "Status", "Date"]}
    />
    </Gate>
  );
}
