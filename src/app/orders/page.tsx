import CustomerOrdersPage from "./CustomerOrderPage";

/**
 * NO Suspense wrapper here.
 *
 * The previous Suspense boundary was catching React suspensions triggered
 * by createPortal commits (OrderFullDetailModal) and flashing the
 * "Synchronizing Manifest..." fallback + remounting Navbar.
 *
 * CustomerOrdersPage is "use client" and handles its own loading states
 * internally (skeleton, error boundary). The only hook that required
 * Suspense was useSearchParams(), which is now isolated inside
 * PaymentSuccessModal with its own <Suspense fallback={null}> inline.
 *
 * Removing this outer boundary means no fallback UI can flash, and
 * Navbar never unmounts/remounts during modal transitions.
 */
export default function Page() {
  return <CustomerOrdersPage />;
}