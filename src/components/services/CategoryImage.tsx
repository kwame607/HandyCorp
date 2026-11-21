import Image from "next/image";
import type { Category } from "@/data/services";
import CategoryIcon from "../CategoryIcon";

// Shows the category photograph when `photo` is set in the data file.
// Until real photos are added, a plain tonal panel with the category icon is
// shown so layout and proportions are already correct.
export default function CategoryImage({ category }: { category: Category }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-line bg-sand">
      {category.photo ? (
        <Image
          src={category.photo}
          alt={category.photoAlt}
          fill
          sizes="(min-width: 1152px) 560px, (min-width: 768px) 45vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-ink/25">
          <CategoryIcon slug={category.slug} width={72} height={72} strokeWidth={1.2} />
        </div>
      )}
    </div>
  );
}
