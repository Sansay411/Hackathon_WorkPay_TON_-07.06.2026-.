export const connectPackages = [
  { id: "pkg_10", connects: 10, priceTon: 1, priceStars: 50, label: "Starter" },
  { id: "pkg_30", connects: 30, priceTon: 2.5, priceStars: 120, label: "Pro" },
  { id: "pkg_100", connects: 100, priceTon: 7, priceStars: 350, label: "Studio" }
] as const;

export type ConnectPackageId = (typeof connectPackages)[number]["id"];
export type ConnectPackage = (typeof connectPackages)[number];

export function getConnectPackage(id: string): ConnectPackage | null {
  return connectPackages.find((item) => item.id === id) ?? null;
}
