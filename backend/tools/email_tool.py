# tools/hitl.py
import os
from langchain.tools import tool
from langgraph.types import interrupt
from tools.email import send_email

TO_ADDR = os.getenv("AAYUSH_EMAIL")

# tools/email.py
import os
import smtplib
from email.message import EmailMessage

def send_email(to_addr: str, subject: str, body: str, cc: str | None = None):
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd  = os.getenv("SMTP_PASS")

    if not (user and pwd and to_addr):
        raise RuntimeError("Email not configured: set SMTP_USER, SMTP_PASS, and target address.")

    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = to_addr
    if cc and cc.lower() != "skip":
        msg["Cc"] = cc
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(host, port) as s:
        s.starttls()
        s.login(user, pwd)
        s.send_message(msg)


@tool("offer_email", return_direct=False)
def offer_email(user_question: str) -> str:
    """
    Offer to escalate by email if the agent couldn't find a confident answer.
    1) Ask user consent
    2) Ask for CC email (optional)
    3) Send email to Aayushmaan with the question
    """
    # 1) Consent
    consent = interrupt(
        "I couldn’t find a confident answer via my knowledge base or the web.\n"
        "Do you want me to email this question to Aayushmaan for a reply? (yes/no)"
    )
    if str(consent).strip().lower() not in ("yes", "y"):
        return "Okay, I won’t send an email."

    # 2) Optional CC
    cc_email = interrupt(
        "Optional: What’s your email to CC on the message? "
        "Reply with your address or 'skip'."
    )

    # 3) Send
    if not TO_ADDR:
        return "Email not configured on server (missing AAYUSH_EMAIL)."

    subject = "Question escalated by the agent"
    body = (
        "Hi Aayushmaan,\n\n"
        "The agent could not confidently answer this question:\n\n"
        f"{user_question}\n\n"
        "Please reply to this thread. The user will be CC’d if they provided an address.\n\n"
        "— Your Agent"
    )

    try:
        cc_val = None if not cc_email or str(cc_email).strip().lower() == "skip" else str(cc_email).strip()
        send_email(TO_ADDR, subject, body, cc=cc_val)
        return "Email sent to Aayushmaan. I’ll keep an eye out for the reply."
    except Exception as e:
        return f"Failed to send email: {e}"
