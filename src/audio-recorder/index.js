// src/components/AudioRecorder.js

import "./AudioRecorder.css";

import { Mic, Pause, Play, Send, Trash } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import MicIcon from "../components/icons/mic";
import Timer from "./recorder-timer";
import WaveSurfer from "wavesurfer.js";

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const waveSurferRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [playDuration, setPlayDuration] = useState(0);
  const [isSeeked, setisSeeked] = useState(false);
  useEffect(() => {
    waveSurferRef.current = WaveSurfer.create({
      container: "#waveform",
      progressColor: "#500ea5",
      waveColor: "#EFEFEF",
      cursorColor: "transparent",
      height: 30,
      responsive: true,
      autoplay: false,
      autoScroll: true,
      dragToSeek: true,
      autoCenter: true,
      barWidth: 4,
      barRadius: 8,
      cursorWidth: 1,
    });

    waveSurferRef.current.on("seeking", function (progress) {
      let durationTime = Math.floor(waveSurferRef.current.getDuration());
      let seekTime = Math.floor(progress);
      setPlayDuration(durationTime - seekTime);
      setisSeeked(true);
    });

    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    sourceNodeRef.current =
      audioContextRef.current.createMediaStreamSource(stream);

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const audioURL = URL.createObjectURL(audioBlob);
      setAudioURL(audioURL);
      waveSurferRef.current.load(audioURL);
    };

    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setRecording(true);

    visualizeAudio(stream);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
  };

  const visualizeAudio = (stream) => {
    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!recording) return;

      analyser.getByteTimeDomainData(dataArray);
      waveSurferRef.current.empty();
      waveSurferRef.current.loadBlob(
        new Blob([dataArray.buffer], { type: "audio/wav" })
      );

      requestAnimationFrame(draw);
    };

    draw();
  };

  const playAudio = () => {
    if (waveSurferRef.current) {
      if (!playing) {
        waveSurferRef.current.play();
        setPlaying(true);
        if (!isSeeked)
          setPlayDuration(Math.floor(waveSurferRef.current.getDuration()));

        waveSurferRef.current.on("finish", () => {
          setPlaying(false);
        });
      } else {
        pauseAudio();
      }
    }
  };

  const pauseAudio = () => {
    waveSurferRef.current.pause();
    setPlaying(false);
  };

  const sendVoice = () => {
    console.log(audioURL);
  };

  const clearAudio = () => {
    setAudioURL("");
    setPlaying(false);
    setPlayDuration(0);
    if (waveSurferRef.current) {
      waveSurferRef.current.empty();
    }
  };

  return (
    <div className="audio-recorder">
      {audioURL && (
        <span
          onClick={playAudio}
          disabled={!audioURL}
          className=" cursor-pointer"
        >
          {playing ? <Pause width={18} /> : <Play width={18} />}
        </span>
      )}
      {audioURL && (
        <span onClick={clearAudio} className="trash-btn cursor-pointer">
          <Trash width={18} />
        </span>
      )}
      {recording && <Timer start={0} running={recording} />}
      {audioURL && <Timer start={playDuration} running={playing} />}
      <div id="waveform"></div>
      {audioURL ? (
        <>
          <button onClick={sendVoice} className="btn mic-btn send-btn">
            <Send width={18} />
          </button>
        </>
      ) : (
        <>
          {!recording && (
            <button onClick={startRecording} className="btn mic-btn ">
              <MicIcon />
            </button>
          )}
          {recording && (
            <button onClick={stopRecording} className="btn pause-btn">
              <span className="pause-icon"></span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AudioRecorder;