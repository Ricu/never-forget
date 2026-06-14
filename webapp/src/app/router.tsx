import { Navigate, createBrowserRouter } from "react-router-dom"

import { AppShell } from "@/components/shell/app-shell"
import { CapturePage } from "@/features/capture/routes/capture-page"
import { MemoryOverviewPage } from "@/features/memory-overview/routes/memory-overview-page"
import { ReviewQueuePage } from "@/features/review-queue/routes/review-queue-page"
import { SessionsPage } from "@/features/sessions/routes/sessions-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/capture" />,
      },
      {
        path: "capture",
        element: <CapturePage />,
      },
      {
        path: "review-queue",
        element: <ReviewQueuePage />,
      },
      {
        path: "sessions",
        element: <SessionsPage />,
      },
      {
        path: "memory-overview",
        element: <MemoryOverviewPage />,
      },
    ],
  },
])
