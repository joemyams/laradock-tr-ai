import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStepForward,
  faStepBackward,
} from "@fortawesome/free-solid-svg-icons";

const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const MusicPlayer = ({
  latestMessage,
  selectedVoice,
  onThreadSwitch,
  doneThreadSwitch,
}) => {
  const synth = window.speechSynthesis;
  const [utterance, setUtterance] = useState(null);
  const [isPlaying, setPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [icon, setIcon] = useState(faPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const getVoice = () => {
    const availableVoice = synth.getVoices();
    const voiceType = availableVoice[Number(selectedVoice)];
    return voiceType;
  };

  const togglePlay = () => {
    if (!utterance) {
      return;
    }

    if (!isPlaying || isPaused) {
      if (isPaused) {
        synth.resume();
      } else {
        utterance.voice = getVoice();
        synth.speak(utterance);
      }
      setIcon(faPause);
      setIsPaused(false);
    } else {
      setIsPaused(true);
      setIcon(faPlay);
      synth.pause();
    }

    setPlaying(!isPlaying);
  };

  const handleEndSpeech = () => {
    synth.cancel();
    setPlaying(false);
    setIsPaused(false);
    setIcon(faPlay);
    setCurrentTime(0);
    setProgress(0);
  };

  useEffect(() => {
    handleEndSpeech();
    const utteranceInstance = new SpeechSynthesisUtterance(latestMessage);
    utteranceInstance.onend = handleEndSpeech;
    setUtterance(utteranceInstance);
  }, [latestMessage, selectedVoice]);

  useEffect(() => {
    if (utterance) {
      const words = latestMessage.split(" ");
      const speakingRate = utterance.rate || 1;
      const estimatedDuration = (words.length / (speakingRate * 210)) * 60;
      setDuration(estimatedDuration);
    }
  }, [latestMessage, utterance, selectedVoice]);

  useEffect(() => {
    if (onThreadSwitch) {
      handleEndSpeech();
      doneThreadSwitch();
    }
  }, [onThreadSwitch, doneThreadSwitch]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      const intervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime >= duration) {
            return duration;
          }
          return newTime;
        });
        setProgress((currentTime / duration) * 100);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, isPaused, currentTime, duration]);

  return (
    <div className="border-t p-4 flex flex-col items-center">
      <div className="w-64 bg-gray-200 h-2 rounded-full mb-4">
        <div
          className="bg-black h-full rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between w-64">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="flex items-center">
        <button className="mx-4 p-2 rounded-full text-white focus:outline-none">
          <FontAwesomeIcon icon={faStepBackward} className="text-black" />
        </button>
        <button
          onClick={togglePlay}
          className="mx-4 p-2 rounded-full text-white focus:outline-none"
        >
          <FontAwesomeIcon icon={icon} className="text-black" />
        </button>
        <button className="mx-4 p-2 rounded-full text-white focus:outline-none">
          <FontAwesomeIcon icon={faStepForward} className="text-black" />
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer;
