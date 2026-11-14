import { NextResponse } from "next/server";
import { getItem } from "@/lib/db-store";
import { mergeSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();
    if (!to || !subject || !body) return NextResponse.json({ ok: false, error: "to, subject, body required" }, { status: 400 });

    let host = process.env.SMTP_HOST;
    let port = Number(process.env.SMTP_PORT || 587);
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;
    let from = process.env.SMTP_FROM || user;
    let secure = port === 465;

    if (!host || !user || !pass) {
      try {
        const s = mergeSettings(await getItem("settings", "default"));
        if (s.email.smtpHost && s.email.smtpUser && s.email.smtpPass) {
          host = s.email.smtpHost;
          port = Number(s.email.smtpPort || 587);
          user = s.email.smtpUser;
          pass = s.email.smtpPass;
          from = s.email.fromEmail || s.email.fromName || user;
          secure = !!s.email.smtpSecure || port === 465;
        }
      } catch {}
    }

    if (!host || !user || !pass || !from) {
      return NextResponse.json({
        ok: false,
        configured: false,
        error: "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local to send real email.",
      }, { status: 400 });
    }

    // dynamic import so build doesn't require nodemailer unless configured
    let nodemailer: any;
    try {
      nodemailer = (await import("nodemailer")).default || (await import("nodemailer"));
    } catch {
      return NextResponse.json({ ok: false, configured: false, error: "nodemailer not installed. Run: npm i nodemailer" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    await transporter.sendMail({ from, to, subject, text: body });
    return NextResponse.json({ ok: true, configured: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
