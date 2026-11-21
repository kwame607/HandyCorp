import { Card, NotConnected, PageHeader, SampleTag } from "./ui";

export default function ComingSoon({ title, text, items, columns }: { title: string; text: string; items: string[]; columns?: string[] }) {
  return (
    <>
      <PageHeader title={title} text={text} />
      <NotConnected>
        Nothing is connected here yet. {title} depends on customer and professional features that haven&apos;t been built (booking, quotations or payments), so there are no real records to show. This page will fill in as those features go live.
      </NotConnected>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="What you'll manage here">
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
            {items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </Card>
        {columns && (
          <Card title="Planned table" right={<SampleTag />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-[15px]">
                <thead><tr className="border-b border-line">{columns.map((c) => <th key={c} scope="col" className="px-2 py-2 text-sm font-semibold text-slate">{c}</th>)}</tr></thead>
                <tbody><tr><td colSpan={columns.length} className="px-2 py-6 text-center text-slate">No records yet</td></tr></tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
