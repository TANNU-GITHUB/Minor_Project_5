import { redirect } from "@tanstack/react-router";
import { getLessons, UserSession } from "@/lib/api";

/** Logged-in users with a finished curriculum can access the app. */
export async function requireAppAccess() {
  if (!UserSession.isLoggedIn()) {
    throw redirect({ to: "/login" });
  }

  if (UserSession.isOnboardingComplete()) {
    return;
  }

  try {
    const userId = UserSession.getId();
    const hasDna = !!UserSession.getDNA();
    const lessons = await getLessons(userId);
    if (hasDna && lessons.length > 0) {
      UserSession.setOnboardingComplete(true);
      return;
    }
  } catch {
    /* fall through to onboarding */
  }

  throw redirect({ to: "/onboarding" });
}

/** Login/signup pages: send finished users to dashboard. */
export async function redirectIfOnboarded() {
  if (!UserSession.isLoggedIn()) return;

  if (UserSession.isOnboardingComplete()) {
    throw redirect({ to: "/dashboard" });
  }

  try {
    const lessons = await getLessons(UserSession.getId());
    if (lessons.length > 0 && UserSession.getDNA()) {
      UserSession.setOnboardingComplete(true);
      throw redirect({ to: "/dashboard" });
    }
  } catch {
    /* stay on auth page */
  }
}
