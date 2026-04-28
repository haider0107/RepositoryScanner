import { getStore } from "@/app/lib/store";
import { NextResponse } from "next/server";

// GET /api/report
// Returns the current scan status and report (if done).
// Poll this after calling POST /api/scan.
//
// Response shapes:
//   { status: "idle" }
//   { status: "scanning", startedAt: string }
//   { status: "done", report: ScanReport }
//   { status: "error", error: string }

export async function GET() {
  const store = getStore();

  switch (store.status) {
    case "idle":
      return NextResponse.json({ status: "idle" });

    case "scanning":
      return NextResponse.json({
        status: "scanning",
        startedAt: store.startedAt,
      });

    case "done":
      return NextResponse.json({
        status: "done",
        report: store.report,
      });

    case "error":
      return NextResponse.json(
        { status: "error", error: store.error },
        { status: 500 },
      );

    default:
      return NextResponse.json({ status: "idle" });
  }
}
