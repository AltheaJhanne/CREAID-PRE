import '../styles/Contact.css'
import logo from '../assets/logoD.png'
import clinic1 from '../assets/clinic1.png'
import clinic2 from '../assets/clinic2.jpg'
import bg3 from '../assets/bg3.png'
import "bootstrap-icons/font/bootstrap-icons.css"
import { Link } from 'react-router-dom'

export default function Contact() {
  return (
    <div className="contact-page">

      <section className="contact-hero-section">

  <div className="contact-hero-overlay">

    <div className="container px-5">

      <div className="contact-hero-content">

        <h1>CONTACT US</h1>

        <p>
          DentConnect is committed to delivering reliable,
          patient-centered dental care experiences through
          modern technology and compassionate service.
        </p>

       

      </div>

    </div>

  </div>

</section>

      <div className="contact-container">
      <div className="container py-5 px-5 mt-5">
  <div className="row text-center g-0">

    <div className="col-md-4 contact-box px-5">
      <i className="bi bi-telephone-fill fs-1"></i>
      <h5 className="mt-3">Contact Us</h5>
      <h6>We’re here to assist you with your dental care needs and inquiries.</h6>
      <p> </p>
      <p>(044) 462 8997</p>
      <p>+639 3120 52240 (Hagonoy)</p>
      <p>+639 0696 15046 (Paombong)</p>
    </div>

    <div className="col-md-4 contact-box divider px-5">
      <i className="bi bi-envelope-at-fill fs-1"></i>
      <h5 className="mt-3">Email Us</h5>
      <h6>Send us your questions or concerns anytime through our email.</h6>
      <p> </p>
      <p>juanasmiledmd@gmail.com</p>
    </div>

    <div className="col-md-4 contact-box divider px-5">
      <i className="bi bi-facebook fs-1"></i>
      <h5 className="mt-3">Follow Us</h5>
      <h6>Stay updated with our latest news, services, and dental tips on social media.</h6>
      <p> </p>
      <p>Juana Smile Dental Clinic - Paombong</p>
      <p>Juana Smile Dental Clinic - Hagonoy</p>

    </div>

  </div>
</div>
</div>

 <div className="container-branches">
      <div className="container py-5 px-5">

  <h1 className="fw-bold mb-4 mt-3">VISIT OUR CLINICS</h1>

  <div className="row g-4">

    {/* BRANCH 1 */}
    <div className="col-md-6">
      <div className="branch-card">

        <img src={clinic1} className="branch-img" alt="Paombong" />

        <div className="mt-3 text-center">
          <h5>📍Dental Clinic - Paombong</h5>
          <p>2nd Floor J4M4 Bldg, San Isidro II, Bulacan</p>
          <small>10:00 AM - 5:00 PM</small>
        </div>

      </div>
    </div>

    {/* BRANCH 2 */}
    <div className="col-md-6">
      <div className="branch-card">

        <img src={clinic2} className="branch-img" alt="Hagonoy" />

        <div className="mt-3 text-center">
          <h5>📍Dental Clinic - Hagonoy</h5>
          <p>2nd Floor New Commercial Bldg, Hagonoy, Bulacan</p>
          <small>10:00 AM - 5:00 PM</small>
        </div>

      </div>
    </div>

  </div>
</div>


      {/* HOW TO FIND US */}
      <div className="container py-5 px-5">
        <div className="container py-4">
  <h1 className="fw-bold mb-4">HOW TO FIND US?</h1>

  {/* BRANCH 1 */}
  <div className="map-section mb-4">
    <h5>Hagonoy, Bulacan Branch</h5>
    <iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.823533193144!2d120.73063577435121!3d14.835158871292515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339651b0c68b6f31%3A0x5ed47029f55239e9!2sJuanaSmile%20Dental%20Clinic!5e0!3m2!1sen!2sph!4v1778307308748!5m2!1sen!2sph" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
  width="100%"
  height="450"
  style={{ border: 0 }}
  allowFullScreen=""
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade">
  </iframe>


  </div>
  {/* BRANCH 2 */}
  <div className="map-section">
    <h5>Paombong, Bulacan Branch</h5>
    <iframe
      title="branch-2-map"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.804565619073!2d120.78463587435115!3d14.836222671266027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339651a58a2583b7%3A0x31ed2d290da5e338!2sJuana%20Smile%20Dental%20Clinic%20Paombong!5e0!3m2!1sen!2sph!4v1778307413497!5m2!1sen!2sph"
      width="100%"
      height="450"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
    ></iframe>
  </div>
</div>
<div className="row g-3 mb-5 px-4">

  <div className="col-md-4">
    <img src={clinic1} className="clinic-img" alt="clinic" />
  </div>

  <div className="col-md-4">
    <img src={clinic2} className="clinic-img" alt="clinic" />
  </div>

  <div className="col-md-4">
    <img src={clinic1} className="clinic-img" alt="clinic" />
  </div>

</div>
</div>
      </div>
        

{/* footer */}
<footer className="custom-footer py-5 mt-5">
  <div className="container px-5">
    <div className="row align-items-start">

      {/* LEFT (expanded space for paragraph) */}
      <div className="col-md-7 mb-4 pe-md-5">
        <img
          src={logo}
          alt="DentConnect Logo"
          width="350"
          className="mb-3"
        />

        <p className="text-light footer-desc">
          DentConnect is designed to provide a seamless and patient-centered
          dental care experience by connecting patients with trusted dental
          services, appointments, and clinic support.
        </p>
      </div>

      {/* RIGHT (slightly reduced width, aligned right) */}
      <div className="col-md-5 d-flex justify-content-md-end">
        <div className="row w-100 justify-content-md-end">

          {/* QUICK LINKS */}
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

          {/* FOLLOW US */}
          <div className="col-6 text-md-end mb-6">

          <h5 className="text-white fw-bold mb-3">
          Follow Us
          </h5>

  <ul className="list-unstyled d-flex flex-column gap-3">

    <li>
      <a
        href="https://www.facebook.com/share/18iLi7e2B2/?mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        Facebook
      </a>
    </li>

    <li>
      <a
        href="https://www.instagram.com/juanasmiledental"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        Instagram
      </a>
    </li>

    <li>
      <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=juanasmiledmd@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
  className="footer-link"
>
  Email Us
</a>
    </li>

    <li>
      <Link
        to="/login"
        className="footer-link"
      >
        Log In
      </Link>
    </li>

  </ul>

</div>

        </div>
      </div>

    </div>

    <hr className="border-light" />

    <div className="text-center text-light">
      <small>© 2026 DentConnect. All Rights Reserved.</small>
    </div>
  </div>
</footer>
</div>
  )
}