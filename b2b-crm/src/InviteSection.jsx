import React, { useState } from "react";

export default function InviteSection({ user, profile }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const inviteLink = `${baseUrl}?ref=${user.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareViaText = () => {
    const msg = `Hey! I'd love to have you on my insurance team. Here's your personal invite link to join our platform: ${inviteLink}`;
    window.open(`sms:?body=${encodeURIComponent(msg)}`);
  };

  const shareViaEmail = () => {
    const subject = "Join My Insurance Team";
    const body = `Hi,\n\nI'd like to invite you to join my team on our insurance platform.\n\nClick this link to get started:\n${inviteLink}\n\nLooking forward to working with you!\n\n${profile?.full_name || "Your Director"}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Invite Your Team</h2>
          <p className="page-subtitle">Share your personal invite link to grow your team</p>
        </div>
      </div>

      <div className="invite-container">
        <div className="card invite-card">
          <div className="invite-hero">
            <div className="invite-icon">+</div>
            <h3 className="invite-heading">Your Personal Invite Link</h3>
            <p className="invite-desc">
              Anyone who signs up using your link will automatically be linked to your downline.
              Share it with prospects, referrals, or anyone interested in joining your team.
            </p>
          </div>

          <div className="invite-link-box">
            <div className="link-display">{inviteLink}</div>
            <button className={`btn ${copied ? "btn-success" : "btn-primary"} copy-btn`} onClick={copyLink}>
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="invite-actions">
            <button className="btn btn-outline" onClick={shareViaText}>
              Share via Text
            </button>
            <button className="btn btn-outline" onClick={shareViaEmail}>
              Share via Email
            </button>
          </div>
        </div>

        <div className="card how-it-works">
          <div className="card-header">
            <h3 className="card-title">How It Works</h3>
          </div>
          <div className="card-body">
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-info">
                  <h4>Share Your Link</h4>
                  <p>Copy your personal invite link and share it with prospects via text, email, or social media.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div className="step-info">
                  <h4>They Sign Up</h4>
                  <p>When they click your link and create an account, they are automatically added to your downline.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-info">
                  <h4>Build Your Team</h4>
                  <p>Track your recruits, monitor their progress, and earn overrides on their production.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div className="step-info">
                  <h4>Grow Together</h4>
                  <p>Your team's success is your success. Field train them, support them, and hit your goals together.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card referral-note">
          <div className="card-header"><h3 className="card-title">Referral Fees</h3></div>
          <div className="card-body">
            <p>For non-licensed contacts who refer clients, you can offer <strong>$200-$300 per converted client</strong> as a referral fee. This is a great way to grow your contact base and reward business owners who send you clients.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
