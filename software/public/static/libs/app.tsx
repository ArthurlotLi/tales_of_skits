/*
  app.tsx

  Primary script for front-facing web application functionality.
  Apologies for any bad practices - this is a quickie deployment
  website. -Arthur
*/

const React = require('react');
const ReactDOM = require('react-dom');

// Classes and objects that will dynamically define the contents of
// the page. 
class Skit {
  skitName = null;
  skitJsonLocation = null;
  skitSamples = null;
  constructor(skitName, skitJsonLocation, skitSamples){
    this.skitName = skitName;
    this.skitJsonLocation = skitJsonLocation;
    this.skitSamples = skitSamples;
  }
}

// Define the skits! 
const skitObjects = [
  new Skit(
    "Welcome to Tales of Skits", // skitName
    "../../../assets/skit0.json", // skitJsonLocation
    "../../../assets/skit0", // skitSamples
  ),
  new Skit(
    "Who keeps on mentioning Maotelus?", // skitName
    "../../../assets/skit1.json", // skitJsonLocation
    "../../../assets/skit1", // skitSamples
  ),
  new Skit(
    "A vested interest", // skitName
    "../../../assets/skit2.json", // skitJsonLocation
    "../../../assets/skit2", // skitSamples
  ),
  new Skit(
    "Discussing the others", // skitName
    "../../../assets/skit3.json", // skitJsonLocation
    "../../../assets/skit3", // skitSamples
  ),
]

const audioEndedChecking = 50; // in ms.
const audioWaitBetweenUtterances = 0; // in ms
const audioEllipseWait = 1500; // in ms.

const defaultSpeakerImage = "VELVET"
const defaultSkitSubtitles = "Please select a skit from dropdown to watch..."
const defaultDisplayedSkit = { "--- Select skit ---": ""}

export class App extends React.Component {

  skits: {};

  state = {
    skitDropdown: {},
    defaultSkit: "",
    speakerImage: defaultSpeakerImage,
    skitSubtitles: defaultSkitSubtitles,
    currentAudio: null,
    currentSkit: "",
  };

  constructor(){
    super();
  }

  // Executed only once upon startup.
  componentDidMount(){
    // Populate Populate dropdown and newSkits.
    let newSkits = {};
    let newSkitDropdown = defaultDisplayedSkit;
    let newDefaultSkit = "";
    for(var i =0; i < skitObjects.length;i++){
      let skit = skitObjects[i];
      let skitName = skit.skitName;
      newSkits[skitName] = skit; // Save the object for future use.
      newSkitDropdown[skitName] = skitName; // Add the key to the dropdown. 
    };
    this.setState({
      skitDropdown : newSkitDropdown,
      defaultSkit: newDefaultSkit,
    });
    this.skits = newSkits;
  }

  async onSkitSelect(evt){
    if(evt.target.value == ""){
      alert("Please select a skit to watch!");
      return
    }

    let skitTitle = evt.target.value;
    if(skitTitle in this.skits){
      // Cancel any existing skits. 
      await this.setState({
        currentSkit: skitTitle,
      });

      let skit = this.skits[skitTitle];

      let response = await fetch(skit.skitJsonLocation,{
        headers : { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
         }})
      this.processTranscript(await response.json(), skit);
    }
    else{
      // Cancel the skit. 
      console.log("[INFO] Skit cancelled entirely! No replacement selected.")
      this.resetSkits();
    }
  }

