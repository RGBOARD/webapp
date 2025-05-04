import React from 'react';
import './styles/LandingPage.css'
import Developer from '../components/Developer';
import marianyelis from '../assets/Marianyelis.jpg';
import edimar from '../assets/Edimar.jpg';
import irsaris from '../assets/Irsaris.jpg';
import jandel from '../assets/Jandel.jpg';
import "./styles/Developers.css";

const Developers = () => {

  const developers = [
    {
      name: 'Marianyelis Jimenez Mercedes',
      degree: 'Software Engineering',
      excerpt: 'There’s something special about seeing all the puzzle pieces come together after putting in the work. I enjoy coding with a backdrop of city pop or video game soundtracks—Pokémon always made the perfect soundtrack for this project.',
      photo: marianyelis,
      linkedin: 'https://www.linkedin.com/in/marianyelis-jimenez-mercedes/',
      borderColor: "border-b-5 border-red-500",
    },
    {
      name: 'Edimar Valentín Kery',
      degree: 'Computer Science and Engineering',
      excerpt: 'They asked how well I understood theoretical computer science. I said I had a theoretical degree in computer science. They said welcome aboard. Fallout: New Vegas fans will get it—I enjoy working with embedded systems and robotics. My favorite language is C, but I always end up using C++.',
      photo: edimar,
      linkedin: 'https://www.linkedin.com/in/edimar-valent%C3%ADn-kery-26992299/',
      borderColor: "border-b-5 border-green-500",
    },
    {
      name: 'Irsaris Pérez Rodríguez',
      degree: 'Software Engineering',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia.',
      photo: irsaris,
      linkedin: 'https://www.linkedin.com/in/irsaris-perez/',
      borderColor: "border-b-5 border-blue-500",
    },
    {
      name: 'Jandel Rodríguez Vázquez',
      degree: 'Computer Science and Engineering',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia.',
      photo: jandel,
      linkedin: 'https://www.linkedin.com/in/jandelrodriguez/',
      borderColor: "border-b-5 border-yellow-400",
    },

  ];

  return (
    <div className="developers-page">
      <h2 className="page-title">Our Developers</h2>
      <div className="page-desc">
        <h3 className="font-semibold">A small peek at the developers who brought RGBoard to life.</h3>
        <h3> From design decisions to backend logic and frontend polish, our team has tackled every corner of the
          project with care and creativity.
          Each developer contributed across the full stack, making this site not just functional, but something we're
          proud of.
        </h3>
      </div>
      <div className="developers-wrapper card-animation">
        <div className="developers-container">
          {developers.map((developer, index) => (
            <Developer
              key={index}
              name={developer.name}
              degree={developer.degree}
              excerpt={developer.excerpt}
              photo={developer.photo}
              linkedin={developer.linkedin}
              borderColor={developer.borderColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Developers;