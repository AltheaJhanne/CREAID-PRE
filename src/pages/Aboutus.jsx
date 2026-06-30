import '../styles/Aboutus.css'
import logo from '../assets/logoD.png'
import clinic1 from '../assets/clinic1.png'
import clinic2 from '../assets/clinic2.jpg'
import clinic3 from '../assets/clinic3.jpg'
import logoF from '../assets/logoF.png'
import { NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom'


export default function Aboutus() {
  return (    
    <div>
      <div className="aboutus-page">
        
      {/* ABOUT US HERO SECTION */}
<section className="about-hero-section">

  <div className="about-hero-overlay">

    <div className="container px-5">

      <div className="about-hero-content">

        <h1>About Us</h1>

        <p>
          DentConnect is committed to delivering reliable,
          patient-centered dental care experiences through
          modern technology and compassionate service.
        </p>

       

      </div>

    </div>

  </div>

</section>


{/* ABOUT INTRODUCTION */}
<section className="about-intro-section py-5">

  <div className="container px-5">

    <div className="about-title-wrapper mb-5">

      <span className="about-small-title">
        Our Story
      </span>

      <h2 className="about-big-title">
        JUANASMILE
      </h2>

    </div>

    <div className="row align-items-center g-5">

      {/* LEFT SIDE */}
      <div className="col-lg-5">

        <h4 className="about-subheading">
          Building Better Dental Experiences
        </h4>

        <p className="about-text">
          DentConnect was developed to provide a smoother,
          more efficient, and patient-focused approach
          to dental care services.
        </p>

        <p className="about-text">
          Our goal is to connect patients with trusted
          dental professionals while simplifying appointments,
          communication, and access to dental information.
        </p>

        <p className="about-text">
          By combining healthcare and technology, we aim
          to improve convenience, accessibility, and
          overall patient satisfaction.
        </p>

        <Link
          to="/Contact"
          className="about-connect-btn text-decoration-none"
        >
          Connect Us →
        </Link>

      </div>

      {/* RIGHT SIDE IMAGE */}
<div className="col-lg-7">

  <div className="about-single-image">

    <img
      src={clinic2}
      alt="about"
      className="about-main-img"
    />

  </div>

</div>
    </div>

  </div>

</section>

{/* MISSION & VISION SECTION */}
<section className="mission-vision-section py-5">

  <div className="container px-5">

    <div className="mb-5">

      <div className="mv-header text-center">
        <span className="mv-small-title text-center">
        What We Stand For
      </span>

      <h2 className="mv-main-title">
        Mission & Vision
      </h2>
      </div>

    </div>

    <div className="row g-4 justify-content-center">

      {/* MISSION CARD */}
      <div className="col-lg-6">

        <div className="mv-card mission-card">

          <div className="mv-icon">
            🎯
          </div>

          <h3>Our Mission</h3>

          <p>
            To provide accessible, efficient, and patient-centered
            dental care solutions through modern technology and
            compassionate service. DentConnect aims to simplify
            communication, appointments, and dental healthcare
            experiences for every patient.
          </p>

        </div>

      </div>

      {/* VISION CARD */}
      <div className="col-lg-6">

        <div className="mv-card vision-card">

          <div className="mv-icon">
            👁️
          </div>

          <h3>Our Vision</h3>

          <p>
            To become a trusted digital platform that transforms
            dental healthcare experiences by connecting patients
            and clinics through innovative, reliable, and
            user-friendly solutions that promote healthier smiles
            and better accessibility.
          </p>

        </div>

      </div>

    </div>

  </div>

</section>


{/* footer */}
<footer className="custom-footer py-5">
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
          </div>
  )
}