import { Model } from 'deepspeech';
import path = require('path');

const MODEL_PATH = path.join(__dirname, 'static', 'model');

const model = new Model(path.join(MODEL_PATH, 'deepspeech-0.9.3-models.pbmm'));
model.enableExternalScorer(
  path.join(MODEL_PATH, 'deepspeech-0.9.3-models.scorer')
);
let predictionStream = model.createStream();

export default function predict(audioData: Buffer) {
  // predictionStream.feedAudioContent(audioData);
  // const result = predictionStream.finishStream();
  // predictionStream = model.createStream();
  // return result;

  const result = model.stt(audioData);
  return result;
}
