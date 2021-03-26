import firebase from "firebase/app";
import firebaseConfig from './firebaseConfig.js';
import "firebase/auth";
import "firebase/analytics";
import "firebase/firestore";

import './App.css';
import Nav from './Components/Nav/Nav'
import Content from './Components/Content/Content'
import Footer from './Components/Footer/Footer'


function App() {

  if (!firebase.apps.length) {
    console.log(1)
    firebase.initializeApp(firebaseConfig);
  }else {
    console.log(2)
    firebase.app(); // if already initialized, use that one
  }

  return (
    <div className='App'>
      <Nav />
      <Content firebase={firebase}></Content>
      <Footer />
    </div>
  );
}

export default App;
