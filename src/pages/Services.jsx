import '../styles/Services.css'
import logo from '../assets/logoD.png'
import clinic1 from '../assets/clinic1.png'
import clinic2 from '../assets/clinic2.jpg'
import clinic3 from '../assets/clinic3.jpg'
import background from '../assets/background.png'
import checkup from '../assets/checkup.png'
import cleaning from '../assets/cleaning.png'
import fillings from '../assets/fillings.png'
import dentures from '../assets/dentures.png'
import extraction from '../assets/extraction.png'
import implants from '../assets/implants.png'
import ortho from '../assets/ortho.png'
import pediatic from '../assets/pediatic.png'
import whitening from '../assets/whitening.png'
import canal from '../assets/canal.png'
import { FaHeart } from "react-icons/fa";
import { NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom'

export default function Services() {
  return (    
    <div>
        <div className="services-about-page">


        {/* SERVICES HERO CAROUSEL */}
<section className="services-banner-section">

  <div
    id="servicesCarousel"
    className="carousel slide"
    data-bs-ride="carousel"
    data-bs-interval="4000"
  >

    <div className="carousel-inner">

      {/* SLIDE 1 */}
      <div className="carousel-item active">

        <img
          src={clinic2}
          className="d-block w-100 services-banner-img"
          alt="slide1"
        />

        <div className="services-banner-overlay">
          <h1>Healthy smiles you can trust.</h1>

          <p>
            Professional dental care focused on comfort,
            confidence, and healthier smiles.
          </p>

          <Link
            to="/appointment"
            className="services-banner-btn text-decoration-none"
          >
            BOOK NOW
          </Link>
        </div>

      </div>


      {/* SLIDE 2 */}
      <div className="carousel-item">

        <img
          src={clinic3}
          className="d-block w-100 services-banner-img"
          alt="slide3"
        />

        <div className="services-banner-overlay">
          <h1>Your smile matters.</h1>

          <p>
            Caring dental professionals committed to
            improving your oral health experience.
          </p>

          <Link
            to="/Contact"
            className="services-banner-btn text-decoration-none"
          >
            CONTACT US
          </Link>
        </div>

      </div>

    </div>

  </div>

</section>

{/* SERVICES CARDS */}
<section className="services-section">

  <div className="container px-5">

    <div className="services-header text-center">
        <span className="services-small-title">
        What We Offer
      </span>
      <h1 className="mt-2">Our Services</h1>
      <p className="services-subtitle mb-5">
        Learn more about our dental services, appointment system,
        and ways we can help you achieve a healthier smile.
      </p>

    </div>
    <div className="row g-5 justify-content-center text-center mb-5">

      {/* CARD 1 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
          

          <div className="service-icon">
  <img
    src={cleaning}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Dental Cleaning</h4>

          <p>
            Professional cleaning procedures to maintain
            healthy gums and teeth.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>

      {/* CARD 2 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
         

          <div className="service-icon">
  <img
    src={extraction}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Tooth Extraction</h4>

          <p>
            Safe tooth removal procedures handled with
            proper dental care.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>

      {/* CARD 3 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
         

          <div className="service-icon">
  <img
    src={ortho}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Orthodontics</h4>

          <p>
            Braces and alignment treatments to improve
            smiles and bite positioning.
          </p>

         <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>

      {/* CARD 4 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
       
          <div className="service-icon">
  <img
    src={fillings}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Dental Fillings</h4>

          <p>
            Restore teeth damaged by cavities using
            quality filling materials.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>

      {/* CARD 5 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
         

          <div className="service-icon">
  <img
    src={canal}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Root Canal</h4>

          <p>
            Treatment procedures that help save infected
            or damaged teeth.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>

      {/* CARD 6 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
         

          <div className="service-icon">
  <img
    src={whitening}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Teeth Whitening</h4>

          <p>
            Cosmetic whitening procedures for a brighter
            and more confident smile.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>


      {/* CARD 7 */}
      <div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>

          <div className="service-icon">
  <img
    src={implants}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Dental Implants</h4>

          <p>
            Cosmetic whitening procedures for a brighter
            and more confident smile.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>


      {/* CARD 8 */}
<div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
       
          <div className="service-icon">
  <img
    src={dentures}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Dentures</h4>

          <p>
            Cosmetic whitening procedures for a brighter
            and more confident smile.
          </p>

          <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>


      {/* CARD 9 */}
<div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
        
          <div className="service-icon">
  <img
    src={checkup}
    alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Oral Checkup</h4>

          <p>
            Cosmetic whitening procedures for a brighter
            and more confident smile.
          </p>

         <Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

        </div>

      </div>


      {/* CARD 10 */}
<div className="col-md-6 col-lg-4">

        <div className="service-card">

<div className="card-line"></div>
        
          <div className="service-icon">
          <img
            src={pediatic}
            alt="Dental Cleaning"
    className="service-icon-img"
  />
</div>

          <h4>Pediatric Dentistry</h4>

          <p>
            Cosmetic whitening procedures for a brighter
            and more confident smile.
          </p>
<Link
  to="/appointment"
  className="service-btn red-btn text-decoration-none"
>
  Book Now
</Link>

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