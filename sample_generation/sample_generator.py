#
# sample_generator.py
#
# Given an input speaker_samples.json files, utilize multispeaker
# synthesis to conduct inference and generate wav files that may
# be presented in the appliaciton, labeled in such a way that no 
# additional modification is required. 
#
# Requires multispeaker synthesis to be in the parent directory
# to tales_of_synthesis. 
#
# Usage:
# python sample_generator.py skit1.json

import sys
import json
import os
from pathlib import Path
import re
from pydub import AudioSegment
import argparse

sys.path.append("../../multispeaker_synthesis")

from production_inference import * 

# Multispeaker Synthesis parameters.
_vocoder = "sv2tts"
_model_num = "model6"
_model_num_synthesizer = "model6"
_synthesizer_fpath = Path("../../multispeaker_synthesis/production_models/synthesizer/"+_model_num_synthesizer+"/synthesizer.pt")
_speaker_encoder_fpath = Path("../../multispeaker_synthesis/production_models/speaker_encoder/"+_model_num+"/encoder.pt")
#_embeds_fpath = Path("../../multispeaker_synthesis_speakers/")
_embeds_fpath = Path("../../kotakee_companion/assets_audio/multispeaker_synthesis_speakers/")

# Quality of the produced samples. 
_target = 2000
_overlap = 100
_batched = True

def generate_samples(json_file: str):
  destination_dir = json_file.replace(".json", "")

  # Housekeeping - ensure the destination folder is clean.
  if os.path.exists(destination_dir):
    existing_files = os.listdir(destination_dir)
    if len(existing_files) > 0:
      print("[INFO] Sample Generator - %d existing files found in %s. Overwrite?\n\nPress [Enter] to Overwrite." 
        % (len(existing_files), destination_dir))
      input()
      for file in existing_files:
        os.remove(str(Path(destination_dir).joinpath(file)))
  
  Path(destination_dir).mkdir(exist_ok=True)
  assert len(os.listdir(destination_dir)) == 0

  # All set. Let's generate the files from the json file.
  f = open(json_file)
  speaker_samples_json = json.load(f)
  f.close()

  multispeaker_synthesis = MultispeakerSynthesis(synthesizer_fpath=_synthesizer_fpath,
    speaker_encoder_fpath=_speaker_encoder_fpath, target=_target, overlap=_overlap, 
    batched=_batched)

  for speaker in speaker_samples_json:
    samples = speaker_samples_json[speaker]
    assert type(samples) == list
    for i in range(len(samples)):
      print("[INFO] Sample Generator - Processing %s_%d.wav." % (speaker, i))
      sample = samples[i]
      # Speak each sample. 
      text_to_speak = [sample]
      split_sentence_re = r'[\.|!|,|\?|:|;|-] '

      # The only preprocessing we do here is to split sentences into
      # different strings. This makes the pronunciation cleaner and also
      # makes inference faster (as it happens in a batch).
      processed_texts = []
      for text in text_to_speak:
        split_text = re.split(split_sentence_re, text)
        processed_texts += split_text
        processed_texts
      
      sample_filename = str(Path(destination_dir).joinpath("%s_%d.wav" % (speaker, i)))

      wavs = multispeaker_synthesis.synthesize_audio_from_embeds(texts = processed_texts, 
        embeds_fpath = Path(_embeds_fpath).joinpath(speaker + ".npy"), 
        vocoder = _vocoder)
      
      assert len(wavs) == 1

      # save the wav. 
      wav = wavs[0]
      audio.save_wav(wav, sample_filename, sr=hparams.sample_rate)
      # Normalize the audio. Not the best code, but it works in ~0.007 seconds.
      wav_suffix = sample_filename.rsplit(".", 1)[1]
      sound = AudioSegment.from_file(sample_filename, wav_suffix)
      change_in_dBFS = -15.0 - sound.dBFS
      normalized_sound = sound.apply_gain(change_in_dBFS)
      normalized_sound.export(sample_filename, format=wav_suffix)

      # All done with this!

if __name__ == "__main__":
  parser = argparse.ArgumentParser()
  parser.add_argument("json_file", type=str)
  args = parser.parse_args()

  generate_samples(**vars(args))