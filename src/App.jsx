import React from 'react';
import Header from './components/header/header';
import Footer from './components/Footer/Footer';

function App() {
  // Returns the entire UI
  return (
    // Div holding our header and text
    <div>
      <Header />
      <p>Track your workouts easily and effectively!</p>
      <Footer />
    </div>
  );
}

export default App;
