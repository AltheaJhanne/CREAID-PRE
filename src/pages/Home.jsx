import '../styles/Home.css'
import logo from '../assets/logoD.png'
import creaid from '../assets/creaid.jpg'
import Contact from '../assets/Contact.png'
import Appointment from '../assets/Appointment.png'
import Services from '../assets/Services.png'
import { Link } from 'react-router-dom'
import { useState } from "react";
import { expoBuildUrl, mobileWebAppUrl } from "../lib/mobileApp";

export default function Home()
{
  const [showFacebooks, setShowFacebooks] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  return (
    <div className="hero">

      {/* HERO SECTION */}
      <div className="hero-content container px-4 py-5">
        <div className="row align-items-center py-5">

          <div className="col-md-6 mt-4 text-start d-flex flex-column gap-3 px-4">

            <h1>Welcome to DentConnect</h1>

            <p>
              Introducing DentConnect, a new application designed to enhance your overall dental care experience.
              Developed under Juana Smile and Creaid, DentConnect aims to provide a more seamless, efficient,
              and patient-centered approach to dental services.
            </p>

            <div className="d-flex flex-column gap-3 w-50 home-app-actions">
              <a className="home-app-button home-app-button-primary" href={expoBuildUrl} target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
                Open Expo Build
              </a>
              <a className="home-app-button home-app-button-secondary" href={mobileWebAppUrl} target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
                Open Web App
              </a>
            </div>

            <a href="#" className="hero-contact-link">Any Concerns? Contact Us -&gt;</a>

          </div>

          <div className="col-md-6 text-center px-3">
            <img src={creaid} alt="hero" className="img-fluid" style={{ width: "90%", marginLeft: "9%" }} />
          </div>

        </div>
      </div>

      {/* CLINIC */}
      <div className="hero2 mt-5">
        <div className="hero2-overlay">
          <div className="container px-5 hero2-inner">
            <h1>Juana Smile Dental Clinic</h1>

            <p>
              Committed to providing comfortable, reliable,
              and patient-focused care for maintaining healthy and confident smiles.
            </p>

            <div className="hero2-buttons">
              <Link to="/Services" className="btn btn-primary">Our Services</Link>
              <button className="btn btn-outline-light" onClick={() => setShowAppointmentModal(true)}>Book Appointment</button>
            </div>

          </div>
        </div>
      </div>

      {/* EXPLORE MORE SECTION */}
      <section className="explore-section py-5 mt-5">
        <div className="container px-5">

          <div className="text-center mb-5">
            <span className="home-small-title">What We Offer</span>
            <h2 className="explore-title">Explore More</h2>
            <p className="explore-subtitle">
              Learn more about our dental services, appointment system,
              and ways we can help you achieve a healthier smile.
            </p>
          </div>

          <div className="row g-4 justify-content-center">

            {/* CARD 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="explore-card text-center">
                <img src={Services} alt="services" className="explore-img" />
                <h4>Our Services</h4>
                <p>
                  Discover professional dental treatments including
                  cleaning, fillings, orthodontics, and oral care
                  solutions for healthier teeth.
                </p>
                <Link to="/Services" className="explore-btn text-decoration-none">MORE</Link>
              </div>
            </div>

            {/* CARD 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="explore-card text-center">
                <img src={Contact} alt="contact" className="explore-img" />
                <h4>Reach Us</h4>
                <p>
                  Contact our clinic for inquiries, schedules,
                  assistance, and important information regarding
                  your dental care needs.
                </p>
                <Link to="/Contact" className="explore-btn text-decoration-none">MORE</Link>
              </div>
            </div>

            {/* CARD 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="explore-card text-center">
                <img src={Appointment} alt="appointment" className="explore-img" />
                <h4>Appointment</h4>
                <p>
                  Easily schedule your dental visits through our
                  appointment booking system for a smoother and
                  hassle-free experience.
                </p>
                <button className="explore-btn" onClick={() => setShowAppointmentModal(true)}>MORE</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* APPOINTMENT MODAL */}
      {showAppointmentModal && (
        <div className="appt-modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="appt-modal" onClick={e => e.stopPropagation()}>
            <button className="appt-modal-close" onClick={() => setShowAppointmentModal(false)}>x</button>
            <span className="appt-modal-label">APPOINTMENTS</span>
            <h2>Book through the DentConnect app</h2>
            <p>Appointment booking is available in the DentConnect app so patients can choose a branch, service, dentist, date, and payment option in one place.</p>
            <div className="appt-modal-actions">
              <a className="home-app-button home-app-button-primary" href={expoBuildUrl} target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
                Open Expo Build
              </a>
              <a className="home-app-button home-app-button-secondary" href={mobileWebAppUrl} target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
                Open Web App
              </a>
              <Link to="/Contact" className="home-app-button home-app-button-secondary" onClick={() => setShowAppointmentModal(false)}>
                Contact Clinic
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="custom-footer py-5 mt-5">
        <div className="container px-5">
          <div className="row align-items-start">

            <div className="col-md-7 mb-4 pe-md-5">
              <img src={logo} alt="DentConnect Logo" width="350" className="mb-3" />
              <p className="text-light footer-desc">
                DentConnect is designed to provide a seamless and patient-centered
                dental care experience by connecting patients with trusted dental
                services, appointments, and clinic support.
              </p>
            </div>

            <div className="col-md-5 d-flex justify-content-md-end">
              <div className="row w-100 justify-content-md-end">

                <div className="col-6 text-md-end mb-6">
                  <h5 className="text-white fw-bold mb-3">Quick Links</h5>
                  <ul className="list-unstyled d-flex flex-column gap-3">
                    <li><Link to="/" className="footer-link">Home</Link></li>
                    <li><Link to="/Services" className="footer-link">Our Services</Link></li>
                    <li><Link to="/Aboutus" className="footer-link">About Us</Link></li>
                    <li><Link to="/Contact" className="footer-link">Contact Us</Link></li>
                    <li><Link to="/Terms" className="footer-link">Terms and Conditions</Link></li>
                  </ul>
                </div>

                <div className="col-6 text-md-end mb-6">
                  <h5 className="text-white fw-bold mb-3">Follow Us</h5>
                  <ul className="list-unstyled d-flex flex-column gap-3">

                    <li className="footer-dropdown">
                      <button className="footer-link footer-dropdown-btn" onClick={() => setShowFacebooks(!showFacebooks)}>
                        Facebook
                      </button>
                      {showFacebooks && (
                        <ul className="footer-submenu">
                          <li>
                            <a href="https://web.facebook.com/JuanaSmileDental" target="_blank" rel="noopener noreferrer" className="footer-link">Hagonoy Branch</a>
                          </li>
                          <li>
                            <a href="https://www.facebook.com/share/18vhm7EgKj/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="footer-link">Paombong Branch</a>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li>
                      <a href="https://www.instagram.com/juanasmiledental" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
                    </li>
                    <li>
                      <a href="https://mail.google.com/mail/?view=cm&fs=1&to=juanasmiledmd@gmail.com" target="_blank" rel="noopener noreferrer" className="footer-link">Email Us</a>
                    </li>
                    <li>
                      <Link to="/login" className="footer-link">Log In</Link>
                    </li>

                  </ul>
                </div>

              </div>
            </div>

          </div>

          <hr className="border-light" />

          <div className="text-center text-light">
            <small>(c) 2026 DentConnect. All Rights Reserved.</small>
          </div>
        </div>
      </footer>

    </div>
  )
}
