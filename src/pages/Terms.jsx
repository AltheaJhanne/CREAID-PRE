import '../styles/Terms.css'
import Navbar from '../Navbar'

export default function Terms() {
  return (
    <div className="terms-page">

      <div className="terms-container container py-5">

        <h1>Terms and Conditions</h1>

        <p className="terms-date">
          Last Updated: May 2026
        </p>

        <div className="terms-section">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing and using DentConnect, you agree to comply with and
            be bound by these Terms and Conditions.
          </p>
        </div>

        <div className="terms-section">
          <h3>2. User Responsibilities</h3>
          <p>
            Users are responsible for providing accurate information and for
            maintaining the confidentiality of their accounts.
          </p>
        </div>

        <div className="terms-section">
          <h3>3. Appointments and Services</h3>
          <p>
            Appointment schedules are subject to clinic availability and may
            be adjusted when necessary.
          </p>
        </div>

        <div className="terms-section">
          <h3>4. Privacy</h3>
          <p>
            DentConnect respects user privacy and handles personal information
            according to applicable data protection practices.
          </p>
        </div>

        <div className="terms-section">
          <h3>5. Changes to Terms</h3>
          <p>
            DentConnect reserves the right to update or modify these terms at
            any time without prior notice.
          </p>
        </div>

      </div>

    </div>

    
  )
}