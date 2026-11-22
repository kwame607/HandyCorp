import ComingSoon from "@/components/admin/ComingSoon";
import Gate from "@/components/admin/Gate";

export const metadata = { title: "Reviews & Reports | HandyCorp Admin" };

export default function Page() {
  return (
    <Gate permission="support.view" next="/admin/reviews">
    <ComingSoon
      title={"Reviews & Reports"}
      text={"Ratings left by customers and issues people report."}
      items={["Reviews on completed jobs", "Reports against professionals or customers", "Moderation of reviews that break the rules"]}
      columns={["Review", "Customer", "Professional", "Rating", "Status"]}
    />
    </Gate>
  );
}
