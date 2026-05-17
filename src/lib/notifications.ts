import { db } from "@/lib/db";

export async function notifyUser(input: {
  userId: string;
  title: string;
  message: string;
  href?: string;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      href: input.href,
    },
  });
}

export async function notifyManagerOfSubmission(
  managerId: string,
  employeeName: string,
  sheetId: string
) {
  return notifyUser({
    userId: managerId,
    title: "Goals pending approval",
    message: `${employeeName} submitted a goal sheet for your review.`,
    href: `/manager/approvals/${sheetId}`,
  });
}
