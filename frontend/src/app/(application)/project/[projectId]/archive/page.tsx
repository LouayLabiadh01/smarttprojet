/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/require-await */
import PageHeader from "~/components/layout/PageHeader";
import { columns } from "./columns"
import { DataTable } from "./data-table"

interface ArchiveItem {
  id: number;
  name: string;
  sprint_duration: number;
  sprint_start: string;
  description?: string;
  color?: string;
  is_archived: boolean;
  date_archivage?: string;
}

async function getData(): Promise<ArchiveItem[]> {
  const res = await fetch(`${process.env.DJANGO_API_URL}/api/archives/`, {
    next: { revalidate: 0 }, // or use: cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch archives");
  }

  const data = await res.json();
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    sprint_duration: item.sprint_duration,
    sprint_start: item.sprint_start,
    description: item.description,
    color: item.color,
  }));
}

export default async function DemoPage() {
  const data = await getData()

  return (
    <>
      <PageHeader breadCrumbs></PageHeader>
      <div className="container mx-auto">
        <DataTable columns={columns} data={data} />
      </div>
    </>
  )
}
