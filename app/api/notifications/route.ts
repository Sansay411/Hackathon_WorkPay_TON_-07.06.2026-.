import { apiOk } from "@/lib/api/errors";

export async function GET() {
  return apiOk({
    notifications: [
      {
        id: "notification-demo",
        type: "job",
        title: "Job update",
        body: "Your job terms are clear enough to publish.",
        isRead: false
      }
    ]
  });
}
