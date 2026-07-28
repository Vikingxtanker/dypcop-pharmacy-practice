"use client";

import { useState, useEffect } from "react";

export default function ScrollDownButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHidden(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAbout = () => {
    const aboutEl = document.getElementById("about");
    if (aboutEl) {
      aboutEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      className={`scroll-down-btn ${hidden ? "hidden" : ""}`}
      title="Scroll Down"
      onClick={scrollToAbout}
    >
      <i className="bi bi-chevron-double-down"></i>
    </button>
  );
}
