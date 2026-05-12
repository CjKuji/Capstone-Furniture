import { Suspense } from "react";
import CustomerOrdersPage from "./CustomerOrderPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading orders...</div>}>
      <CustomerOrdersPage />
    </Suspense>
  );
}