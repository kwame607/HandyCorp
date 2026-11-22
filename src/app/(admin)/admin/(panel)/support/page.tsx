import ComingSoon from "@/components/admin/ComingSoon";
import Gate from "@/components/admin/Gate";

export const metadata = { title: "Messages & Support | HandyCorp Admin" };

export default function Page() {
  return (
    <Gate permission="support.view" next="/admin/support">
    <ComingSoon
      title={"Messages & Support"}
      text={"Complaints, disputes and the evidence behind them."}
      items={["Customer and professional complaints", "Disputed bookings with messages, evidence, inspection reports and transaction history", "Internal notes that customers and professionals never see", "Statuses: open, under investigation, awaiting customer response, awaiting professional response, resolved, closed, with a recorded resolution"]}
      columns={["Case", "Raised by", "Booking", "Status", "Opened"]}
    />
    </Gate>
  );
}
