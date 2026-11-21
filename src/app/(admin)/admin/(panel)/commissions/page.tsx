import ComingSoon from "@/components/admin/ComingSoon";

export const metadata = { title: "Commissions | HandyCorp Admin" };

export default function Page() {
  return (
    <ComingSoon
      title={"Commissions"}
      text={"What HandyCorp earns and what professionals are owed."}
      items={["Completed transaction value, platform commission, professional earnings and processing fees", "Settlement status for each payout", "The commission rate will be a setting you can change, not a fixed number in the code. Changes will need confirmation and be logged"]}
      columns={["Booking", "Job value", "Commission", "Professional earns", "Settlement"]}
    />
  );
}
