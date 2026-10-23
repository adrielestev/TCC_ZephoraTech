#pragma once

#include <Arduino.h>

struct Device {
  int id = 0;
  String name;
  String type;
  String direction;
  uint8_t pin = 0;
  bool activeLow = false;
  bool activeHigh = true;
  uint32_t debounceMs = 80;
  uint32_t holdMs = 0;
  bool configured = false;
  bool seen = false;
  bool hasRawState = false;
  bool rawState = false;
  bool debouncedState = false;
  bool stableState = false;
  bool absencePending = false;
  uint32_t rawChangedAt = 0;
  uint32_t absenceStartedAt = 0;
  uint32_t nextInputSampleAt = 0;
  bool appliedStateValid = false;
  float appliedState = 0;
  bool hasReportedState = false;
  float lastReportedState = 0;
  uint32_t nextReportAt = 0;
};
