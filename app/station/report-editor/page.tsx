"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/auth-context";
import { ReportEditor } from "@/components/reports/editor/ReportEditor";
import "@/components/reports/report.css";
import "@/components/reports/editor/report-editor.css";

interface SessionUser {
  username: string;
  role: string;
}

function readSessionUser(): SessionUser | null {
  try {
    const stored = typeof window === "undefined" ? null : sessionStorage.getItem("currentUser");
    return stored ? (JSON.parse(stored) as SessionUser) : null;
  } catch {
    return null;
  }
}

// AuthContext restores the user in a mount effect, so `user` is still null on
// first render even for a valid session. Treating sessionStorage as the source
// of truth and reading it through useSyncExternalStore avoids both a false
// "Access Denied" and a server/client hydration mismatch (the server snapshot
// is null, matching the spinner the server prerenders).
//
// getSnapshot is memoized by identity so React does not see "store changed"
// on every render.
let cachedSessionUser: SessionUser | null = null;
let cachedSessionUserValid = false;

function noopSubscribe(): () => void {
  return () => {};
}

function getSessionSnapshot(): SessionUser | null {
  const fresh = readSessionUser();
  if (
    cachedSessionUserValid &&
    fresh &&
    cachedSessionUser &&
    fresh.username === cachedSessionUser.username &&
    fresh.role === cachedSessionUser.role
  ) {
    return cachedSessionUser;
  }
  cachedSessionUser = fresh;
  cachedSessionUserValid = true;
  return fresh;
}

function getSessionSnapshotServer(): SessionUser | null {
  return null;
}

export default function ReportEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const sessionUser = useSyncExternalStore(noopSubscribe, getSessionSnapshot, getSessionSnapshotServer);

  const effectiveUser = user ?? sessionUser;
  const authorized = !!effectiveUser && (effectiveUser.role === "admin" || effectiveUser.role === "station");

  const deniedRef = useRef(false);
  useEffect(() => {
    if (authorized) {
      deniedRef.current = false;
      return;
    }
    if (deniedRef.current) return;
    deniedRef.current = true;
    Swal.fire({ icon: "error", title: "Access Denied", text: "You must be logged in with Admin or Station role.", confirmButtonText: "OK" }).then((result) => {
      if (!result.isDismissed) router.push("/health-screening");
    });
  }, [authorized, router]);

  if (!authorized) {
    return (
      <div className="dyp-ed-app" style={{ alignItems: "center", justifyContent: "center" }}>
        <span className="dyp-ed-spinner" />
      </div>
    );
  }

  return <ReportEditor />;
}