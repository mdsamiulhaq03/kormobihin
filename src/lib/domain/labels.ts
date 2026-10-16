import type { InterviewOutcome, InterviewType, JobSource, Stage } from "@/generated/prisma/enums";

// Human-readable names for enum values. Pure data, safe to use in browser components.

export const STAGE_LABELS: Record<Stage, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  DECLINED: "Declined",
};

export const SOURCE_LABELS: Record<JobSource, string> = {
  BDJOBS: "Bdjobs",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook group",
  COMPANY_SITE: "Company website",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: "Phone screen",
  WRITTEN: "Written test",
  VIVA: "Viva",
  TECHNICAL: "Technical",
  HR: "HR",
  OTHER: "Other",
};

export const INTERVIEW_OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
};
