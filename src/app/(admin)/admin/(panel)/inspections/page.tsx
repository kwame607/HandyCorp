import ComingSoon from "@/components/admin/ComingSoon";
import Gate from "@/components/admin/Gate";

export const metadata = { title: "Inspections & Quotations | HandyCorp Admin" };

export default function Page() {
  return (
    <Gate permission="bookings.view" next="/admin/inspections">
    <ComingSoon
      title={"Inspections & Quotations"}
      text={"The inspection and quotation workflow."}
      items={["Inspection requests, proposed fees, customer approvals and payments", "Scheduled and completed inspections, and submitted inspection reports", "Quotations, and inspection credits applied to accepted quotations", "Credit rule: 100% of a paid inspection fee goes toward the job if the customer accepts a quotation from the same professional. Credits can't move to another professional", "Inspection fees and job payments stay separate financial records"]}
      columns={["Inspection", "Customer", "Professional", "Fee", "Credit applied", "Status"]}
    />
    </Gate>
  );
}
