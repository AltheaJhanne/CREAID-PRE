import { useState } from 'react'
import './Navbar.css'
import logo from './assets/logoD.png'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-navbar">
      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container custom-nav-container px-5">

          <Link className="navbar-brand" to="/">
            <img src={logo} alt="logo" width="200" height="65" />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setOpen(!open)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`custom-collapse ${open ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/" onClick={() => setOpen(false)}>Home</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/services" onClick={() => setOpen(false)}>Our Services</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/aboutus" onClick={() => setOpen(false)}>About Us</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/contact" onClick={() => setOpen(false)}>Contact Us</Link>
              </li>
            </ul>
          </div>

        </div>
      </nav>
    </header>
  )
}