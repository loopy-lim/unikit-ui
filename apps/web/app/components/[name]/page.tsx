import { notFound } from "next/navigation";

import { catalog, getCatalogItem } from "../../../components/showcase/catalog";

import { ComponentDoc } from "./component-doc";

export function generateStaticParams() {
  return catalog.map((item) => ({ name: item.name }));
}

export default async function ShowcaseComponentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  if (!getCatalogItem(name)) {
    notFound();
  }
  return <ComponentDoc name={name} />;
}
