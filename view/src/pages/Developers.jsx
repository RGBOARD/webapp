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
      excerpt: 'There’s something special about seeing all the pieces come together after putting in the work. I enjoy coding with a backdrop of city pop or video game soundtracks—Pokémon always made the perfect soundtrack for this project.',
      photo: marianyelis,
      linkedin: 'https://www.linkedin.com/in/marianyelis-jimenez-mercedes/',
    },
    {
      name: 'Edimar Valentín Kery',
      degree: 'Computer Science and Engineering',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia.',
      photo: edimar,
      linkedin: 'https://www.linkedin.com/in/edimar-valent%C3%ADn-kery-26992299/',
    },
    {
      name: 'Irsaris Pérez Rodríguez',
      degree: 'Software Engineering',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia. Lorem ipsum dolor sit amet, consectetur adipiscing elit',
      photo: irsaris,
      linkedin: 'https://www.linkedin.com/in/irsaris-perez/',
    },
    {
      name: 'Jandel Rodríguez Vázquez',
      degree: 'Computer Science and Engineering',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur justo nec nisl aliquet, a suscipit libero lacinia.',
      photo: jandel,
      linkedin: 'https://www.linkedin.com/in/jandelrodriguez/',
    },

  ];

  return (
    <div className="developers-page">
      <h2>Our Developers</h2>
      <div className="developers-wrapper">
        <div className="developers-container">
          {developers.map((developer, index) => (
            <Developer
              key={index}
              name={developer.name}
              degree={developer.degree}
              excerpt={developer.excerpt}
              photo={developer.photo}
              linkedin={developer.linkedin}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Developers;