import nodemailer from "nodemailer";

export class EmailServices {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransport();
  }

  private createTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `PODCAST APP <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
      });
      return {
        success: true,
        message: info.messageId,
      };
    } catch (error) {
      console.error("Error sending email: ", error);
      return {
        success: false,
        message: "Error sending email",
      };
    }
  }

  async SendMeetingInvite(
    to: string[],
    from: string,
    meetingTitle: string,
    meetingLink: string,
    scheduledAt: string,
    inviteCode: string,
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #151515; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: #252525; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎙️ Meeting Invitation</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${from}</strong> has invited you to join a meeting:</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Meeting Title:</span> ${meetingTitle}
              </div>
              <div class="detail-row">
                <span class="label">Scheduled for:</span> ${scheduledAt}
              </div>
              <div class="detail-row">
                <span class="label">Host:</span> ${from}
              </div>
            </div>

            <p style="margin-top: 25px;">Use this code to join the meeting:</p>
            <div class="code-box">${inviteCode}</div>

            <p style="text-align: center;">
              <a href="${meetingLink}" class="button">Join Meeting</a>
            </p>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              To join manually, click "Join Public Meeting" on the home page and enter the code above.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Podcast App</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const promises = to.map((email) =>
      this.sendMail(email, `Meeting Invitation: ${meetingTitle}`, html),
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === "fulfilled").length;

    return {
      success: successful > 0,
      message: `Sent ${successful}/${to.length} invitation emails`,
      totalSent: successful,
      totalFailed: to.length - successful,
    };
  }

  async SendMeetingRemainder(
    to: string[],
    meetingLink: string,
    scheduledAt: string,
  ) {
    const html = `
            <h1>Meeting Reminder</h1>
            <p>Hello,</p>
            <p>This is a reminder for your upcoming meeting scheduled at ${scheduledAt}.</p>
            <p>Click <a href="${meetingLink}">here</a> to join the meeting.</p>
            <p>Best regards,<br/>Podcast App Team</p>
        `;

    return this.sendMail(to.join(","), "Meeting Reminder", html);
  }
}
