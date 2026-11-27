interface WorkspaceInviteEmailParams {
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  inviteUrl: string;
  role?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates a responsive, Linear-inspired HTML + plain-text workspace invitation email.
 */
export function buildWorkspaceInviteEmail({
  workspaceName,
  workspaceSlug,
  inviterName,
  inviterEmail,
  inviteeEmail,
  inviteUrl,
  role = "Member",
}: WorkspaceInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const safeWorkspace = escapeHtml(workspaceName);
  const safeSlug = escapeHtml(workspaceSlug);
  const safeInviterName = escapeHtml(inviterName);
  const safeInviterEmail = escapeHtml(inviterEmail);
  const safeInviteeEmail = escapeHtml(inviteeEmail);
  const safeRole = escapeHtml(role);
  const safeUrl = escapeHtml(inviteUrl);
  const workspaceInitial = escapeHtml(
    workspaceName.trim().charAt(0).toUpperCase() || "S"
  );

  const subject = `${inviterName} invited you to join ${workspaceName} on SprintSync`;

  const text = [
    `${inviterName} (${inviterEmail}) invited you to join the ${workspaceName} workspace on SprintSync as a ${role}.`,
    "",
    `Accept invitation: ${inviteUrl}`,
    "",
    `Workspace URL: sprintsync.app/${workspaceSlug}`,
    `Invited email: ${inviteeEmail}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#08090a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f7f8f8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#08090a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#0f1011;border:1px solid #232528;border-radius:10px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #1d1f22;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:28px;height:28px;background-color:#5e6ad2;border-radius:6px;text-align:center;vertical-align:middle;font-size:13px;font-weight:600;color:#ffffff;">
                      ${workspaceInitial}
                    </td>
                    <td style="padding-left:10px;font-size:14px;font-weight:600;color:#f7f8f8;letter-spacing:-0.01em;">
                      SprintSync
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.35;font-weight:600;color:#f7f8f8;letter-spacing:-0.02em;">
                  Join ${safeWorkspace} on SprintSync
                </h1>

                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#9ba1a6;">
                  <strong style="color:#f7f8f8;font-weight:500;">${safeInviterName}</strong>
                  (<a href="mailto:${safeInviterEmail}" style="color:#9ba1a6;text-decoration:none;">${safeInviterEmail}</a>)
                  has invited you to collaborate in the
                  <strong style="color:#f7f8f8;font-weight:500;">${safeWorkspace}</strong>
                  workspace.
                </p>

                <!-- Workspace Summary Box -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#151618;border:1px solid #232528;border-radius:8px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="font-size:12px;color:#6f767e;padding-bottom:6px;">Workspace</td>
                          <td align="right" style="font-size:12px;color:#f7f8f8;font-weight:500;padding-bottom:6px;">${safeWorkspace}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px;color:#6f767e;padding-bottom:6px;">URL</td>
                          <td align="right" style="font-size:12px;color:#9ba1a6;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding-bottom:6px;">sprintsync.app/${safeSlug}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px;color:#6f767e;">Role</td>
                          <td align="right" style="font-size:12px;color:#d0d6e0;">${safeRole}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Primary CTA -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="border-radius:6px;background-color:#5e6ad2;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;">
                        Accept invitation &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#6f767e;">
                  Or copy and paste this link into your browser:<br />
                  <a href="${safeUrl}" style="color:#828fff;text-decoration:underline;word-break:break-all;">${safeUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 32px;background-color:#0b0c0d;border-top:1px solid #1d1f22;font-size:11px;line-height:1.5;color:#62666d;">
                This invitation was sent to <span style="color:#8a8f98;">${safeInviteeEmail}</span>.
                If you weren&apos;t expecting this email, you can safely ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
