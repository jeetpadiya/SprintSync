import { buildWorkspaceInviteEmail } from "../utils/emailTemplates.js";

interface SendEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

interface SendWorkspaceInviteInput {
  to: string;
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
  inviterEmail: string;
  role?: string;
}

const RESEND_API_ENDPOINT = "https://api.resend.com/emails";

export async function sendWorkspaceInvitationEmail(
  input: SendWorkspaceInviteInput
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; skipping invitation email.");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
  const inviteUrl = `${clientUrl}/register?email=${encodeURIComponent(input.to)}`;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "SprintSync <onboarding@resend.dev>";

  const { subject, html, text } = buildWorkspaceInviteEmail({
    workspaceName: input.workspaceName,
    workspaceSlug: input.workspaceSlug,
    inviterName: input.inviterName,
    inviterEmail: input.inviterEmail,
    inviteeEmail: input.to,
    inviteUrl,
    role: input.role,
  });

  try {
    const response = await fetch(RESEND_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject,
        html,
        text,
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: string }
      | null;

    if (!response.ok) {
      const errorMsg =
        body?.message || body?.error || `Resend returned status ${response.status}`;
      console.error(`Failed to send invite email to ${input.to}:`, errorMsg);
      return { sent: false, error: errorMsg };
    }

    return { sent: true, id: body?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    console.error(`Resend request failed for ${input.to}:`, errorMsg);
    return { sent: false, error: errorMsg };
  }
}
