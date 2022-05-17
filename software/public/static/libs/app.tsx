/*
  app.tsx

  Primary script for front-facing web application functionality.
  Apologies for any bad practices - this is a quickie deployment
  website. -Arthur
*/

const React = require('react');
const ReactDOM = require('react-dom');

// Small standard object to pass around to cite sample song locations. 


export class App extends React.Component {
  state = {
  };

  constructor(){
    super();
  }

  // Executed only once upon startup.
  componentDidMount(){
  }

  render() {
    return (
      <div>
        <div id = "mainBackground">
          <div id="mainBackgroundInner">
            <img id="mainBackgroundImg" src={require("../../../assets/mainBackground.jpg").default}/>
          </div>
        </div>

        <div id="content">
          <div id="contentInner">

            <h2 id = "title">
              Tales of Skits
            </h2>

            <hr/>

            <div id="introduction">
              <div>
                Artificial Intelligence meets the "Tales of" video game series! 
              </div>

              <br/>

              <div>
                Recent revolutionary breakthroughs in the field of Machine Learning have enabled text-to-speech voice cloning, for any aribitrary speaker. 

                This project focuses on extracting and utilizing data from "Tales of" skits using various Computer Vision, Natural Language Processing, and Audio Processing techniques. 

                This data was used to train brand-new and unique variants of voice-cloning models specialized in these specific voices.
              </div>

              <br/>

              <div>
                This website provides some new skits using the final model, whose components were trained over the course of months. Please enjoy! 
              </div>
            </div>

            <hr/>

          </div>
        </div>

      </div>
    )
  };
}

ReactDOM.render(<App />, document.getElementById('app'));