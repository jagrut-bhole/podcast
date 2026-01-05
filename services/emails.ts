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
    meetingLink: string,
    scheduledAt: string,
    inviteCode: string,
  ) {
    const html = `
            <h1>You're Invited to a Meeting!</h1>
            <p>Hello,</p>
            <p>${from} has invited you to a meeting scheduled at ${scheduledAt}.</p>
            <p>Click <a href="${meetingLink}">here</a> to join the meeting.</p>
            <p>Your invite code is: <strong>${inviteCode}</strong></p>
            <p>Best regards,<br/>Podcast App Team</p>
        `;

    return this.sendMail(to.join(","), `Meeting Invitation from ${from}`, html);
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
