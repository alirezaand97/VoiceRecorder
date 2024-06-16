// src/components/Timer.js

import React, { useEffect, useState } from "react";

import PropTypes from "prop-types";

const Timer = ({ start, onFinish, running }) => {
  const [time, setTime] = useState(start);

  useEffect(() => {
    setTime(start);
  }, [start]);

  useEffect(() => {
    let timerInterval = null;

    if (running) {
      timerInterval = setInterval(() => {
        setTime((prevTime) => {
          if (start > 0 && prevTime <= 1) {
            clearInterval(timerInterval);
            if (onFinish) onFinish();
            return 0;
          }
          return prevTime + (start > 0 ? -1 : 1);
        });
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }

    return () => clearInterval(timerInterval);
  }, [running, start, onFinish]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="timer">
      <span className="recording-circle"></span>
      {formatTime(time)}
    </div>
  );
};

export default Timer;