  async processTranscript(skitTranscript, skit) {
    for(var i = 0; i < skitTranscript.length; i++){
      if(this.state.currentSkit != skit.skitName) break;
      let segment = skitTranscript[i];
      for (const [speaker, utterances] of Object.entries(segment)) {
        if(this.state.currentSkit != skit.skitName) break;
        let listUtterances = utterances as Array<Object>;
        // Note there should ever only be one speaker and one list of utterances.
        for(var j=0; j< listUtterances.length; j++){
          if(this.state.currentSkit != skit.skitName) break;
          let utterance = listUtterances[j];
          for (const [subtitles, _] of Object.entries(utterance)) {
            if(this.state.currentSkit != skit.skitName) break;
            // And there should only be one pair - the transcript and what
            // was submitted to the model. 

            let utteranceSubtitles = subtitles as string;
            let utteranceSpeaker = speaker as string;
            let utteranceWavFilename = `${i}_${utteranceSpeaker}_${j}.wav`
            
            console.log(`[${utteranceWavFilename}] ${utteranceSpeaker}: \"${utteranceSubtitles}\"`)

            // Display image and text. 
            await this.setState({
              speakerImage: utteranceSpeaker,
              skitSubtitles: utteranceSubtitles,
            });
            

            // Load the audio
            let audio = new Audio(skit.skitSamples + "/" + utteranceWavFilename);
            let currentAudio = this.state.currentAudio;
            if(currentAudio != null){
              currentAudio.pause();
              currentAudio = null;
            }
            await this.setState({
              currentAudio: audio,
              playingAudio: true
            });

            if(utteranceSubtitles == "..."){
              await new Promise(r => setTimeout(r, audioEllipseWait));
            }
            else{
              audio.play();
              // Wait 50 ms until the audio is done. 
              while(!audio.paused){
                if(this.state.currentSkit != skit.skitName) {
                  audio.pause();
                  break;
                }
                await new Promise(r => setTimeout(r, audioEndedChecking));
              }
            }

            // An extra pause between utterances. 
            if(audioWaitBetweenUtterances > 0){
              await new Promise(r => setTimeout(r, audioWaitBetweenUtterances));
            }
          }
        }
      }
    }

    // Skit has completed.
    if(this.state.currentSkit == skit.skitName){
      this.resetSkits();
    }
  }

  async resetSkits(){
    await this.setState({
      speakerImage: defaultSpeakerImage,
      skitSubtitles: defaultSkitSubtitles,
      currentSkit: "",
    });
    let skitDropdown = document.getElementById("skitSelectionDropdown") as HTMLSelectElement;
    skitDropdown.selectedIndex = 0
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

            <div id="contentUpper">
              <h2 id = "title">
                Tales of Skits
              </h2>
              <div id="subtitle"><b>AI-synthesized audio</b></div>
            </div>

            <div id="skitSelectionSection">
              <div id="skitSelectionSectionInner">
                <select id="skitSelectionDropdown" default="" onChange={evt => this.onSkitSelect(evt)}>
                  {Object.keys(this.state.skitDropdown).map((x,y) => <option key={y}>{x}</option>)}
                </select>
              </div>
            </div>

            <div id= "speakerImage">
              <div id="speakerImageInner">

                <div id="speakerContainer">
                  <img id = "speakerImageImg" src={require("../../../assets/speakerImages/"+this.state.speakerImage.toUpperCase()+".webp").default}/>
                </div>

              </div>
              <div id="speakerImageName"><b>{this.state.speakerImage.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();})}</b></div>
            </div>

            <div id = "skitSubtitles">
              <div id="skitSubtitlesInner">
                <div id = "skitSubtitlesText">{this.state.skitSubtitles}</div>
              </div>
            </div>

            <div id="contentLower">

              <div id="introduction">
                <div id="introductionInner">
                  <h2 id="introductionHeader">
                    Multi-Speaker Synthesis with Video Game Characters
                  </h2>

                  <div id="overview">
                    <img id="overviewImage" src={require("../../../assets/overview.png").default}/>
                  </div>

                  <div>
                  Artificial Intelligence meets the "Tales of" video game series! 
                  </div>

                  <br/>

                  <div>
                    Voice data was extracted from in-game skits using Computer Vision, Natural Language Processing, and Speaker Verification methods. 

                    This data was then used to train uniquely specialized, state of the art text-to-speech voice cloning models.
                  </div>

                  <br/>

                  <div>
                    This website provides original, voiced skits using the final model, whose components were trained over the course of months.
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>


      </div>
    )
  };
}

ReactDOM.render(<App />, document.getElementById('app'));