/*
  app.tsx

  Primary script for front-facing web application functionality.
  Apologies for any bad practices - this is a quickie deployment
  website. -Arthur
*/

const React = require('react');
const ReactDOM = require('react-dom');

const defaultIntroductionPage1Style = {
  width: "100%",
  height: "fit-content",
  display: "block",
  visibility: "visible",
  pointerEvents: "auto",
  overflow: "hidden",
}

const defaultIntroductionPage2Style = {
  width: "100%",
  height: "fit-content",
  display: "none",
  visibility: "hidden",
  pointerEvents: "none",
  overflow: "hidden",
}

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
    "A vested interest", // skitName
    "../../../assets/skit2.json", // skitJsonLocation
    "../../../assets/skit2", // skitSamples
  ),
  new Skit(
    "Discussing the others", // skitName
    "../../../assets/skit3.json", // skitJsonLocation
    "../../../assets/skit3", // skitSamples
  ),
  new Skit(
    "A world free of malevolence", // skitName
    "../../../assets/skit4.json", // skitJsonLocation
    "../../../assets/skit4", // skitSamples
  ),
  new Skit(
    "Lailah's final roll call", // skitName
    "../../../assets/skit1.json", // skitJsonLocation
    "../../../assets/skit1", // skitSamples
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
    showingPage1: true,
    introductionPage1Style: defaultIntroductionPage1Style,
    introductionPage2Style: defaultIntroductionPage2Style,
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

  async toggleAbout() {
    var modifiedPage1Style = Object.assign({}, this.state.introductionPage1Style);
    var modifiedPage2Style = Object.assign({}, this.state.introductionPage2Style);

    if(this.state.showingPage1){
      modifiedPage2Style["display"] = "block";
      modifiedPage2Style["visibility"] = "visible";
      modifiedPage2Style["pointerEvents"] = "auto";
      modifiedPage1Style["display"] = "none";
      modifiedPage1Style["visibility"] = "hidden";
      modifiedPage1Style["pointerEvents"] = "none";

      await this.setState({
        introductionPage1Style : modifiedPage1Style,
        introductionPage2Style : modifiedPage2Style,
        showingPage1: false,
      });
      this.scrollToBottom();
    }
    else {
      modifiedPage1Style["display"] = "block";
      modifiedPage1Style["visibility"] = "visible";
      modifiedPage1Style["pointerEvents"] = "auto";
      modifiedPage2Style["display"] = "none";
      modifiedPage2Style["visibility"] = "hidden";
      modifiedPage2Style["pointerEvents"] = "none";

      await this.setState({
        introductionPage1Style : modifiedPage1Style,
        introductionPage2Style : modifiedPage2Style,
        showingPage1: true,
      });
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    this.endOfPage.scrollIntoView({ behavior: "auto" });
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

            <div style={{ float:"left", clear: "both" }}
              ref={(el) => { this.endOfPage = el; }}>
            </div>

            <div id="contentLower">

              <div id="introduction">
                <div id="introductionInner">

                  <div id="introductionPage1" style={this.state.introductionPage1Style}>
                    <h2 id="introductionHeader">
                      Multispeaker Synthesis with Video Game Characters
                    </h2>

                    <div id="overview">
                      <img id="overviewImage" src={require("../../../assets/overview.png").default}/>
                    </div>

                    <br/>

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

                    <br/>

                    <div>
                      Please enjoy the results of this project.
                    </div>
                  </div>

                  <div id="introductionPage2" style={this.state.introductionPage2Style}>
                    <br/>
                    <div>
                      Author: Arthurlot Li
                    </div>
                    <br/>
                    <div>
                      <i>Feel free to contact me:</i> <a href="mailto:ArthurlotLi@gmail.com">ArthurlotLi@gmail.com</a>
                    </div>

                    <br/>

                    <hr/>

                    <h2>Citations:</h2>
                    
                    <div>
                      <b>[1] LibriSpeech ASR Corpus</b> - <a target="_blank" href="https://www.openslr.org/12">https://www.openslr.org/12</a>
                      <div>Published Paper (2015): <a target="_blank" href="https://ieeexplore.ieee.org/document/7178964">https://ieeexplore.ieee.org/document/7178964</a></div>
                      <p>
                      <div>Panayotov, Vassil, et al. "Librispeech: an asr corpus based on public domain audio books."</div> 
                      <div>&emsp;2015 IEEE international conference on acoustics, speech and signal processing (ICASSP).</div>
                      <div>&emsp;IEEE, 2015.</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[2] Vox Celeb1 Dataset</b> - <a target="_blank" href="https://www.robots.ox.ac.uk/~vgg/data/voxceleb/">https://www.robots.ox.ac.uk/~vgg/data/voxceleb/</a>
                      <div>Published Paper (2020): <a target="_blank" href="https://www.sciencedirect.com/science/article/pii/S0885230819302712">https://www.sciencedirect.com/science/article/pii/S0885230819302712</a></div>
                      <div>Published Paper (2017): <a target="_blank" href="https://arxiv.org/abs/1706.08612">https://arxiv.org/abs/1706.08612</a></div>
                      <p>
                      <div>Nagrani, Arsha, et al. "Voxceleb: Large-scale speaker verification in the wild." Computer</div> 
                      <div>&emsp;Speech &#38; Language 60 (2020): 101027.</div>
                      </p>
                      <p>
                      <div>Nagrani, Arsha, Joon Son Chung, and Andrew Zisserman. "Voxceleb: a large-scale speaker</div> 
                      <div>&emsp;identification dataset." arXiv preprint arXiv:1706.08612 (2017).</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[3] Vox Celeb2 Dataset</b> - <a target="_blank" href="https://www.robots.ox.ac.uk/~vgg/data/voxceleb/">https://www.robots.ox.ac.uk/~vgg/data/voxceleb/</a>
                      <div>Published Paper (2018): <a target="_blank" href="https://arxiv.org/abs/1806.05622">https://arxiv.org/abs/1806.05622</a></div>
                      <p>
                      <div>Chung, Joon Son, Arsha Nagrani, and Andrew Zisserman. "Voxceleb2: Deep speaker recognition." </div>
                      <div>&emsp;arXiv preprint arXiv:1806.05622 (2018).</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[4] Transfer Learning from Speaker Verification to Multispeaker Text-To-Speech Synthesis</b> - <a target="_blank" href="https://arxiv.org/abs/1806.04558">https://arxiv.org/abs/1806.04558</a>
                      <p>
                      <div>Jia, Ye, et al. "Transfer learning from speaker verification to multispeaker text-to-speech</div>
                      <div>&emsp;synthesis." Advances in neural information processing systems 31 (2018).</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[5] Real-Time Voice Cloning</b> - <a target="_blank" href="https://matheo.uliege.be/handle/2268.2/6801">https://matheo.uliege.be/handle/2268.2/6801</a>
                      <p>
                      <div>Jemine, Corentin. "Master thesis: Real-time voice cloning." (2019).</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[6] Montreal Forced Aligner</b> - <a target="_blank" href="https://montreal-forced-aligner.readthedocs.io/en/latest/index.html">https://montreal-forced-aligner.readthedocs.io/en/latest/index.html</a>
                      <div>Published Paper (2017): <a target="_blank" href="https://www.isca-speech.org/archive/interspeech_2017/mcauliffe17_interspeech.html">https://www.isca-speech.org/archive/interspeech_2017/mcauliffe17_interspeech.html</a></div>
                      <p>
                      <div>McAuliffe, Michael, et al. "Montreal Forced Aligner: Trainable Text-Speech Alignment Using</div>
                      <div>&emsp;Kaldi." Interspeech. Vol. 2017. 2017.</div>
                      </p>
                    </div>

                    <br/>

                    <hr/>

                    <br/>

                    <div>
                      <b><i>Tales of Berseria</i>, <i>Tales of Zestiria</i> in-game video recordings</b> - <a target="_blank" href="https://www.youtube.com/c/Chlorophylls">https://www.youtube.com/c/Chlorophylls</a>
                    </div>
                    <div>
                      <b><i>Tales of Vesperia</i> in-game video recordings</b> - <a target="_blank" href="https://www.youtube.com/c/BAIGAMING">https://www.youtube.com/c/BAIGAMING</a>
                    </div>

                  </div>

                  <br/>

                  <div id="about">
                    <button id="aboutButton" onClick={this.toggleAbout.bind(this)} >{this.state.showingPage1 ? "About + Citations" : "Main Page"}</button>
                  </div>

                  <br/>
                </div>
              </div>

              <br/>

              <br/>

            </div>

          </div>
        </div>


      </div>
    )
  };
}

ReactDOM.render(<App />, document.getElementById('app'));