import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { email, code, role, customTitle, organizationName, invitedBy } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    
    // Format role nicely for display
    const formattedRole = role === "OWNER" ? "Project Manager (Owner)" 
      : role === "PM" ? "Project Manager"
      : role === "DEVELOPER" ? "Developer"
      : role === "CLIENT" ? "Client"
      : "Viewer"

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0F172A; margin-bottom: 16px;">Workspace Invitation</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">
          Hello,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">
          <strong>${invitedBy || "An administrator"}</strong> has invited you to join the workspace <strong>${organizationName || "projectBeacon"}</strong> as a <strong>${customTitle || formattedRole}</strong>.
        </p>
        
        <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="color: #64748B; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; tracking-wider; font-weight: bold;">Your Invitation Code</p>
          <span style="font-family: monospace; font-size: 28px; font-weight: bold; color: #0F172A; letter-spacing: 2px;">${code}</span>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 20px;">
          To accept this invitation:
          <ol style="padding-left: 20px; margin-top: 8px;">
            <li>Go to the projectBeacon login page.</li>
            <li>Select "Log in as Team Member".</li>
            <li>Enter your email address: <strong>${email}</strong> and the code above.</li>
          </ol>
        </p>

        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 32px 0;" />
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message from projectBeacon. If you were not expecting this invite, please ignore this email.
        </p>
      </div>
    `

    if (!apiKey || apiKey === "re_123456789") {
      console.log("=========================================")
      console.log("RESEND_API_KEY is not configured or is default. Mocking email send:")
      console.log(`To: ${email}`)
      console.log(`Code: ${code}`)
      console.log(`Role: ${formattedRole} (${customTitle || "None"})`)
      console.log(`Workspace: ${organizationName}`)
      console.log("=========================================")
      
      return NextResponse.json({ 
        success: true, 
        message: "Email logged to server console (RESEND_API_KEY not configured)." 
      })
    }

    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [email],
      subject: `Invite to join ${organizationName || "projectBeacon"} Workspace`,
      html: htmlContent,
    })

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error sending invite email:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

