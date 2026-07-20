import type { ReactNode } from "react";

import { AdminToaster, ToastFromQuery } from "./toast-admin-client";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminToaster />
      <ToastFromQuery />
      {children}
    </>
  );
}


