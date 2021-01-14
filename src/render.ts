// define functions exposed in preload.ts for typescript
interface Window {
  electronMain: {
    transcribe: (audioData: ArrayBuffer) => void;
  };
}

window.onload = () => {
  main();
};

function main() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(handleStream)
    .catch((e) => console.log(`Error: ${e}`));
}

function handleStream(stream: MediaStream) {
  const audioChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  setupElements(recorder, audioChunks);

  recorder.ondataavailable = async (e) => {
    audioChunks.push(e.data);
    if (recorder.state == 'inactive') {
      const blob = new Blob(audioChunks);
      createAudioElement(blob);

      const arrayBuffer = await blob.arrayBuffer();
      window.electronMain.transcribe(arrayBuffer);
      // const audioBuffer = await arrayToAudioBuffer(arrayBuffer);
      // resample(audioBuffer, 16000, (resampledAudioBuffer) => {
      //   // TODO: this assumes only one channel
      //   const floatChannelData = resampledAudioBuffer.getChannelData(0);
      //   const channelData = f32Toi16Arr(floatChannelData);
      //   window.electronMain.transcribe(channelData);
      // });
    }
  };
}

// HTML element manipulation
function createAudioElement(audioData: Blob) {
  let audioElement = document.createElement('audio');
  audioElement.src = URL.createObjectURL(audioData);
  audioElement.controls = true;
  audioElement.style.display = 'block';
  audioElement.style.marginTop = '5px';
  document.body.append(audioElement);
}

function setupElements(recorder: MediaRecorder, audioChunks: Blob[]) {
  function findButton(id: string) {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (!button) {
      console.error(`Button with id ${id} not found.`);
      return null;
    }
    return button;
  }

  const b1 = findButton('startRecord');
  const b2 = findButton('stopRecord');
  if (!b1) return;
  if (!b2) return;
  const [startRecord, stopRecord] = [b1, b2];

  startRecord.onclick = () => {
    startRecord.disabled = true;
    console.log('Record started');
    audioChunks.length = 0;
    recorder.start();
    stopRecord.disabled = false;
  };

  stopRecord.onclick = () => {
    stopRecord.disabled = true;
    console.log('Record stopped');
    recorder.stop();
    startRecord.disabled = false;
  };
}

// utils
function f32Toi16Arr(arr: Float32Array) {
  const res = new Int16Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const n = arr[i];
    const v = n < 0 ? n * 32768 : n * 32767; // convert in range [-32768, 32767]
    res[i] = Math.max(-32768, Math.min(32768, v)); // clamp
  }
  return res;
}

function arrayToAudioBuffer(arrayBuffer: ArrayBuffer) {
  const audioCtx = new AudioContext();
  return audioCtx.decodeAudioData(arrayBuffer);
}

function resample(
  sourceAudioBuffer: AudioBuffer,
  newSampleRate: number,
  callback: (resampledAudioBuffer: AudioBuffer) => void
) {
  const offlineCtx = new OfflineAudioContext(
    sourceAudioBuffer.numberOfChannels,
    sourceAudioBuffer.duration * newSampleRate,
    newSampleRate
  );
  const cloneBuffer = offlineCtx.createBuffer(
    sourceAudioBuffer.numberOfChannels,
    sourceAudioBuffer.length,
    sourceAudioBuffer.sampleRate
  );
  // Copy the source data into the offline AudioBuffer
  for (let i = 0; i < sourceAudioBuffer.numberOfChannels; i++) {
    cloneBuffer.copyToChannel(sourceAudioBuffer.getChannelData(i), i);
  }
  const source = offlineCtx.createBufferSource();
  source.buffer = cloneBuffer;
  source.connect(offlineCtx.destination);
  offlineCtx.oncomplete = function (e) {
    const resampledAudioBuffer = e.renderedBuffer;
    callback(resampledAudioBuffer);
    return;
  };
  offlineCtx.startRendering();
  source.start(0);
}
